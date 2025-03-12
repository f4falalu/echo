use anyhow::Result;
use serde_json::Value;

use crate::processor::Processor;
use crate::types::{ProcessedOutput, ProcessorType, ReasoningText};

/// Processor for plan data
pub struct PlanProcessor;

impl PlanProcessor {
    /// Creates a new PlanProcessor
    pub fn new() -> Self {
        PlanProcessor
    }
}

impl Processor for PlanProcessor {
    fn processor_type(&self) -> ProcessorType {
        ProcessorType::Plan
    }

    fn can_process(&self, json: &str) -> bool {
        if let Ok(value) = serde_json::from_str::<Value>(json) {
            return value.get("plan_markdown").is_some();
        }
        false
    }

    fn process(&self, id: String, json: &str) -> Result<Option<ProcessedOutput>> {
        // Try to parse the JSON
        if let Ok(value) = serde_json::from_str::<Value>(json) {
            // Check if it's a plan structure (has plan_markdown key)
            if let Some(plan_markdown) = value.get("plan_markdown").and_then(Value::as_str) {
                // Return the plan as a ReasoningText
                return Ok(Some(ProcessedOutput::Text(ReasoningText {
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_can_process() {
        let processor = PlanProcessor::new();

        // Test with valid plan data
        let json = r#"{"plan_markdown": "This is a plan"}"#;
        assert!(processor.can_process(json));

        // Test with invalid data
        let json = r#"{"other_key": "value"}"#;
        assert!(!processor.can_process(json));

        // Test with malformed JSON
        let json = r#"{"plan_markdown": "This is a plan"#;
        assert!(!processor.can_process(json));
    }

    #[test]
    fn test_process() {
        let processor = PlanProcessor::new();
        let id = "test_id".to_string();

        // Test with valid plan data
        let json = r#"{"plan_markdown": "This is a plan"}"#;
        let result = processor.process(id.clone(), json);
        assert!(result.is_ok());
        
        let output = result.unwrap();
        assert!(output.is_some());
        
        if let Some(ProcessedOutput::Text(text)) = output {
            assert_eq!(text.id, id);
            assert_eq!(text.title, "Creating a plan...");
            assert_eq!(text.message_chunk, Some("This is a plan".to_string()));
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
