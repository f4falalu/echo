use anyhow::Result;
use serde::Serialize;
use uuid::Uuid;

use crate::utils::clients::ai::litellm::Message;

#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum BusterThreadMessage {
    ChatMessage(BusterChatMessage),
    Thought(BusterThought),
}

#[derive(Debug, Serialize)]
pub struct BusterChatMessage {
    pub id: String,
    #[serde(rename = "type")]
    pub message_type: String,
    pub message: Option<String>,
    pub message_chunk: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct BusterThought {
    pub id: String,
    #[serde(rename = "type")]
    pub thought_type: String,
    pub thought_title: String,
    pub thought_secondary_title: String,
    pub thought_pills: Option<Vec<BusterThoughtPill>>,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct BusterThoughtPill {
    pub id: String,
    pub text: String,
    #[serde(rename = "type")]
    pub thought_file_type: String,
}

pub fn transform_message(message: Message) -> Result<BusterThreadMessage> {
    match message {
        Message::Assistant { id, content, .. } => {
            let id = id.unwrap_or_else(|| Uuid::new_v4().to_string());
            let content = content.ok_or_else(|| anyhow::anyhow!("Missing content"))?;
            Ok(BusterThreadMessage::ChatMessage(BusterChatMessage {
                id,
                message_type: "text".to_string(),
                message: None,
                message_chunk: Some(content),
            }))
        }
        Message::Tool {
            id,
            content,
            tool_call_id,
            name,
            progress,
        } => {
            tracing::debug!("Tool message: {:?}", message);
            Ok(BusterThreadMessage::Thought(BusterThought {
                id,
                thought_type: "text".to_string(),
                thought_title: "".to_string(),
                thought_secondary_title: "".to_string(),
                thought_pills: None,
                status: "".to_string(),
            }))
        }
        _ => Err(anyhow::anyhow!("Unsupported message type")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_transformation() {
        let message = Message::Assistant {
            id: None,
            content: Some("Test content".to_string()),
            name: None,
            tool_calls: None,
            progress: None,
        };

        let result = transform_message(message);
        assert!(result.is_ok());
        let transformed = result.unwrap();
        assert_eq!(transformed.message_type, "text");
        assert!(transformed.message_chunk.is_some());
    }

    #[test]
    fn test_unsupported_message_type() {
        let message = Message::Tool {
            id: None,
            content: "content".to_string(),
            tool_call_id: "test".to_string(),
            name: None,
            progress: None,
        };

        let result = transform_message(message);
        assert!(matches!(result, Err(_)));
    }
}
