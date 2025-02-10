use std::collections::HashMap;

use anyhow::Result;
use serde::Serialize;
use uuid::Uuid;

use crate::utils::clients::ai::litellm::{Message, MessageProgress, ToolCall};

use crate::utils::tools::file_tools::file_types::file::FileEnum;
use crate::utils::tools::file_tools::open_files::OpenFilesOutput;
use crate::utils::tools::file_tools::search_data_catalog::SearchDataCatalogOutput;
use crate::utils::tools::file_tools::search_files::SearchFilesOutput;
use crate::utils::tools::file_tools::create_files::CreateFilesParams;
use crate::utils::tools::file_tools::modify_files::ModifyFilesParams;

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
    println!("transform_message: {:?}", message);

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

            Err(anyhow::anyhow!("Assistant message missing required fields"))
        }
        Message::Tool {
            id,
            content,
            tool_call_id,
            name,
            progress,
        } => {
            if let Some(name) = name {
                return transform_tool_message(id, name, content, progress);
            }

            Err(anyhow::anyhow!("Tool message missing name field"))
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
        "data_catalog_search" => tool_data_catalog_search(id, content, progress),
        "stored_values_search" => tool_stored_values_search(id, content, progress),
        "search_files" => tool_file_search(id, content, progress),
        "create_files" => tool_create_file(id, content, progress),
        "modify_files" => tool_modify_file(id, content, progress),
        "open_files" => tool_open_files(id, content, progress),
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
        "data_catalog_search" => assistant_data_catalog_search(id, progress),
        "stored_values_search" => assistant_stored_values_search(id, progress),
        "search_files" => assistant_file_search(id, progress),
        "create_files" => assistant_create_file(id, tool_calls, progress),
        "modify_files" => assistant_modify_file(id, tool_calls, progress),
        "open_files" => assistant_open_files(id, progress),
        _ => Err(anyhow::anyhow!("Unsupported tool name")),
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

        let duration = (data_catalog_result.duration.clone() as f64 / 1000.0 * 10.0).round() / 10.0;

        let result_count = data_catalog_result.results.len();

        let query_params = data_catalog_result.query_params.clone();

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
                thought_pills: Some(vec![BusterThoughtPillContainer {
                    title: "No results found".to_string(),
                    thought_pills: query_params
                        .iter()
                        .map(|param| BusterThoughtPill {
                            id: "".to_string(),
                            text: param.clone(),
                            thought_file_type: "empty".to_string(),
                        })
                        .collect(),
                }]),
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
            title: "No results found".to_string(),
            thought_pills: vec![],
        }]);
    }

    let mut file_results: HashMap<String, Vec<BusterThoughtPill>> = HashMap::new();

    for result in results.results {
        file_results
            .entry(result.name.clone())
            .or_insert_with(Vec::new)
            .push(BusterThoughtPill {
                id: result.id.to_string(),
                text: result.name.clone(),
                thought_file_type: result.name,
            });
    }

    let buster_thought_pill_containers = file_results
        .into_iter()
        .map(|(title, thought_pills)| {
            let count = thought_pills.len();
            BusterThoughtPillContainer {
                title: format!(
                    "{count} {} found",
                    title.chars().next().unwrap().to_uppercase().to_string() + &title[1..]
                ),
                thought_pills,
            }
        })
        .collect();

    Ok(buster_thought_pill_containers)
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
                thought_title: "Searching for relevant values...".to_string(),
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

// TODO: Implmentation for stored values search.
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
                thought_title: "Searching across your assets...".to_string(),
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
    if let Some(progress) = progress {
        let file_search_result = match serde_json::from_str::<SearchFilesOutput>(&content) {
            Ok(result) => result,
            Err(e) => {
                return Err(anyhow::anyhow!("Failed to parse file search result: {}", e));
            }
        };

        let query_params = file_search_result.query_params.clone();
        let duration = (file_search_result.duration.clone() as f64 / 1000.0 * 10.0).round() / 10.0;
        let result_count = file_search_result.files.len();

        let thought_pill_containers = match process_file_search_results(file_search_result) {
            Ok(containers) => containers,
            Err(e) => {
                return Err(anyhow::anyhow!(
                    "Failed to process file search results: {}",
                    e
                ));
            }
        };

        let buster_thought = if result_count > 0 {
            BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: format!("Found {} assets", result_count),
                thought_secondary_title: format!("{} seconds", duration),
                thought_pills: Some(thought_pill_containers),
                status: "completed".to_string(),
            })
        } else {
            BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "No assets found".to_string(),
                thought_secondary_title: format!("{} seconds", duration),
                thought_pills: Some(vec![BusterThoughtPillContainer {
                    title: "No assets found".to_string(),
                    thought_pills: query_params
                        .iter()
                        .map(|param| BusterThoughtPill {
                            id: "".to_string(),
                            text: param.clone(),
                            thought_file_type: "empty".to_string(),
                        })
                        .collect(),
                }]),
                status: "completed".to_string(),
            })
        };

        match progress {
            MessageProgress::Complete => Ok(buster_thought),
            _ => Err(anyhow::anyhow!("Tool file search only supports complete.")),
        }
    } else {
        Err(anyhow::anyhow!("Tool file search requires progress."))
    }
}

fn process_file_search_results(
    results: SearchFilesOutput,
) -> Result<Vec<BusterThoughtPillContainer>> {
    if results.files.is_empty() {
        return Ok(vec![BusterThoughtPillContainer {
            title: "No assets found".to_string(),
            thought_pills: vec![],
        }]);
    }

    let mut file_results: HashMap<String, Vec<BusterThoughtPill>> = HashMap::new();

    for result in results.files {
        file_results
            .entry(result.file_type.clone())
            .or_insert_with(Vec::new)
            .push(BusterThoughtPill {
                id: result.id.to_string(),
                text: result.name,
                thought_file_type: result.file_type,
            });
    }

    let buster_thought_pill_containers = file_results
        .into_iter()
        .map(|(title, thought_pills)| BusterThoughtPillContainer {
            title: title.chars().next().unwrap().to_uppercase().to_string() + &title[1..],
            thought_pills,
        })
        .collect();

    Ok(buster_thought_pill_containers)
}

fn assistant_open_files(
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

fn tool_open_files(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        let open_files_result = match serde_json::from_str::<OpenFilesOutput>(&content) {
            Ok(result) => result,
            Err(e) => {
                return Err(anyhow::anyhow!("Failed to parse open files result: {}", e));
            }
        };

        let duration = (open_files_result.duration as f64 / 1000.0 * 10.0).round() / 10.0;
        let result_count = open_files_result.results.len();

        let mut file_results: HashMap<String, Vec<BusterThoughtPill>> = HashMap::new();

        for result in open_files_result.results {
            let file_type = match result {
                FileEnum::Dashboard(_) => "dashboard",
                FileEnum::Metric(_) => "metric",
            }
            .to_string();

            file_results
                .entry(file_type.clone())
                .or_insert_with(Vec::new)
                .push(BusterThoughtPill {
                    id: Uuid::new_v4().to_string(),
                    text: open_files_result.message.clone(),
                    thought_file_type: file_type,
                });
        }

        let thought_pill_containers = file_results
            .into_iter()
            .map(|(title, thought_pills)| BusterThoughtPillContainer {
                title: title.chars().next().unwrap().to_uppercase().to_string() + &title[1..],
                thought_pills,
            })
            .collect::<Vec<_>>();

        let buster_thought = BusterThreadMessage::Thought(BusterThought {
            id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
            thought_type: "thought".to_string(),
            thought_title: format!("Looked through {} assets", result_count),
            thought_secondary_title: format!("{} seconds", duration),
            thought_pills: Some(thought_pill_containers),
            status: "completed".to_string(),
        });

        match progress {
            MessageProgress::Complete => Ok(buster_thought),
            _ => Err(anyhow::anyhow!("Tool open file only supports complete.")),
        }
    } else {
        Err(anyhow::anyhow!("Tool open file requires progress."))
    }
}

fn assistant_create_file(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Try to parse the tool call arguments to get file metadata
                if let Some(tool_call) = tool_calls.first() {
                    if let Ok(params) = serde_json::from_str::<CreateFilesParams>(&tool_call.function.arguments) {
                        if let Some(file) = params.files.first() {
                            return Ok(BusterThreadMessage::Thought(BusterThought {
                                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                                thought_type: "thought".to_string(),
                                thought_title: format!("Creating {} file '{}'...", file.file_type, file.name),
                                thought_secondary_title: "".to_string(),
                                thought_pills: None,
                                status: "loading".to_string(),
                            }));
                        }
                    }
                }
                // Fall back to generic message if we can't parse the metadata
                let id = id.unwrap_or_else(|| Uuid::new_v4().to_string());
                
                Ok(BusterThreadMessage::Thought(BusterThought {
                    id,
                    thought_type: "thought".to_string(),
                    thought_title: "Creating a new file...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thought_pills: None,
                    status: "loading".to_string(),
                }))
            }
            _ => Err(anyhow::anyhow!(
                "Assistant create file only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!("Assistant create file requires progress."))
    }
}

fn assistant_modify_file(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Try to parse the tool call arguments to get file metadata
                if let Some(tool_call) = tool_calls.first() {
                    if let Ok(params) = serde_json::from_str::<ModifyFilesParams>(&tool_call.function.arguments) {
                        if let Some(file) = params.files.first() {
                            return Ok(BusterThreadMessage::Thought(BusterThought {
                                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                                thought_type: "thought".to_string(),
                                thought_title: format!("Modifying {} file '{}'...", file.file_type, file.file_name),
                                thought_secondary_title: "".to_string(),
                                thought_pills: None,
                                status: "loading".to_string(),
                            }));
                        }
                    }
                }
                // Fall back to generic message if we can't parse the metadata
                let id = id.unwrap_or_else(|| Uuid::new_v4().to_string());
                
                Ok(BusterThreadMessage::Thought(BusterThought {
                    id,
                    thought_type: "thought".to_string(),
                    thought_title: "Modifying file...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thought_pills: None,
                    status: "loading".to_string(),
                }))
            }
            _ => Err(anyhow::anyhow!(
                "Assistant modify file only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!("Assistant modify file requires progress."))
    }
}

fn tool_create_file(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        let duration = 0.1; // File creation is typically very fast

        let buster_thought = BusterThreadMessage::Thought(BusterThought {
            id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
            thought_type: "thought".to_string(),
            thought_title: "Created new file".to_string(),
            thought_secondary_title: format!("{} seconds", duration),
            thought_pills: Some(vec![BusterThoughtPillContainer {
                title: "Created".to_string(),
                thought_pills: vec![BusterThoughtPill {
                    id: Uuid::new_v4().to_string(),
                    text: content,
                    thought_file_type: "file".to_string(),
                }],
            }]),
            status: "completed".to_string(),
        });

        match progress {
            MessageProgress::Complete => Ok(buster_thought),
            _ => Err(anyhow::anyhow!("Tool create file only supports complete.")),
        }
    } else {
        Err(anyhow::anyhow!("Tool create file requires progress."))
    }
}

fn tool_modify_file(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(progress) = progress {
        let duration = 0.1; // File modification is typically very fast

        let buster_thought = BusterThreadMessage::Thought(BusterThought {
            id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
            thought_type: "thought".to_string(),
            thought_title: "Modified file".to_string(),
            thought_secondary_title: format!("{} seconds", duration),
            thought_pills: Some(vec![BusterThoughtPillContainer {
                title: "Modified".to_string(),
                thought_pills: vec![BusterThoughtPill {
                    id: Uuid::new_v4().to_string(),
                    text: content,
                    thought_file_type: "file".to_string(),
                }],
            }]),
            status: "completed".to_string(),
        });

        match progress {
            MessageProgress::Complete => Ok(buster_thought),
            _ => Err(anyhow::anyhow!("Tool modify file only supports complete.")),
        }
    } else {
        Err(anyhow::anyhow!("Tool modify file requires progress."))
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
