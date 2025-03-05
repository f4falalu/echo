use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::messages::types::ChatMessage;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatWithMessages {
    pub id: Uuid,
    pub title: String,
    pub is_favorited: bool,
    pub message_ids: Vec<String>,
    pub messages: HashMap<String, ChatMessage>,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: String,
    pub created_by_id: String,
    pub created_by_name: String,
    pub created_by_avatar: Option<String>,
}

impl ChatWithMessages {
    pub fn new(
        title: String,
        created_by_id: String,
        created_by_name: String,
        created_by_avatar: Option<String>,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: uuid::Uuid::new_v4(),
            title,
            is_favorited: false,
            message_ids: Vec::new(),
            messages: HashMap::new(),
            created_at: now.clone(),
            updated_at: now,
            created_by: created_by_id.clone(),
            created_by_id,
            created_by_name,
            created_by_avatar,
        }
    }

    pub fn new_with_messages(
        id: uuid::Uuid,
        title: String,
        messages: Vec<ChatMessage>,
        is_favorited: bool,
        created_by_id: String,
        created_by_name: String,
        created_by_avatar: Option<String>,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        
        // Convert messages into a HashMap and collect their IDs
        let message_ids: Vec<String> = messages.iter()
            .map(|msg| msg.id.to_string())
            .collect();
            
        let messages_map: HashMap<String, ChatMessage> = messages.into_iter()
            .map(|msg| (msg.id.to_string(), msg))
            .collect();

        Self {
            id,
            title,
            is_favorited,
            message_ids,
            messages: messages_map,
            created_at: now.clone(),
            updated_at: now,
            created_by: created_by_id.clone(),
            created_by_id,
            created_by_name,
            created_by_avatar,
        }
    }

    pub fn add_message(&mut self, message: ChatMessage) {
        let message_id = message.id.to_string();
        if !self.message_ids.contains(&message_id) {
            self.message_ids.push(message_id.clone());
        }
        self.messages.insert(message_id, message);
        self.updated_at = chrono::Utc::now().to_rfc3339();
    }

    pub fn update_message(&mut self, message: ChatMessage) {
        let message_id = message.id.to_string();
        if !self.message_ids.contains(&message_id) {
            self.message_ids.push(message_id.clone());
        }
        self.messages.insert(message_id, message);
        self.updated_at = chrono::Utc::now().to_rfc3339();
    }
}



