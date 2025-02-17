use serde::{Deserialize, Serialize};
use uuid::Uuid;

use litellm::Message;

/// A Thread represents a conversation between a user and the AI agent.
/// It contains a sequence of messages in chronological order.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentThread {
    /// Unique identifier for the thread
    pub id: Uuid,
    pub user_id: Uuid,
    /// Ordered sequence of messages in the conversation
    pub messages: Vec<Message>,
}

impl AgentThread {
    pub fn new(id: Option<Uuid>, user_id: Uuid, messages: Vec<Message>) -> Self {
        Self {
            id: id.unwrap_or(Uuid::new_v4()),
            user_id,
            messages,
        }
    }
}
