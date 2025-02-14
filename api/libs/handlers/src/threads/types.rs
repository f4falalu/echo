use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::messages::types::ThreadMessage;

// Add more thread-related types as needed
#[derive(Debug, Serialize, Deserialize)]
pub struct ThreadWithMessages {
    pub id: Uuid,
    pub title: String,
    pub is_favorited: bool,
    pub messages: Vec<ThreadMessage>,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: String,
    pub created_by_id: String,
    pub created_by_name: String,
    pub created_by_avatar: Option<String>,
}
