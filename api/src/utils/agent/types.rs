use serde::{Deserialize, Serialize};

use crate::utils::clients::ai::litellm::Message;

/// A Thread represents a conversation between a user and the AI agent.
/// It contains a sequence of messages in chronological order.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentThread {
    /// Unique identifier for the thread
    pub id: String,
    /// Ordered sequence of messages in the conversation
    pub messages: Vec<Message>,
}

impl AgentThread {
    pub fn new(id: Option<String>, messages: Vec<Message>) -> Self {
        Self {
            id: id.unwrap_or(uuid::Uuid::new_v4().to_string()),
            messages,
        }
    }
}
