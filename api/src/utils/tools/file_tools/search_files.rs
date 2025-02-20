use std::time::Instant;
use std::sync::Arc;

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
    database_dep::{
        lib::get_pg_pool,
        models::{DashboardFile, MetricFile},
        schema::{dashboard_files, metric_files},
    },
    utils::{
        tools::ToolExecutor,
        agent::Agent,
    },
};

use litellm::{ChatCompletionRequest, LiteLLMClient, Message, Metadata, ResponseFormat, ToolCall};

#[derive(Debug, Serialize, Deserialize)]
struct SearchFilesParams {
    query_params: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchFilesOutput {
    pub message: String,
    pub query_params: Vec<String>,
    pub duration: i64,
    pub files: Vec<FileSearchResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileSearchResult {
    pub id: Uuid,
    pub name: String,
    pub file_type: String,
    pub updated_at: DateTime<Utc>,
}

const FILE_SEARCH_PROMPT: &str = r#"
You are a file search assistant. You have access to a collection of metric and dashboard files.
Your task is to identify up to 10 most relevant files based on the following search queries:

{queries_joined_with_newlines}

Consider all queries collectively to determine relevance.

IMPORTANT: You must return your response in this exact JSON format:
{
    "results": [
        {
            "id": "uuid-string-here",
            "name": "file-name-here",
            "file_type": "metric-or-dashboard",
            "updated_at": "iso-timestamp"
        }
        // ... more results up to 10 total
    ]
}

Available files:
{files_array_as_json}

Requirements:
1. Return up to 10 most relevant files
2. Order results from most to least relevant
3. ALWAYS include the "results" key in your response, even if the array is empty
4. Each result MUST have all fields: id, name, file_type, and updated_at
5. file_type MUST be either "metric" or "dashboard"
6. If no files match, return {"results": []}
"#;

#[derive(Debug, Deserialize)]
struct LLMSearchResponse {
    results: Vec<FileSearchResult>,
}

pub struct SearchFilesTool {
    agent: Arc<Agent>
}

impl SearchFilesTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }

    fn format_search_prompt(query_params: &[String], files_array: &[Value]) -> Result<String> {
        let queries_joined = query_params.join("\n");
        let files_json = serde_json::to_string_pretty(&files_array)?;

        Ok(FILE_SEARCH_PROMPT
            .replace("{queries_joined_with_newlines}", &queries_joined)
            .replace("{files_array_as_json}", &files_json))
    }

    async fn perform_llm_search(
        prompt: String,
        user_id: &Uuid,
        session_id: &Uuid,
    ) -> Result<LLMSearchResponse> {
        debug!("Performing LLM search");

        // Setup LiteLLM client
        let llm_client = LiteLLMClient::new(None, None);
        let request = ChatCompletionRequest {
            model: "o3-mini".to_string(),
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
                generation_name: "search_files".to_string(),
                user_id: user_id.to_string(),
                session_id: session_id.to_string(),
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
            } => {
                debug!("Received LLM response content: {}", content);
                content
            }
            _ => {
                error!("LLM response missing content");
                return Err(anyhow::anyhow!("LLM response missing content"));
            }
        };

        // Parse into structured response
        serde_json::from_str(content).map_err(|e| {
            warn!(error = %e, content = content, "Failed to parse LLM response as JSON");
            anyhow::anyhow!("Failed to parse search results: {}", e)
        })
    }
}


#[async_trait]
impl ToolExecutor for SearchFilesTool {
    type Output = SearchFilesOutput;

    fn get_name(&self) -> String {
        "search_files".to_string()
    }

    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        let start_time = Instant::now();

        let params: SearchFilesParams = match serde_json::from_str(&tool_call.function.arguments.clone()) {
            Ok(params) => params,
            Err(e) => {
                return Err(anyhow!("Failed to parse search parameters: {}", e));
            }
        };

        // Get current thread for context
        let current_thread = self.agent.get_current_thread().await
            .ok_or_else(|| anyhow::anyhow!("No current thread"))?;

        let mut conn = get_pg_pool().get().await?;

        // Fetch all non-deleted records from both tables concurrently
        let (metric_files, dashboard_files) =
            tokio::try_join!(get_metric_files(), get_dashboard_files())?;

        // Format files for LLM
        let files_array: Vec<Value> = metric_files
            .iter()
            .map(|f| {
                json!({
                    "id": f.id.to_string(),
                    "name": f.name,
                    "file_type": "metric",
                    "updated_at": f.updated_at.to_rfc3339(),
                })
            })
            .chain(dashboard_files.iter().map(|f| {
                json!({
                    "id": f.id.to_string(),
                    "name": f.name,
                    "file_type": "dashboard",
                    "updated_at": f.updated_at.to_rfc3339(),
                })
            }))
            .collect();

        // Format prompt and perform search
        let prompt = Self::format_search_prompt(&params.query_params, &files_array)?;
        let search_response = match Self::perform_llm_search(prompt, &current_thread.user_id, &current_thread.id).await {
            Ok(response) => response,
            Err(e) => {
                let duration = start_time.elapsed().as_millis() as i64;
                return Ok(SearchFilesOutput {
                    message: format!("Search failed: {}", e),
                    files: vec![],
                    duration,
                    query_params: params.query_params,
                });
            }
        };

        let message = if search_response.results.is_empty() {
            "No relevant files found".to_string()
        } else {
            format!("Found {} relevant files", search_response.results.len())
        };

        info!(
            query_count = params.query_params.len(),
            result_count = search_response.results.len(),
            "Completed file search operation"
        );

        let duration = start_time.elapsed().as_millis() as i64;

        Ok(SearchFilesOutput {
            message,
            files: search_response.results,
            duration,
            query_params: params.query_params,
        })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "search_files", 
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["query_params"],
                "properties": {
                    "query_params": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "A single search query represented as a string."
                        },
                        "description": "An array of natural language queries used to search for files."
                    }
                },
                "additionalProperties": false
            },
            "description": "Use this tool only when a user explicitly requests to view or find existing metrics/dashboards. This tool is not a substitute for the data catalog search needed to understand available data structures.Guard Rail: Do not execute any file creation or modifications until a thorough data catalog search has been completed and reviewed."
        })
    }
}

async fn get_metric_files() -> Result<Vec<MetricFile>> {
    debug!("Fetching metric files");
    let mut conn = get_pg_pool().get().await?;

    let files = metric_files::table
        .filter(metric_files::deleted_at.is_null())
        .load::<MetricFile>(&mut conn)
        .await?;

    debug!(count = files.len(), "Successfully loaded metric files");
    Ok(files)
}

async fn get_dashboard_files() -> Result<Vec<DashboardFile>> {
    debug!("Fetching dashboard files");
    let mut conn = get_pg_pool().get().await?;

    let files = dashboard_files::table
        .filter(dashboard_files::deleted_at.is_null())
        .load::<DashboardFile>(&mut conn)
        .await?;

    debug!(count = files.len(), "Successfully loaded dashboard files");
    Ok(files)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    fn parse_search_result(result: &Value) -> Result<FileSearchResult> {
        Ok(FileSearchResult {
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
            file_type: result
                .get("file_type")
                .and_then(|v| v.as_str())
                .ok_or_else(|| anyhow::anyhow!("Missing file_type"))?
                .to_string(),
            updated_at: DateTime::parse_from_rfc3339(
                result
                    .get("updated_at")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow::anyhow!("Missing updated_at"))?,
            )?
            .with_timezone(&Utc),
        })
    }

    #[test]
    fn test_parse_valid_search_result() {
        let result = json!({
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Test File",
            "file_type": "metric",
            "updated_at": "2024-02-07T00:00:00Z"
        });

        let parsed = parse_search_result(&result).unwrap();
        assert_eq!(parsed.name, "Test File");
        assert_eq!(parsed.file_type, "metric");
        assert_eq!(
            parsed.updated_at,
            Utc.with_ymd_and_hms(2024, 2, 7, 0, 0, 0).unwrap()
        );
    }

    #[test]
    fn test_parse_invalid_search_result() {
        let result = json!({
            "id": "invalid-uuid",
            "name": "Test File",
            "file_type": "metric",
            "updated_at": "2024-02-07T00:00:00Z"
        });

        assert!(parse_search_result(&result).is_err());
    }

    #[test]
    fn test_parse_missing_fields() {
        let result = json!({
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Test File"
        });

        assert!(parse_search_result(&result).is_err());
    }
}
