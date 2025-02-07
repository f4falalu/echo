use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::utils::{clients::ai::litellm::ToolCall, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
struct SearchFilesParams {
    query_params: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct SearchFilesOutput {
    success: bool,
}

pub struct SearchFilesTool;

#[async_trait]
impl ToolExecutor for SearchFilesTool {
    type Output = SearchFilesOutput;

    fn get_name(&self) -> String {
        "search_files".to_string()
    }

    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        let params: SearchFilesParams =
            serde_json::from_str(&tool_call.function.arguments.clone())?;
        // TODO: Implement actual file search logic
        Ok(SearchFilesOutput {
            success: true,
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
            "description": "Searches for metric and dashboard files using natural-language queries. Typically used if you suspect there might already be a relevant metric or dashboard in the repository. If results are found, you can then decide whether to open them with `open_files`."
        })
    }
}
