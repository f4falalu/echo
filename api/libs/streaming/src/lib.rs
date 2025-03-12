//! Streaming Parser Library
//!
//! This library provides functionality for parsing incomplete JSON streams
//! and processing them through specialized processors.

pub mod parser;
pub mod processor;
pub mod types;
pub mod processors;

// Re-exports for convenient access
pub use parser::StreamingParser;
pub use processor::{Processor, ProcessorRegistry};
pub use types::ProcessedOutput;
