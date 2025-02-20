use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;
use std::sync::Arc;

use crate::utils::{
    agent::{Agent, DashboardAgent},
    tools::ToolExecutor,
};

pub struct DashboardAgentTool {
    agent: Arc<Agent>,
}

impl DashboardAgentTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for DashboardAgentTool {
    type Output = Value;

    fn get_name(&self) -> String {
        "dashboard_agent".to_string()
    }

    async fn execute(&self, tool_call: &litellm::ToolCall) -> Result<Self::Output> {
        // Create and initialize the agent
        let dashboard_agent = DashboardAgent::new()?;

        // Parse input parameters
        let input = serde_json::from_str(&tool_call.function.arguments)?;

        // TODO: Implement the dashboard agent result
        // Return dummy value for now
        Ok(serde_json::json!("TODO"))
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