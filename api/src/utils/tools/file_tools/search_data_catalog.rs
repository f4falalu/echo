use anyhow::Result;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::{debug, error, warn};
use uuid::Uuid;

use crate::{
    database::{
        lib::get_pg_pool,
        schema::datasets,
    },
    utils::{
        clients::ai::litellm::{
            ChatCompletionRequest, LiteLLMClient, Message, ResponseFormat,
            Tool, ToolCall,
        },
        tools::ToolExecutor,
    },
};

#[derive(Debug, Serialize, Deserialize)]
struct SearchDataCatalogParams {
    query_params: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct SearchDataCatalogOutput {
    message: String,
    results: Vec<DatasetSearchResult>,
}

#[derive(Debug, Serialize, Deserialize)]
struct DatasetSearchResult {
    id: Uuid,
    name: String,
    yml_content: String,
}

#[derive(Debug, Deserialize)]
struct RawLLMResponse {
    results: Vec<Value>,
}

const CATALOG_SEARCH_PROMPT: &str = r#"
You are a dataset search assistant. You have access to a collection of datasets with their YML content.
Your task is to identify all relevant datasets based on the following search queries:

{queries_joined_with_newlines}

Consider all queries collectively to determine relevance. These queries describe different aspects of the problem or question that needs to be answered.
The YML content contains important information about the dataset including its schema, description, and other metadata.
Use this information to determine if the dataset would be relevant to answering the queries.

You must return your response as a JSON object with a 'results' array. Each result should have:
- id: string (UUID)
- name: string

Available datasets:
{datasets_array_as_json}

Requirements:
1. Return all relevant datasets (no limit)
2. Order results from most to least relevant
3. Only include id and name fields
4. Ensure all field types match the specified formats
5. If no datasets are relevant, return an empty results array
"#;

pub struct SearchDataCatalogTool;

impl SearchDataCatalogTool {
    pub fn new() -> Self {
        Self
    }

    fn format_search_prompt(query_params: &[String], datasets: &[DatasetRecord]) -> Result<String> {
        let datasets_json = datasets
            .iter()
            .map(|d| d.to_llm_format())
            .collect::<Vec<_>>();

        Ok(CATALOG_SEARCH_PROMPT
            .replace("{queries_joined_with_newlines}", &query_params.join("\n"))
            .replace("{datasets_array_as_json}", &serde_json::to_string_pretty(&datasets_json)?))
    }

    async fn perform_llm_search(prompt: String) -> Result<Vec<DatasetSearchResult>> {
        debug!("Performing LLM search");
        
        // Setup LiteLLM client
        let llm_client = LiteLLMClient::new(None, None);
        let request = ChatCompletionRequest {
            model: "o3-mini".to_string(),
            messages: vec![Message::User {
                content: prompt,
                name: None,
            }],
            stream: Some(false),
            response_format: Some(ResponseFormat {
                type_: "json_object".to_string(),
                json_schema: None,
            }),
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
        datasets.into_iter()
            .map(DatasetRecord::from_dataset)
            .collect()
    }
}

#[async_trait]
impl ToolExecutor for SearchDataCatalogTool {
    type Output = SearchDataCatalogOutput;

    fn get_name(&self) -> String {
        "search_data_catalog".to_string()
    }

    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        debug!("Starting dataset search operation");
        let params: SearchDataCatalogParams = serde_json::from_str(&tool_call.function.arguments)?;

        // Fetch all non-deleted datasets
        let datasets = Self::get_datasets().await?;
        if datasets.is_empty() {
            return Ok(SearchDataCatalogOutput {
                message: "No datasets available to search".to_string(),
                results: vec![],
            });
        }

        // Format prompt and perform search
        let prompt = Self::format_search_prompt(&params.query_params, &datasets)?;
        let search_results = match Self::perform_llm_search(prompt).await {
            Ok(results) => results,
            Err(e) => {
                return Ok(SearchDataCatalogOutput {
                    message: format!("Search failed: {}", e),
                    results: vec![],
                });
            }
        };

        let message = if search_results.is_empty() {
            "No relevant datasets found".to_string()
        } else {
            format!(
                "Found {} relevant datasets for {} queries",
                search_results.len(),
                params.query_params.len()
            )
        };

        Ok(SearchDataCatalogOutput {
            message,
            results: search_results,
        })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "search_data_catalog",
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["query_params"],
                "properties": {
                    "query_params": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "A descriptive search query representing an aspect of the problem or question to be answered"
                        },
                        "description": "Array of natural language queries that collectively describe the problem or question that needs to be answered"
                    }
                },
                "additionalProperties": false
            },
            "description": "Searches for datasets using multiple natural language queries that describe different aspects of the problem/question. Analyzes YML content for relevance and returns all relevant datasets ordered by relevance."
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
        name: result
            .get("name")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing name"))?
            .to_string(),
        yml_content: result
            .get("yml_content")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing yml_content"))?
            .to_string(),
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
        assert_eq!(parsed.name, "Test Dataset");
        assert!(parsed.yml_content.contains("description: Test dataset"));
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
