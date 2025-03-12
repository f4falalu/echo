use std::sync::Arc;
use std::time::Instant;

use anyhow::Result;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use database::{pool::get_pg_pool, schema::datasets};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::{debug, error, warn};
use uuid::Uuid;

use crate::{agent::Agent, tools::ToolExecutor};

use litellm::{ChatCompletionRequest, LiteLLMClient, LiteLlmMessage, Metadata, ResponseFormat};

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchDataCatalogParams {
    search_requirements: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchDataCatalogOutput {
    pub message: String,
    pub search_requirements: String,
    pub duration: i64,
    pub results: Vec<DatasetSearchResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatasetSearchResult {
    pub id: Uuid,
    pub name: Option<String>,
    pub yml_content: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RawLLMResponse {
    results: Vec<Value>,
}

const CATALOG_SEARCH_PROMPT: &str = r#"
You are a dataset search assistant tasked with finding highly relevant datasets that SPECIFICALLY match the user's requirements.
Your task is to identify only the most relevant datasets based on the following search request:

{queries_joined_with_newlines}

Evaluation Criteria:
1. Direct Relevance: The dataset must directly address the core aspects of the search query
2. Schema Alignment: The dataset's structure should contain fields that match the required information
3. Data Coverage: The dataset should cover the specific domain or business context mentioned
4. Recency & Quality: Prefer datasets with complete metadata and documentation

The YML content contains important information about the dataset including its schema, description, and other metadata.
Only include datasets that meet AT LEAST 3 of the above criteria with high confidence.

IMPORTANT: You must return your response in this exact JSON format:
{
    "results": [
        {
            "id": "uuid-string-here"
        }
        // ... more results in order of relevance
    ]
}

Available datasets:
{datasets_array_as_json}

Requirements:
1. Return ONLY datasets that are highly relevant (meeting 3+ criteria)
2. Order results from most to least relevant
3. ALWAYS include the "results" key in your response, even if the array is empty
4. Each result MUST ONLY include the "id" field containing the UUID string
5. If no datasets meet the relevance criteria, return {"results": []}
6. Exclude datasets that only tangentially relate to the query
7. CRITICAL: Each result MUST contain ONLY a valid UUID string with the key "id" - no other fields are allowed
8. CRITICAL: The "id" value MUST be a valid UUID string (e.g., "550e8400-e29b-41d4-a716-446655440000")
9. Any result without a valid UUID "id" field will be rejected
"#;

pub struct SearchDataCatalogTool {
    agent: Arc<Agent>,
}

impl SearchDataCatalogTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }

    async fn is_enabled(&self) -> bool {
        true
    }

    fn format_search_prompt(query_params: &[String], datasets: &[DatasetRecord]) -> Result<String> {
        let datasets_json = datasets
            .iter()
            .map(|d| d.to_llm_format())
            .collect::<Vec<_>>();

        Ok(CATALOG_SEARCH_PROMPT
            .replace("{queries_joined_with_newlines}", &query_params.join("\n"))
            .replace(
                "{datasets_array_as_json}",
                &serde_json::to_string_pretty(&datasets_json)?,
            ))
    }

    async fn perform_llm_search(
        prompt: String,
        user_id: &Uuid,
        session_id: &Uuid,
    ) -> Result<Vec<DatasetSearchResult>> {
        debug!("Performing LLM search");

        // Setup LiteLLM client
        let llm_client = LiteLLMClient::new(None, None);

        // Maximum number of retries for parsing errors
        const MAX_RETRIES: usize = 3;
        let mut retry_count = 0;
        let mut last_error = None;
        let mut current_prompt = prompt;

        while retry_count < MAX_RETRIES {
            let request = ChatCompletionRequest {
                model: "o3-mini".to_string(),
                messages: vec![LiteLlmMessage::User {
                    id: None,
                    content: current_prompt.clone(),
                    name: None,
                }],
                stream: Some(false),
                response_format: Some(ResponseFormat {
                    type_: "json_object".to_string(),
                    json_schema: None,
                }),
                metadata: Some(Metadata {
                    generation_name: "search_data_catalog".to_string(),
                    user_id: user_id.to_string(),
                    session_id: session_id.to_string(),
                    trace_id: session_id.to_string(),
                }),
                reasoning_effort: Some("low".to_string()),
                max_completion_tokens: Some(8092),
                ..Default::default()
            };

            // Get response from LLM
            let response = match llm_client.chat_completion(request).await {
                Ok(resp) => resp,
                Err(e) => {
                    error!(error = %e, "Failed to get response from LLM");
                    return Err(anyhow::anyhow!("Failed to get response from LLM: {}", e));
                }
            };

            // Parse LLM response
            let content = match &response.choices[0].message {
                LiteLlmMessage::Assistant {
                    content: Some(content),
                    ..
                } => content,
                _ => {
                    error!("LLM response missing content");
                    return Err(anyhow::anyhow!("LLM response missing content"));
                }
            };

            // Parse into raw response first
            match serde_json::from_str::<RawLLMResponse>(content) {
                Ok(raw_response) => {
                    // Process each result, logging any invalid ones
                    let mut valid_results = Vec::new();
                    let mut invalid_count = 0;

                    for result in raw_response.results {
                        match parse_search_result(&result) {
                            Ok(result) => valid_results.push(result),
                            Err(e) => {
                                warn!(error = %e, "Invalid search result from LLM");
                                invalid_count += 1;
                            }
                        }
                    }

                    if invalid_count > 0 {
                        warn!(count = invalid_count, "Found invalid search results");
                    }

                    return Ok(valid_results);
                }
                Err(e) => {
                    // Store the error for potential return
                    let error_message = e.to_string();
                    last_error = Some(error_message.clone());

                    // Log the error and retry
                    warn!(
                        error = %error_message,
                        retry = retry_count + 1,
                        max_retries = MAX_RETRIES,
                        "Failed to parse LLM response as JSON, retrying with error feedback..."
                    );

                    // Increment retry counter
                    retry_count += 1;

                    // Only modify the prompt if we're going to retry
                    if retry_count < MAX_RETRIES {
                        // Add the error to the prompt to help the LLM correct its response
                        current_prompt = format!(
                            "{}\n\nYour previous response could not be parsed correctly. Error: {}\n\nPlease ensure your response is valid JSON with the exact format specified. The response must include a 'results' array containing objects with only an 'id' field that is a valid UUID string.",
                            current_prompt, error_message
                        );
                    }
                }
            }
        }

        // If we've exhausted all retries, return the last error
        Err(anyhow::anyhow!(
            "Failed to parse search results after {} retries: {}",
            MAX_RETRIES,
            last_error.unwrap_or_else(|| "Unknown error".to_string())
        ))
    }

    async fn get_datasets() -> Result<Vec<DatasetRecord>> {
        debug!("Fetching datasets");
        let mut conn = get_pg_pool().get().await?;

        let datasets = datasets::table
            .select((
                datasets::id,
                datasets::name,
                datasets::yml_file,
                datasets::created_at,
                datasets::updated_at,
                datasets::deleted_at,
            ))
            .filter(datasets::deleted_at.is_null())
            .load::<Dataset>(&mut conn)
            .await?;

        debug!(count = datasets.len(), "Successfully loaded datasets");

        // Convert to DatasetRecord format
        datasets
            .into_iter()
            .map(DatasetRecord::from_dataset)
            .collect()
    }
}

#[async_trait]
impl ToolExecutor for SearchDataCatalogTool {
    type Output = SearchDataCatalogOutput;
    type Params = SearchDataCatalogParams;

    async fn execute(&self, params: Self::Params, tool_call_id: String, user: AuthenticatedUser) -> Result<Self::Output> {
        let start_time = Instant::now();

        // Fetch all non-deleted datasets
        let datasets = Self::get_datasets().await?;
        if datasets.is_empty() {
            let duration = start_time.elapsed().as_millis();

            return Ok(SearchDataCatalogOutput {
                message: "No datasets available to search".to_string(),
                search_requirements: params.search_requirements,
                duration: duration as i64,
                results: vec![],
            });
        }

        // Format prompt and perform search
        let prompt = Self::format_search_prompt(&[params.search_requirements.clone()], &datasets)?;
        let search_results = match Self::perform_llm_search(
            prompt,
            &self.agent.get_user_id(),
            &self.agent.get_session_id(),
        )
        .await
        {
            Ok(results) => results,
            Err(e) => {
                let duration = start_time.elapsed().as_millis();

                return Ok(SearchDataCatalogOutput {
                    message: format!("Search failed: {}", e),
                    search_requirements: params.search_requirements.clone(),
                    duration: duration as i64,
                    results: vec![],
                });
            }
        };

        let search_results = search_results
            .into_iter()
            .map(|result| {
                let matching_dataset = datasets.iter().find(|dataset| dataset.id == result.id);
                DatasetSearchResult {
                    id: result.id,
                    name: matching_dataset.map(|d| d.name.clone()),
                    yml_content: matching_dataset.map(|d| d.yml_content.clone()),
                }
            })
            .collect::<Vec<_>>();

        let message = if search_results.is_empty() {
            "No relevant datasets found".to_string()
        } else {
            format!("Found {} relevant datasets", search_results.len())
        };

        self.agent
            .set_state_value(String::from("data_context"), Value::Bool(true))
            .await;

        let duration = start_time.elapsed().as_millis();

        Ok(SearchDataCatalogOutput {
            message,
            search_requirements: params.search_requirements,
            duration: duration as i64,
            results: search_results,
        })
    }

    async fn is_enabled(&self) -> bool {
        true
    }

    fn get_name(&self) -> String {
        "search_data_catalog".to_string()
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
          "name": "search_data_catalog",
          "description": "Use to search across a user's data catalog for metadata, documentation, column definitions, or business terminology.",
          "parameters": {
            "type": "object",
            "required": [
              "search_requirements"
            ],
            "properties": {
              "search_requirements": {
                "type": "string",
                "description": "Write a brief outline that explains the documentation (mostly datasets) that you would like to search the data catalog for. It should start with 'I need...' and then proceed to briefly describe the needed documentation. Specifically, you should describe the types of datasets and topics that you will likely need to understand to accomplish your task or workflow. You don't know exactly what data exists, so your request needs to be broad and general."
              }
            },
            "additionalProperties": false
          }
        })
    }
}

// Helper types and functions

#[derive(Queryable, Selectable)]
#[diesel(table_name = datasets)]
#[diesel(check_for_backend(diesel::pg::Pg))]
struct Dataset {
    id: Uuid,
    name: String,
    yml_file: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    deleted_at: Option<DateTime<Utc>>,
}

struct DatasetRecord {
    id: Uuid,
    name: String,
    yml_content: String,
}

impl DatasetRecord {
    fn to_llm_format(&self) -> Value {
        json!({
            "id": self.id.to_string(),
            "name": self.name,
            "content": self.yml_content,
        })
    }

    fn from_dataset(dataset: Dataset) -> Result<Self> {
        Ok(Self {
            id: dataset.id,
            name: dataset.name,
            yml_content: dataset.yml_file.unwrap_or_default(),
        })
    }
}

fn parse_search_result(result: &Value) -> Result<DatasetSearchResult> {
    Ok(DatasetSearchResult {
        id: Uuid::parse_str(
            result
                .get("id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("Missing id"))?,
        )?,
        name: None,
        yml_content: None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_search_result() {
        let result = json!({
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Test Dataset",
            "yml_content": "description: Test dataset\nschema:\n  - name: id\n    type: uuid"
        });

        let parsed = parse_search_result(&result).unwrap();
    }

    #[test]
    fn test_parse_invalid_search_result() {
        let result = json!({
            "id": "invalid-uuid",
            "name": "Test Dataset",
            "yml_content": "test content"
        });

        assert!(parse_search_result(&result).is_err());
    }

    #[test]
    fn test_parse_missing_fields() {
        let result = json!({
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Test Dataset"
        });

        assert!(parse_search_result(&result).is_err());
    }
}
