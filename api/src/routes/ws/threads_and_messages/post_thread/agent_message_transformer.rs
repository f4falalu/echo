use anyhow::Result;
use serde::Serialize;
use uuid::Uuid;

use crate::utils::clients::ai::litellm::{Message, MessageProgress, ToolCall};

use crate::utils::tools::file_tools::search_data_catalog::SearchDataCatalogOutput;

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
    pub thought_pills: Option<Vec<BusterThoughtPillContainer>>,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct BusterThoughtPillContainer {
    pub title: String,
    pub thought_pills: Vec<BusterThoughtPill>,
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
        Message::Assistant {
            id,
            content,
            name,
            tool_calls,
            progress,
        } => {
            if let Some(content) = content {
                return transform_text_message(id, content, progress);
            }

            if let (Some(name), Some(tool_calls)) = (name, tool_calls) {
                return transform_assistant_tool_message(id, name, tool_calls, progress);
            }

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
            if let (Some(name), Some(content)) = (name, content) {
                return transform_tool_message(id, name, content, progress);
            }

            Ok(BusterThreadMessage::Thought(BusterThought {
                id: tool_call_id.clone(),
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
    name: String,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    match name.as_str() {
        "data_catalog_search" => assistant_data_catalog_search(id, progress),
        "stored_values_search" => assistant_stored_values_search(id, progress),
        "file_search" => assistant_file_search(id, progress),
        "create_file" => assistant_create_file(id, content, progress),
        "modify_file" => assistant_modify_file(id, content, progress),
        _ => Err(anyhow::anyhow!("Unsupported tool name")),
    }
}

fn transform_assistant_tool_message(
    id: Option<String>,
    name: String,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    match name.as_str() {
        "data_catalog_search" => assistant_data_catalog_search(id, content, progress),
        "stored_values_search" => assistant_stored_values_search(id, content, progress),
        "file_search" => assistant_file_search(id, content, progress),
        "create_file" => assistant_create_file(id, content, progress),
        "modify_file" => assistant_modify_file(id, content, progress),
    }
}

fn assistant_data_catalog_search(
    id: Option<String>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                let id = id.unwrap_or_else(|| Uuid::new_v4().to_string());

                Ok(BusterThreadMessage::Thought(BusterThought {
                    id,
                    thought_type: "thought".to_string(),
                    thought_title: "Searching your data catalog...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thought_pills: None,
                    status: "loading".to_string(),
                }))
            }
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
        let data_catalog_result = match serde_json::from_str::<SearchDataCatalogOutput>(&content) {
            Ok(result) => result,
            Err(e) => {
                return Err(anyhow::anyhow!(
                    "Failed to parse data catalog search result: {}",
                    e
                ));
            }
        };

        let thought_pill_containters =
            match proccess_data_catalog_search_results(data_catalog_result) {
                Ok(object) => object,
                Err(e) => {
                    return Err(anyhow::anyhow!(
                        "Failed to process data catalog search results: {}",
                        e
                    ));
                }
            };

        let duration = (data_catalog_result.duration as f64 / 1000.0 * 10.0).round() / 10.0;

        let result_count = data_catalog_result.results.len();

        let buster_thought = if result_count > 0 {
            BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: format!("Found {} results", result_count),
                thought_secondary_title: format!("{} seconds", duration),
                thought_pills: Some(thought_pill_containters),
                status: "completed".to_string(),
            })
        } else {
            BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "No data catalog items found".to_string(),
                thought_secondary_title: format!("{} seconds", duration),
                thought_pills: vec![],
                status: "completed".to_string(),
            })
        };

        match progress {
            MessageProgress::Complete => Ok(buster_thought),
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

fn proccess_data_catalog_search_results(
    results: SearchDataCatalogOutput,
) -> Result<Vec<BusterThoughtPillContainer>> {
    if results.results.is_empty() {
        return Ok(vec![BusterThoughtPillContainer {
            title: "No datasets found".to_string(),
            thought_pills: vec![],
        }]);
    }

    let mut dataset_results = vec![];
    let mut terms_results = vec![];
    let mut verified_metrics = vec![];

    for result in results.results {
        match result.name.as_str() {
            "dataset" => dataset_results.push(BusterThoughtPill {
                id: result.id.to_string(),
                text: result.name,
                thought_file_type: "dataset".to_string(),
            }),
            "term" => terms_results.push(BusterThoughtPill {
                id: result.id.to_string(),
                text: result.name,
                thought_file_type: "term".to_string(),
            }),
            "verified_metric" => verified_metrics.push(BusterThoughtPill {
                id: result.id.to_string(),
                text: result.name,
                thought_file_type: "verified_metric".to_string(),
            }),
            _ => (),
        }
    }

    let dataset_count = dataset_results.len();
    let term_count = terms_results.len();
    let verified_metric_count = verified_metrics.len();

    Ok(vec![
        BusterThoughtPillContainer {
            title: format!("Datasets ({})", dataset_count),
            thought_pills: dataset_results,
        },
        BusterThoughtPillContainer {
            title: format!("Terms ({})", term_count),
            thought_pills: terms_results,
        },
        BusterThoughtPillContainer {
            title: format!("Verified Metrics ({})", verified_metric_count),
            thought_pills: verified_metrics,
        },
    ])
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

fn assistant_file_search(
    id: Option<String>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => Ok(BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "Searching your files...".to_string(),
                thought_secondary_title: "".to_string(),
                thought_pills: None,
                status: "loading".to_string(),
            })),
            _ => Err(anyhow::anyhow!(
                "Assistant file search only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!("Assistant file search requires progress."))
    }
}

fn tool_file_search(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    Ok(BusterThreadMessage::Thought(BusterThought {
        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        thought_type: "thought".to_string(),
        thought_title: "".to_string(),
        thought_secondary_title: "".to_string(),
        thought_pills: None,
        status: "completed".to_string(),
    }))
}

fn assistant_open_file(
    id: Option<String>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => Ok(BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "Looking through assets...".to_string(),
                thought_secondary_title: "".to_string(),
                thought_pills: None,
                status: "loading".to_string(),
            })),
            _ => Err(anyhow::anyhow!(
                "Assistant file search only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!("Assistant file search requires progress."))
    }
}

fn tool_open_file(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    Ok(BusterThreadMessage::ChatMessage(BusterChatMessage {
        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        message_type: "text".to_string(),
        message: Some(content),
        message_chunk: None,
    }))
}

fn assistant_create_file(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => Ok(BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "Creating a new file...".to_string(),
                thought_secondary_title: "".to_string(),
                thought_pills: None,
                status: "loading".to_string(),
            })),
            _ => Err(anyhow::anyhow!(
                "Assistant file search only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!("Assistant file search requires progress."))
    }
}

fn assistant_modify_file(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => Ok(BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "Creating a new file...".to_string(),
                thought_secondary_title: "".to_string(),
                thought_pills: None,
                status: "loading".to_string(),
            })),
            _ => Err(anyhow::anyhow!(
                "Assistant file search only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!("Assistant file search requires progress."))
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
