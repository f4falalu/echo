use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct ThreadMessage {
    pub id: Uuid,
    pub request_message: ThreadUserMessage,
    pub response_messages: Vec<String>,
    pub reasoning: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ThreadUserMessage {
    pub request: String,
    pub sender_id: Uuid,
    pub sender_name: String,
    pub sender_avatar: Option<String>,
}