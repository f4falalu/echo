use anyhow::Result;
use std::collections::HashMap;

use crate::types::{ProcessedOutput, ProcessorType};

/// Trait defining the interface for streaming processors
pub trait Processor {
    /// Returns the type of processor
    fn processor_type(&self) -> ProcessorType;
    
    /// Checks if this processor can handle the given JSON data
    fn can_process(&self, json: &str) -> bool;
    
    /// Processes the JSON data and returns a processed output
    fn process(&self, id: String, json: &str) -> Result<Option<ProcessedOutput>>;
}

/// Registry for managing processors
pub struct ProcessorRegistry {
    processors: HashMap<String, Box<dyn Processor>>,
}

impl ProcessorRegistry {
    /// Creates a new processor registry
    pub fn new() -> Self {
        ProcessorRegistry {
            processors: HashMap::new(),
        }
    }
    
    /// Registers a processor with the registry
    pub fn register(&mut self, processor: Box<dyn Processor>) {
        let processor_type = processor.processor_type().as_str().to_string();
        self.processors.insert(processor_type, processor);
    }
    
    /// Processes data using the appropriate processor
    pub fn process(&self, id: String, json: &str, processor_type: &str) -> Result<Option<ProcessedOutput>> {
        if let Some(processor) = self.processors.get(processor_type) {
            if processor.can_process(json) {
                return processor.process(id, json);
            }
        }
        
        Ok(None)
    }
    
    /// Checks if a processor of the given type is registered
    pub fn has_processor(&self, processor_type: &str) -> bool {
        self.processors.contains_key(processor_type)
    }
    
    /// Returns a list of registered processor types
    pub fn processor_types(&self) -> Vec<String> {
        self.processors.keys().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
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
                Ok(Some(ProcessedOutput::Text(crate::types::ReasoningText {
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
    fn test_processor_registry() {
        let mut registry = ProcessorRegistry::new();
        
        // Test empty registry
        assert!(!registry.has_processor("test"));
        assert_eq!(registry.processor_types().len(), 0);
        
        // Register a processor
        registry.register(Box::new(TestProcessor));
        
        // Test registry with processor
        assert!(registry.has_processor("test"));
        assert_eq!(registry.processor_types().len(), 1);
        assert_eq!(registry.processor_types()[0], "test");
        
        // Test processing with valid data
        let result = registry.process(
            "test_id".to_string(),
            r#"{"test_key": "value"}"#,
            "test",
        );
        assert!(result.is_ok());
        assert!(result.unwrap().is_some());
        
        // Test processing with invalid data
        let result = registry.process(
            "test_id".to_string(),
            r#"{"other_key": "value"}"#,
            "test",
        );
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
        
        // Test processing with non-existent processor
        let result = registry.process(
            "test_id".to_string(),
            r#"{"test_key": "value"}"#,
            "non_existent",
        );
        assert!(result.is_ok());
        assert!(result.unwrap().is_none());
    }
}
