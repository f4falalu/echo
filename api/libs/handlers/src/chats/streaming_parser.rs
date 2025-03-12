use agents::tools::categories::file_tools::common::generate_deterministic_uuid;
use anyhow::Result;
use serde_json::Value;
use sha2::{Digest, Sha256};
use streaming::types::{
    File, FileContent, FileMetadata, ProcessedOutput, ProcessorType, ReasoningFile, ReasoningPill,
    ReasoningText, ThoughtPill, ThoughtPillContainer,
};
use streaming::StreamingParser as LibStreamingParser;
use uuid::Uuid;

pub struct StreamingParser {
    // Use the library's StreamingParser internally
    inner_parser: LibStreamingParser,
}

impl StreamingParser {
    pub fn new() -> Self {
        StreamingParser {
            inner_parser: LibStreamingParser::new(),
        }
    }

    // Register a processor with the parser
    pub fn register_processor(&mut self, processor: Box<dyn streaming::Processor>) {
        self.inner_parser.register_processor(processor);
    }

    // Clear the buffer - useful when reusing the parser for different content formats
    pub fn clear_buffer(&mut self) {
        self.inner_parser.clear_buffer();
    }

    // Process a chunk with a specific processor type
    pub fn process_chunk(
        &mut self,
        id: String,
        chunk: &str,
        processor_type: &str,
    ) -> Result<Option<ProcessedOutput>> {
        // Delegate to the library's process_chunk method
        self.inner_parser.process_chunk(id, chunk, processor_type)
    }

    // Process chunks meant for plan creation
    pub fn process_plan_chunk(
        &mut self,
        id: String,
        chunk: &str,
    ) -> Result<Option<ProcessedOutput>> {
        self.process_chunk(id, chunk, "plan")
    }

    // Process chunks meant for search data catalog
    pub fn process_search_data_catalog_chunk(
        &mut self,
        id: String,
        chunk: &str,
    ) -> Result<Option<ProcessedOutput>> {
        self.process_chunk(id, chunk, "search_data_catalog")
    }

    // Process chunks meant for metric files
    pub fn process_metric_chunk(
        &mut self,
        id: String,
        chunk: &str,
    ) -> Result<Option<ProcessedOutput>> {
        // Clear buffer and add new chunk
        self.clear_buffer();

        // Process the buffer with metric file type
        self.process_file_data(id.clone(), "metric".to_string())
    }

    // Process chunks meant for dashboard files
    pub fn process_dashboard_chunk(
        &mut self,
        id: String,
        chunk: &str,
    ) -> Result<Option<ProcessedOutput>> {
        // Clear buffer and add new chunk
        self.clear_buffer();
        self.inner_parser
            .process_chunk(id.clone(), chunk, "dashboard")?;

        // Process the buffer with dashboard file type
        self.process_file_data(id.clone(), "dashboard".to_string())
    }

    // Internal function to process file data (shared by metric and dashboard processing)
    pub fn process_file_data(
        &mut self,
        id: String,
        file_type: String,
    ) -> Result<Option<ProcessedOutput>> {
        // Process the chunk directly since we can't access the buffer from the library
        let chunk = match self.inner_parser.process_chunk(id.clone(), "", &file_type) {
            Ok(Some(_)) => "", // Just to trigger processing
            _ => "",
        };

        // Since we can't access the buffer directly, we'll pass the chunk to the process_chunk method
        // and then use our convert_file_to_message method to create the ProcessedOutput
        if let Ok(value) = serde_json::from_str::<Value>(chunk) {
            return self.convert_file_to_message(id, value, file_type);
        }

        // If we can't parse the chunk, try to process it with the appropriate processor type
        self.inner_parser.process_chunk(id, chunk, &file_type)
    }

    // Helper method to convert file JSON to message
    pub fn convert_file_to_message(
        &self,
        id: String,
        value: Value,
        file_type: String,
    ) -> Result<Option<ProcessedOutput>> {
        // Check if we have a files array
        if let Some(obj) = value.as_object() {
            if let Some(files) = obj.get("files").and_then(|v| v.as_array()) {
                let mut file_ids = Vec::new();
                let mut file_map = std::collections::HashMap::new();

                // Process each file in the array
                for file_value in files {
                    if let Some(file_obj) = file_value.as_object() {
                        // Extract file properties
                        let file_id = file_obj
                            .get("id")
                            .and_then(|v| v.as_str())
                            .unwrap_or_default()
                            .to_string();
                        let file_name = file_obj
                            .get("name")
                            .and_then(|v| v.as_str())
                            .unwrap_or_default()
                            .to_string();
                        let yml_content = file_obj
                            .get("yml_content")
                            .and_then(|v| v.as_str())
                            .unwrap_or_default()
                            .to_string();

                        // Generate deterministic version ID
                        let version_id =
                            match generate_deterministic_uuid(&id, &file_name, &file_type) {
                                Ok(id) => id,
                                Err(e) => {
                                    eprintln!("Failed to generate version ID: {}", e);
                                    continue;
                                }
                            };

                        // Create file content
                        let file_content = FileContent {
                            text: Some(yml_content),
                            text_chunk: None,
                            modifided: None,
                        };

                        // Create file
                        let file = File {
                            id: file_id.clone(),
                            file_type: file_type.clone(),
                            file_name: file_name.clone(),
                            version_number: 1,
                            version_id: version_id.to_string(),
                            status: "completed".to_string(),
                            file: file_content,
                            metadata: Some(vec![]),
                        };

                        // Add to file map and IDs
                        file_ids.push(file_id.clone());
                        file_map.insert(file_id, file);
                    }
                }

                // If we have files, create a ReasoningFile
                if !file_map.is_empty() {
                    let title = format!("Created {} {} files", file_map.len(), file_type);
                    let reasoning_file = ReasoningFile {
                        id,
                        message_type: "files".to_string(),
                        title,
                        secondary_title: "".to_string(),
                        status: "completed".to_string(),
                        file_ids,
                        files: file_map,
                    };

                    return Ok(Some(ProcessedOutput::File(reasoning_file)));
                }
            }
        }

        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_convert_file_to_message() {
        let parser = StreamingParser::new();

        // Create a test JSON value
        let json = r#"{
            "files": [
                {
                    "id": "test-id-1",
                    "name": "test-file-1.yml",
                    "yml_content": "name: Test Metric\ntype: metric"
                }
            ]
        }"#;

        let value: Value = serde_json::from_str(json).unwrap();
        let result = parser
            .convert_file_to_message("test-id".to_string(), value, "metric".to_string())
            .unwrap();

        assert!(result.is_some());
        if let Some(ProcessedOutput::File(file)) = result {
            assert_eq!(file.id, "test-id");
            assert_eq!(file.file_ids.len(), 1);
            assert_eq!(file.files.len(), 1);
            assert!(file.files.contains_key("test-id-1"));
        } else {
            panic!("Expected ProcessedOutput::File");
        }
    }
}
