use std::collections::{HashMap, HashSet};
use std::{env, sync::Arc, time::Instant};

use anyhow::{Context, Result};
use async_trait::async_trait;
use braintrust::{get_prompt_system_message, BraintrustClient};
use chrono::{DateTime, Utc};
use cohere_rust::{
    api::rerank::{ReRankModel, ReRankRequest},
    Cohere,
};
use database::{pool::get_pg_pool, schema::datasets};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use futures::stream::{self, StreamExt};
use litellm::{AgentMessage, ChatCompletionRequest, EmbeddingRequest, LiteLLMClient, Metadata, ResponseFormat};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::{debug, error, info, warn};
use uuid::Uuid;
use dataset_security::{get_permissioned_datasets, PermissionedDataset};
use sqlx::PgPool;
use stored_values;

use crate::{agent::Agent, tools::ToolExecutor};

// NEW: Structure to represent found values with their source information
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
pub struct FoundValueInfo {
    pub value: String,
    pub database_name: String,
    pub schema_name: String,
    pub table_name: String,
    pub column_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchDataCatalogParams {
    specific_queries: Option<Vec<String>>,
    exploratory_topics: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchDataCatalogOutput {
    pub message: String,
    pub specific_queries: Option<Vec<String>>,
    pub exploratory_topics: Option<Vec<String>>,
    pub value_search_terms: Option<Vec<String>>,
    pub duration: i64,
    pub results: Vec<DatasetSearchResult>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
pub struct DatasetSearchResult {
    pub id: Uuid,
    pub name: Option<String>,
    pub yml_content: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
struct DatasetResult {
    id: Uuid,
    name: Option<String>,
    yml_content: Option<String>,
}

#[derive(Debug, Clone)]
struct RankedDataset {
    dataset: PermissionedDataset,
}

/// Represents a searchable dimension in a model
#[derive(Debug, Clone)]
struct SearchableDimension {
    model_name: String,
    dimension_name: String,
    dimension_path: Vec<String>, // Path to locate this dimension in the YAML
}

// NEW: Helper function to generate embeddings for search terms
async fn generate_embedding_for_text(text: &str) -> Result<Vec<f32>> {
    let litellm_client = LiteLLMClient::new(None, None);
    
    let embedding_request = EmbeddingRequest {
        model: "text-embedding-3-small".to_string(),
        input: vec![text.to_string()], // Single input as a vector
        dimensions: Some(1536),
        encoding_format: Some("float".to_string()),
        user: None,
    };
    
    let embedding_response = litellm_client
        .generate_embeddings(embedding_request)
        .await?;
    
    if embedding_response.data.is_empty() {
        return Err(anyhow::anyhow!("No embeddings returned from API"));
    }
    
    Ok(embedding_response.data[0].embedding.clone())
}

// Rename and modify the function signature
async fn search_values_for_term_by_embedding(
    data_source_id: &Uuid,
    embedding: Vec<f32>, // Accept pre-computed embedding
    limit: i64,
) -> Result<Vec<stored_values::search::StoredValueResult>> {
    // Skip searching if embedding is invalid (e.g., empty)
    if embedding.is_empty() {
        debug!("Skipping search for empty embedding");
        return Ok(vec![]);
    }

    // Search values using the provided embedding (no table/column filters)
    match stored_values::search::search_values_by_embedding(
        *data_source_id,
        &embedding,
        limit,
    ).await {
        Ok(results) => {
            debug!(count = results.len(), "Successfully found values matching embedding");
            Ok(results)
        }
        Err(e) => {
            error!(data_source_id = %data_source_id, error = %e, "Failed to search values by embedding");
            // Return empty results on error to continue the process
            Ok(vec![])
        }
    }
}

// Helper function to identify time-based terms that might cause issues
fn is_time_period_term(term: &str) -> bool {
    let term_lower = term.to_lowercase();
    
    // List of time periods that might cause embedding search issues
    let time_terms = [
        "today", "yesterday", "tomorrow",
        "last week", "last month", "last year", "last quarter",
        "this week", "this month", "this year", "this quarter",
        "next week", "next month", "next year", "next quarter",
        "q1", "q2", "q3", "q4",
        "january", "february", "march", "april", "may", "june", 
        "july", "august", "september", "october", "november", "december",
        "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dec"
    ];
    
    time_terms.iter().any(|&t| term_lower.contains(t))
}

// NEW: Convert StoredValueResult to FoundValueInfo
fn to_found_value_info(result: stored_values::search::StoredValueResult, _score: f64) -> FoundValueInfo {
    FoundValueInfo {
        value: result.value,
        database_name: result.database_name,
        schema_name: result.schema_name,
        table_name: result.table_name,
        column_name: result.column_name,
    }
}

#[derive(Debug, Deserialize)]
struct LLMFilterResponse {
    results: Vec<String>,
}

const SPECIFIC_LLM_FILTER_PROMPT: &str = r#"
You are a dataset relevance evaluator, focused on specific analytical requirements. Your task is to determine which datasets are **semantically relevant** to the user's query and the anticipated analytical needs based on their structure and metadata. Focus on the core **Business Objects, Properties, Events, Metrics, and Filters** explicitly requested or strongly implied.

USER REQUEST (Context): {user_request}
SPECIFIC SEARCH QUERY: {query} (This query is framed around key semantic concepts and anticipated attributes/joins identified from the user request)

Below is a list of datasets that were identified as potentially relevant by an initial ranking system.
For each dataset, review its description in the YAML format. Evaluate how well the dataset's described contents (columns, metrics, entities, documentation) **semantically align** with the key **Objects, Properties, Events, Metrics, and Filters** required by the SPECIFIC SEARCH QUERY and USER REQUEST context.

IMPORTANT EVIDENCE - ACTUAL DATA VALUES FOUND IN THIS DATASET:
{found_values_json}
These values were found in the actual data that matches your search requirements. Consider these as concrete evidence that this dataset contains data relevant to your query.

**Crucially, anticipate necessary attributes**: Pay close attention to whether the dataset contains specific attributes like **names, IDs, emails, timestamps, or other identifying/linking information** that are likely required to fulfill the analytical goal, even if not explicitly stated in the query but inferable from the user request context and common analytical patterns (e.g., needing 'customer name' when analyzing 'customer revenue').

Include datasets where the YAML description suggests a reasonable semantic match or overlap with the needed concepts and anticipated attributes. Prioritize datasets that appear to contain the core Objects or Events AND the necessary linking/descriptive Properties.

DATASETS:
{datasets_json}

Return a JSON response containing ONLY a list of the UUIDs for the semantically relevant datasets. The response should have the following structure:
```json
{
  "results": [
    "dataset-uuid-here-1",
    "dataset-uuid-here-2"
    // ... semantically relevant dataset UUIDs
  ]
}
```

IMPORTANT GUIDELINES:
1.  **Focus on Semantic Relevance & Anticipation**: Include datasets whose content, as described in the YAML, is semantically related to the required Objects, Properties, Events, Metrics, or Filters, AND contains the anticipated attributes needed for analysis (like names, IDs, relevant dimensions).
2.  **Consider the Core Concepts & Analytical Goal**: Does the dataset seem to be about the primary Business Object(s) or Event(s)? Does it contain relevant Properties or Metrics (including anticipated ones)?
3.  **Prioritize Datasets with Key Attributes**: Give higher importance to datasets containing necessary identifying or descriptive attributes (names, IDs, categories, timestamps) relevant to the query and user request context.
4.  **Evaluate based on Semantic Fit**: Does the dataset's purpose and structure align well with the user's information need and the likely analytical steps?
5.  **Consider Found Values as Evidence**: The actual values found in the dataset provide concrete evidence of relevance. If values matching the user's query (like specific entities, terms, or categories) appear in the dataset, this strongly suggests relevance.
6.  **Contextual Information is Relevant**: Include datasets providing important contextual Properties for the core Objects or Events.
7.  **When in doubt, lean towards inclusion if semantically plausible and potentially useful**: If the dataset seems semantically related, include it.
8.  **CRITICAL:** Each string in the "results" array MUST contain ONLY the dataset's UUID string (e.g., "9711ca55-8329-4fd9-8b20-b6a3289f3d38").
9.  **Use USER REQUEST for context, SPECIFIC SEARCH QUERY for focus**: Understand the underlying need (user request) and the specific concepts/attributes being targeted (search query).
"#;

const EXPLORATORY_LLM_FILTER_PROMPT: &str = r#"
You are a dataset relevance evaluator, focused on exploring potential connections and related concepts. Your task is to determine which datasets might be **thematically relevant** or provide useful **contextual information** related to the user's exploratory topic and broader request.

USER REQUEST (Context): {user_request}
EXPLORATORY TOPIC: {topic} (This topic represents a general area of interest derived from the user request)

Below is a list of datasets identified as potentially relevant by an initial ranking system.
For each dataset, review its description in the YAML format. Evaluate how well the dataset's described contents (columns, metrics, entities, documentation) **thematically relate** to the EXPLORATORY TOPIC and the overall USER REQUEST context.

IMPORTANT EVIDENCE - ACTUAL DATA VALUES FOUND IN THIS DATASET:
{found_values_json}
These values were found in the actual data that matches your exploratory topics. Consider these as concrete evidence that this dataset contains data relevant to your exploration.

Consider datasets that:
- Directly address the EXPLORATORY TOPIC.
- Contain concepts, objects, or events that are often related to the EXPLORATORY TOPIC (e.g., if the topic is 'customer churn', related datasets might involve 'customer support interactions', 'product usage', 'marketing engagement', 'customer demographics').
- Provide valuable contextual dimensions (like time, geography, product categories) that could enrich the analysis of the EXPLORATORY TOPIC.
- Might reveal interesting patterns or correlations when combined with data more central to the topic.

Focus on **potential utility for exploration and discovery**, rather than strict semantic matching to the topic words alone.

DATASETS:
{datasets_json}

Return a JSON response containing ONLY a list of the UUIDs for the potentially relevant datasets for exploration. The response should have the following structure:
```json
{
  "results": [
    "dataset-uuid-here-1",
    "dataset-uuid-here-2"
    // ... potentially relevant dataset UUIDs for exploration
  ]
}
```

IMPORTANT GUIDELINES:
1.  **Focus on Thematic Relevance & Potential Utility**: Include datasets whose content seems related to the EXPLORATORY TOPIC or could provide valuable context/insights for exploration.
2.  **Consider Related Concepts**: Think broadly about what data is often analyzed alongside the given topic.
3.  **Consider Found Values as Evidence**: The actual values found in the dataset provide concrete evidence of relevance. If values matching the user's exploratory topic (like specific entities, terms, or categories) appear in the dataset, this strongly suggests usefulness for exploration.
4.  **Prioritize Breadth**: Lean towards including datasets that might offer different perspectives or dimensions related to the topic.
5.  **Evaluate based on Potential for Discovery**: Does the dataset seem like it could contribute to understanding the topic area, even indirectly?
6.  **Contextual Information is Valuable**: Include datasets providing relevant dimensions or related entities.
7.  **When in doubt, lean towards inclusion if thematically plausible**: If the dataset seems potentially related to the exploration goal, include it.
8.  **CRITICAL:** Each string in the "results" array MUST contain ONLY the dataset's UUID string (e.g., "9711ca55-8329-4fd9-8b20-b6a3289f3d38").
9.  **Use USER REQUEST for context, EXPLORATORY TOPIC for focus**: Understand the underlying need (user request) and the general area being explored (topic).
"#;

// NEW: Helper function to extract data source ID from permissioned datasets
// This is a placeholder - you'll need to adjust based on how data_source_id is actually stored/retrieved
fn extract_data_source_id(datasets: &[PermissionedDataset]) -> Option<Uuid> {
    // Assuming datasets have a data_source_id property or it can be derived from dataset.id
    // As a fallback, we're using the ID of the first dataset
    // Replace this with actual implementation based on your data model
    if datasets.is_empty() {
        return None;
    }
    
    // For this implementation, we're assuming the dataset ID is the data source ID
    // In a real implementation, you would likely have a different way to get the data_source_id
    Some(datasets[0].data_source_id)
}

pub struct SearchDataCatalogTool {
    agent: Arc<Agent>,
}

impl SearchDataCatalogTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }

    #[allow(dead_code)]
    async fn is_enabled(&self) -> bool {
        true
    }

    async fn get_datasets(user_id: &Uuid) -> Result<Vec<PermissionedDataset>> {
        debug!("Fetching permissioned datasets for agent tool for user {}", user_id);
        let datasets_result = get_permissioned_datasets(user_id, 0, 10000).await;

        match datasets_result {
            Ok(datasets) => {
                let filtered_datasets: Vec<PermissionedDataset> = datasets
                    .into_iter()
                    .filter(|d| d.yml_content.is_some())
                    .collect();

                debug!(
                    count = filtered_datasets.len(),
                    user_id = %user_id,
                    "Successfully loaded and filtered permissioned datasets for agent tool"
                );
                Ok(filtered_datasets)
            }
            Err(e) => {
                error!(user_id = %user_id, "Failed to load permissioned datasets for agent tool: {}", e);
                Err(anyhow::anyhow!("Error fetching permissioned datasets: {}", e))
            }
        }
    }
}

#[async_trait]
impl ToolExecutor for SearchDataCatalogTool {
    type Output = SearchDataCatalogOutput;
    type Params = SearchDataCatalogParams;

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        let start_time = Instant::now();
        let user_id = self.agent.get_user_id();
        let session_id = self.agent.get_session_id();

        let specific_queries = params.specific_queries.clone().unwrap_or_default();
        let exploratory_topics = params.exploratory_topics.clone().unwrap_or_default();
        
        // Get the user prompt for extracting value search terms
        let user_prompt_value = self.agent.get_state_value("user_prompt").await;
        let user_prompt_str = match user_prompt_value {
            Some(Value::String(prompt)) => prompt,
            _ => {
                warn!("User prompt not found in agent state for value extraction.");
                "User query context not available.".to_string()
            }
        };
        
        debug!(
            specific_queries_count = specific_queries.len(),
            exploratory_topics_count = exploratory_topics.len(),
            "Starting request with specific queries and exploratory topics"
        );

        // Start concurrent tasks
        
        // 1. Start value term extraction concurrently
        let user_prompt_clone = user_prompt_str.clone();
        let user_id_clone = user_id.clone();
        let session_id_clone = session_id.clone();
        let value_search_terms_future = tokio::spawn(async move {
            extract_value_search_terms(user_prompt_clone, user_id_clone, session_id_clone).await
        });
        
        // 2. Begin fetching datasets concurrently
        let user_id_for_datasets = user_id.clone();
        let all_datasets_future = tokio::spawn(async move {
            Self::get_datasets(&user_id_for_datasets).await
        });
        
        // Await the datasets future first (we need this to proceed)
        let all_datasets = match all_datasets_future.await? {
            Ok(datasets) => datasets,
            Err(e) => {
                error!(user_id=%user_id, "Failed to retrieve permissioned datasets for tool execution: {}", e);
                return Ok(SearchDataCatalogOutput {
                    message: format!("Error fetching datasets: {}", e),
                    specific_queries: params.specific_queries,
                    exploratory_topics: params.exploratory_topics,
                    value_search_terms: Some(vec![]),
                    duration: start_time.elapsed().as_millis() as i64,
                    results: vec![],
                });
            }
        };

        if all_datasets.is_empty() {
            info!("No datasets found for the organization.");
            return Ok(SearchDataCatalogOutput {
                message: "No datasets available to search.".to_string(),
                specific_queries: params.specific_queries,
                exploratory_topics: params.exploratory_topics,
                value_search_terms: Some(vec![]),
                duration: start_time.elapsed().as_millis() as i64,
                results: vec![],
            });
        }

        // Get the data source ID
        let target_data_source_id = match extract_data_source_id(&all_datasets) {
            Some(id) => id,
            None => {
                warn!("No data source ID found in the permissioned datasets.");
                return Ok(SearchDataCatalogOutput {
                    message: "Could not determine data source for value search.".to_string(),
                    specific_queries: params.specific_queries,
                    exploratory_topics: params.exploratory_topics,
                    value_search_terms: Some(vec![]),
                    duration: start_time.elapsed().as_millis() as i64,
                    results: vec![],
                });
            }
        };
        
        debug!(data_source_id = %target_data_source_id, "Identified target data source ID for value search");

        // Prepare documents from datasets
        let documents: Vec<String> = all_datasets
            .iter()
            .filter_map(|dataset| dataset.yml_content.clone())
            .collect();

        if documents.is_empty() {
            warn!("No datasets with YML content found after filtering.");
            return Ok(SearchDataCatalogOutput {
                message: "No searchable dataset content found.".to_string(),
                specific_queries: params.specific_queries,
                exploratory_topics: params.exploratory_topics,
                value_search_terms: Some(vec![]),
                duration: start_time.elapsed().as_millis() as i64,
                results: vec![],
            });
        }

        // 3. Start reranking tasks concurrently (for specific queries and exploratory topics)
        // We'll use the user prompt for the LLM filtering
        let user_prompt_for_task = user_prompt_str.clone();
        
        // 3a. Start specific query reranking
        let specific_rerank_futures = stream::iter(specific_queries.clone())
            .map(|query| {
                let current_query = query.clone();
                let datasets_clone = all_datasets.clone();
                let documents_clone = documents.clone();

                async move {
                    let ranked = match rerank_datasets(&current_query, &datasets_clone, &documents_clone).await {
                        Ok(r) => r,
                        Err(e) => {
                            error!(error = %e, query = current_query, "Reranking failed for specific query");
                            Vec::new()
                        }
                    };

                    (current_query, ranked)
                }
            })
            .buffer_unordered(10);

        // 3b. Start exploratory topic reranking
        let exploratory_rerank_futures = stream::iter(exploratory_topics.clone())
            .map(|topic| {
                let current_topic = topic.clone();
                let datasets_clone = all_datasets.clone();
                let documents_clone = documents.clone();

                async move {
                    let ranked = match rerank_datasets(&current_topic, &datasets_clone, &documents_clone).await {
                        Ok(r) => r,
                        Err(e) => {
                            error!(error = %e, topic = current_topic, "Reranking failed for exploratory topic");
                            Vec::new()
                        }
                    };

                    (current_topic, ranked)
                }
            })
            .buffer_unordered(10);

        // Collect rerank results in parallel
        let specific_reranked_vec = specific_rerank_futures.collect::<Vec<(String, Vec<RankedDataset>)>>().await;
        let exploratory_reranked_vec = exploratory_rerank_futures.collect::<Vec<(String, Vec<RankedDataset>)>>().await;
        
        // Now await the value search terms
        let value_search_terms = match value_search_terms_future.await? {
            Ok(terms) => terms,
            Err(e) => {
                warn!(error = %e, "Failed to extract value search terms, falling back to provided terms if any");
                vec![]
            }
        };
        
        // Filter terms before generating embeddings
        let valid_value_search_terms: Vec<String> = value_search_terms
            .into_iter()
            .filter(|term| term.len() >= 2 && !is_time_period_term(term))
            .collect();

        // Check if we have anything to search for *after* extracting terms
        if specific_queries.is_empty() && exploratory_topics.is_empty() && valid_value_search_terms.is_empty() {
            warn!("SearchDataCatalogTool executed with no specific queries, exploratory topics, or valid value search terms.");
            return Ok(SearchDataCatalogOutput {
                message: "No search queries, exploratory topics, or valid value search terms provided.".to_string(),
                specific_queries: params.specific_queries,
                exploratory_topics: params.exploratory_topics,
                value_search_terms: Some(valid_value_search_terms.clone()), // Return the filtered list
                duration: start_time.elapsed().as_millis() as i64,
                results: vec![],
            });
        }

        let embedding_terms = valid_value_search_terms.clone();

        // 4. Generate embeddings for all valid terms concurrently using batching
        let embedding_batch_future = tokio::spawn(async move {
            generate_embeddings_batch(embedding_terms).await
        });

        // Await the batch embedding generation
        let term_embeddings: HashMap<String, Vec<f32>> = match embedding_batch_future.await? {
            Ok(results) => results.into_iter().collect(),
            Err(e) => {
                error!(error = %e, "Batch embedding generation failed");
                HashMap::new() // Return empty map on error
            }
        };

        debug!(count = term_embeddings.len(), "Generated embeddings for value search terms via batch");

        // 5. Begin value searches concurrently using pre-generated embeddings
        let mut value_search_futures = Vec::new();
        for (term, embedding) in term_embeddings.iter() {
            let term_clone = term.clone();
            let embedding_clone = embedding.clone();
            let data_source_id_clone = target_data_source_id;
            
            let future = tokio::spawn(async move {
                let results = search_values_for_term_by_embedding(
                    &data_source_id_clone,
                    embedding_clone,
                    20, // Get top 20 values per term
                ).await;
                
                (term_clone, results)
            });
            
            value_search_futures.push(future);
        }
        
        // Await value searches to complete (renumbered step)
        let value_search_results_vec: Vec<(String, Result<Vec<stored_values::search::StoredValueResult>>)> = 
            futures::future::join_all(value_search_futures)
                .await
                .into_iter()
                .filter_map(|r| r.ok()) // Filter out any join errors
                .collect();
        
        // Process the value search results
        let mut found_values_by_term = HashMap::new();
        for (term, result) in value_search_results_vec {
            match result {
                Ok(values) => {
                    let found_values: Vec<FoundValueInfo> = values.into_iter()
                        .map(|val| {
                            to_found_value_info(val, 0.0) // We don't use score in FoundValueInfo
                        })
                        .collect();
                    
                    let term_str = term.clone(); // Clone before moving into HashMap
                    let values_count = found_values.len();
                    found_values_by_term.insert(term, found_values);
                    debug!(term = %term_str, count = values_count, "Found values for search term");
                }
                Err(e) => {
                    error!(term = %term, error = %e, "Error searching for values");
                    found_values_by_term.insert(term, vec![]);
                }
            }
        }
        
        // Flatten all found values into a single list
        let all_found_values: Vec<FoundValueInfo> = found_values_by_term.values()
            .flat_map(|values| values.clone())
            .collect();
        
        debug!(value_count = all_found_values.len(), "Total found values across all terms");

        // 6. Now run LLM filtering with the found values and ranked datasets (renumbered step)
        let specific_filter_futures = stream::iter(specific_reranked_vec)
            .map(|(query, ranked)| {
                let user_id_clone = user_id.clone();
                let session_id_clone = session_id.clone();
                let prompt_clone = user_prompt_for_task.clone();
                let values_clone = all_found_values.clone();

                async move {
                    if ranked.is_empty() {
                        return Ok(vec![]);
                    }
                    
                    match filter_specific_datasets_with_llm(&query, &prompt_clone, ranked, &user_id_clone, &session_id_clone, &values_clone).await {
                        Ok(filtered) => Ok(filtered),
                        Err(e) => {
                            error!(error = %e, query = query, "LLM filtering failed for specific query");
                            Ok(vec![])
                        }
                    }
                }
            })
            .buffer_unordered(10);

        let exploratory_filter_futures = stream::iter(exploratory_reranked_vec)
            .map(|(topic, ranked)| {
                let user_id_clone = user_id.clone();
                let session_id_clone = session_id.clone();
                let prompt_clone = user_prompt_for_task.clone();
                let values_clone = all_found_values.clone();

                async move {
                    if ranked.is_empty() {
                        return Ok(vec![]);
                    }
                    
                    match filter_exploratory_datasets_with_llm(&topic, &prompt_clone, ranked, &user_id_clone, &session_id_clone, &values_clone).await {
                        Ok(filtered) => Ok(filtered),
                        Err(e) => {
                            error!(error = %e, topic = topic, "LLM filtering failed for exploratory topic");
                            Ok(vec![])
                        }
                    }
                }
            })
            .buffer_unordered(10);
        
        // Collect filter results
        let specific_results_vec: Vec<Result<Vec<DatasetResult>>> = specific_filter_futures.collect().await;
        let exploratory_results_vec: Vec<Result<Vec<DatasetResult>>> = exploratory_filter_futures.collect().await;

        // Process and combine results
        let mut combined_results = Vec::new();
        let mut unique_ids = HashSet::new();

        for result in specific_results_vec {
            match result {
                Ok(datasets) => {
                    for dataset in datasets {
                        if unique_ids.insert(dataset.id) {
                            combined_results.push(dataset);
                        }
                    }
                }
                Err(e) => {
                    warn!("Error processing a specific query stream: {}", e);
                }
            }
        }

        for result in exploratory_results_vec {
            match result {
                Ok(datasets) => {
                    for dataset in datasets {
                        if unique_ids.insert(dataset.id) {
                            combined_results.push(dataset);
                        }
                    }
                }
                Err(e) => {
                    warn!("Error processing an exploratory topic stream: {}", e);
                }
            }
        }

        let final_search_results: Vec<DatasetSearchResult> = combined_results
            .into_iter()
            .map(|result| DatasetSearchResult {
                id: result.id,
                name: result.name,
                yml_content: result.yml_content,
            })
            .collect();

        // After filtering and before returning results, update YML content with search results
        // For each dataset in the final results, search for searchable dimensions and update YML
        let mut updated_results = Vec::new();
        
        for result in &final_search_results {
            let mut updated_result = result.clone();
            
            if let Some(yml_content) = &result.yml_content {
                // Search and update YML with relevant values
                match search_and_update_yml(
                    yml_content,
                    target_data_source_id,
                    &user_prompt_str,
                    &user_id,
                    &session_id
                ).await {
                    Ok(updated_yml) => {
                        debug!(
                            dataset_id = %result.id,
                            "Successfully updated YML with relevant values for searchable dimensions"
                        );
                        updated_result.yml_content = Some(updated_yml);
                    },
                    Err(e) => {
                        warn!(
                            dataset_id = %result.id,
                            error = %e,
                            "Failed to update YML with relevant values"
                        );
                    }
                }
            }
            
            updated_results.push(updated_result);
        }

        // Return the updated results
        let message = if updated_results.is_empty() {
            "No relevant datasets found after filtering.".to_string()
        } else {
            format!("Found {} relevant datasets with injected values for searchable dimensions.", updated_results.len())
        };

        self.agent
            .set_state_value(
                String::from("data_context"),
                Value::Bool(!updated_results.is_empty()),
            )
            .await;

        self.agent
            .set_state_value(String::from("searched_data_catalog"), Value::Bool(true))
            .await;

        let duration = start_time.elapsed().as_millis();

        Ok(SearchDataCatalogOutput {
            message,
            specific_queries: params.specific_queries,
            exploratory_topics: params.exploratory_topics,
            value_search_terms: Some(valid_value_search_terms),
            duration: duration as i64,
            results: updated_results,  // Use updated results instead of final_search_results
        })
    }

    fn get_name(&self) -> String {
        "search_data_catalog".to_string()
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
          "name": "search_data_catalog",
          "description": get_search_data_catalog_description().await,
          "parameters": {
            "type": "object",
            "properties": {
              "specific_queries": {
                "type": "array",
                "description": "Optional list of specific, high-intent search queries targeting data assets based on identified Objects, Properties, Events, Metrics, Filters, and anticipated needs (e.g., required joins, identifiers). Use for focused requests.",
                "items": {
                  "type": "string",
                  "description": "A concise, full-sentence, natural language query describing the specific search intent, e.g., 'Find datasets with Customer orders including Order ID, Order Date, Total Amount, and linked Customer Name and Email.'"
                },
              },
              "exploratory_topics": {
                 "type": "array",
                 "description": "Optional list of broader topics for exploration when the user's request is vague or seeks related concepts. Aims to discover potentially relevant datasets based on thematic connections.",
                 "items": {
                   "type": "string",
                   "description": "A concise topic phrase describing a general area of interest, e.g., 'Customer churn factors', 'Website traffic analysis', 'Product performance metrics'."
                 },
               },
            },
            "additionalProperties": false
          }
        })
    }
}

async fn get_search_data_catalog_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "Searches the data catalog for relevant data assets (e.g., datasets, models, metrics, filters, properties, documentation) based on high-intent queries derived solely from the user's request and conversation history, with no assumptions about data availability. Queries are concise, full-sentence, natural language expressions of search intent. Specific requests generate a single, focused query, while broad requests produce multiple queries to cover all context-implied assets (datasets, models, metrics, properties, documentation), starting with topics mentioned in the context (e.g., sales, customers, products) and refining with filters, metrics, or relationships. Supports multiple concurrent queries for comprehensive coverage.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "865efb24-4355-4abb-aaf7-260af0f06794").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!(
                "Failed to get prompt system message for tool description: {}",
                e
            );
            "Searches the data catalog for relevant data assets (e.g., datasets, models, metrics, filters, properties, documentation) based on high-intent queries derived solely from the user's request and conversation history, with no assumptions about data availability. Queries are concise, full-sentence, natural language expressions of search intent. Specific requests generate a single, focused query, while broad requests produce multiple queries to cover all context-implied assets (datasets, models, metrics, properties, documentation), starting with topics mentioned in the context (e.g., sales, customers, products) and refining with filters, metrics, or relationships. Supports multiple concurrent queries for comprehensive coverage.".to_string()
        }
    }
}

async fn rerank_datasets(
    query: &str,
    all_datasets: &[PermissionedDataset],
    documents: &[String],
) -> Result<Vec<RankedDataset>, anyhow::Error> {
    if documents.is_empty() || all_datasets.is_empty() {
        return Ok(vec![]);
    }
    let co = Cohere::default();

    let request = ReRankRequest {
        query,
        documents,
        model: ReRankModel::EnglishV3,
        top_n: Some(35),
        ..Default::default()
    };

    let rerank_results = match co.rerank(&request).await {
        Ok(results) => results,
        Err(e) => {
            error!(error = %e, query = query, "Cohere rerank API call failed");
            return Err(anyhow::anyhow!("Cohere rerank failed: {}", e));
        }
    };

    let mut ranked_datasets = Vec::new();
    for result in rerank_results {
        if let Some(dataset) = all_datasets.get(result.index as usize) {
            ranked_datasets.push(RankedDataset {
                dataset: dataset.clone(),
            });
        } else {
            error!(
                "Invalid dataset index {} from Cohere for query '{}'. Max index: {}",
                result.index,
                query,
                all_datasets.len() - 1
            );
        }
    }

    let relevant_datasets = ranked_datasets.into_iter().collect::<Vec<_>>();

    Ok(relevant_datasets)
}

async fn llm_filter_helper(
    prompt_template: &str,
    query_or_topic: &str,
    user_prompt: &str,
    ranked_datasets: Vec<RankedDataset>,
    user_id: &Uuid,
    session_id: &Uuid,
    generation_name_suffix: &str,
    all_found_values: &[FoundValueInfo],
) -> Result<Vec<DatasetResult>, anyhow::Error> {
    if ranked_datasets.is_empty() {
        return Ok(vec![]);
    }

    let datasets_json = ranked_datasets
        .iter()
        .map(|ranked| {
            serde_json::json!({
                "id": ranked.dataset.id.to_string(),
                "name": ranked.dataset.name,
                "yml_content": ranked.dataset.yml_content.clone().unwrap_or_default(),
            })
        })
        .collect::<Vec<_>>();

    // NEW: Format found values as JSON for the prompt
    let found_values_json = if all_found_values.is_empty() {
        "No specific values were found in the dataset that match the search terms.".to_string()
    } else {
        // Convert found values to a formatted string that can be inserted in the prompt
        let values_json = all_found_values
            .iter()
            .map(|val| {
                format!(
                    "- '{}' (found in {}.{}.{})",
                    val.value, val.database_name, val.table_name, val.column_name
                )
            })
            .collect::<Vec<_>>()
            .join("\n");
        values_json
    };

    let prompt = prompt_template
        .replace("{user_request}", user_prompt)
        .replace("{query}", query_or_topic)
        .replace("{topic}", query_or_topic)
        .replace(
            "{datasets_json}",
            &serde_json::to_string_pretty(&datasets_json)?,
        )
        .replace("{found_values_json}", &found_values_json);

    let llm_client = LiteLLMClient::new(None, None);

    let request = ChatCompletionRequest {
        model: "gemini-2.0-flash-001".to_string(),
        messages: vec![AgentMessage::User {
            id: None,
            content: prompt,
            name: None,
        }],
        stream: Some(false),
        response_format: Some(ResponseFormat {
            type_: "json_object".to_string(),
            json_schema: None,
        }),
        metadata: Some(Metadata {
            generation_name: format!("filter_data_catalog_{}_agent", generation_name_suffix),
            user_id: user_id.to_string(),
            session_id: session_id.to_string(),
            trace_id: Uuid::new_v4().to_string(),
        }),
        max_completion_tokens: Some(8096),
        temperature: Some(0.0),
        ..Default::default()
    };

    let response = llm_client.chat_completion(request).await?;

    let content = match response.choices.get(0).map(|c| &c.message) {
        Some(AgentMessage::Assistant { content: Some(content), .. }) => content,
        _ => {
            error!("LLM filter response missing or invalid content for query/topic: {}", query_or_topic);
            return Err(anyhow::anyhow!("LLM filter response missing or invalid content"));
        }
    };

    let filter_response: LLMFilterResponse = match serde_json::from_str(content) {
        Ok(response) => response,
        Err(e) => {
            error!(
                "Failed to parse LLM filter response for query/topic '{}': {}. Content: {}",
                query_or_topic, e, content
            );
            return Err(anyhow::anyhow!(
                "Failed to parse LLM filter response: {}",
                e
            ));
        }
    };

    let dataset_map: HashMap<Uuid, &PermissionedDataset> = ranked_datasets
        .iter()
        .map(|ranked| (ranked.dataset.id, &ranked.dataset))
        .collect();

    let filtered_datasets: Vec<DatasetResult> = filter_response
        .results
        .into_iter()
        .filter_map(|dataset_id_str| {
            match Uuid::parse_str(&dataset_id_str) {
                Ok(parsed_id) => {
                    if let Some(dataset) = dataset_map.get(&parsed_id) {
                        debug!(dataset_id = %dataset.id, dataset_name = %dataset.name, "Found matching dataset via LLM filter for query/topic: {}", query_or_topic);
                        Some(DatasetResult {
                            id: dataset.id,
                            name: Some(dataset.name.clone()),
                            yml_content: dataset.yml_content.clone(),
                        })
                    } else {
                        warn!(parsed_id = %parsed_id, query_or_topic = query_or_topic, "LLM filter returned UUID not found in ranked list");
                        None
                    }
                }
                Err(e) => {
                    error!(llm_result_id_str = %dataset_id_str, error = %e, query_or_topic = query_or_topic, "Failed to parse UUID from LLM filter result string");
                    None
                }
            }
        })
        .collect();

    debug!(
        "LLM filtering ({}) complete for query/topic '{}', keeping {} relevant datasets",
        generation_name_suffix,
        query_or_topic,
        filtered_datasets.len()
    );
    Ok(filtered_datasets)
}

async fn filter_specific_datasets_with_llm(
    query: &str,
    user_prompt: &str,
    ranked_datasets: Vec<RankedDataset>,
    user_id: &Uuid,
    session_id: &Uuid,
    all_found_values: &[FoundValueInfo],
) -> Result<Vec<DatasetResult>, anyhow::Error> {
    debug!(
        "Filtering {} datasets with SPECIFIC LLM for query: {}",
        ranked_datasets.len(),
        query
    );
    llm_filter_helper(
        SPECIFIC_LLM_FILTER_PROMPT,
        query,
        user_prompt,
        ranked_datasets,
        user_id,
        session_id,
        "specific",
        all_found_values
    ).await
}

async fn filter_exploratory_datasets_with_llm(
    topic: &str,
    user_prompt: &str,
    ranked_datasets: Vec<RankedDataset>,
    user_id: &Uuid,
    session_id: &Uuid,
    all_found_values: &[FoundValueInfo],
) -> Result<Vec<DatasetResult>, anyhow::Error> {
    debug!(
        "Filtering {} datasets with EXPLORATORY LLM for topic: {}",
        ranked_datasets.len(),
        topic
    );
    llm_filter_helper(
        EXPLORATORY_LLM_FILTER_PROMPT,
        topic,
        user_prompt,
        ranked_datasets,
        user_id,
        session_id,
        "exploratory",
        all_found_values
    ).await
}

// NEW: Extract potential column values from user query using Gemini
async fn extract_value_search_terms(user_request: String, user_id: Uuid, session_id: Uuid) -> Result<Vec<String>> {
    debug!("Extracting potential value search terms from user request");
    
    let prompt = r#"
Your task is to extract specific values/entities from a user request that are likely to appear as actual values in database columns, focusing on concrete entities that would be useful for semantic search.

Focus on extracting these types of values:
1. Product names (e.g., "Red Bull", "iPhone 12")
2. Company/organization names (e.g., "Acme Corp", "Microsoft")
3. People's names (e.g., "John Smith", "Dallin Bentley")
4. Locations/regions (e.g., "California", "New York", "Europe", "West Coast")
5. Categories/segments (e.g., "Premium tier", "Enterprise customers", "SMB segment")
6. Status values (e.g., "completed", "pending", "active")
7. Product features (e.g., "waterproof", "4K resolution")
8. Industry terms (e.g., "B2B", "SaaS", "retail")

DO NOT include:
1. General concepts, objects, or metrics (e.g., "revenue", "customers", "products")
2. Time periods (e.g., "last month", "Q1", "yesterday", "January") - these work poorly with embedding search
3. Generic attributes (e.g., "name", "id", "date")
4. Common words or very short terms (1-2 characters)
5. Numbers without context

Extract only SPECIFIC, DISTINCTIVE values that would be stored in a database as actual values in columns.

For example, from: "Show me sales for Red Bull in California in Q1", only extract: ["Red Bull", "California"]
From: "What is John Smith's customer satisfaction score?", extract: ["John Smith"]
From: "Compare revenue between Premium and Basic tiers", extract: ["Premium", "Basic"]
From: "Sales for Apple products last month in Europe", extract: ["Apple", "Europe"]

User request: "{user_request}"

Output the extracted values as a JSON array of strings. If no valid values are found, return an empty array.
Example response formats:
["Red Bull", "California"]
["John Smith"]
[]
"#.replace("{user_request}", &user_request);

    let llm_client = LiteLLMClient::new(None, None);

    let request = ChatCompletionRequest {
        model: "gemini-2.0-flash-001".to_string(),
        messages: vec![AgentMessage::User {
            id: None,
            content: prompt,
            name: None,
        }],
        stream: Some(false),
        response_format: Some(ResponseFormat {
            type_: "json_object".to_string(),
            json_schema: Some(serde_json::json!({
                "type": "array",
                "items": {
                    "type": "string"
                }
            })),
        }),
        metadata: Some(Metadata {
            generation_name: "extract_value_search_terms".to_string(),
            user_id: user_id.to_string(),
            session_id: session_id.to_string(),
            trace_id: Uuid::new_v4().to_string(),
        }),
        max_completion_tokens: Some(2048),
        temperature: Some(0.0),
        ..Default::default()
    };

    let response = llm_client.chat_completion(request).await?;

    let content = match response.choices.get(0).map(|c| &c.message) {
        Some(AgentMessage::Assistant { content: Some(content), .. }) => content,
        _ => {
            error!("LLM response missing or invalid content");
            return Ok(vec![]);
        }
    };

    // Try to parse the response as a JSON array of strings
    match serde_json::from_str::<Vec<String>>(content) {
        Ok(extracted_terms) => {
            debug!(
                extracted_terms = ?extracted_terms,
                count = extracted_terms.len(),
                "Successfully extracted value search terms"
            );
            Ok(extracted_terms)
        },
        Err(e) => {
            // If parsing as array fails, try as object with a values field
            match serde_json::from_str::<serde_json::Value>(content) {
                Ok(json_value) => {
                    if let Some(values) = json_value.as_array() {
                        let extracted_terms: Vec<String> = values
                            .iter()
                            .filter_map(|v| v.as_str().map(|s| s.to_string()))
                            .collect();
                        
                        debug!(
                            extracted_terms = ?extracted_terms,
                            count = extracted_terms.len(),
                            "Successfully extracted value search terms from JSON array"
                        );
                        Ok(extracted_terms)
                    } else {
                        warn!(content = %content, "LLM response was valid JSON but not an array of strings");
                        Ok(vec![])
                    }
                },
                Err(e2) => {
                    error!(error1 = %e, error2 = %e2, content = %content, "Failed to parse LLM response as JSON");
                    Ok(vec![])
                }
            }
        }
    }
}

// NEW: Helper function to generate embeddings for multiple texts in a batch
async fn generate_embeddings_batch(texts: Vec<String>) -> Result<Vec<(String, Vec<f32>)>> {
    if texts.is_empty() {
        return Ok(vec![]);
    }
    
    let litellm_client = LiteLLMClient::new(None, None);
    
    let embedding_request = EmbeddingRequest {
        model: "text-embedding-3-small".to_string(),
        input: texts.clone(), // Pass all texts to the API
        dimensions: Some(1536),
        encoding_format: Some("float".to_string()),
        user: None,
    };
    
    debug!(count = texts.len(), "Generating embeddings in batch");
    
    let embedding_response = litellm_client
        .generate_embeddings(embedding_request)
        .await
        .context("Failed to generate embeddings batch")?;
        
    if embedding_response.data.len() != texts.len() {
        warn!(
            "Mismatch between input text count ({}) and returned embedding count ({})",
            texts.len(),
            embedding_response.data.len()
        );
        // Attempt to match based on index, but this might be inaccurate if the order isn't guaranteed
    }

    let mut results = Vec::with_capacity(texts.len());
    for (index, text) in texts.into_iter().enumerate() {
        if let Some(embedding_data) = embedding_response.data.get(index) {
            results.push((text, embedding_data.embedding.clone()));
        } else {
            error!(term = %text, index = index, "Could not find corresponding embedding in batch response");
        }
    }
    
    Ok(results)
}

/// Parse YAML content to find models with searchable dimensions
fn extract_searchable_dimensions(yml_content: &str) -> Result<Vec<SearchableDimension>> {
    let yaml: serde_yaml::Value = serde_yaml::from_str(yml_content)
        .context("Failed to parse dataset YAML content")?;
    
    let mut searchable_dimensions = Vec::new();
    
    // Check if models field exists
    if let Some(models) = yaml["models"].as_sequence() {
        for model in models {
            let model_name = model["name"].as_str().unwrap_or("unknown_model").to_string();
            
            // Check if dimensions field exists
            if let Some(dimensions) = model["dimensions"].as_sequence() {
                for dimension in dimensions {
                    // Check if dimension has searchable: true
                    if let Some(true) = dimension["searchable"].as_bool() {
                        let dimension_name = dimension["name"].as_str().unwrap_or("unknown_dimension").to_string();
                        
                        // Store this dimension as searchable
                        searchable_dimensions.push(SearchableDimension {
                            model_name: model_name.clone(), // Clone here to avoid move
                            dimension_name: dimension_name.clone(),
                            dimension_path: vec!["models".to_string(), model_name.clone(), "dimensions".to_string(), dimension_name],
                        });
                    }
                }
            }
        }
    }
    
    Ok(searchable_dimensions)
}

/// Extract database structure from YAML content based on actual model structure
fn extract_database_info_from_yaml(yml_content: &str) -> Result<HashMap<String, HashMap<String, HashMap<String, Vec<String>>>>> {
    let yaml: serde_yaml::Value = serde_yaml::from_str(yml_content)
        .context("Failed to parse dataset YAML content")?;
    
    // Structure: database -> schema -> table -> columns
    let mut database_info = HashMap::new();
    
    // Process models
    if let Some(models) = yaml["models"].as_sequence() {
        for model in models {
            // Extract database, schema, and model name (which acts as table name)
            let database_name = model["database"].as_str().unwrap_or("unknown").to_string();
            let schema_name = model["schema"].as_str().unwrap_or("public").to_string();
            let table_name = model["name"].as_str().unwrap_or("unknown_model").to_string();
            
            // Initialize the nested structure if needed
            database_info
                .entry(database_name.clone())
                .or_insert_with(HashMap::new)
                .entry(schema_name.clone())
                .or_insert_with(HashMap::new);
            
            // Collect column names from dimensions, measures, and metrics
            let mut columns = Vec::new();
            
            // Add dimensions
            if let Some(dimensions) = model["dimensions"].as_sequence() {
                for dim in dimensions {
                    if let Some(dim_name) = dim["name"].as_str() {
                        columns.push(dim_name.to_string());
                        
                        // Also add the expression as a potential column to search
                        if let Some(expr) = dim["expr"].as_str() {
                            if expr != dim_name {
                                columns.push(expr.to_string());
                            }
                        }
                    }
                }
            }
            
            // Add measures
            if let Some(measures) = model["measures"].as_sequence() {
                for measure in measures {
                    if let Some(measure_name) = measure["name"].as_str() {
                        columns.push(measure_name.to_string());
                        
                        // Also add the expression as a potential column to search
                        if let Some(expr) = measure["expr"].as_str() {
                            if expr != measure_name {
                                columns.push(expr.to_string());
                            }
                        }
                    }
                }
            }
            
            // Add metrics
            if let Some(metrics) = model["metrics"].as_sequence() {
                for metric in metrics {
                    if let Some(metric_name) = metric["name"].as_str() {
                        columns.push(metric_name.to_string());
                    }
                }
            }
            
            // Store columns for this model
            database_info
                .get_mut(&database_name)
                .unwrap()
                .get_mut(&schema_name)
                .unwrap()
                .insert(table_name, columns);
        }
    }
    
    Ok(database_info)
}

/// Perform concurrent searches for searchable dimensions and update YAML
async fn search_and_update_yml(
    yml_content: &str,
    data_source_id: Uuid,
    user_query: &str,
    user_id: &Uuid,
    session_id: &Uuid,
) -> Result<String> {
    // Extract searchable dimensions
    let searchable_dimensions = extract_searchable_dimensions(yml_content)?;
    
    if searchable_dimensions.is_empty() {
        debug!("No searchable dimensions found in YAML content");
        return Ok(yml_content.to_string());
    }
    
    // Generate embedding for user query
    let embedding = generate_embedding_for_text(user_query).await?;
    
    // Extract database structure from YAML - this is now model-based
    let database_info = extract_database_info_from_yaml(yml_content)?;
    
    debug!(
        dimensions_count = searchable_dimensions.len(),
        databases = database_info.keys().map(|k| k.to_string()).collect::<Vec<_>>().join(", "),
        "Found searchable dimensions and database info from models in YAML"
    );
    
    // Create search targets for each dimension
    let mut search_futures = Vec::new();
    
    for dimension in &searchable_dimensions {
        let embedding_clone = embedding.clone();
        let dimension_clone = dimension.clone();
        let data_source_id_clone = data_source_id;
        let database_info_clone = database_info.clone();
        
        // Create and spawn a search task
        let future = tokio::spawn(async move {
            let mut all_results = Vec::new();
            
            // Find matching tables and columns for this dimension
            // For model-based YAML, we use model name as the table
            
            // We'll first check for dimension's corresponding model
            for (database_name, schemas) in &database_info_clone {
                for (schema_name, tables) in schemas {
                    // First check if there's a direct match for model name
                    if let Some(columns) = tables.get(&dimension_clone.model_name) {
                        debug!(
                            dimension = %dimension_clone.dimension_name,
                            model = %dimension_clone.model_name,
                            db = %database_name,
                            schema = %schema_name,
                            "Found exact model to search for dimension"
                        );
                        
                        // Use dimension name or expression as the column to search
                        // First try direct match for the dimension name
                        let dimension_result = stored_values::search::search_values_by_embedding_with_filters(
                            data_source_id_clone,
                            &embedding_clone,
                            20,
                            Some(database_name),
                            Some(schema_name),
                            Some(&dimension_clone.model_name),
                            Some(&dimension_clone.dimension_name),
                        ).await;
                        
                        match dimension_result {
                            Ok(results) => {
                                if !results.is_empty() {
                                    debug!(
                                        dimension = %dimension_clone.dimension_name,
                                        count = results.len(),
                                        "Found values for dimension using direct match"
                                    );
                                    all_results.extend(results);
                                }
                            },
                            Err(e) => {
                                warn!(
                                    dimension = %dimension_clone.dimension_name,
                                    error = %e,
                                    "Error searching for dimension values"
                                );
                            }
                        }
                        
                        // If no results from direct match, try related columns
                        if all_results.is_empty() {
                            let matching_columns: Vec<String> = columns.iter()
                                .filter(|col| {
                                    // Skip self
                                    if *col == &dimension_clone.dimension_name {
                                        return false;
                                    }
                                    
                                    // Column contains dimension name
                                    if col.to_lowercase().contains(&dimension_clone.dimension_name.to_lowercase()) {
                                        return true;
                                    }
                                    
                                    // Dimension contains column name
                                    if col.len() >= 3 && dimension_clone.dimension_name.to_lowercase().contains(&col.to_lowercase()) {
                                        return true;
                                    }
                                    
                                    false
                                })
                                .cloned()
                                .collect();
                            
                            for column_name in matching_columns {
                                match stored_values::search::search_values_by_embedding_with_filters(
                                    data_source_id_clone,
                                    &embedding_clone,
                                    5,
                                    Some(database_name),
                                    Some(schema_name),
                                    Some(&dimension_clone.model_name),
                                    Some(&column_name),
                                ).await {
                                    Ok(results) => {
                                        all_results.extend(results);
                                    },
                                    Err(e) => {
                                        warn!(
                                            dimension = %dimension_clone.dimension_name,
                                            column = %column_name,
                                            error = %e,
                                            "Error searching related column"
                                        );
                                    }
                                }
                            }
                        }
                        
                        // If we found results for this model, we can stop
                        if !all_results.is_empty() {
                            break;
                        }
                    }
                }
                
                // If we've found results in the model, stop searching
                if !all_results.is_empty() {
                    break;
                }
            }
            
            // If still no results, try database-level search for the dimension name
            if all_results.is_empty() {
                debug!(
                    dimension = %dimension_clone.dimension_name,
                    "No results found in model, trying database-level search"
                );
                
                for (database_name, _) in &database_info_clone {
                    match stored_values::search::search_values_by_embedding_with_filters(
                        data_source_id_clone,
                        &embedding_clone,
                        10,
                        Some(database_name),
                        None, // No schema
                        None, // No table
                        Some(&dimension_clone.dimension_name), // Just filter by column name
                    ).await {
                        Ok(results) => {
                            if !results.is_empty() {
                                debug!(
                                    dimension = %dimension_clone.dimension_name,
                                    db = %database_name,
                                    count = results.len(),
                                    "Found values using database-level search"
                                );
                                all_results.extend(results);
                                break;
                            }
                        },
                        Err(e) => {
                            warn!(
                                dimension = %dimension_clone.dimension_name,
                                db = %database_name,
                                error = %e,
                                "Error in database-level search"
                            );
                        }
                    }
                }
            }
            
            // Last resort fallback
            if all_results.is_empty() {
                match stored_values::search::search_values_by_embedding(
                    data_source_id_clone,
                    &embedding_clone,
                    5,
                ).await {
                    Ok(results) => {
                        debug!(
                            dimension = %dimension_clone.dimension_name,
                            count = results.len(),
                            "Found values using unfiltered search (last resort)"
                        );
                        all_results = results;
                    },
                    Err(e) => {
                        warn!(
                            dimension = %dimension_clone.dimension_name,
                            error = %e,
                            "Error in unfiltered fallback search"
                        );
                    }
                }
            }
            
            (dimension_clone, Ok::<Vec<stored_values::search::StoredValueResult>, anyhow::Error>(all_results))
        });
        
        search_futures.push(future);
    }
    
    // Await all searches to complete
    let search_results = futures::future::join_all(search_futures).await;
    
    // Parse YAML for modification
    let mut yaml: serde_yaml::Value = serde_yaml::from_str(yml_content)
        .context("Failed to parse dataset YAML for updating")?;
    
    // Process search results and update YAML
    for result in search_results {
        match result {
            Ok((dimension, Ok(values))) => {
                // Extract unique values from search results and sort by relevance
                // (the values are already sorted by relevance from the embedding search)
                let mut relevant_values: Vec<String> = values // Make mutable
                    .into_iter()
                    .map(|v| v.value)
                    .collect::<std::collections::HashSet<_>>() // Deduplicate
                    .into_iter()
                    .collect();
                
                // Limit to max 20 results
                relevant_values.truncate(20);
                
                debug!(
                    dimension = %dimension.model_name,
                    dimension_name = %dimension.dimension_name,
                    values_count = relevant_values.len(),
                    "Adding relevant values to dimension"
                );
                
                // Update the YAML with relevant_values
                if let Some(models) = yaml["models"].as_sequence_mut() {
                    for model in models {
                        if model["name"].as_str() == Some(&dimension.model_name) {
                            if let Some(dimensions) = model["dimensions"].as_sequence_mut() {
                                for dim in dimensions {
                                    if dim["name"].as_str() == Some(&dimension.dimension_name) {
                                        // Add relevant_values field
                                        dim["relevant_values"] = serde_yaml::Value::Sequence(
                                            relevant_values.iter()
                                                .map(|v| serde_yaml::Value::String(v.clone()))
                                                .collect()
                                        );
                                        break;
                                    }
                                }
                            }
                            break;
                        }
                    }
                }
            },
            Ok((dimension, Err(e))) => {
                warn!(
                    dimension = ?dimension,
                    error = %e,
                    "Error searching for values for dimension"
                );
            },
            Err(e) => {
                warn!(
                    error = %e,
                    "Task join error during search"
                );
            }
        }
    }
    
    // Convert back to YAML string
    let updated_yml = serde_yaml::to_string(&yaml)
        .context("Failed to convert updated YAML back to string")?;
    
    Ok(updated_yml)
}
