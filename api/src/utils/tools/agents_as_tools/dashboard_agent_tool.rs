use anyhow::Result;
use async_trait::async_trait;
use litellm::Message as AgentMessage;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

use crate::utils::{
    agent::{Agent, DashboardAgent},
    tools::{file_tools::file_types::file::FileEnum, ToolExecutor},
};

pub struct DashboardAgentTool {
    agent: Arc<Agent>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardAgentParams {
    pub ticket_description: String,
}

pub struct DashboardAgentOutput {
    pub message: String,
    pub duration: i64,
    pub files: Vec<FileEnum>,
}

impl DashboardAgentTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for DashboardAgentTool {
    type Output = Value;
    type Params = DashboardAgentParams;

    fn get_name(&self) -> String {
        "create_or_modify_dashboard".to_string()
    }

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        // Create and initialize the agent
        let dashboard_agent = DashboardAgent::from_existing(&self.agent).await?;

        let mut current_thread = self
            .agent
            .get_current_thread()
            .await
            .ok_or_else(|| anyhow::anyhow!("No current thread"))?;

        // Add the ticket description to the thread
        current_thread
            .messages
            .push(AgentMessage::user(params.ticket_description));

        // Run the dashboard agent and get the receiver
        let mut rx = dashboard_agent.run(&mut current_thread).await?;

        // Process all messages from the receiver
        let mut messages = Vec::new();
        while let Some(msg_result) = rx.recv().await {
            match msg_result {
                Ok(msg) => messages.push(msg),
                Err(e) => return Err(e.into()),
            }
        }

        // Return the messages as part of the output
        Ok(serde_json::json!({
            "messages": messages,
            "status": "completed"
        }))
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "create_or_modify_dashboard",
            "description": "Use to create or update entire dashboards. This is suitable when multiple related metrics or visualizations need to be organized together on a single page.",
            "strict": true,
            "parameters": {
                "type": "object",
                "required": [
                    "ticket_description"
                ],
                "properties": {
                    "ticket_description": {
                        "type": "string",
                        "description": "A brief description for the action. This should essentially be a ticket description that can be appended to a ticket. The ticket description should explain which parts of the user's request this action addresses. Copy the user's request exactly without adding instructions, thoughts, or assumptions. Write it as a command, e.g., 'Create a dashboard showing...', 'Update the sales dashboard to include...', etc."
                    }
                },
                "additionalProperties": false
            }
        })
    }
}
