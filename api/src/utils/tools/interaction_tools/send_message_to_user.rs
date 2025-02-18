use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::utils::tools::ToolCall;
use crate::utils::tools::ToolExecutor;

#[derive(Debug, Serialize, Deserialize)]
pub struct SendMessageToUserOutput {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct SendMessageToUserInput {
    pub message: String,
}

pub struct SendMessageToUser;

#[async_trait]
impl ToolExecutor for SendMessageToUser {
    type Output = SendMessageToUserOutput;

    async fn execute(
        &self,
        tool_call: &ToolCall,
        user_id: &Uuid,
        session_id: &Uuid,
    ) -> Result<Self::Output> {
        let input: SendMessageToUserInput = serde_json::from_str(&tool_call.function.arguments)?;

        // For now, we'll consider it a success if we can parse the message
        // In a real implementation, we might have additional delivery logic
        Ok(SendMessageToUserOutput {
            success: true,
            message: input.message,
        })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "send_message_to_user",
            "description": "Sends a text message to the user",
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "The message to send to the user"
                    }
                },
                "required": ["message"]
            }
        })
    }

    fn get_name(&self) -> String {
        "send_message_to_user".to_string()
    }
}
