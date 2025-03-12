use anyhow::Result;
use serde_json::Value;

use crate::processor::Processor;
use crate::types::{ProcessedOutput, ProcessorType, ReasoningText};

/// Processor for search data catalog
pub struct SearchProcessor;

impl SearchProcessor {
    /// Creates a new SearchProcessor
    pub fn new() -> Self {
        SearchProcessor
    }
}

impl Processor for SearchProcessor {
    fn processor_type(&self) -> ProcessorType {
        ProcessorType::SearchDataCatalog
    }

    fn can_process(&self, json: &str) -> bool {
        if let Ok(value) = serde_json::from_str::<Value>(json) {
            return value.get("search_requirements").is_some();
        }
        false
    }

    fn process(&self, id: String, json: &str) -> Result<Option<ProcessedOutput>> {
        // Try to parse the JSON
        if let Ok(value) = serde_json::from_str::<Value>(json) {
            // Check if it's a search requirements structure
            if let Some(search_requirements) = value.get("search_requirements").and_then(Value::as_str) {
                // Return the search requirements as a ReasoningText
                return Ok(Some(ProcessedOutput::Text(ReasoningText {
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_can_process() {
        let processor = SearchProcessor::new();

        // Test with valid search data
        let json = r#"{"search_requirements": "Find metrics related to user engagement"}"#;
        assert!(processor.can_process(json));

        // Test with invalid data
        let json = r#"{"other_key": "value"}"#;
        assert!(!processor.can_process(json));

        // Test with malformed JSON
        let json = r#"{"search_requirements": "Find metrics"#;
        assert!(!processor.can_process(json));
    }

    #[test]
    fn test_process() {
        let processor = SearchProcessor::new();
        let id = "test_id".to_string();

        // Test with valid search data
        let json = r#"{"search_requirements": "Find metrics related to user engagement"}"#;
        let result = processor.process(id.clone(), json);
        assert!(result.is_ok());
        
        let output = result.unwrap();
        assert!(output.is_some());
        
        if let Some(ProcessedOutput::Text(text)) = output {
            assert_eq!(text.id, id);
            assert_eq!(text.title, "Searching your data catalog...");
            assert_eq!(text.message_chunk, Some("Find metrics related to user engagement".to_string()));
        } else {
            panic!("Expected ProcessedOutput::Text");
        }

        // Test with invalid data
        let json = r#"{"other_key": "value"}"#;
        let result = processor.process(id.clone(), json);
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }
}
