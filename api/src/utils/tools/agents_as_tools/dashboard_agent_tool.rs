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

fn is_completion_signal(msg: &AgentMessage) -> bool {
    matches!(msg, AgentMessage::Assistant { content: Some(content), tool_calls: None, .. } 
        if content == "AGENT_COMPLETE")
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
        "create_or_modify_dashboards".to_string()
    }

    async fn is_enabled(&self) -> bool {
        match self.agent.get_state_value("data_context").await {
            Some(_) => true,
            None => false,
        }
    }

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        // Create and initialize the agent
        println!("DashboardAgentTool: Creating dashboard agent");
        let dashboard_agent = DashboardAgent::from_existing(&self.agent).await?;
        println!("DashboardAgentTool: Dashboard agent created");

        println!("DashboardAgentTool: Getting current thread");
        let mut current_thread = self
            .agent
            .get_current_thread()
            .await
            .ok_or_else(|| anyhow::anyhow!("No current thread"))?;
        println!("DashboardAgentTool: Current thread retrieved");

        println!("DashboardAgentTool: Removing last assistant message");
        current_thread.remove_last_assistant_message();
        println!("DashboardAgentTool: Last assistant message removed");

        current_thread.add_user_message(params.ticket_description);

        println!("DashboardAgentTool: Starting dashboard agent run");
        // Run the dashboard agent and get the output
        let output = dashboard_agent.run(&mut current_thread).await?;
        println!("DashboardAgentTool: Dashboard agent run completed");

        println!("DashboardAgentTool: Preparing success response");

        self.agent
            .set_state_value(String::from("files_created"), Value::Bool(false))
            .await;

        // Return success with the output
        Ok(serde_json::json!({
            "status": "success",
            "message": output.message,
            "duration": output.duration,
            "files": output.files
        }))
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "create_or_modify_dashboards",
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
