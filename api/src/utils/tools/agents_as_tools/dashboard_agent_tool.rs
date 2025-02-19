use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;
use uuid::Uuid;

use crate::utils::{
    agent::DashboardAgent,
    tools::ToolExecutor,
};

pub struct DashboardAgentTool;

impl DashboardAgentTool {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ToolExecutor for DashboardAgentTool {
    type Output = Value;

    fn get_name(&self) -> String {
        "dashboard_agent".to_string()
    }

    async fn execute(
        &self,
        tool_call: &litellm::ToolCall,
        user_id: &Uuid,
        session_id: &Uuid,
    ) -> Result<Self::Output> {
        // Create and initialize the agent
        let agent = DashboardAgent::new()?;

        // Parse input parameters
        let input = serde_json::from_str(&tool_call.function.arguments)?;

        // Execute the agent
        let output = agent.process_dashboard(input, *session_id, *user_id).await?;

        // Convert output to Value
        serde_json::to_value(output).map_err(Into::into)
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "dashboard_agent",
            "description": "Creates and modifies dashboard definitions and their associated metrics",
            "parameters": {
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "enum": ["create", "modify", "analyze"],
                        "description": "The operation to perform on the dashboard"
                    },
                    "dashboard_name": {
                        "type": "string",
                        "description": "Name of the dashboard to create or modify"
                    },
                    "dashboard_id": {
                        "type": "string",
                        "description": "UUID of the dashboard to modify"
                    },
                    "requirements": {
                        "type": "string",
                        "description": "Requirements or specifications for the dashboard"
                    },
                    "modifications": {
                        "type": "string",
                        "description": "Specific modifications to apply to the dashboard"
                    },
                    "metric_ids": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "UUIDs of existing metrics to include in the dashboard"
                    },
                    "new_metrics": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "Names of new metrics to create for the dashboard"
                    }
                },
                "required": ["operation"]
            }
        })
    }
} 