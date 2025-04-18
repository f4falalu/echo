use std::collections::{HashMap, HashSet};
use std::{env, sync::Arc, time::Instant};

use anyhow::Result;
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
use litellm::{AgentMessage, ChatCompletionRequest, LiteLLMClient, Metadata, ResponseFormat};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::{debug, error, info, warn};
use uuid::Uuid;
use dataset_security::{get_permissioned_datasets, PermissionedDataset};

use crate::{agent::Agent, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchDataCatalogParams {
    queries: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchDataCatalogOutput {
    pub message: String,
    pub queries: Vec<String>,
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
    relevance_score: f64,
}

#[derive(Debug, Deserialize)]
struct LLMFilterResponse {
    results: Vec<String>,
}

const LLM_FILTER_PROMPT: &str = r#"
You are a dataset relevance evaluator, acting like a semantic search engine. Your task is to determine which datasets are **semantically relevant** to the user's query based on their structure and metadata, focusing on the core **Business Objects, Properties, Events, Metrics, and Filters** implied by the request.

USER REQUEST: {user_request}
SEARCH QUERY: {query} (This query is framed around key semantic concepts identified from the user request)

Below is a list of datasets that were identified as potentially relevant by an initial ranking system.
For each dataset, review its description in the YAML format. Evaluate how well the dataset's described contents (columns, metrics, entities, documentation) **semantically align** with the key **Objects, Properties, Events, Metrics, and Filters** required by the USER REQUEST and SEARCH QUERY. Pay close attention to whether the dataset contains specific attributes like **names, IDs, emails, or other identifying information** if implied by the request.

Include datasets where the YAML description suggests a reasonable semantic match or overlap with the needed concepts. Prioritize datasets that appear to contain the core Objects or Events, especially if they also contain key identifying attributes relevant to the request.

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
1. **Focus on Semantic Relevance**: Include datasets whose content, as described in the YAML, is semantically related to the required Objects, Properties, Events, Metrics, or Filters. Direct keyword matches are not required.
2. **Consider the Core Concepts**: Does the dataset seem to be about the primary Business Object(s) or Event(s)? Does it contain relevant Properties or Metrics, even if named differently (synonyms)?
3. **Anticipate Attribute Needs & Allow Inference**: If a dataset describes the correct Object (e.g., 'Customers') and the query implies a need for identifying information (e.g., analyzing individual customer behavior), infer the relevance of Properties like 'Customer Name' or 'Customer ID', even if not explicitly listed in the query but present in the YAML. Prioritize datasets containing these likely necessary attributes.
4. **Evaluate based on Semantic Fit**: Does the dataset's purpose and structure, based on its YAML, align well with the user's information need? Consider relationships between entities described in the YAML.
5. **Contextual Information is Relevant**: Datasets providing important contextual Properties (like dimensions, timestamps, or related identifiers) for the core Objects or Events should be considered relevant.
6. **When in doubt, lean towards inclusion if semantically plausible**: If the dataset seems semantically related to the core concepts, even if imperfectly described in the YAML snippet, it's better to include it for further inspection.
7. **CRITICAL:** Each string in the "results" array MUST contain ONLY the dataset's UUID string (e.g., "9711ca55-8329-4fd9-8b20-b6a3289f3d38"). Do NOT include the dataset name or any other information.
8. **Use both USER REQUEST and SEARCH QUERY**: Understand the underlying need (user request) and the specific concepts being targeted (search query), including implicit needs for specific attributes.
9. **Prioritize Semantic Overlap & Key Attributes**: Look for datasets that cover the key Objects, Events, or Metrics, *especially* if they contain relevant identifying attributes (names, IDs, etc.) suggested by the context.
10. **Assume potential utility based on semantic clues**: If the YAML indicates the dataset is about the right topic (Object/Event), assume it might contain relevant Properties/Metrics (including identifiers) unless the YAML explicitly contradicts this.
11. A dataset is relevant if its described structure and purpose **semantically align** with the information needed to answer the query, including anticipated attribute requirements.
"#;

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

        if params.queries.is_empty() {
            warn!("SearchDataCatalogTool executed with no queries.");
            return Ok(SearchDataCatalogOutput {
                message: "No search queries provided.".to_string(),
                queries: params.queries,
                duration: start_time.elapsed().as_millis() as i64,
                results: vec![],
            });
        }

        let all_datasets = match Self::get_datasets(&user_id).await {
            Ok(datasets) => datasets,
            Err(e) => {
                error!(user_id=%user_id, "Failed to retrieve permissioned datasets for tool execution: {}", e);
                return Ok(SearchDataCatalogOutput {
                    message: format!("Error fetching datasets: {}", e),
                    queries: params.queries,
                    duration: start_time.elapsed().as_millis() as i64,
                    results: vec![],
                });
            }
        };

        if all_datasets.is_empty() {
            info!("No datasets found for the organization.");
            return Ok(SearchDataCatalogOutput {
                message: "No datasets available to search.".to_string(),
                queries: params.queries,
                duration: start_time.elapsed().as_millis() as i64,
                results: vec![],
            });
        }

        let documents: Vec<String> = all_datasets
            .iter()
            .filter_map(|dataset| dataset.yml_content.clone())
            .collect();

        if documents.is_empty() {
            warn!("No datasets with YML content found after filtering.");
            return Ok(SearchDataCatalogOutput {
                message: "No searchable dataset content found.".to_string(),
                queries: params.queries,
                duration: start_time.elapsed().as_millis() as i64,
                results: vec![],
            });
        }

        let query_results_futures = stream::iter(params.queries.clone())
            .map(|query| {
                let current_query = query.clone();
                let datasets_clone = all_datasets.clone();
                let documents_clone = documents.clone();
                let user_id_clone = user_id;
                let session_id_clone = session_id;

                async move {
                    let ranked = match rerank_datasets(&current_query, &datasets_clone, &documents_clone).await {
                        Ok(r) => r,
                        Err(e) => {
                            error!(error = %e, query = current_query, "Reranking failed for query");
                            return Ok(vec![]);
                        }
                    };

                    let user_prompt = match self.agent.get_state_value("user_prompt").await {
                        Some(Value::String(prompt)) => prompt,
                        _ => current_query.clone(),
                    };

                    match filter_datasets_with_llm(&current_query, &user_prompt, ranked, &user_id_clone, &session_id_clone).await {
                        Ok(filtered) => Ok(filtered),
                        Err(e) => {
                            error!(error = %e, query = current_query, "LLM filtering failed for query");
                            Ok(vec![])
                        }
                    }
                }
            })
            .buffer_unordered(5);

        let all_query_results: Vec<Result<Vec<DatasetResult>>> =
            query_results_futures.collect().await;

        let mut combined_results = Vec::new();
        let mut unique_ids = HashSet::new();

        for result in all_query_results {
            match result {
                Ok(datasets) => {
                    for dataset in datasets {
                        if unique_ids.insert(dataset.id) {
                            combined_results.push(dataset);
                        }
                    }
                }
                Err(e) => {
                    warn!("Error processing a query stream: {}", e);
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

        let message = if final_search_results.is_empty() {
            "No relevant datasets found after filtering.".to_string()
        } else {
            format!("Found {} relevant datasets.", final_search_results.len())
        };

        self.agent
            .set_state_value(
                String::from("data_context"),
                Value::Bool(!final_search_results.is_empty()),
            )
            .await;

        self.agent
            .set_state_value(String::from("searched_data_catalog"), Value::Bool(true))
            .await;

        let duration = start_time.elapsed().as_millis();

        Ok(SearchDataCatalogOutput {
            message,
            queries: params.queries,
            duration: duration as i64,
            results: final_search_results,
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
            "required": [
              "queries"
            ],
            "properties": {
              "queries": {
                "type": "array",
                "description": "A list of high-intent search queries targeting data assets, based only on conversation context/history. Queries are concise, conversational sentences that articulate the analyst's search intent. Specific requests use one query (e.g., 'I'm looking for datasets related to revenue with a monthly time property'), while broad requests use multiple queries to cover all relevant assets implied by the context (e.g., datasets, models, metrics, documentation), starting with context-implied topics and refining as needed. Queries run concurrently to maximize relevance and coverage.",
                "items": {
                  "type": "string",
                  "description": "A concise, full-sentence, natural language query describing the search intent for a specific data asset or topic, e.g., 'I'm looking for datasets related to revenue with a monthly time property,' 'I'm looking for product datasets with sales metrics,' 'I need customer datasets linked to product purchases, including customer names,' or 'I want product inventory documentation.'"
                },
                "minItems": 1
              }
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
                relevance_score: result.relevance_score,
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

    ranked_datasets.sort_by(|a, b| {
        b.relevance_score
            .partial_cmp(&a.relevance_score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    let relevant_datasets = ranked_datasets.into_iter().collect::<Vec<_>>();

    Ok(relevant_datasets)
}

async fn filter_datasets_with_llm(
    query: &str,
    user_prompt: &str,
    ranked_datasets: Vec<RankedDataset>,
    user_id: &Uuid,
    session_id: &Uuid,
) -> Result<Vec<DatasetResult>, anyhow::Error> {
    if ranked_datasets.is_empty() {
        return Ok(vec![]);
    }

    debug!(
        "Filtering {} datasets with LLM for query: {}",
        ranked_datasets.len(),
        query
    );

    let datasets_json = ranked_datasets
        .iter()
        .map(|ranked| {
            serde_json::json!({
                "id": ranked.dataset.id.to_string(),
                "name": ranked.dataset.name,
                "yml_content": ranked.dataset.yml_content.clone().unwrap_or_default(),
                "relevance_score": ranked.relevance_score
            })
        })
        .collect::<Vec<_>>();

    let prompt = LLM_FILTER_PROMPT
        .replace("{user_request}", user_prompt)
        .replace("{query}", query)
        .replace(
            "{datasets_json}",
            &serde_json::to_string_pretty(&datasets_json)?,
        );

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
            generation_name: "filter_data_catalog_agent".to_string(),
            user_id: user_id.to_string(),
            session_id: session_id.to_string(),
            trace_id: Uuid::new_v4().to_string(),
        }),
        max_completion_tokens: Some(8096),
        temperature: Some(0.0),
        ..Default::default()
    };

    let response = llm_client.chat_completion(request).await?;

    let content = match &response.choices[0].message {
        AgentMessage::Assistant {
            content: Some(content),
            ..
        } => content,
        _ => {
            error!("LLM filter response missing content for query: {}", query);
            return Err(anyhow::anyhow!("LLM filter response missing content"));
        }
    };

    let filter_response: LLMFilterResponse = match serde_json::from_str(content) {
        Ok(response) => response,
        Err(e) => {
            error!(
                "Failed to parse LLM filter response for query '{}': {}. Content: {}",
                query, e, content
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
            debug!(llm_result_id_str = %dataset_id_str, "Processing LLM filter result ID string");
            let parsed_uuid_result = Uuid::parse_str(&dataset_id_str);
            match &parsed_uuid_result {
                Ok(parsed_id) => {
                    debug!(parsed_id = %parsed_id, "Successfully parsed UUID from LLM result");
                    let dataset_option = dataset_map.get(parsed_id);
                    match dataset_option {
                        Some(dataset) => {
                            debug!(dataset_id = %dataset.id, dataset_name = %dataset.name, "Found matching dataset in map");
                            Some(DatasetResult {
                                id: dataset.id,
                                name: Some(dataset.name.clone()),
                                yml_content: dataset.yml_content.clone(),
                            })
                        }
                        None => {
                            warn!(parsed_id = %parsed_id, "Parsed UUID not found in dataset_map");
                            None
                        }
                    }
                }
                Err(e) => {
                    error!(llm_result_id_str = %dataset_id_str, error = %e, "Failed to parse UUID from LLM result string");
                    None
                }
            }
        })
        .collect();

    debug!(
        "LLM filtering complete for query '{}', keeping {} relevant datasets",
        query,
        filtered_datasets.len()
    );
    Ok(filtered_datasets)
}
