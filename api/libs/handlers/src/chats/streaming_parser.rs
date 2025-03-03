use anyhow::Result;
use serde_json::Value;
use uuid::Uuid;

use super::post_chat_handler::{BusterChatContainer, BusterFileLine, BusterFileMessage};

pub struct StreamingParser {
    buffer: String,
    yml_content_regex: regex::Regex,
}

impl StreamingParser {
    pub fn new() -> Self {
        StreamingParser {
            buffer: String::new(),
            yml_content_regex: regex::Regex::new(
                r#""yml_content":\s*"((?:[^"\\]|\\.|[\r\n])*?)(?:"|$)"#,
            )
            .unwrap(),
        }
    }

    pub fn process_chunk(&mut self, id: String, chunk: &str) -> Result<Option<BusterChatContainer>> {
        // Add new chunk to buffer
        self.buffer.push_str(chunk);

        // Extract and replace yml_content with placeholders
        let mut yml_contents = Vec::new();
        let mut positions = Vec::new();
        let mut processed_json = self.buffer.clone();

        // Find all yml_content matches and store them with their positions
        for captures in self.yml_content_regex.captures_iter(&self.buffer) {
            if let Some(content_match) = captures.get(1) {
                yml_contents.push(content_match.as_str().to_string());
                positions.push((
                    captures.get(0).unwrap().start(),
                    captures.get(0).unwrap().end(),
                ));
            }
        }

        // Sort positions from last to first to maintain correct indices when replacing
        let mut position_indices: Vec<usize> = (0..positions.len()).collect();
        position_indices.sort_by_key(|&i| std::cmp::Reverse(positions[i].0));

        // Replace matches with placeholders in reverse order
        for i in position_indices {
            let (start, end) = positions[i];
            let placeholder = format!(r#""yml_content":"YML_CONTENT_{i}""#);
            processed_json.replace_range(start..end, &placeholder);
        }

        // Complete any incomplete JSON structure
        processed_json = self.complete_json_structure(processed_json);

        // Try to parse the completed JSON
        if let Ok(mut value) = serde_json::from_str::<Value>(&processed_json) {
            // Put back the yml_content and process escapes first
            if let Some(obj) = value.as_object_mut() {
                if let Some(files) = obj.get_mut("files").and_then(|v| v.as_array_mut()) {
                    for (i, file) in files.iter_mut().enumerate() {
                        if let Some(file_obj) = file.as_object_mut() {
                            if let Some(yml_content) = yml_contents.get(i) {
                                // Process escaped characters
                                let processed_content =
                                    serde_json::from_str::<String>(&format!("\"{}\"", yml_content))
                                        .unwrap_or_else(|_| yml_content.clone());

                                file_obj.insert(
                                    "yml_content".to_string(),
                                    Value::String(processed_content),
                                );
                            }
                        }
                    }
                }
            }

            // Now check the structure after modifications
            if let Some(obj) = value.as_object() {
                if let Some(files) = obj.get("files").and_then(Value::as_array) {
                    if let Some(last_file) = files.last().and_then(Value::as_object) {
                        let has_name = last_file.get("name").and_then(Value::as_str).is_some();
                        let has_file_type =
                            last_file.get("file_type").and_then(Value::as_str).is_some();
                        let has_yml_content = last_file.get("yml_content").is_some();

                        if has_name && has_file_type && has_yml_content {
                            return self.convert_to_message(id, value);
                        }
                    }
                }
            }
        }

        Ok(None)
    }

    fn complete_json_structure(&self, json: String) -> String {
        let mut processed = String::with_capacity(json.len());
        let mut nesting_stack = Vec::new();
        let mut in_string = false;
        let mut escape_next = false;

        // Process each character and track structure
        for c in json.chars() {
            processed.push(c);

            if escape_next {
                escape_next = false;
                continue;
            }

            match c {
                '\\' => escape_next = true,
                '"' if !escape_next => in_string = !in_string,
                '{' | '[' if !in_string => nesting_stack.push(c),
                '}' if !in_string => {
                    if nesting_stack.last() == Some(&'{') {
                        nesting_stack.pop();
                    }
                }
                ']' if !in_string => {
                    if nesting_stack.last() == Some(&'[') {
                        nesting_stack.pop();
                    }
                }
                _ => {}
            }
        }

        // Close any unclosed strings
        if in_string {
            processed.push('"');
        }

        // Close structures in reverse order of opening
        while let Some(c) = nesting_stack.pop() {
            match c {
                '{' => processed.push('}'),
                '[' => processed.push(']'),
                _ => {}
            }
        }

        println!("complete_json_structure: {:?}", processed);
        processed
    }

    fn convert_to_message(&self, id: String, value: Value) -> Result<Option<BusterChatContainer>> {
        if let Some(files) = value.get("files").and_then(Value::as_array) {
            if let Some(last_file) = files.last().and_then(Value::as_object) {
                let name = last_file.get("name").and_then(Value::as_str).unwrap_or("");
                let file_type = last_file
                    .get("file_type")
                    .and_then(Value::as_str)
                    .unwrap_or("");
                let yml_content = last_file
                    .get("yml_content")
                    .and_then(Value::as_str)
                    .unwrap_or("");

                let mut current_lines = Vec::new();
                for (i, line) in yml_content.lines().enumerate() {
                    current_lines.push(BusterFileLine {
                        line_number: i + 1,
                        text: line.to_string(),
                        modified: Some(false),
                    });
                }

                return Ok(Some(BusterChatContainer::File(BusterFileMessage {
                    id,
                    message_type: "file".to_string(),
                    file_type: file_type.to_string(),
                    file_name: name.to_string(),
                    version_number: 1,
                    version_id: Uuid::new_v4().to_string(),
                    status: "loading".to_string(),
                    file: Some(current_lines),
                    filter_version_id: None,
                    metadata: None,
                })));
            }
        }
        Ok(None)
    }
}
