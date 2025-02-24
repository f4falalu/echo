use anyhow::Result;
use async_trait::async_trait;
use litellm::Message as AgentMessage;
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
        match self.agent.get_state_value("data_context").await {
            Some(_) => true,
            None => false,
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
            "description": "Use to create or update individual metrics or visualizations. This tool is most effective for direct, single-metric requests or when a user explicitly asks for a specific number of metrics (e.g., '2 metrics showing...' or '3 charts for...'). It is not suitable for ambiguous or complex multi-part requests.",
            "strict": true,
            "parameters": {
              "type": "object",
              "required": [
                "ticket_description"
              ],
              "properties": {
                "ticket_description": {
                  "type": "string",
                  "description": "A brief description containing the general requirements for the metric(s). Focus on what needs to be measured or visualized. Write it as a command, e.g., 'Create a bar chart showing...', 'Generate 2 metrics that measure...', 'Add a metric for...', etc."
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
                        content: Some(content),
                        tool_calls: None,
                        ..
                    } => {
                        // Return the collected output with the final message
                        return Ok(MetricAgentOutput {
                            message: content,
                            duration: start_time.elapsed().as_secs() as i64,
                            files,
                        });
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
