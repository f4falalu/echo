use std::collections::HashMap;

use anyhow::Result;
use serde::Serialize;
use uuid::Uuid;

use crate::utils::{
    clients::ai::litellm::{Message, MessageProgress, ToolCall},
    tools::file_tools::{
        file_types::file::FileEnum,
        open_files::OpenFilesOutput,
        parsers::{CreateFileParser, FileChunk, FileStreamEvent, ModifyFileParser},
        search_data_catalog::SearchDataCatalogOutput,
        search_files::SearchFilesOutput,
    },
};

#[derive(Debug, Serialize, Clone)]
#[serde(untagged)]
pub enum BusterThreadMessage {
    ChatMessage(BusterChatMessage),
    FileMessage(BusterFileMessage),
    Thought(BusterThought),
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
    pub thought_pills: Option<Vec<BusterThoughtPillContainer>>,
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
    pub status: String,
    pub file_chunk: Option<Vec<FileChunk>>,
    pub file: Option<Vec<FileChunk>>,
}

pub fn transform_message(message: Message) -> Result<BusterThreadMessage> {
    tracing::debug!("Transforming message: {:?}", message);
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

            if let Some(tool_calls) = tool_calls {
                // If name is provided use it, otherwise use the function name from the first tool call
                let name = name.or_else(|| tool_calls.first().map(|tc| tc.function.name.clone()));
                if let Some(name) = name {
                    return transform_assistant_tool_message(id, name, tool_calls, progress);
                }
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
        "data_catalog_search" => assistant_data_catalog_search(id, tool_calls, progress),
        "stored_values_search" => assistant_stored_values_search(id, tool_calls, progress),
        "search_files" => assistant_file_search(id, tool_calls, progress),
        "create_files" => assistant_create_file(id, tool_calls, progress),
        "modify_files" => assistant_modify_file(id, tool_calls, progress),
        "open_files" => assistant_open_files(id, tool_calls, progress),
        _ => Err(anyhow::anyhow!("Unsupported tool name")),
    }
}

fn assistant_data_catalog_search(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    let mut thought = BusterThought {
        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        thought_type: "thought".to_string(),
        thought_title: "Searching your data catalog...".to_string(),
        thought_secondary_title: "".to_string(),
        thought_pills: None,
        status: "loading".to_string(),
    };

    // Try to extract query parameters from tool calls
    if let Some(tool_call) = tool_calls.first() {
        if let Some(query) = extract_string_field(&tool_call.function.arguments, "query") {
            thought.thought_secondary_title = format!("Query: {}", query);
        }
    }

    Ok(BusterThreadMessage::Thought(thought))
}

fn assistant_stored_values_search(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    let mut thought = BusterThought {
        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        thought_type: "thought".to_string(),
        thought_title: "Searching for relevant values...".to_string(),
        thought_secondary_title: "".to_string(),
        thought_pills: None,
        status: "loading".to_string(),
    };

    // Try to extract search parameters from tool calls
    if let Some(tool_call) = tool_calls.first() {
        if let Some(key) = extract_string_field(&tool_call.function.arguments, "key") {
            thought.thought_secondary_title = format!("Key: {}", key);
        }
    }

    Ok(BusterThreadMessage::Thought(thought))
}

fn assistant_file_search(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    let mut thought = BusterThought {
        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        thought_type: "thought".to_string(),
        thought_title: "Searching across your assets...".to_string(),
        thought_secondary_title: "".to_string(),
        thought_pills: None,
        status: "loading".to_string(),
    };

    // Try to extract search parameters from tool calls
    if let Some(tool_call) = tool_calls.first() {
        if let Some(query) = extract_string_field(&tool_call.function.arguments, "query") {
            thought.thought_secondary_title = format!("Query: {}", query);
        }
    }

    Ok(BusterThreadMessage::Thought(thought))
}

fn assistant_open_files(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    let mut thought = BusterThought {
        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        thought_type: "thought".to_string(),
        thought_title: "Looking through assets...".to_string(),
        thought_secondary_title: "".to_string(),
        thought_pills: None,
        status: "loading".to_string(),
    };

    // Try to extract file IDs from tool calls
    if let Some(tool_call) = tool_calls.first() {
        if let Some(file_ids_str) = extract_array_content(&tool_call.function.arguments, "file_ids")
        {
            let count = file_ids_str.split(',').count();
            thought.thought_secondary_title = format!("Opening {} files", count);
        }
    }

    Ok(BusterThreadMessage::Thought(thought))
}

fn assistant_create_file(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    let mut thought = BusterThought {
        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        thought_type: "thought".to_string(),
        thought_title: "Creating a new file...".to_string(),
        thought_secondary_title: "".to_string(),
        thought_pills: None,
        status: "loading".to_string(),
    };

    // Try to extract file details from tool calls
    if let Some(tool_call) = tool_calls.first() {
        if let Some(name) = extract_string_field(&tool_call.function.arguments, "name") {
            thought.thought_secondary_title = format!("File: {}", name);
        }
    }

    Ok(BusterThreadMessage::Thought(thought))
}

fn assistant_modify_file(
    id: Option<String>,
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    let mut thought = BusterThought {
        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        thought_type: "thought".to_string(),
        thought_title: "Modifying file...".to_string(),
        thought_secondary_title: "".to_string(),
        thought_pills: None,
        status: "loading".to_string(),
    };

    // Try to extract file details from tool calls
    if let Some(tool_call) = tool_calls.first() {
        if let Some(file_name) = extract_string_field(&tool_call.function.arguments, "file_name") {
            thought.thought_secondary_title = format!("File: {}", file_name);
        }
    }

    Ok(BusterThreadMessage::Thought(thought))
}

fn tool_data_catalog_search(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    tracing::debug!("Processing data catalog search chunk: {}", content);

    // Always create a base thought with what we know
    let mut thought = BusterThought {
        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        thought_type: "thought".to_string(),
        thought_title: "Searching your data catalog...".to_string(),
        thought_secondary_title: "".to_string(),
        thought_pills: None,
        status: "loading".to_string(),
    };

    // Try to extract duration if available
    if let Some(duration_str) = extract_number_field(&content, "duration") {
        let duration = (duration_str as f64 / 1000.0 * 10.0).round() / 10.0;
        thought.thought_secondary_title = format!("{} seconds", duration);
    }

    // Try to extract and process results if available
    if content.contains("\"results\": [") {
        // Extract results array
        if let Some(results_str) = extract_array_content(&content, "results") {
            let mut file_results: HashMap<String, Vec<BusterThoughtPill>> = HashMap::new();

            // Process each result object we can find
            for result_obj in results_str.split("},") {
                if let (Some(id), Some(name)) = (
                    extract_string_field(result_obj, "id"),
                    extract_string_field(result_obj, "name"),
                ) {
                    file_results
                        .entry(name.clone())
                        .or_insert_with(Vec::new)
                        .push(BusterThoughtPill {
                            id: id.to_string(),
                            text: name.clone(),
                            thought_file_type: name,
                        });
                }
            }

            // Update thought with what we found
            let result_count = file_results.values().map(|v| v.len()).sum::<usize>();
            thought.thought_title = if result_count > 0 {
                format!("Found {} results", result_count)
            } else {
                "No data catalog items found".to_string()
            };

            // Convert results to containers
            let containers: Vec<BusterThoughtPillContainer> = file_results
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

            thought.thought_pills = Some(containers);
        }

        // If we found results, we can consider this complete
        thought.status = "completed".to_string();
    }

    Ok(BusterThreadMessage::Thought(thought))
}

// Helper function to extract array content from partial JSON
fn extract_array_content(content: &str, field_name: &str) -> Option<String> {
    if let Some(start) = content.find(&format!("\"{}\":", field_name)) {
        let content_start = content[start..].find('[')?;
        let array_content = &content[start + content_start..];
        let mut bracket_count = 1;
        let mut in_string = false;
        let mut escape_next = false;

        for (i, c) in array_content[1..].chars().enumerate() {
            match c {
                '[' if !in_string => bracket_count += 1,
                ']' if !in_string => {
                    bracket_count -= 1;
                    if bracket_count == 0 {
                        return Some(array_content[1..=i].to_string());
                    }
                }
                '"' if !escape_next => in_string = !in_string,
                '\\' if !escape_next => escape_next = true,
                _ => escape_next = false,
            }
        }
    }
    None
}

// Helper function to extract number fields from partial JSON
fn extract_number_field(content: &str, field_name: &str) -> Option<f64> {
    if let Some(start) = content.find(&format!("\"{}\":", field_name)) {
        let content_start = content[start..].find(':')?;
        let mut content = content[start + content_start + 1..].trim();

        // Find the end of the number
        let end = content
            .find(|c: char| !c.is_numeric() && c != '.' && c != '-')
            .unwrap_or(content.len());

        content[..end].parse().ok()
    } else {
        None
    }
}

// Helper function to extract string fields from partial JSON content
fn extract_string_field(content: &str, field_name: &str) -> Option<String> {
    if let Some(start) = content.find(&format!("\"{}\":", field_name)) {
        let content_start = content[start..].find(':')?;
        let mut content = content[start + content_start + 1..].trim();

        if content.starts_with('"') {
            content = &content[1..];
            if let Some(end) = content.find('"') {
                return Some(content[..end].to_string());
            }
        }
    }
    None
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

fn tool_create_file(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    tracing::debug!("Processing create file content chunk: {}", content);

    // Extract any available fields from the partial content
    let file_type = extract_string_field(&content, "file_type").unwrap_or_default();
    let file_name = extract_string_field(&content, "name").unwrap_or_default();
    let status = if content.contains("\"yml_content\": ") {
        "loading"
    } else {
        "pending"
    };

    // Create message with whatever we have
    let mut message = BusterThreadMessage::FileMessage(BusterFileMessage {
        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        message_type: "create_files".to_string(),
        file_type,
        file_name,
        status: status.to_string(),
        file_chunk: None,
        file: None,
    });

    // If we have content to parse, do that
    if content.contains("\"yml_content\": ") {
        let mut parser = CreateFileParser::new();
        if let Some(FileStreamEvent::ContentChunk { lines }) = parser.process_chunk(&content)? {
            if let BusterThreadMessage::FileMessage(ref mut file_msg) = message {
                file_msg.file_chunk = Some(lines);
            }
        }
    }

    Ok(message)
}

fn tool_modify_file(
    id: Option<String>,
    content: String,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    tracing::debug!("Processing modify file content chunk: {}", content);

    // Extract any available fields from the partial content
    let file_type = extract_string_field(&content, "file_type").unwrap_or_default();
    let file_name = extract_string_field(&content, "file_name").unwrap_or_default();
    let status = if content.contains("\"new_content\": ") {
        "loading"
    } else {
        "pending"
    };

    // Create message with whatever we have
    let mut message = BusterThreadMessage::FileMessage(BusterFileMessage {
        id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
        message_type: "modify_files".to_string(),
        file_type,
        file_name,
        status: status.to_string(),
        file_chunk: None,
        file: None,
    });

    // If we have content to parse, do that
    if content.contains("\"new_content\": ") {
        let mut parser = ModifyFileParser::new();
        if let Some(FileStreamEvent::ContentChunk { lines }) = parser.process_chunk(&content)? {
            if let BusterThreadMessage::FileMessage(ref mut file_msg) = message {
                file_msg.file_chunk = Some(lines);
            }
        }
    }

    Ok(message)
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
