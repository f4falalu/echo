use anyhow::Result;
use serde::Serialize;
use uuid::Uuid;

use crate::utils::clients::ai::litellm::{Message, MessageProgress, ToolCall};

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
        } => Ok(BusterThreadMessage::Thought(BusterThought {
            id: tool_call_id.clone(),
            thought_type: "text".to_string(),
            thought_title: "".to_string(),
            thought_secondary_title: "".to_string(),
            thought_pills: None,
            status: "".to_string(),
        })),
        _ => Err(anyhow::anyhow!("Unsupported message type")),
    }
}

fn transform_text_message(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                Ok(BusterThreadMessage::ChatMessage(BusterChatMessage {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    message_type: "text".to_string(),
                    message: None,
                    message_chunk: Some(content),
                }))
            }
            MessageProgress::Complete => Ok(BusterThreadMessage::ChatMessage(BusterChatMessage {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                message_type: "text".to_string(),
                message: Some(content),
                message_chunk: None,
            })),
            _ => Err(anyhow::anyhow!("Unsupported message progress")),
        }
    } else {
        Ok(BusterThreadMessage::ChatMessage(BusterChatMessage {
            id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
            message_type: "text".to_string(),
            message: None,
            message_chunk: None,
        }))
    }
}

fn transform_tool_message(
    id: Option<String>,
    content: String,
    tool_call_id: Option<String>,
    name: Option<String>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    Ok(BusterThreadMessage::Thought(BusterThought {
        id: tool_call_id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        thought_type: "text".to_string(),
        thought_title: "".to_string(),
        thought_secondary_title: "".to_string(),
        thought_pills: None,
        status: "".to_string(),
    }))
}

fn transform_assistant_tool_message(
    id: Option<String>,
    content: String,
    name: Option<String>,
    tool_calls: Option<Vec<ToolCall>>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    Ok(BusterThreadMessage::ChatMessage(BusterChatMessage {
        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        message_type: "text".to_string(),
        message: None,
        message_chunk: Some(content),
    }))
}

fn assistant_data_catalog_search(
    id: Option<String>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => Ok(BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "Searching your data catalog...".to_string(),
                thought_secondary_title: "".to_string(),
                thought_pills: None,
                status: "loading".to_string(),
            })),
            _ => Err(anyhow::anyhow!(
                "Assistant data catalog search only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant data catalog search requires progress."
        ))
    }
}

fn tool_data_catalog_search(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::Complete => Ok(BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "".to_string(),
                thought_secondary_title: "".to_string(),
                thought_pills: None,
                status: "completed".to_string(),
            })),
            _ => Err(anyhow::anyhow!(
                "Tool data catalog search only supports complete."
            )),
        }
    } else {
        Err(anyhow::anyhow!(
            "Tool data catalog search requires progress."
        ))
    }
}

fn assistant_stored_values_search(
    id: Option<String>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => Ok(BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "Searching your stored values...".to_string(),
                thought_secondary_title: "".to_string(),
                thought_pills: None,
                status: "loading".to_string(),
            })),
            _ => Err(anyhow::anyhow!(
                "Assistant stored values search only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant stored values search requires progress."
        ))
    }
}

fn tool_stored_values_search(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::Complete => Ok(BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "".to_string(),
                thought_secondary_title: "".to_string(),
                thought_pills: None,
                status: "completed".to_string(),
            })),
            _ => Err(anyhow::anyhow!(
                "Tool stored values search only supports complete."
            )),
        }
    } else {
        Err(anyhow::anyhow!(
            "Tool stored values search requires progress."
        ))
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
