use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::messages::types::ChatMessage;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatWithMessages {
    pub id: Uuid,
    pub title: String,
    pub is_favorited: bool,
    pub messages: Vec<ChatMessage>,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: String,
    pub created_by_id: String,
    pub created_by_name: String,
    pub created_by_avatar: Option<String>,
}

