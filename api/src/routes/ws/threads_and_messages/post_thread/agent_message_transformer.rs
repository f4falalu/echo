use std::collections::HashMap;

use anyhow::Result;
use serde::Serialize;
use serde_json::Value;
use uuid::Uuid;

use crate::utils::clients::ai::litellm::{Message, MessageProgress, ToolCall};

use crate::utils::tools::file_tools::create_files::CreateFilesParams;
use crate::utils::tools::file_tools::file_types::file::FileEnum;
use crate::utils::tools::file_tools::modify_files::ModifyFilesParams;
use crate::utils::tools::file_tools::open_files::OpenFilesOutput;
use crate::utils::tools::file_tools::search_data_catalog::SearchDataCatalogOutput;
use crate::utils::tools::file_tools::search_files::SearchFilesOutput;

#[derive(Clone)]
struct StreamingFileState {
    id: String,
    file_type: String,
    file_name: String,
    version_id: String,
    current_lines: Vec<FileContent>,
    line_buffer: String,
    next_line_number: usize,
    has_metadata: bool,
    status: String,
}

enum ParsingState {
    WaitingForMetadata,
    StreamingFiles {
        files: Vec<StreamingFileState>,
    },
    Complete,
}

struct StreamingParser {
    state: ParsingState,
    buffer: String,
}

impl StreamingParser {
    
    fn new() -> Self {
        Self {
            state: ParsingState::WaitingForMetadata,
            buffer: String::new(),
        }
    }

    fn complete_json(&self, partial: &str) -> String {
        let mut json = partial.to_string();
        let mut result = String::with_capacity(json.len() * 2);
        
        let mut brace_count = 0;
        let mut bracket_count = 0;
        let mut in_string = false;
        let mut escape_next = false;
        let mut in_yml_content = false;
        let mut yml_content_start = 0;
        
        // First pass: track state and identify yml_content
        let chars: Vec<char> = json.chars().collect();
        let mut i = 0;
        while i < chars.len() {
            let c = chars[i];
            
            if escape_next {
                result.push(c);
                escape_next = false;
                i += 1;
                continue;
            }
            
            match c {
                '{' if !in_string => {
                    brace_count += 1;
                    result.push(c);
                }
                '}' if !in_string => {
                    brace_count -= 1;
                    result.push(c);
                }
                '[' if !in_string => {
                    bracket_count += 1;
                    result.push(c);
                }
                ']' if !in_string => {
                    bracket_count -= 1;
                    result.push(c);
                }
                '"' => {
                    if !escape_next {
                        // Check if we're entering yml_content
                        if !in_string && i >= 13 {
                            let prev = &chars[i-13..i];
                            let prev_str: String = prev.iter().collect();
                            if prev_str == "\"yml_content\":" {
                                in_yml_content = true;
                                yml_content_start = result.len() + 1;
                            }
                        }
                        // Check if we're exiting yml_content
                        if in_string && in_yml_content {
                            // Look ahead to see if this is really the end
                            if i + 1 < chars.len() {
                                match chars[i + 1] {
                                    ',' | '}' => in_yml_content = false,
                                    _ => {} // Not the end, keep going
                                }
                            }
                        }
                        in_string = !in_string;
                    }
                    result.push(c);
                }
                '\\' => {
                    escape_next = true;
                    result.push(c);
                }
                _ => {
                    result.push(c);
                }
            }
            i += 1;
        }
        
        // Second pass: complete any unclosed structures
        if in_string {
            // If we're in yml_content, we need to be careful about how we close it
            if in_yml_content {
                // Only add closing quote if we don't have an odd number of unescaped quotes
                let yml_part = &result[yml_content_start..];
                let mut quote_count = 0;
                let mut was_escape = false;
                for c in yml_part.chars() {
                    match c {
                        '"' if !was_escape => quote_count += 1,
                        '\\' => was_escape = !was_escape,
                        _ => was_escape = false
                    }
                }
                if quote_count % 2 == 0 {
                    result.push('"');
                }
            } else {
                result.push('"');
            }
        }
        
        // Close any unclosed arrays/objects
        while bracket_count > 0 {
            result.push(']');
            bracket_count -= 1;
        }
        while brace_count > 0 {
            result.push('}');
            brace_count -= 1;
        }
        
        result
    }

    fn process_chunk(&mut self, chunk: &str) -> Result<Option<BusterThreadMessage>> {
        self.buffer.push_str(chunk);
        let completed_json = self.complete_json(&self.buffer);
        
        println!("completed_json: {:?}", completed_json);
        
        match &mut self.state {
            ParsingState::WaitingForMetadata => {
                if let Ok(partial) = serde_json::from_str::<Value>(&completed_json) {
                    if let Some(files_array) = partial.get("files").and_then(|f| f.as_array()) {
                        let mut streaming_files = Vec::new();
                        
                        for file in files_array {
                            if let (Some(name), Some(file_type)) = (
                                file.get("name").and_then(|n| n.as_str()),
                                file.get("file_type").and_then(|t| t.as_str()),
                            ) {
                                let mut file_state = StreamingFileState {
                                    id: Uuid::new_v4().to_string(),
                                    file_type: file_type.to_string(),
                                    file_name: name.to_string(),
                                    version_id: Uuid::new_v4().to_string(),
                                    current_lines: Vec::new(),
                                    line_buffer: String::new(),
                                    next_line_number: 1,
                                    has_metadata: true,
                                    status: "loading".to_string(),
                                };

                                // Process any initial content that's available
                                if let Some(yml_content) = file.get("yml_content").and_then(|c| c.as_str()) {
                                    if !yml_content.is_empty() {
                                        file_state.line_buffer.push_str(yml_content);
                                        
                                        // Process complete lines
                                        let mut new_lines = Vec::new();
                                        for line in file_state.line_buffer.lines() {
                                            new_lines.push(FileContent {
                                                text: line.to_string(),
                                                line_number: file_state.next_line_number,
                                                modified: true,
                                            });
                                            file_state.next_line_number += 1;
                                        }
                                        
                                        // Handle partial lines
                                        if !file_state.line_buffer.ends_with('\n') {
                                            if let Some(last_newline) = file_state.line_buffer.rfind('\n') {
                                                file_state.line_buffer = file_state.line_buffer[last_newline + 1..].to_string();
                                            }
                                        } else {
                                            file_state.line_buffer.clear();
                                        }
                                        
                                        file_state.current_lines.extend(new_lines);
                                    }
                                }

                                streaming_files.push(file_state);

                                // Transition to StreamingFiles state as soon as we have metadata
                                if file == files_array.last().unwrap() {
                                    let last_file = streaming_files.last().unwrap().clone();
                                    self.state = ParsingState::StreamingFiles {
                                        files: streaming_files,
                                    };
                                    
                                    return Ok(Some(BusterThreadMessage::File(BusterFileMessage {
                                        id: last_file.id,
                                        message_type: "file".to_string(),
                                        file_type: last_file.file_type,
                                        file_name: last_file.file_name,
                                        version_number: 1,
                                        version_id: last_file.version_id,
                                        status: "loading".to_string(),
                                        file: Some(last_file.current_lines),
                                    })));
                                }
                            }
                        }
                    }
                }
                Ok(None)
            }
            
            ParsingState::StreamingFiles { files } => {
                if let Ok(partial) = serde_json::from_str::<Value>(&completed_json) {
                    if let Some(files_array) = partial.get("files").and_then(|f| f.as_array()) {
                        // Process content for current file
                        if let Some(current_file) = files.last_mut() {
                            if let Some(file_data) = files_array.last() {
                                if let Some(yml_content) = file_data.get("yml_content").and_then(|c| c.as_str()) {
                                    if yml_content.len() > current_file.line_buffer.len() {
                                        let new_content = &yml_content[current_file.line_buffer.len()..];
                                        current_file.line_buffer.push_str(new_content);
                                        
                                        // Process complete lines
                                        let mut new_lines = Vec::new();
                                        for line in current_file.line_buffer.lines() {
                                            new_lines.push(FileContent {
                                                text: line.to_string(),
                                                line_number: current_file.next_line_number,
                                                modified: true,
                                            });
                                            current_file.next_line_number += 1;
                                        }
                                        
                                        // Handle partial lines
                                        if !current_file.line_buffer.ends_with('\n') {
                                            if let Some(last_newline) = current_file.line_buffer.rfind('\n') {
                                                current_file.line_buffer = current_file.line_buffer[last_newline + 1..].to_string();
                                            }
                                        } else {
                                            current_file.line_buffer.clear();
                                        }
                                        
                                        current_file.current_lines.extend(new_lines);
                                        
                                        return Ok(Some(BusterThreadMessage::File(BusterFileMessage {
                                            id: current_file.id.clone(),
                                            message_type: "file".to_string(),
                                            file_type: current_file.file_type.clone(),
                                            file_name: current_file.file_name.clone(),
                                            version_number: 1,
                                            version_id: current_file.version_id.clone(),
                                            status: "loading".to_string(),
                                            file: Some(current_file.current_lines.clone()),
                                        })));
                                    }
                                }
                            }
                        }

                        // Check for new files
                        if files_array.len() > files.len() {
                            // Complete the current file if it exists
                            if let Some(current_file) = files.last_mut() {
                                current_file.status = "completed".to_string();
                                
                                // Emit completion message for current file
                                let completion_message = BusterThreadMessage::File(BusterFileMessage {
                                    id: current_file.id.clone(),
                                    message_type: "file".to_string(),
                                    file_type: current_file.file_type.clone(),
                                    file_name: current_file.file_name.clone(),
                                    version_number: 1,
                                    version_id: current_file.version_id.clone(),
                                    status: "completed".to_string(),
                                    file: Some(current_file.current_lines.clone()),
                                });
                                
                                // Add new file to state if we have its metadata
                                if let Some(new_file) = files_array.last() {
                                    if let (Some(name), Some(file_type)) = (
                                        new_file.get("name").and_then(|n| n.as_str()),
                                        new_file.get("file_type").and_then(|t| t.as_str()),
                                    ) {
                                        files.push(StreamingFileState {
                                            id: Uuid::new_v4().to_string(),
                                            file_type: file_type.to_string(),
                                            file_name: name.to_string(),
                                            version_id: Uuid::new_v4().to_string(),
                                            current_lines: Vec::new(),
                                            line_buffer: String::new(),
                                            next_line_number: 1,
                                            has_metadata: true,
                                            status: "loading".to_string(),
                                        });
                                    }
                                }
                                
                                return Ok(Some(completion_message));
                            }
                        }
                    }
                }
                Ok(None)
            }
            
            ParsingState::Complete => Ok(None),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum BusterThreadMessage {
    ChatMessage(BusterChatMessage),
    Thought(BusterThought),
    File(BusterFileMessage),
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

#[derive(Debug, Serialize)]
pub struct BusterFileMessage {
    pub id: String,
    #[serde(rename = "type")]
    pub message_type: String,
    pub file_type: String,
    pub file_name: String,
    pub version_number: i32,
    pub version_id: String,
    pub status: String,
    pub file: Option<Vec<FileContent>>,
}

#[derive(Debug, Serialize, Clone)]
pub struct FileContent {
    pub text: String,
    pub line_number: usize,
    pub modified: bool,
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

            if let Some(tool_calls) = tool_calls {
                return transform_assistant_tool_message(id, tool_calls, progress);
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
    tool_calls: Vec<ToolCall>,
    progress: Option<MessageProgress>,
) -> Result<BusterThreadMessage> {
    if let Some(tool_call) = tool_calls.first() {
        match tool_call.function.name.as_str() {
            "data_catalog_search" => assistant_data_catalog_search(id, progress),
            "stored_values_search" => assistant_stored_values_search(id, progress),
            "search_files" => assistant_file_search(id, progress),
            "create_files" => assistant_create_file(id, tool_calls, progress),
            "modify_files" => assistant_modify_file(id, tool_calls, progress),
            "open_files" => assistant_open_files(id, progress),
            _ => Err(anyhow::anyhow!("Unsupported tool name")),
        }
    } else {
        Err(anyhow::anyhow!("Assistant tool message missing tool call"))
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
                    return process_assistant_create_file(tool_call);
                }
                Err(anyhow::anyhow!("No tool call found"))
            }
            _ => Err(anyhow::anyhow!(
                "Assistant create file only supports in progress."
            )),
        }
    } else {
        Err(anyhow::anyhow!("Assistant create file requires progress."))
    }
}

fn process_assistant_create_file(tool_call: &ToolCall) -> Result<BusterThreadMessage> {
    let mut parser = StreamingParser::new();

    // Process the arguments from the tool call
    if let Some(message) = parser.process_chunk(&tool_call.function.arguments)? {
        return Ok(message);
    }

    // Return None by returning Ok(None) wrapped in a Result
    Err(anyhow::anyhow!("Still waiting for file data"))
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
                    if let Ok(params) =
                        serde_json::from_str::<ModifyFilesParams>(&tool_call.function.arguments)
                    {
                        if let Some(file) = params.files.first() {
                            return Ok(BusterThreadMessage::Thought(BusterThought {
                                id: id.unwrap_or_else(|| Uuid::new_v4().to_string()),
                                thought_type: "thought".to_string(),
                                thought_title: format!(
                                    "Modifying {} file '{}'...",
                                    file.file_type, file.file_name
                                ),
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
