use agents::tools::categories::file_tools::common::generate_deterministic_uuid;
use anyhow::Result;
use regex::Regex;
use serde_json::Value;
use sha2::{Digest, Sha256};
use uuid::Uuid;
use streaming::processor::{Processor, ProcessorRegistry};
use streaming::types::{ProcessedOutput, ProcessorType, ReasoningText};

use super::post_chat_handler::{
    BusterFile, BusterFileContent, BusterReasoningFile, BusterReasoningMessage,
    BusterReasoningPill, BusterReasoningText, BusterThoughtPill, BusterThoughtPillContainer,
};

pub struct StreamingParser {
    buffer: String,
    yml_content_regex: Regex,
    processors: ProcessorRegistry,
}

impl StreamingParser {
    pub fn new() -> Self {
        StreamingParser {
            buffer: String::new(),
            yml_content_regex: Regex::new(
                r#""yml_content":\s*"((?:[^"\\]|\\.|[\r\n])*?)(?:"|$)"#,
            )
            .unwrap(),
            processors: ProcessorRegistry::new(),
        }
    }

    // Register a processor with the parser
    pub fn register_processor(&mut self, processor: Box<dyn Processor>) {
        self.processors.register(processor);
    }

    // Clear the buffer - useful when reusing the parser for different content formats
    pub fn clear_buffer(&mut self) {
        self.buffer.clear();
    }

    // Process a chunk with a specific processor type
    pub fn process_chunk(
        &mut self,
        id: String,
        chunk: &str,
        processor_type: &str,
    ) -> Result<Option<BusterReasoningMessage>> {
        // Add new chunk to buffer
        self.buffer.push_str(chunk);

        // Complete any incomplete JSON structure
        let processed_json = self.complete_json_structure(self.buffer.clone());

        // Process with the appropriate processor
        let processed_output = self.processors.process(id, &processed_json, processor_type)?;
        
        // Convert the output to BusterReasoningMessage if there is one
        Ok(processed_output.and_then(|output| self.convert_processed_output(output)))
    }

    // Process chunks meant for plan creation
    pub fn process_plan_chunk(
        &mut self,
        id: String,
        chunk: &str,
    ) -> Result<Option<BusterReasoningMessage>> {
        self.process_chunk(id, chunk, "plan")
    }

    // Process chunks meant for search data catalog
    pub fn process_search_data_catalog_chunk(
        &mut self,
        id: String,
        chunk: &str,
    ) -> Result<Option<BusterReasoningMessage>> {
        self.process_chunk(id, chunk, "search_data_catalog")
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

    // Process YAML content in JSON
    pub fn process_yml_content(&self, json: String) -> String {
        // Extract and replace yml_content with placeholders
        let mut yml_contents = Vec::new();
        let mut positions = Vec::new();
        let mut processed_json = json.clone();

        // Find all yml_content matches and store them with their positions
        for captures in self.yml_content_regex.captures_iter(&json) {
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
            // Put back the yml_content and process escapes
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

            // Return the JSON as a string
            if let Ok(json_str) = serde_json::to_string(&value) {
                return json_str;
            }
        }

        // If we couldn't parse the JSON, return the processed JSON as is
        processed_json
    }

    // Internal function to process file data (shared by metric and dashboard processing)
    pub fn process_file_data(
        &mut self,
        id: String,
        file_type: String,
    ) -> Result<Option<BusterReasoningMessage>> {
        // Process YAML content
        let processed_json = self.process_yml_content(self.buffer.clone());

        // Try to parse the completed JSON
        if let Ok(value) = serde_json::from_str::<Value>(&processed_json) {
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
    pub fn convert_file_to_message(
        &self,
        id: String,
        value: Value,
        file_type: String,
    ) -> Result<Option<BusterReasoningMessage>> {
        // Check if the JSON has the expected structure
        if let Some(files_array) = value.get("files").and_then(Value::as_array) {
            if !files_array.is_empty() {
                let mut file_ids = Vec::new();
                let mut files = std::collections::HashMap::new();

                // Process each file in the array
                for file_value in files_array {
                    if let Some(file_obj) = file_value.as_object() {
                        if let (Some(name), Some(yml_content)) = (
                            file_obj.get("name").and_then(Value::as_str),
                            file_obj.get("yml_content").and_then(Value::as_str),
                        ) {
                            // Generate a deterministic UUID for the file
                            if let Ok(uuid) = generate_deterministic_uuid(&id, name, &file_type) {
                                let file_id = uuid.to_string();
                                file_ids.push(file_id.clone());

                                // Create a BusterFile
                                files.insert(
                                    file_id.clone(),
                                    BusterFile {
                                        id: file_id,
                                        file_type: file_type.clone(),
                                        file_name: name.to_string(),
                                        version_number: 1,
                                        version_id: Uuid::new_v4().to_string(),
                                        status: "loading".to_string(),
                                        file: BusterFileContent {
                                            text: None,
                                            text_chunk: Some(yml_content.to_string()),
                                            modifided: None,
                                        },
                                        metadata: None,
                                    },
                                );
                            }
                        }
                    }
                }

                // If we have files, create a BusterReasoningFile message
                if !file_ids.is_empty() {
                    return Ok(Some(BusterReasoningMessage::File(BusterReasoningFile {
                        id,
                        message_type: "files".to_string(),
                        title: format!("Creating {} files...", file_type),
                        secondary_title: String::from(""),
                        status: "loading".to_string(),
                        file_ids,
                        files,
                    })));
                }
            }
        }

        Ok(None)
    }

    /// Convert ProcessedOutput to BusterReasoningMessage
    pub fn convert_processed_output(&self, output: ProcessedOutput) -> Option<BusterReasoningMessage> {
        match output {
            ProcessedOutput::Text(text) => Some(BusterReasoningMessage::Text(BusterReasoningText {
                id: text.id,
                reasoning_type: text.reasoning_type,
                title: text.title,
                secondary_title: text.secondary_title,
                message: text.message,
                message_chunk: text.message_chunk,
                status: text.status,
            })),
            // Add conversion for other types as needed
            _ => None, // For now, we're not handling other types
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_complete_json_structure() {
        let parser = StreamingParser::new();
        
        // Test with incomplete JSON
        let json = r#"{"key": "value""#;
        let completed = parser.complete_json_structure(json.to_string());
        assert_eq!(completed, r#"{"key": "value"}"#);
        
        // Test with unclosed string
        let json = r#"{"key": "value"#;
        let completed = parser.complete_json_structure(json.to_string());
        assert_eq!(completed, r#"{"key": "value"}"#);
        
        // Test with nested structures
        let json = r#"{"key": {"nested": "value""#;
        let completed = parser.complete_json_structure(json.to_string());
        assert_eq!(completed, r#"{"key": {"nested": "value"}}"#);
        
        // Test with array
        let json = r#"{"key": ["value1", "value2""#;
        let completed = parser.complete_json_structure(json.to_string());
        assert_eq!(completed, r#"{"key": ["value1", "value2"]}"#);
    }

    #[test]
    fn test_process_yml_content() {
        let parser = StreamingParser::new();
        
        // Test with valid JSON containing yml_content
        let json = r#"{"files":[{"name":"test.yml","yml_content":"key: value\nlist:\n  - item1\n  - item2"}]}"#;
        let processed = parser.process_yml_content(json.to_string());
        
        // Parse the processed JSON to verify structure
        let value: Value = serde_json::from_str(&processed).unwrap();
        let yml_content = value["files"][0]["yml_content"].as_str().unwrap();
        assert!(yml_content.contains("key: value"));
        assert!(yml_content.contains("list:"));
    }

    #[test]
    fn test_process_yml_content_with_invalid_json() {
        let parser = StreamingParser::new();
        
        // Test with invalid JSON containing yml_content
        let json = r#"{"files":[{"name":"test.yml","yml_content":"key: value\nlist:\n  - item1\n  - item2"}"#;
        let processed = parser.process_yml_content(json.to_string());
        
        // The function should complete the JSON structure
        assert!(processed.ends_with("]}"));
        
        // Parse the processed JSON to verify structure
        let value: Value = serde_json::from_str(&processed).unwrap();
        let yml_content = value["files"][0]["yml_content"].as_str().unwrap();
        assert!(yml_content.contains("key: value"));
    }
}
