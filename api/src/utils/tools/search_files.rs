use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;
use serde::{Deserialize, Serialize};

use crate::utils::{clients::ai::litellm::ToolCall, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
struct SearchFilesParams {
    query_params: Vec<String>,
}

pub struct SearchFilesTool;

#[async_trait]
impl ToolExecutor for SearchFilesTool {
    async fn execute(&self, tool_call: &ToolCall) -> Result<Value> {
        let params: SearchFilesParams = serde_json::from_str(&tool_call.function.arguments.clone())?;
        // TODO: Implement actual file search logic
        Ok(Value::Array(vec![]))
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