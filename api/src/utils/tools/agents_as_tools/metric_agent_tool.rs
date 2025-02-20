use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;
use uuid::Uuid;

use crate::utils::{
    agent::MetricAgent,
    tools::ToolExecutor,
};

pub struct MetricAgentTool;

impl MetricAgentTool {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ToolExecutor for MetricAgentTool {
    type Output = Value;

    fn get_name(&self) -> String {
        "metric_agent".to_string()
    }

    async fn execute(
        &self,
        tool_call: &litellm::ToolCall,
        user_id: &Uuid,
        session_id: &Uuid,
    ) -> Result<Self::Output> {
        // Create and initialize the agent
        let agent = MetricAgent::new()?;

        // Parse input parameters
        let input = serde_json::from_str(&tool_call.function.arguments)?;

        // Execute the agent
        let output = agent.process_metric(input, *session_id, *user_id).await?;

        // Convert output to Value
        serde_json::to_value(output).map_err(Into::into)
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