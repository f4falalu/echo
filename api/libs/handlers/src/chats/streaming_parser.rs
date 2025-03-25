use agents::tools::categories::file_tools::common::generate_deterministic_uuid;
use anyhow::Result;
use serde_json::Value;

use super::post_chat_handler::{
    BusterFile, BusterFileContent, BusterReasoningFile, BusterReasoningMessage, BusterReasoningText,
};

pub struct StreamingParser {
    buffer: String,
    yml_content_regex: regex::Regex,
}

impl Default for StreamingParser {
    fn default() -> Self {
        Self::new()
    }
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

    // Clear the buffer - useful when reusing the parser for different content formats
    pub fn clear_buffer(&mut self) {
        self.buffer.clear();
    }

    // Process chunks meant for plan creation
    pub fn process_plan_chunk(
        &mut self,
        id: String,
        chunk: &str,
    ) -> Result<Option<BusterReasoningMessage>> {
        // Clear buffer and add new chunk
        self.clear_buffer();
        self.buffer.push_str(chunk);

        // Complete any incomplete JSON structure
        let processed_json = self.complete_json_structure(self.buffer.clone());

        // Try to parse the JSON
        if let Ok(value) = serde_json::from_str::<Value>(&processed_json) {
            // Check if it's a plan structure (has plan_markdown key)
            if let Some(plan_markdown) = value.get("plan_markdown").and_then(Value::as_str) {
                // Return the plan as a BusterReasoningText
                return Ok(Some(BusterReasoningMessage::Text(BusterReasoningText {
                    id,
                    reasoning_type: "text".to_string(),
                    title: "Creating a plan...".to_string(),
                    secondary_title: String::from(""),
                    message: None,
                    message_chunk: Some(plan_markdown.to_string()),
                    status: Some("loading".to_string()),
                })));
            }
        }

        Ok(None)
    }

    // Process chunks meant for search data catalog
    pub fn process_search_data_catalog_chunk(
        &mut self,
        id: String,
        chunk: &str,
    ) -> Result<Option<BusterReasoningMessage>> {
        // Clear buffer and add new chunk
        self.clear_buffer();
        self.buffer.push_str(chunk);

        // Complete any incomplete JSON structure
        let processed_json = self.complete_json_structure(self.buffer.clone());

        // Try to parse the JSON
        if let Ok(value) = serde_json::from_str::<Value>(&processed_json) {
            // Check if it's a search requirements structure
            if let Some(search_requirements) =
                value.get("search_requirements").and_then(Value::as_str)
            {
                // Return the search requirements as a BusterReasoningText
                return Ok(Some(BusterReasoningMessage::Text(BusterReasoningText {
                    id,
                    reasoning_type: "text".to_string(),
                    title: "Searching your data catalog...".to_string(),
                    secondary_title: String::from(""),
                    message: None,
                    message_chunk: Some(search_requirements.to_string()),
                    status: Some("loading".to_string()),
                })));
            }
        }

        Ok(None)
    }

    // Process chunks meant for metric files
    pub fn process_metric_chunk(
        &mut self,
        id: String,
        chunk: &str,
    ) -> Result<Option<BusterReasoningMessage>> {
        // Clear buffer and add new chunk
        self.clear_buffer();
        self.buffer.push_str(chunk);

        // Process the buffer with metric file type
        self.process_file_data(id.clone(), "metric".to_string())
    }

    // Process chunks meant for dashboard files
    pub fn process_dashboard_chunk(
        &mut self,
        id: String,
        chunk: &str,
    ) -> Result<Option<BusterReasoningMessage>> {
        // Clear buffer and add new chunk
        self.clear_buffer();
        self.buffer.push_str(chunk);

        // Process the buffer with dashboard file type
        self.process_file_data(id.clone(), "dashboard".to_string())
    }

    // Internal function to process file data (shared by metric and dashboard processing)
    pub fn process_file_data(
        &mut self,
        id: String,
        file_type: String,
    ) -> Result<Option<BusterReasoningMessage>> {
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
            return self.convert_file_to_message(id, value, file_type);
        }

        Ok(None)
    }

    // Helper method to complete JSON structure (shared functionality)
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

        processed
    }

    // Helper method to convert file JSON to message
    fn convert_file_to_message(
        &self,
        id: String,
        value: Value,
        file_type: String,
    ) -> Result<Option<BusterReasoningMessage>> {
        if let Some(files) = value.get("files").and_then(Value::as_array) {
            let mut files_map = std::collections::HashMap::new();
            let mut file_ids = Vec::new();

            for file in files {
                if let Some(file_obj) = file.as_object() {
                    let has_name = file_obj.get("name").and_then(Value::as_str).is_some();
                    let has_yml_content = file_obj.get("yml_content").is_some();

                    if has_name && has_yml_content {
                        let name = file_obj.get("name").and_then(Value::as_str).unwrap_or("");
                        let yml_content = file_obj
                            .get("yml_content")
                            .and_then(Value::as_str)
                            .unwrap_or("");

                        // Generate deterministic UUID based on tool call ID, file name, and type
                        let file_id = generate_deterministic_uuid(&id, name, &file_type)?;

                        let buster_file = BusterFile {
                            id: file_id.to_string(),
                            file_type: file_type.clone(),
                            file_name: name.to_string(),
                            version_number: 1,
                            status: "loading".to_string(),
                            file: BusterFileContent {
                                text: None,
                                text_chunk: Some(yml_content.to_string()),
                                modifided: None,
                            },
                            metadata: None,
                        };

                        file_ids.push(file_id.to_string());
                        files_map.insert(file_id.to_string(), buster_file);
                    }
                }
            }

            if !files_map.is_empty() {
                return Ok(Some(BusterReasoningMessage::File(BusterReasoningFile {
                    id,
                    message_type: "files".to_string(),
                    title: format!("Creating {} files...", file_type),
                    secondary_title: String::new(),
                    status: "loading".to_string(),
                    file_ids,
                    files: files_map,
                })));
            }
        }
        Ok(None)
    }
}
