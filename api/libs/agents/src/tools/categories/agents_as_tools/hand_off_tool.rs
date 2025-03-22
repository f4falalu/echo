use std::sync::Arc;

use anyhow::{anyhow, Result};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{agent::Agent, tools::ToolExecutor};

/// Parameters for the HandOffTool
#[derive(Debug, Serialize, Deserialize)]
pub struct HandOffParams {
    /// The ID or name of the agent to hand off to
    pub target_agent: String,
}

/// Output from the HandOffTool
#[derive(Debug, Serialize, Deserialize)]
pub struct HandOffOutput {}

/// Tool for handing off a conversation to another agent
pub struct HandOffTool {
    agent: Arc<Agent>,
    available_target_agents: Vec<String>,
}

impl HandOffTool {
    /// Create a new HandOffTool
    pub fn new(agent: Arc<Agent>) -> Self {
        Self {
            agent,
            available_target_agents: Vec::new(),
        }
    }

    /// Create a new HandOffTool with a list of available target agents
    pub fn new_with_target_agents(agent: Arc<Agent>, target_agents: Vec<String>) -> Self {
        Self {
            agent,
            available_target_agents: target_agents,
        }
    }

    /// Update the available target agents
    pub fn set_available_target_agents(&mut self, target_agents: Vec<String>) {
        self.available_target_agents = target_agents;
    }

    fn get_hand_off_description() -> String {
        "Hands off the current conversation to another agent. This allows a specialized agent to take over the conversation when the current agent reaches the limits of its capabilities.".to_string()
    }

    fn get_target_agent_description() -> String {
        "The ID or name of the agent to hand off to. This should be the identifier of an existing agent in the system.".to_string()
    }

    fn get_context_description() -> String {
        "Optional context to provide to the target agent. This allows passing additional information about why the handoff is occurring and what the target agent should focus on.".to_string()
    }

    fn get_transfer_history_description() -> String {
        "Optional flag to indicate whether the conversation history should be transferred to the target agent. Defaults to true if not specified.".to_string()
    }
}

#[async_trait]
impl ToolExecutor for HandOffTool {
    type Output = HandOffOutput;
    type Params = HandOffParams;

    fn get_name(&self) -> String {
        "hand_off".to_string()
    }

    async fn is_enabled(&self) -> bool {
        // This tool should always be available when multiple agents are configured
        true
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        let target_agent_id = params.target_agent;

        // Here we would implement the actual handoff logic:
        // 1. Notify the target agent
        // 2. Transfer conversation history if requested
        // 3. Update conversation state
        // 4. Redirect user to the new agent

        // TODO: Implement actual handoff logic
        // For now, we'll return a stub response

        Ok(HandOffOutput {})
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": Self::get_hand_off_description(),
            "parameters": {
                "type": "object",
                "properties": {
                    "target_agent": {
                      "type": "string",
                      "description": Self::get_target_agent_description(),
                      "enum": self.available_target_agents
                    },
                    "context": {
                        "type": "string",
                        "description": Self::get_context_description(),
                    },
                    "transfer_history": {
                        "type": "boolean",
                        "description": Self::get_transfer_history_description(),
                    },
                },
                "required": ["target_agent"],
            },
        })
    }
}
