use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;
use serde::{Deserialize, Serialize};

use crate::utils::{clients::ai::litellm::ToolCall, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
struct OpenFilesParams {
    file_names: Vec<String>,
}

pub struct OpenFilesTool;

#[async_trait]
impl ToolExecutor for OpenFilesTool {
    async fn execute(&self, tool_call: &ToolCall) -> Result<Value> {
        let params: OpenFilesParams = serde_json::from_str(&tool_call.function.arguments.clone())?;
        // TODO: Implement actual file opening logic
        Ok(Value::Array(vec![]))
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "open_files",
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["file_names"],
                "properties": {
                    "file_names": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "The name of a file to be opened"
                        },
                        "description": "List of file names to be opened"
                    }
                },
                "additionalProperties": false
            },
            "description": "Opens one or more files in read mode and displays **their entire contents** to the user. If you use this, the user will actually see the metric/dashboard you open."
        })
    }
} 