use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::tools::ToolExecutor;

#[derive(Debug, Deserialize, Serialize)]
pub struct MessageNotifyUserInput {
    text: String,
}

// The output is essentially the same as the input, just confirming the message.
pub type MessageNotifyUserOutput = MessageNotifyUserInput;

pub struct MessageNotifyUser;

impl MessageNotifyUser {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ToolExecutor for MessageNotifyUser {
    type Output = MessageNotifyUserOutput;
    type Params = MessageNotifyUserInput;

    fn get_name(&self) -> String {
        "message_notify_user".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        // This tool's primary function is schema validation and confirming the message text.
        // The actual sending logic would reside elsewhere in the system.
        Ok(MessageNotifyUserOutput { text: params.text })
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Use if you need to send a message to the user before starting your workflow and do not require a response. This should only be used if you need to address aspects of the user request that cannot be accomplished. This should not be used to send a final response to the user. Final responses must be sent with the `done` tool.",
            "parameters": {
                "type": "object",
                "required": [
                "text"
                ],
                "properties": {
                "text": {
                    "type": "string",
                    "description": "Message text to display to user."
                }
                },
                "additionalProperties": false
            }
        })
    }
} 