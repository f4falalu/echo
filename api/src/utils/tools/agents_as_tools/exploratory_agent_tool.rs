use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;
use uuid::Uuid;

use crate::utils::{
    agent::ExploratoryAgent,
    tools::ToolExecutor,
};

pub struct ExploratoryAgentTool;

impl ExploratoryAgentTool {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl ToolExecutor for ExploratoryAgentTool {
    type Output = Value;

    fn get_name(&self) -> String {
        "exploratory_agent".to_string()
    }

    async fn execute(
        &self,
        tool_call: &litellm::ToolCall,
        user_id: &Uuid,
        session_id: &Uuid,
    ) -> Result<Self::Output> {
        // Create and initialize the agent
        let agent = ExploratoryAgent::new()?;

        // Parse input parameters
        let input = serde_json::from_str(&tool_call.function.arguments)?;

        // Execute the agent
        let output = agent.explore(input, *session_id, *user_id).await?;

        // Convert output to Value
        serde_json::to_value(output).map_err(Into::into)
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "exploratory_agent",
            "description": "Performs exploratory analysis on data sources and structures",
            "parameters": {
                "type": "object",
                "properties": {
                    "target": {
                        "type": "string",
                        "description": "The target data source or structure to explore"
                    },
                    "focus_areas": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "Specific areas or aspects to focus the exploration on"
                    },
                    "constraints": {
                        "type": "string",
                        "description": "Any limitations or requirements for the exploration"
                    }
                },
                "required": ["target"]
            }
        })
    }
} 