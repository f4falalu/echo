use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;
use uuid::Uuid;

use crate::utils::{
    agent::ExploratoryAgent,
    tools::ToolExecutor,
};

pub struct ExploratoryAgentTool;

impl ExploratoryAgentTool {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ToolExecutor for ExploratoryAgentTool {
    type Output = Value;

    fn get_name(&self) -> String {
        "exploratory_agent".to_string()
    }

    async fn execute(
        &self,
        tool_call: &litellm::ToolCall,
        user_id: &Uuid,
        session_id: &Uuid,
    ) -> Result<Self::Output> {
        // Create and initialize the agent
        let agent = ExploratoryAgent::new()?;

        // Parse input parameters
        let input = serde_json::from_str(&tool_call.function.arguments)?;

        // Execute the agent
        let output = agent.explore(input, *session_id, *user_id).await?;

        // Convert output to Value
        serde_json::to_value(output).map_err(Into::into)
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "exploratory_analysis",
            "description": "Use for open-ended, exploratory requests or deep-dive data investigations. Within this action, you can run multiple queries, analyze results, and decide which metrics or insights are noteworthy. Do not use for straightforward metric or chart requests.",
            "strict": true,
            "parameters": {
              "type": "object",
              "required": [
                "ticket_description"
              ],
              "properties": {
                "ticket_description": {
                  "type": "string",
                  "description": "A brief description for the action. This should essentially be a ticket description that can be appended to a ticket. The ticket description should explain which parts of the user's request this action addresses. Copy the user's request exactly without adding instructions, thoughts, or assumptions. Write it as a command, not a question, typically starting with an imperative verb like 'Investigate...', 'Explore...', etc."
                }
              },
              "additionalProperties": false
            }
        })
    }
} 