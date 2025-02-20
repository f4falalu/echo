use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;
use std::sync::Arc;

use crate::utils::{
    agent::{Agent, ExploratoryAgent},
    tools::ToolExecutor,
};

pub struct ExploratoryAgentTool {
    agent: Arc<Agent>,
}

impl ExploratoryAgentTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for ExploratoryAgentTool {
    type Output = Value;

    fn get_name(&self) -> String {
        "exploratory_agent".to_string()
    }

    async fn execute(&self, tool_call: &litellm::ToolCall) -> Result<Self::Output> {
        // Create and initialize the agent
        let exploratory_agent = ExploratoryAgent::from_existing(&self.agent)?;

        // Parse input parameters
        let input = serde_json::from_str(&tool_call.function.arguments)?;

        // TODO: Implement the exploratory agent result

        // Return dummy value for now
        Ok(serde_json::json!("TODO"))
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "explore_data",
            "description": "Use to explore data and create insights. This is suitable for exploring data sources, understanding data relationships, and generating insights that can be used to create metrics or dashboards.",
            "strict": true,
            "parameters": {
                "type": "object",
                "required": [
                    "ticket_description"
                ],
                "properties": {
                    "ticket_description": {
                        "type": "string",
                        "description": "A brief description for the action. This should essentially be a ticket description that can be appended to a ticket. The ticket description should explain which parts of the user's request this action addresses. Copy the user's request exactly without adding instructions, thoughts, or assumptions. Write it as a command, e.g., 'Explore sales data...', 'Analyze customer behavior...', etc."
                    }
                },
                "additionalProperties": false
            }
        })
    }
}
