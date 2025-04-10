use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::tools::ToolExecutor;

#[derive(Debug, Deserialize, Serialize)]
pub struct DoneInput {
    final_response: String,
}

// The output is the same as the input, confirming the final response.
pub type DoneOutput = DoneInput;

pub struct Done;

impl Done {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ToolExecutor for Done {
    type Output = DoneOutput;
    type Params = DoneInput;

    fn get_name(&self) -> String {
        "done".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        // This tool signals the end of the workflow and provides the final response.
        // The actual agent termination logic resides elsewhere.
        Ok(DoneOutput { final_response: params.final_response })
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Use when you have completed your workflow and are ready to send a final response to the user.",
            "parameters": {
                "type": "object",
                "required": [
                "final_response"
                ],
                "properties": {
                "final_response": {
                    "type": "string",
                    "description": "The final response to display to the use after all tasks are completed."
                }
                },
                "additionalProperties": false
            }
        })
    }
} 