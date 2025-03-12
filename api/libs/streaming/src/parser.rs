use anyhow::Result;
use regex::Regex;
use serde_json::Value;

use crate::processor::ProcessorRegistry;
use crate::types::ProcessedOutput;

/// StreamingParser handles parsing of incomplete JSON streams
pub struct StreamingParser {
    /// Buffer to accumulate chunks of data
    buffer: String,
    /// Registry of processors for different types of content
    processors: ProcessorRegistry,
    /// Regex for extracting YAML content
    yml_content_regex: Regex,
}

impl StreamingParser {
    /// Creates a new StreamingParser with an empty processor registry
    pub fn new() -> Self {
        StreamingParser {
            buffer: String::new(),
            processors: ProcessorRegistry::new(),
            yml_content_regex: Regex::new(
                r#""yml_content":\s*"((?:[^"\\]|\\.|[\r\n])*?)(?:"|$)"#,
            )
            .unwrap(),
        }
    }

    /// Creates a new StreamingParser with the provided processor registry
    pub fn with_processors(processors: ProcessorRegistry) -> Self {
        StreamingParser {
            buffer: String::new(),
            processors,
            yml_content_regex: Regex::new(
                r#""yml_content":\s*"((?:[^"\\]|\\.|[\r\n])*?)(?:"|$)"#,
            )
            .unwrap(),
        }
    }

    /// Registers a processor with the parser
    pub fn register_processor(&mut self, processor: Box<dyn crate::processor::Processor>) {
        self.processors.register(processor);
    }

    /// Clear the buffer - useful when reusing the parser for different content formats
    pub fn clear_buffer(&mut self) {
        self.buffer.clear();
    }

    /// Process a chunk of data with the specified processor type
    pub fn process_chunk(
        &mut self,
        id: String,
        chunk: &str,
        processor_type: &str,
    ) -> Result<Option<ProcessedOutput>> {
        // Add new chunk to buffer
        self.buffer.push_str(chunk);

        // Complete any incomplete JSON structure
        let processed_json = self.complete_json_structure(self.buffer.clone());

        // Process with the appropriate processor
        self.processors.process(id, &processed_json, processor_type)
    }

    /// Process YAML content in JSON
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

    /// Helper method to complete JSON structure (shared functionality)
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
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::processor::Processor;
    use crate::types::{ProcessorType, ReasoningText};

    struct TestProcessor;

    impl Processor for TestProcessor {
        fn processor_type(&self) -> ProcessorType {
            ProcessorType::Custom("test".to_string())
        }

        fn can_process(&self, json: &str) -> bool {
            json.contains("test_key")
        }

        fn process(&self, id: String, json: &str) -> Result<Option<ProcessedOutput>> {
            if self.can_process(json) {
                Ok(Some(ProcessedOutput::Text(ReasoningText {
                    id,
                    reasoning_type: "text".to_string(),
                    title: "Test".to_string(),
                    secondary_title: "".to_string(),
                    message: Some("Test message".to_string()),
                    message_chunk: None,
                    status: Some("completed".to_string()),
                })))
            } else {
                Ok(None)
            }
        }
    }

    #[test]
    fn test_complete_json_structure() {
        let parser = StreamingParser::new();

        // Test basic completion
        let incomplete = r#"{"key": "value"#;
        let completed = parser.complete_json_structure(incomplete.to_string());
        
        // Parse the completed JSON to verify it's valid
        let parsed_json: serde_json::Value = serde_json::from_str(&completed).unwrap();
        assert_eq!(parsed_json["key"], "value");

        // Test escaped quotes in string
        let incomplete = r#"{"key": "value with \"quotes\""#;
        let completed = parser.complete_json_structure(incomplete.to_string());

        println!("Completed JSON: {}", completed);
        
        // Parse the completed JSON to verify it's valid
        let parsed_json: serde_json::Value = serde_json::from_str(&completed).unwrap();
        assert_eq!(parsed_json["key"].as_str().unwrap(), r#"value with "quotes""#);
    }

    #[test]
    fn test_process_chunk() {
        let mut parser = StreamingParser::new();
        parser.register_processor(Box::new(TestProcessor));

        // Test with valid data for the processor
        let result = parser.process_chunk(
            "test_id".to_string(),
            r#"{"test_key": "value"}"#,
            "test",
        );
        assert!(result.is_ok());
        assert!(result.unwrap().is_some());

        // Test with invalid data for the processor
        parser.clear_buffer();
        let result = parser.process_chunk(
            "test_id".to_string(),
            r#"{"other_key": "value"}"#,
            "test",
        );
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());

        // Test with non-existent processor
        parser.clear_buffer();
        let result = parser.process_chunk(
            "test_id".to_string(),
            r#"{"test_key": "value"}"#,
            "non_existent",
        );
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }

    #[test]
    fn test_process_yml_content() {
        let parser = StreamingParser::new();

        // Test with yml_content
        let json = r#"{"files":[{"name":"test.yml","yml_content":"key: value\nlist:\n  - item1\n  - item2"}]}"#;
        let processed = parser.process_yml_content(json.to_string());
        
        // Parse the processed JSON to verify it's valid
        let value: Value = serde_json::from_str(&processed).unwrap();
        
        // Check that the yml_content was properly processed
        let yml_content = value["files"][0]["yml_content"].as_str().unwrap();
        assert!(yml_content.contains("key: value"));
        assert!(yml_content.contains("list:"));
    }

    #[test]
    fn test_process_yml_content_with_invalid_json() {
        let parser = StreamingParser::new();

        // Test with invalid JSON
        let json = r#"{"files":[{"name":"test.yml","yml_content":"key: value\nlist:\n  - item1\n  - item2"}]"#;
        let processed = parser.process_yml_content(json.to_string());
        
        // Parse the processed JSON to verify it's valid
        let value: Value = serde_json::from_str(&processed).unwrap();
        
        // Check that the yml_content was properly processed
        let yml_content = value["files"][0]["yml_content"].as_str().unwrap();
        assert!(yml_content.contains("key: value"));
        assert!(yml_content.contains("list:"));
    }


}
