use anyhow::Result;
use async_trait::async_trait;
use litellm::AgentMessage as AgentMessage;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::broadcast;

use crate::utils::{
    agent::{Agent, AgentError, DashboardAgent},
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
    pub files: Vec<Value>,
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
        "dashboard_worker".to_string()
    }

    async fn is_enabled(&self) -> bool {
        match (
            self.agent.get_state_value("data_context").await,
            self.agent.get_state_value("plan_available").await,
        ) {
            (Some(_), Some(_)) => true,
            _ => false,
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
        let rx = dashboard_agent.run(&mut current_thread).await?;
        println!("DashboardAgentTool: Dashboard agent run completed");

        let output = process_agent_output(rx).await?;

        self.agent
            .set_state_value(String::from("files_available"), Value::Bool(false))
            .await;

        // Return success response with the collected output
        Ok(serde_json::json!({
            "status": "success",
            "message": output.message,
            "duration": output.duration,
            "files": output.files
        }))
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Executes the previously built plan for dashboard creation or updates based on the ticket description. This tool processes the plan and coordinates the creation of all necessary metrics and dashboard components according to the analyzed requirements.",
            "strict": true,
            "parameters": {
                "type": "object",
                "required": [
                    "ticket_description"
                ],
                "properties": {
                    "ticket_description": {
                        "type": "string",
                        "description": "A high-level description of what the dashboard should accomplish, including the metrics to be displayed and their organization. For example: 'Create a sales performance dashboard with monthly revenue trends, top-selling products, and regional breakdown' or 'Build a user engagement dashboard showing daily active users, session duration, and feature usage statistics'. The specific implementation details and SQL queries will be handled by the dashboard worker."
                    }
                },
                "additionalProperties": false
            }
        })
    }
}

async fn process_agent_output(
    mut rx: broadcast::Receiver<Result<AgentMessage, AgentError>>,
) -> Result<DashboardAgentOutput> {
    let mut files = Vec::new();
    let start_time = std::time::Instant::now();

    while let Ok(msg_result) = rx.recv().await {
        match msg_result {
            Ok(msg) => {
                println!("Agent message: {:?}", msg);
                match msg {
                    AgentMessage::Assistant {
                        name: Some(name),
                        content: Some(content),
                        tool_calls: None,
                        ..
                    } => {
                        if name == "dashboard_agent" {
                            // Return the collected output with the final message
                            return Ok(DashboardAgentOutput {
                                message: content,
                                duration: start_time.elapsed().as_secs() as i64,
                                files,
                            });
                        }
                    }
                    AgentMessage::Tool { content, .. } => {
                        // Process tool output
                        if let Ok(output) = serde_json::from_str::<Value>(&content) {
                            // Collect files
                            if let Some(file_array) = output.get("files").and_then(|f| f.as_array())
                            {
                                files.extend(file_array.iter().cloned());
                            }
                        }
                    }
                    _ => {}
                }
            }
            Err(e) => {
                println!("Agent error: {:?}", e);
                return Err(e.into());
            }
        }
    }

    // If we get here without finding a completion message, return an error
    Err(anyhow::anyhow!(
        "Agent communication ended without completion message"
    ))
}
