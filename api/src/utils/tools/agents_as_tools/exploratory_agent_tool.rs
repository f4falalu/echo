use anyhow::Result;
use async_trait::async_trait;
use serde::Deserialize;
use serde_json::Value;
use std::sync::Arc;

use crate::utils::{
    agent::{Agent, ExploratoryAgent},
    tools::ToolExecutor,
};

pub struct ExploratoryAgentTool {
    agent: Arc<Agent>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ExploratoryAgentInput {
    pub ticket_description: String,
}

impl ExploratoryAgentTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for ExploratoryAgentTool {
    type Output = Value;
    type Params = ExploratoryAgentInput;
    fn get_name(&self) -> String {
        "explore_data".to_string()
    }

    async fn is_enabled(&self) -> bool {
        match self.agent.get_state_value("data_context").await {
            Some(_) => true,
            None => false,
        }
    }

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        // Create and initialize the agent
        let exploratory_agent = ExploratoryAgent::from_existing(&self.agent).await?;

        let mut current_thread = self
            .agent
            .get_current_thread()
            .await
            .ok_or_else(|| anyhow::anyhow!("No current thread"))?;

        current_thread.remove_last_assistant_message();

        current_thread.add_user_message(params.ticket_description);

        // Run the exploratory agent and get the receiver
        let _rx = exploratory_agent.run(&mut current_thread).await?;

        // Return immediately with status
        Ok(serde_json::json!({
            "status": "running",
            "message": "Exploratory agent started successfully"
        }))
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
