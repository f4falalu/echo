use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub id: Uuid,
    pub request_message: ChatUserMessage,
    pub response_messages: Vec<Value>,
    pub reasoning: Vec<Value>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatUserMessage {
    pub request: String,
    pub sender_id: Uuid,
    pub sender_name: String,
    pub sender_avatar: Option<String>,
}
