use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::utils::tools::ToolExecutor;
use litellm::ToolCall;

#[derive(Debug, Serialize, Deserialize)]
struct SendToUserParams {
    metric_id: String,
}

#[derive(Debug, Serialize)]
pub struct SendToUserOutput {
    success: bool,
}

pub struct SendFilesToUserTool;

impl SendFilesToUserTool {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ToolExecutor for SendFilesToUserTool {
    type Output = SendToUserOutput;
    type Params = SendToUserParams;

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        // TODO: Implement actual send to user logic
        Ok(SendToUserOutput { success: true })
    }

    fn get_name(&self) -> String {
        "send_to_user".to_string()
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
