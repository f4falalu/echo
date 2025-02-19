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
            "name": "metric_agent",
            "description": "Creates and modifies metric definitions",
            "parameters": {
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "enum": ["create", "modify", "analyze"],
                        "description": "The operation to perform on the metric"
                    },
                    "metric_name": {
                        "type": "string",
                        "description": "Name of the metric to create or modify"
                    },
                    "metric_id": {
                        "type": "string",
                        "description": "UUID of the metric to modify"
                    },
                    "requirements": {
                        "type": "string",
                        "description": "Requirements or specifications for the metric"
                    },
                    "modifications": {
                        "type": "string",
                        "description": "Specific modifications to apply to the metric"
                    }
                },
                "required": ["operation"]
            }
        })
    }
} 