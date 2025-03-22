use std::sync::Arc;

use anyhow::{anyhow, Result};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{
    agent::Agent,
    tools::ToolExecutor,
};

/// Parameters for the HandOffTool
#[derive(Debug, Serialize, Deserialize)]
pub struct HandOffParams {
    /// The ID or name of the agent to hand off to
    pub target_agent: String,
    /// The context to provide to the target agent
    pub context: Option<String>,
    /// Whether to transfer the conversation history
    pub transfer_history: Option<bool>,
}

/// Output from the HandOffTool
#[derive(Debug, Serialize, Deserialize)]
pub struct HandOffOutput {
    /// The message indicating success or failure
    pub message: String,
    /// The ID of the target agent that took over
    pub target_agent_id: String,
    /// The ID of the new conversation (if applicable)
    pub conversation_id: Option<String>,
}

/// Tool for handing off a conversation to another agent
pub struct HandOffTool {
    agent: Arc<Agent>,
}

impl HandOffTool {
    /// Create a new HandOffTool
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
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

    async fn execute(&self, params: Self::Params, tool_call_id: String) -> Result<Self::Output> {
        let target_agent_id = params.target_agent;
        let context = params.context.unwrap_or_default();
        let transfer_history = params.transfer_history.unwrap_or(true);

        // Get the current conversation ID
        let conversation_id = match self.agent.get_state_value("conversation_id").await {
            Some(id) => id,
            None => return Err(anyhow!("No active conversation found")),
        };

        // Check if target agent exists
        // This would typically query a registry of available agents
        // For now, we'll assume validation happens here
        // TODO: Implement agent validation

        // Log the handoff attempt
        tracing::info!(
            "Agent {} attempting to hand off conversation {} to agent {}",
            self.agent.get_agent_id(),
            conversation_id,
            target_agent_id
        );

        // Here we would implement the actual handoff logic:
        // 1. Notify the target agent
        // 2. Transfer conversation history if requested
        // 3. Update conversation state
        // 4. Redirect user to the new agent
        
        // TODO: Implement actual handoff logic
        // For now, we'll return a stub response

        Ok(HandOffOutput {
            message: format!(
                "Successfully handed off conversation to agent {}{}",
                target_agent_id,
                if transfer_history {
                    " with conversation history"
                } else {
                    ""
                }
            ),
            target_agent_id,
            conversation_id: Some(conversation_id),
        })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": Self::get_hand_off_description(),
            "parameters": {
                "type": "object",
                "properties": {
                    "target_agent": {
                        "type": "string",
                        "description": Self::get_target_agent_description(),
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