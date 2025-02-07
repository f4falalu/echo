use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::utils::{clients::ai::litellm::ToolCall, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
struct SendToUserParams {
    metric_id: String,
}

#[derive(Debug, Serialize)]
pub struct SendToUserOutput {
    success: bool,
}

pub struct SendToUserTool;

#[async_trait]
impl ToolExecutor for SendToUserTool {
    type Output = SendToUserOutput;

    fn get_name(&self) -> String {
        "send_to_user".to_string()
    }

    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        let params: SendToUserParams = serde_json::from_str(&tool_call.function.arguments.clone())?;
        // TODO: Implement actual send to user logic
        Ok(SendToUserOutput { success: true })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "send_to_user",
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["metric_id"],
                "properties": {
                    "metric_id": {
                        "type": "string",
                        "description": "The ID of the metric to send to the user"
                    }
                },
                "additionalProperties": false
            },
            "description": "Sends a metric to the user by its ID."
        })
    }
}
