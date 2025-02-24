use std::sync::Arc;
use std::time::Instant;

use anyhow::{anyhow, Result};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use crate::{
    database_dep::{lib::get_pg_pool, schema::datasets},
    utils::{agent::Agent, tools::ToolExecutor},
};

use litellm::{ChatCompletionRequest, LiteLLMClient, Message, Metadata, ResponseFormat};

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchDataCatalogParams {
    ticket_description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchDataCatalogOutput {
    pub message: String,
    pub ticket_description: String,
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
You are a dataset search assistant. You have access to a collection of datasets with their YML content.
Your task is to identify all relevant datasets based on the following search request:

{queries_joined_with_newlines}

Consider all queries collectively to determine relevance. These queries describe different aspects of the problem or question that needs to be answered.
The YML content contains important information about the dataset including its schema, description, and other metadata.
Use this information to determine if the dataset would be relevant to answering the queries.

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
1. Return all relevant datasets (no limit)
2. Order results from most to least relevant
3. ALWAYS include the "results" key in your response, even if the array is empty
4. Each result MUST ONLY include the "id" field containing the UUID string
5. If no datasets are relevant, return {"results": []}
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
        let request = ChatCompletionRequest {
            model: "gemini-2".to_string(),
            messages: vec![Message::User {
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
                generation_name: "search_data_catalog".to_string(),
                user_id: user_id.to_string(),
                session_id: session_id.to_string(),
            }),
            // reasoning_effort: Some("low".to_string()),
            ..Default::default()
        };

        // Get response from LLM
        let response = llm_client.chat_completion(request).await.map_err(|e| {
            error!(error = %e, "Failed to get response from LLM");
            anyhow::anyhow!("Failed to get response from LLM: {}", e)
        })?;

        // Parse LLM response
        let content = match &response.choices[0].message {
            Message::Assistant {
                content: Some(content),
                ..
            } => content,
            _ => {
                error!("LLM response missing content");
                return Err(anyhow::anyhow!("LLM response missing content"));
            }
        };

        // Parse into raw response first
        let raw_response: RawLLMResponse = serde_json::from_str(content).map_err(|e| {
            warn!(error = %e, "Failed to parse LLM response as JSON");
            anyhow::anyhow!("Failed to parse search results: {}", e)
        })?;

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

        Ok(valid_results)
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

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        let start_time = Instant::now();

        // Fetch all non-deleted datasets
        let datasets = Self::get_datasets().await?;
        if datasets.is_empty() {
            let duration = start_time.elapsed().as_millis();

            return Ok(SearchDataCatalogOutput {
                message: "No datasets available to search".to_string(),
                ticket_description: params.ticket_description,
                duration: duration as i64,
                results: vec![],
            });
        }

        // Format prompt and perform search
        let prompt = Self::format_search_prompt(&[params.ticket_description.clone()], &datasets)?;
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
                    ticket_description: params.ticket_description.clone(),
                    duration: duration as i64,
                    results: vec![],
                });
            }
        };

        let search_results = search_results.into_iter().map(|result| {
            let matching_dataset = datasets.iter().find(|dataset| dataset.id == result.id);
            DatasetSearchResult {
                id: result.id,
                name: matching_dataset.map(|d| d.name.clone()),
                yml_content: matching_dataset.map(|d| d.yml_content.clone()),
            }
        }).collect::<Vec<_>>();

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
            ticket_description: params.ticket_description,
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
            "strict": true,
            "parameters": {
              "type": "object",
              "required": [
                "ticket_description"
              ],
              "properties": {
                "ticket_description": {
                  "type": "string",
                  "description": "This should just be the user request, copied exactly."
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
    use chrono::TimeZone;

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
