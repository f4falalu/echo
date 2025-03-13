use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;
use uuid::Uuid;

use crate::processor::Processor;
use crate::types::{File, FileContent, ProcessedOutput, ProcessorType, ReasoningFile};

/// Processor for dashboard files
pub struct CreateDashboardsProcessor;

impl CreateDashboardsProcessor {
    /// Creates a new DashboardProcessor
    pub fn new() -> Self {
        CreateDashboardsProcessor
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

impl Processor for CreateDashboardsProcessor {
    fn processor_type(&self) -> ProcessorType {
        ProcessorType::Dashboard
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
        self.process_with_context(id, json, None)
    }

    fn process_with_context(&self, id: String, json: &str, previous_output: Option<ProcessedOutput>) -> Result<Option<ProcessedOutput>> {
        // Try to parse the JSON
        if let Ok(value) = serde_json::from_str::<Value>(json) {
            // Check if it's a dashboard file structure
            if let Some(files) = value.get("files").and_then(Value::as_array) {
                let mut files_map = HashMap::new();
                let mut file_ids = Vec::new();

                // Get previous files if they exist
                let previous_files = if let Some(ProcessedOutput::File(file_output)) = &previous_output {
                    &file_output.files
                } else {
                    &HashMap::new()
                };

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
                            let file_id = self.generate_deterministic_uuid(&id, name, "dashboard")?;
                            let file_id_str = file_id.to_string();

                            // Get the previously processed content for this file
                            let previous_content = if let Some(prev_file) = previous_files.get(&file_id_str) {
                                prev_file.file.text_chunk.clone().unwrap_or_default()
                            } else {
                                String::new()
                            };

                            // Calculate the new content (what wasn't in the previous content)
                            let new_content = if yml_content.len() > previous_content.len() {
                                yml_content[previous_content.len()..].to_string()
                            } else {
                                // If for some reason the new content is shorter, just use the whole thing
                                yml_content.to_string()
                            };

                            let file = File {
                                id: file_id_str.clone(),
                                file_type: "dashboard".to_string(),
                                file_name: name.to_string(),
                                version_number: 1,
                                version_id: String::from("0203f597-5ec5-4fd8-86e2-8587fe1c23b6"),
                                status: "loading".to_string(),
                                file: FileContent {
                                    text: None,
                                    text_chunk: if new_content.is_empty() { None } else { Some(new_content) },
                                    modified: None,
                                },
                                metadata: None,
                            };

                            file_ids.push(file_id_str.clone());
                            files_map.insert(file_id_str, file);
                        }
                    }
                }

                if !files_map.is_empty() {
                    return Ok(Some(ProcessedOutput::File(ReasoningFile {
                        id,
                        message_type: "files".to_string(),
                        title: "Creating dashboard files...".to_string(),
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

    fn clone_box(&self) -> Box<dyn Processor> {
        Box::new(CreateDashboardsProcessor::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::ProcessedOutput;

    #[test]
    fn test_can_process() {
        let processor = CreateDashboardsProcessor::new();

        // Test with valid dashboard data
        let json = r#"{"files":[{"name":"test_dashboard.yml","yml_content":"name: Test Dashboard\ndescription: A test dashboard"}]}"#;
        assert!(processor.can_process(json));

        // Test with invalid data (missing yml_content)
        let json = r#"{"files":[{"name":"test_dashboard.yml"}]}"#;
        assert!(!processor.can_process(json));

        // Test with invalid data (missing name)
        let json = r#"{"files":[{"yml_content":"name: Test Dashboard\ndescription: A test dashboard"}]}"#;
        assert!(!processor.can_process(json));

        // Test with invalid data (no files)
        let json = r#"{"other_key":"value"}"#;
        assert!(!processor.can_process(json));

        // Test with malformed JSON
        let json = r#"{"files":[{"name":"test_dashboard.yml","yml_content":"name: Test Dashboard"}"#;
        assert!(!processor.can_process(json));
    }

    #[test]
    fn test_process() {
        let processor = CreateDashboardsProcessor::new();
        let id = "test_id".to_string();

        // Test with valid dashboard data
        let json = r#"{"files":[{"name":"test_dashboard.yml","yml_content":"name: Test Dashboard\ndescription: A test dashboard"}]}"#;
        let result = processor.process(id.clone(), json);
        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.is_some());

        if let Some(ProcessedOutput::File(file_output)) = output {
            assert_eq!(file_output.id, id);
            assert_eq!(file_output.title, "Creating dashboard files...");
            assert_eq!(file_output.files.len(), 1);
            
            // Check the first file
            let file_id = &file_output.file_ids[0];
            let file = file_output.files.get(file_id).unwrap();
            assert_eq!(file.file_name, "test_dashboard.yml");
            assert_eq!(file.file.text, None);
            assert_eq!(file.file.text_chunk, Some("name: Test Dashboard\ndescription: A test dashboard".to_string()));
        } else {
            panic!("Expected ProcessedOutput::File");
        }
    }

    #[test]
    fn test_process_with_context_streaming() {
        let processor = CreateDashboardsProcessor::new();
        let id = "test_id".to_string();

        // First chunk
        let json1 = r#"{"files":[{"name":"test_dashboard.yml","yml_content":""}]}"#;
        let result1 = processor.process_with_context(id.clone(), json1, None);
        assert!(result1.is_ok());
        let output1 = result1.unwrap();
        assert!(output1.is_some());

        if let Some(ProcessedOutput::File(file_output)) = &output1 {
            let file_id = &file_output.file_ids[0];
            let file = file_output.files.get(file_id).unwrap();
            assert_eq!(file.file.text, None);
            assert_eq!(file.file.text_chunk, None); // Empty string, so no chunk
        } else {
            panic!("Expected ProcessedOutput::File");
        }

        // Second chunk
        let json2 = r#"{"files":[{"name":"test_dashboard.yml","yml_content":"name: Test Dashboard\n"}]}"#;
        let result2 = processor.process_with_context(id.clone(), json2, output1);
        assert!(result2.is_ok());
        let output2 = result2.unwrap();
        assert!(output2.is_some());

        if let Some(ProcessedOutput::File(file_output)) = &output2 {
            let file_id = &file_output.file_ids[0];
            let file = file_output.files.get(file_id).unwrap();
            assert_eq!(file.file.text, None);
            assert_eq!(file.file.text_chunk, Some("name: Test Dashboard\n".to_string()));
        } else {
            panic!("Expected ProcessedOutput::File");
        }

        // Third chunk
        let json3 = r#"{"files":[{"name":"test_dashboard.yml","yml_content":"name: Test Dashboard\ndescription: A test dashboard"}]}"#;
        let result3 = processor.process_with_context(id.clone(), json3, output2);
        assert!(result3.is_ok());
        let output3 = result3.unwrap();
        assert!(output3.is_some());

        if let Some(ProcessedOutput::File(file_output)) = &output3 {
            let file_id = &file_output.file_ids[0];
            let file = file_output.files.get(file_id).unwrap();
            assert_eq!(file.file.text, None);
            assert_eq!(file.file.text_chunk, Some("description: A test dashboard".to_string()));
        } else {
            panic!("Expected ProcessedOutput::File");
        }
    }
}
