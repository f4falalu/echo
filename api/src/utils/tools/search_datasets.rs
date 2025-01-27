use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;
use serde::{Deserialize, Serialize};

use crate::utils::{clients::ai::litellm::ToolCall, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
struct SearchDatasetsParams {
    search_terms: Vec<String>,
}

pub struct SearchDatasetsTool;

#[async_trait]
impl ToolExecutor for SearchDatasetsTool {
    async fn execute(&self, tool_call: &ToolCall) -> Result<Value> {
        let params: SearchDatasetsParams = serde_json::from_str(&tool_call.function.arguments.clone())?;
        // TODO: Implement actual dataset search logic
        Ok(Value::Array(vec![]))
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "search_datasets",
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["search_terms"],
                "properties": {
                    "search_terms": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "A search term for finding relevant datasets"
                        },
                        "description": "Array of strings representing the terms to search for"
                    }
                },
                "additionalProperties": false
            },
            "description": "Searches for relevant datasets or tables you can query. If you need to write SQL but don't know which dataset to reference, call this with relevant search terms (e.g., \"orders,\" \"customers,\" \"sales transactions\")."
        })
    }
} 