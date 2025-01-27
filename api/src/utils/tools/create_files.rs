use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;
use serde::{Deserialize, Serialize};

use crate::utils::{clients::ai::litellm::ToolCall, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
struct CreateFilesParams {
    names: Vec<String>,
    yml_content: String,
}

pub struct CreateFilesTool;

#[async_trait]
impl ToolExecutor for CreateFilesTool {
    async fn execute(&self, tool_call: &ToolCall) -> Result<Value> {
        let params: CreateFilesParams = serde_json::from_str(&tool_call.function.arguments.clone())?;
        // TODO: Implement actual file creation logic
        Ok(Value::Array(vec![]))
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "create_files",
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["names", "yml_content"],
                "properties": {
                    "names": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "The name of a metric or dashboard file to be created"
                        },
                        "description": "An array of names for the metric or dashboard files to be created"
                    },
                    "yml_content": {
                        "type": "string",
                        "description": "The YAML content to be included in the created files"
                    }
                },
                "additionalProperties": false
            },
            "description": "Creates **new** metric or dashboard files by name. Use this if no existing file can fulfill the user's needs. This will automatically open the metric/dashboard for the user."
        })
    }
} 