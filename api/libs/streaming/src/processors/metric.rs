use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;
use uuid::Uuid;

use crate::processor::Processor;
use crate::types::{File, FileContent, ProcessedOutput, ProcessorType, ReasoningFile};

/// Processor for metric files
pub struct MetricProcessor;

impl MetricProcessor {
    /// Creates a new MetricProcessor
    pub fn new() -> Self {
        MetricProcessor
    }

    /// Generate a deterministic UUID based on input parameters
    fn generate_deterministic_uuid(&self, base_id: &str, name: &str, file_type: &str) -> Result<Uuid> {
        use sha2::{Digest, Sha256};
        
        // Create a deterministic string by combining the inputs
        let combined = format!("{}:{}:{}", base_id, name, file_type);
        
        // Hash the combined string
        let mut hasher = Sha256::new();
        hasher.update(combined.as_bytes());
        let result = hasher.finalize();
        
        // Use the first 16 bytes of the hash as the UUID
        let mut bytes = [0u8; 16];
        bytes.copy_from_slice(&result[0..16]);
        
        Ok(Uuid::from_bytes(bytes))
    }
}

impl Processor for MetricProcessor {
    fn processor_type(&self) -> ProcessorType {
        ProcessorType::Metric
    }

    fn can_process(&self, json: &str) -> bool {
        // Check if the JSON contains files array
        if let Ok(value) = serde_json::from_str::<Value>(json) {
            if let Some(files) = value.get("files").and_then(Value::as_array) {
                // Check if at least one file has name and yml_content
                return files.iter().any(|file| {
                    if let Some(file_obj) = file.as_object() {
                        file_obj.get("name").is_some() && file_obj.get("yml_content").is_some()
                    } else {
                        false
                    }
                });
            }
        }
        false
    }

    fn process(&self, id: String, json: &str) -> Result<Option<ProcessedOutput>> {
        // Try to parse the JSON
        if let Ok(value) = serde_json::from_str::<Value>(json) {
            if let Some(files) = value.get("files").and_then(Value::as_array) {
                let mut files_map = HashMap::new();
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
                            let file_id = self.generate_deterministic_uuid(&id, name, "metric")?;

                            let file = File {
                                id: file_id.to_string(),
                                file_type: "metric".to_string(),
                                file_name: name.to_string(),
                                version_number: 1,
                                version_id: String::from("0203f597-5ec5-4fd8-86e2-8587fe1c23b6"),
                                status: "loading".to_string(),
                                file: FileContent {
                                    text: None,
                                    text_chunk: Some(yml_content.to_string()),
                                    modifided: None,
                                },
                                metadata: None,
                            };

                            file_ids.push(file_id.to_string());
                            files_map.insert(file_id.to_string(), file);
                        }
                    }
                }

                if !files_map.is_empty() {
                    return Ok(Some(ProcessedOutput::File(ReasoningFile {
                        id,
                        message_type: "files".to_string(),
                        title: "Creating metric files...".to_string(),
                        secondary_title: String::new(),
                        status: "loading".to_string(),
                        file_ids,
                        files: files_map,
                    })));
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
    fn test_can_process() {
        let processor = MetricProcessor::new();

        // Test with valid metric data
        let json = r#"{"files":[{"name":"test_metric.yml","yml_content":"name: Test Metric\ndescription: A test metric"}]}"#;
        assert!(processor.can_process(json));

        // Test with invalid data (missing yml_content)
        let json = r#"{"files":[{"name":"test_metric.yml"}]}"#;
        assert!(!processor.can_process(json));

        // Test with invalid data (missing name)
        let json = r#"{"files":[{"yml_content":"name: Test Metric\ndescription: A test metric"}]}"#;
        assert!(!processor.can_process(json));

        // Test with invalid data (no files)
        let json = r#"{"other_key":"value"}"#;
        assert!(!processor.can_process(json));

        // Test with malformed JSON
        let json = r#"{"files":[{"name":"test_metric.yml","yml_content":"name: Test Metric"}"#;
        assert!(!processor.can_process(json));
    }

    #[test]
    fn test_process() {
        let processor = MetricProcessor::new();
        let id = "test_id".to_string();

        // Test with valid metric data
        let json = r#"{"files":[{"name":"test_metric.yml","yml_content":"name: Test Metric\ndescription: A test metric"}]}"#;
        let result = processor.process(id.clone(), json);
        assert!(result.is_ok());
        
        let output = result.unwrap();
        assert!(output.is_some());
        
        if let Some(ProcessedOutput::File(file)) = output {
            assert_eq!(file.id, id);
            assert_eq!(file.title, "Creating metric files...");
            assert_eq!(file.file_ids.len(), 1);
            
            // Check that the file was created with the correct properties
            let file_id = &file.file_ids[0];
            let metric_file = file.files.get(file_id).unwrap();
            assert_eq!(metric_file.file_type, "metric");
            assert_eq!(metric_file.file_name, "test_metric.yml");
            assert_eq!(metric_file.status, "loading");
            
            // Check the file content
            assert!(metric_file.file.text_chunk.as_ref().unwrap().contains("name: Test Metric"));
        } else {
            panic!("Expected ProcessedOutput::File");
        }

        // Test with invalid data
        let json = r#"{"other_key":"value"}"#;
        let result = processor.process(id.clone(), json);
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }
}
