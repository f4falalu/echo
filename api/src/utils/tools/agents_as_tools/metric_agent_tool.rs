use anyhow::Result;
use async_trait::async_trait;
use litellm::Message as AgentMessage;
use serde::Deserialize;
use serde_json::Value;
use std::sync::Arc;
use uuid::Uuid;

use crate::utils::{
    agent::{Agent, MetricAgent},
    tools::ToolExecutor,
};

pub struct MetricAgentTool {
    agent: Arc<Agent>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct MetricAgentInput {
    pub ticket_description: String,
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
        "create_or_modify_metrics".to_string()
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

        // Parse input parameters
        let agent_input = MetricAgentInput {
            ticket_description: params.ticket_description,
        };

        current_thread.remove_last_assistant_message();

        // Run the metric agent and get the receiver
        let _rx = metric_agent.run(&mut current_thread).await?;

        // Return immediately with status
        Ok(serde_json::json!({
            "status": "running",
            "message": "Metric agent started successfully"
        }))
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "create_or_modify_metrics",
            "description": "Use to create or update individual metrics, charts, or tables. This is suitable for a single chart/visualization (or several individual metrics) that does not require building an entire dashboard.",
            "strict": true,
            "parameters": {
              "type": "object",
              "required": [
                "ticket_description"
              ],
              "properties": {
                "ticket_description": {
                  "type": "string",
                  "description": "A brief description for the action. This should essentially be a ticket description that can be appended to a ticket. The ticket description should explain which parts of the user's request this action addresses. Copy the user's request exactly without adding instructions, thoughts, or assumptions. Write it as a command, e.g., 'Create a bar chart showing...', 'Add a metric for...', etc."
                }
              },
              "additionalProperties": false
            }
        })
    }
}
