use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::utils::clients::ai::litellm::{Message, ToolCall};

/// A Thread represents a conversation between a user and the AI agent.
/// It contains a sequence of messages in chronological order.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentThread {
    /// Unique identifier for the thread
    pub id: String,
    /// Ordered sequence of messages in the conversation
    pub messages: Vec<Message>,
}

/// A trait that defines how tools should be implemented.
/// Any struct that wants to be used as a tool must implement this trait.
#[async_trait]
pub trait ToolExecutor: Send + Sync {
    /// Execute the tool with given arguments and return a result
    async fn execute(&self, tool_call: &ToolCall) -> Result<Value>;

    /// Return the JSON schema that describes this tool's interface
    fn get_schema(&self) -> serde_json::Value;
}
