use anyhow::Result;
use async_trait::async_trait;
use litellm::Message as AgentMessage;
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
                        content: Some(content),
                        tool_calls: None,
                        ..
                    } => {
                        // Return the collected output with the final message
                        return Ok(DashboardAgentOutput {
                            message: content,
                            duration: start_time.elapsed().as_secs() as i64,
                            files,
                        });
                    }
                    AgentMessage::Tool { content, .. } => {
                        // Process tool output
                        if let Ok(output) = serde_json::from_str::<Value>(&content) {
                            // Collect files
                            if let Some(file_array) = output.get("files").and_then(|f| f.as_array()) {
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
