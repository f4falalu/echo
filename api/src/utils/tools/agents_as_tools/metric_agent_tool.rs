use anyhow::Result;
use async_trait::async_trait;
use litellm::AgentMessage as AgentMessage;
use serde::Deserialize;
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::utils::{
    agent::{Agent, AgentError, MetricAgent},
    tools::ToolExecutor,
};

pub struct MetricAgentTool {
    agent: Arc<Agent>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct MetricAgentInput {
    pub ticket_description: String,
}

pub struct MetricAgentOutput {
    pub message: String,
    pub duration: i64,
    pub files: Vec<Value>,
}

impl MetricAgentTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for MetricAgentTool {
    type Output = Value;
    type Params = MetricAgentInput;

    fn get_name(&self) -> String {
        "metric_worker".to_string()
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
        let metric_agent = MetricAgent::from_existing(&self.agent).await?;

        // Get current thread for context
        let mut current_thread = self
            .agent
            .get_current_thread()
            .await
            .ok_or_else(|| anyhow::anyhow!("No current thread"))?;

        current_thread.remove_last_assistant_message();
        current_thread.add_user_message(params.ticket_description);

        // Run the metric agent and get the receiver
        let rx = metric_agent.run(&mut current_thread).await?;

        // Process output and collect files
        let output = process_agent_output(rx).await?;

        self.agent
            .set_state_value(String::from("files_available"), Value::Bool(false))
            .await;

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
            "description": "Use to create or update individual metrics or visualizations based on the established plan. This tool executes the metric-related portions of the plan, focusing on one metric at a time. It should be used after data exploration and planning are complete, not for initial data discovery or ambiguous requests.",
            "strict": true,
            "parameters": {
              "type": "object",
              "required": [
                "ticket_description"
              ],
              "properties": {
                "ticket_description": {
                  "type": "string",
                  "description": "A high-level description of the metric or visualization that needs to be created. This should describe what needs to be measured or visualized without including specific SQL statements. For example: 'Show monthly revenue from subscription payments' or 'Display daily active users count with a breakdown by user type'. The actual SQL construction will be handled by the metric agent."
                }
              },
              "additionalProperties": false
            }
        })
    }
}

async fn process_agent_output(
    mut rx: broadcast::Receiver<Result<AgentMessage, AgentError>>,
) -> Result<MetricAgentOutput> {
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
                        if name == "metric_agent" {
                            // Return the collected output with the final message
                            return Ok(MetricAgentOutput {
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
