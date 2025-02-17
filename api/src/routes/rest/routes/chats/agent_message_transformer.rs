use std::collections::HashMap;

use anyhow::Result;
use serde::Serialize;
use serde_json::Value;
use uuid::Uuid;

use crate::routes::ws::threads_and_messages::threads_router::ThreadEvent;
use litellm::{Message, MessageProgress, ToolCall};

use crate::utils::tools::file_tools::create_files::CreateFilesOutput;
use crate::utils::tools::file_tools::file_types::file::FileEnum;
use crate::utils::tools::file_tools::modify_files::ModifyFilesParams;
use crate::utils::tools::file_tools::open_files::OpenFilesOutput;
use crate::utils::tools::file_tools::search_data_catalog::SearchDataCatalogOutput;
use crate::utils::tools::file_tools::search_files::SearchFilesOutput;
use crate::utils::tools::interaction_tools::send_message_to_user::{SendMessageToUserInput, SendMessageToUserOutput};

#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum BusterThreadMessage {
    ChatMessage(BusterChatMessage),
    Thought(BusterThought),
    File(BusterFileMessage),
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterChatMessageContainer {
    pub response_message: BusterChatMessage,
    pub chat_id: Uuid,
    pub message_id: Uuid,
}

#[derive(Debug, Serialize, Clone)]
#[serde(untagged)]
pub enum ReasoningMessage {
    Thought(BusterThought),
    File(BusterFileMessage),
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterReasoningMessageContainer {
    pub reasoning: ReasoningMessage,
    pub chat_id: Uuid,
    pub message_id: Uuid,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterChatMessage {
    pub id: String,
    #[serde(rename = "type")]
    pub message_type: String,
    pub message: Option<String>,
    pub message_chunk: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterThought {
    pub id: String,
    #[serde(rename = "type")]
    pub thought_type: String,
    pub thought_title: String,
    pub thought_secondary_title: String,
    pub thoughts: Option<Vec<BusterThoughtPillContainer>>,
    pub status: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterThoughtPillContainer {
    pub title: String,
    pub thought_pills: Vec<BusterThoughtPill>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterThoughtPill {
    pub id: String,
    pub text: String,
    #[serde(rename = "type")]
    pub thought_file_type: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterFileMessage {
    pub id: String,
    #[serde(rename = "type")]
    pub message_type: String,
    pub file_type: String,
    pub file_name: String,
    pub version_number: i32,
    pub version_id: String,
    pub status: String,
    pub file: Option<Vec<BusterFileLine>>,
}

#[derive(Debug, Serialize, Clone)]
pub struct BusterFileLine {
    pub line_number: usize,
    pub text: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(untagged)]
pub enum BusterContainer {
    ChatMessage(BusterChatMessageContainer),
    ReasoningMessage(BusterReasoningMessageContainer),
}

pub fn transform_message(
    chat_id: &Uuid,
    message_id: &Uuid,
    message: Message,
) -> Result<(Vec<BusterContainer>, ThreadEvent)> {
    match message {
        Message::Assistant {
            id,
            content,
            name,
            tool_calls,
            progress,
            initial,
        } => {
            if let Some(content) = content {
                let messages = match transform_text_message(
                    id,
                    content,
                    progress,
                    chat_id.clone(),
                    message_id.clone(),
                ) {
                    Ok(messages) => messages
                        .into_iter()
                        .filter(|msg| msg.response_message.message_chunk.is_none()) // Only include completed messages
                        .map(BusterContainer::ChatMessage)
                        .collect(),
                    Err(_) => vec![], // Silently ignore errors by returning empty vec
                };

                return Ok((messages, ThreadEvent::GeneratingResponseMessage));
            }

            if let Some(tool_calls) = tool_calls {
                let messages = match transform_assistant_tool_message(
                    id,
                    tool_calls,
                    progress,
                    initial,
                    chat_id.clone(),
                    message_id.clone(),
                ) {
                    Ok(messages) => messages
                        .into_iter()
                        .filter(|msg| match &msg.reasoning {
                            ReasoningMessage::Thought(thought) => thought.status == "completed",
                            ReasoningMessage::File(file) => file.status == "completed",
                        })
                        .map(BusterContainer::ReasoningMessage)
                        .collect(),
                    Err(_) => vec![], // Silently ignore errors by returning empty vec
                };

                return Ok((messages, ThreadEvent::GeneratingReasoningMessage));
            }

            Ok((vec![], ThreadEvent::GeneratingResponseMessage)) // Return empty vec instead of error
        }
        Message::Tool {
            id,
            content,
            tool_call_id,
            name,
            progress,
        } => {
            if let Some(name) = name {
                let messages = match transform_tool_message(
                    id,
                    name,
                    content,
                    progress,
                    chat_id.clone(),
                    message_id.clone(),
                ) {
                    Ok(messages) => messages
                        .into_iter()
                        .filter(|msg| match &msg.reasoning {
                            ReasoningMessage::Thought(thought) => thought.status == "completed",
                            ReasoningMessage::File(file) => file.status == "completed",
                        })
                        .map(BusterContainer::ReasoningMessage)
                        .collect(),
                    Err(_) => vec![], // Silently ignore errors by returning empty vec
                };

                return Ok((messages, ThreadEvent::GeneratingReasoningMessage));
            }

            Ok((vec![], ThreadEvent::GeneratingReasoningMessage)) // Return empty vec instead of error
        }
        _ => Ok((vec![], ThreadEvent::GeneratingResponseMessage)), // Return empty vec instead of error
    }
}

fn transform_text_message(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
    chat_id: Uuid,
    message_id: Uuid,
) -> Result<Vec<BusterChatMessageContainer>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => Ok(vec![BusterChatMessageContainer {
                response_message: BusterChatMessage {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    message_type: "text".to_string(),
                    message: None,
                    message_chunk: Some(content),
                },
                chat_id,
                message_id,
            }]),
            MessageProgress::Complete => Ok(vec![BusterChatMessageContainer {
                response_message: BusterChatMessage {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    message_type: "text".to_string(),
                    message: Some(content),
                    message_chunk: None,
                },
                chat_id,
                message_id,
            }]),
            _ => Err(anyhow::anyhow!("Unsupported message progress")),
        }
    } else {
        Ok(vec![BusterChatMessageContainer {
            response_message: BusterChatMessage {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                message_type: "text".to_string(),
                message: None,
                message_chunk: None,
            },
            chat_id,
            message_id,
        }])
    }
}

fn transform_tool_message(
    id: Option<String>,
    name: String,
    content: String,
    progress: Option<MessageProgress>,
    chat_id: Uuid,
    message_id: Uuid,
) -> Result<Vec<BusterReasoningMessageContainer>> {
    let messages = match name.as_str() {
        "search_data_catalog" => tool_data_catalog_search(id, content, progress),
        "stored_values_search" => tool_stored_values_search(id, content, progress),
        "search_files" => tool_file_search(id, content, progress),
        "create_files" => tool_create_file(id, content, progress),
        "modify_files" => tool_modify_file(id, content, progress),
        "open_files" => tool_open_files(id, content, progress),
        "send_message_to_user" => tool_send_message_to_user(id, content, progress),
        _ => Err(anyhow::anyhow!("Unsupported tool name")),
    }?;

    Ok(messages
        .into_iter()
        .map(|message| BusterReasoningMessageContainer {
            reasoning: match message {
                BusterThreadMessage::Thought(thought) => ReasoningMessage::Thought(thought),
                BusterThreadMessage::File(file) => ReasoningMessage::File(file),
                _ => unreachable!("Tool messages should only return Thought or File"),
            },
            chat_id,
            message_id,
        })
        .collect())
}

fn transform_assistant_tool_message(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
    initial: bool,
    chat_id: Uuid,
    message_id: Uuid,
) -> Result<Vec<BusterReasoningMessageContainer>> {
    if let Some(tool_call) = tool_calls.first() {
        let messages = match tool_call.function.name.as_str() {
            "search_data_catalog" => assistant_data_catalog_search(id, progress, initial),
            "stored_values_search" => assistant_stored_values_search(id, progress, initial),
            "search_files" => assistant_file_search(id, progress, initial),
            "create_files" => assistant_create_file(id, tool_calls, progress),
            "modify_files" => assistant_modify_file(id, tool_calls, progress),
            "open_files" => assistant_open_files(id, progress, initial),
            "send_message_to_user" => assistant_send_message_to_user(id, tool_calls, progress),
            _ => Err(anyhow::anyhow!("Unsupported tool name")),
        }?;

        Ok(messages
            .into_iter()
            .map(|message| BusterReasoningMessageContainer {
                reasoning: match message {
                    BusterThreadMessage::Thought(thought) => ReasoningMessage::Thought(thought),
                    BusterThreadMessage::File(file) => ReasoningMessage::File(file),
                    _ => unreachable!("Assistant tool messages should only return Thought or File"),
                },
                chat_id,
                message_id,
            })
            .collect())
    } else {
        Err(anyhow::anyhow!("Assistant tool message missing tool call"))
    }
}

fn assistant_data_catalog_search(
    id: Option<String>,
    progress: Option<MessageProgress>,
    initial: bool,
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        if initial {
            match progress {
                MessageProgress::InProgress => {
                    let id = id.unwrap_or_else(|| Uuid::new_v4().to_string());

                    Ok(vec![BusterThreadMessage::Thought(BusterThought {
                        id,
                        thought_type: "thought".to_string(),
                        thought_title: "Searching your data catalog...".to_string(),
                        thought_secondary_title: "".to_string(),
                        thoughts: None,
                        status: "loading".to_string(),
                    })])
                }
                _ => Err(anyhow::anyhow!(
                    "Assistant data catalog search only supports in progress."
                )),
            }
        } else {
            Err(anyhow::anyhow!(
                "Assistant data catalog search only supports initial."
            ))
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
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        let data_catalog_result = match serde_json::from_str::<SearchDataCatalogOutput>(&content) {
            Ok(result) => result,
            Err(_) => return Ok(vec![]), // Silently ignore parsing errors
        };

        let duration = (data_catalog_result.duration.clone() as f64 / 1000.0 * 10.0).round() / 10.0;
        let result_count = data_catalog_result.results.len();
        let query_params = data_catalog_result.query_params.clone();

        let thought_pill_containters = match proccess_data_catalog_search_results(data_catalog_result) {
            Ok(object) => object,
            Err(_) => return Ok(vec![]), // Silently ignore processing errors
        };

        let buster_thought = if result_count > 0 {
            BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: format!("Found {} results", result_count),
                thought_secondary_title: format!("{} seconds", duration),
                thoughts: Some(thought_pill_containters),
                status: "completed".to_string(),
            })
        } else {
            BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "No data catalog items found".to_string(),
                thought_secondary_title: format!("{} seconds", duration),
                thoughts: Some(vec![BusterThoughtPillContainer {
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
            MessageProgress::Complete => Ok(vec![buster_thought]),
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
    initial: bool,
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        if initial {
            match progress {
                MessageProgress::InProgress => {
                    Ok(vec![BusterThreadMessage::Thought(BusterThought {
                        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                        thought_type: "thought".to_string(),
                        thought_title: "Searching for relevant values...".to_string(),
                        thought_secondary_title: "".to_string(),
                        thoughts: None,
                        status: "loading".to_string(),
                    })])
                }
                _ => Err(anyhow::anyhow!(
                    "Assistant stored values search only supports in progress."
                )),
            }
        } else {
            Err(anyhow::anyhow!(
                "Assistant stored values search only supports initial."
            ))
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
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::Complete => Ok(vec![BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "".to_string(),
                thought_secondary_title: "".to_string(),
                thoughts: None,
                status: "completed".to_string(),
            })]),
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
    initial: bool,
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        if initial {
            match progress {
                MessageProgress::InProgress => {
                    Ok(vec![BusterThreadMessage::Thought(BusterThought {
                        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                        thought_type: "thought".to_string(),
                        thought_title: "Searching across your assets...".to_string(),
                        thought_secondary_title: "".to_string(),
                        thoughts: None,
                        status: "loading".to_string(),
                    })])
                }
                _ => Err(anyhow::anyhow!(
                    "Assistant file search only supports in progress."
                )),
            }
        } else {
            Err(anyhow::anyhow!(
                "Assistant file search only supports initial."
            ))
        }
    } else {
        Err(anyhow::anyhow!("Assistant file search requires progress."))
    }
}

fn tool_file_search(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        let file_search_result = match serde_json::from_str::<SearchFilesOutput>(&content) {
            Ok(result) => result,
            Err(_) => return Ok(vec![]), // Silently ignore parsing errors
        };

        let query_params = file_search_result.query_params.clone();
        let duration = (file_search_result.duration.clone() as f64 / 1000.0 * 10.0).round() / 10.0;
        let result_count = file_search_result.files.len();

        let thought_pill_containers = match process_file_search_results(file_search_result) {
            Ok(containers) => containers,
            Err(_) => return Ok(vec![]), // Silently ignore processing errors
        };

        let buster_thought = if result_count > 0 {
            BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: format!("Found {} assets", result_count),
                thought_secondary_title: format!("{} seconds", duration),
                thoughts: Some(thought_pill_containers),
                status: "completed".to_string(),
            })
        } else {
            BusterThreadMessage::Thought(BusterThought {
                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                thought_type: "thought".to_string(),
                thought_title: "No assets found".to_string(),
                thought_secondary_title: format!("{} seconds", duration),
                thoughts: Some(vec![BusterThoughtPillContainer {
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
            MessageProgress::Complete => Ok(vec![buster_thought]),
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
    initial: bool,
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        if initial {
            match progress {
                MessageProgress::InProgress => {
                    Ok(vec![BusterThreadMessage::Thought(BusterThought {
                        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                        thought_type: "thought".to_string(),
                        thought_title: "Looking through assets...".to_string(),
                        thought_secondary_title: "".to_string(),
                        thoughts: None,
                        status: "loading".to_string(),
                    })])
                }
                _ => Err(anyhow::anyhow!(
                    "Assistant file search only supports in progress."
                )),
            }
        } else {
            Err(anyhow::anyhow!(
                "Assistant file search only supports initial."
            ))
        }
    } else {
        Err(anyhow::anyhow!("Assistant file search requires progress."))
    }
}

fn tool_open_files(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        let open_files_result = match serde_json::from_str::<OpenFilesOutput>(&content) {
            Ok(result) => result,
            Err(_) => return Ok(vec![]), // Silently ignore parsing errors
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
            thoughts: Some(thought_pill_containers),
            status: "completed".to_string(),
        });

        match progress {
            MessageProgress::Complete => Ok(vec![buster_thought]),
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
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress | MessageProgress::Complete => {
                // Try to parse the tool call arguments to get file metadata
                if let Some(tool_call) = tool_calls.first() {
                    return process_assistant_create_file(tool_call);
                }
                Err(anyhow::anyhow!("No tool call found"))
            }
            _ => Err(anyhow::anyhow!(
                "Assistant create file only supports in progress and complete."
            )),
        }
    } else {
        Err(anyhow::anyhow!("Assistant create file requires progress."))
    }
}

fn process_assistant_create_file(tool_call: &ToolCall) -> Result<Vec<BusterThreadMessage>> {
    // Try to parse the complete arguments directly
    match serde_json::from_str(&tool_call.function.arguments) {
        Ok(value) => {
            let file_data: Value = value;
            if let Some(files) = file_data.get("files").and_then(Value::as_array) {
                if let Some(file) = files.first().and_then(Value::as_object) {
                    let name = file.get("name").and_then(Value::as_str).unwrap_or("");
                    let file_type = file.get("file_type").and_then(Value::as_str).unwrap_or("");
                    let yml_content = file.get("yml_content").and_then(Value::as_str).unwrap_or("");

                    let current_lines: Vec<BusterFileLine> = yml_content
                        .lines()
                        .enumerate()
                        .map(|(i, line)| BusterFileLine {
                            line_number: i + 1,
                            text: line.to_string(),
                        })
                        .collect();

                    return Ok(vec![BusterThreadMessage::File(BusterFileMessage {
                        id: name.to_string(),
                        message_type: "file".to_string(),
                        file_type: file_type.to_string(),
                        file_name: name.to_string(),
                        version_number: 1,
                        version_id: Uuid::new_v4().to_string(),
                        status: "loading".to_string(),
                        file: Some(current_lines),
                    })]);
                }
            }
            Ok(vec![])
        }
        Err(_) => Ok(vec![]),
    }
}

fn assistant_modify_file(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::InProgress => {
                // Try to parse the tool call arguments to get file metadata
                if let Some(tool_call) = tool_calls.first() {
                    if let Ok(params) =
                        serde_json::from_str::<ModifyFilesParams>(&tool_call.function.arguments)
                    {
                        if let Some(file) = params.files.first() {
                            return Ok(vec![BusterThreadMessage::Thought(BusterThought {
                                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                                thought_type: "thought".to_string(),
                                thought_title: format!(
                                    "Modifying {} file '{}'...",
                                    file.file_type, file.file_name
                                ),
                                thought_secondary_title: "".to_string(),
                                thoughts: None,
                                status: "loading".to_string(),
                            })]);
                        }
                    }
                }
                // Fall back to generic message if we can't parse the metadata
                let id = id.unwrap_or_else(|| Uuid::new_v4().to_string());

                Ok(vec![BusterThreadMessage::Thought(BusterThought {
                    id,
                    thought_type: "thought".to_string(),
                    thought_title: "Modifying file...".to_string(),
                    thought_secondary_title: "".to_string(),
                    thoughts: None,
                    status: "loading".to_string(),
                })])
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
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        match progress {
            MessageProgress::Complete => {
                // Parse the content to get file information using CreateFilesOutput
                let create_files_result = match serde_json::from_str::<CreateFilesOutput>(&content) {
                    Ok(result) => result,
                    Err(_) => return Ok(vec![]), // Silently ignore parsing errors
                };
                let mut messages = Vec::new();

                for file in create_files_result.files {
                    let (name, file_type, content) = (file.name, file.file_type, file.yml_content);

                    let mut current_lines = Vec::new();
                    for (i, line) in content.lines().enumerate() {
                        current_lines.push(BusterFileLine {
                            line_number: i + 1,
                            text: line.to_string(),
                        });
                    }

                    messages.push(BusterThreadMessage::File(BusterFileMessage {
                        id: name.clone(),
                        message_type: "file".to_string(),
                        file_type,
                        file_name: name,
                        version_number: 1,
                        version_id: Uuid::new_v4().to_string(),
                        status: "completed".to_string(),
                        file: Some(current_lines),
                    }));
                }

                Ok(messages)
            }
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
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        let duration = 0.1; // File modification is typically very fast

        let buster_thought = BusterThreadMessage::Thought(BusterThought {
            id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
            thought_type: "thought".to_string(),
            thought_title: "Modified file".to_string(),
            thought_secondary_title: format!("{} seconds", duration),
            thoughts: Some(vec![BusterThoughtPillContainer {
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
            MessageProgress::Complete => Ok(vec![buster_thought]),
            _ => Err(anyhow::anyhow!("Tool modify file only supports complete.")),
        }
    } else {
        Err(anyhow::anyhow!("Tool modify file requires progress."))
    }
}

fn assistant_send_message_to_user(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        if let Some(tool_call) = tool_calls.first() {
            // Try to parse the message from the tool call arguments
            if let Ok(input) = serde_json::from_str::<SendMessageToUserInput>(&tool_call.function.arguments) {
                match progress {
                    MessageProgress::InProgress => {
                        Ok(vec![BusterThreadMessage::ChatMessage(BusterChatMessage {
                            id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                            message_type: "text".to_string(),
                            message: None,
                            message_chunk: Some(input.message),
                        })])
                    }
                    _ => Err(anyhow::anyhow!(
                        "Assistant send message to user only supports in progress."
                    )),
                }
            } else {
                Err(anyhow::anyhow!("Failed to parse send message to user input"))
            }
        } else {
            Err(anyhow::anyhow!("No tool call found"))
        }
    } else {
        Err(anyhow::anyhow!(
            "Assistant send message to user requires progress."
        ))
    }
}

fn tool_send_message_to_user(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<Vec<BusterThreadMessage>> {
    if let Some(progress) = progress {
        // Parse the output to get the message
        let output = match serde_json::from_str::<SendMessageToUserOutput>(&content) {
            Ok(result) => result,
            Err(_) => return Ok(vec![]), // Silently ignore parsing errors
        };

        match progress {
            MessageProgress::Complete => {
                Ok(vec![BusterThreadMessage::ChatMessage(BusterChatMessage {
                    id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                    message_type: "text".to_string(),
                    message: Some(output.message),
                    message_chunk: None,
                })])
            }
            _ => Err(anyhow::anyhow!(
                "Tool send message to user only supports complete."
            )),
        }
    } else {
        Err(anyhow::anyhow!("Tool send message to user requires progress."))
    }
}
