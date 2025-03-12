use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// The main output type for processors
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ProcessedOutput {
    /// A text-based reasoning message
    Text(ReasoningText),
    /// A file-based reasoning message
    File(ReasoningFile),
    /// A pill-based reasoning message
    Pill(ReasoningPill),
}

/// Represents a text-based reasoning message
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReasoningText {
    pub id: String,
    #[serde(rename = "type")]
    pub reasoning_type: String,
    pub title: String,
    pub secondary_title: String,
    pub message: Option<String>,
    pub message_chunk: Option<String>,
    pub status: Option<String>,
}

/// Represents a file-based reasoning message
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReasoningFile {
    pub id: String,
    #[serde(rename = "type")]
    pub message_type: String,
    pub title: String,
    pub secondary_title: String,
    pub status: String,
    pub file_ids: Vec<String>,
    pub files: HashMap<String, File>,
}

/// Represents a reasoning pill message
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReasoningPill {
    pub id: String,
    #[serde(rename = "type")]
    pub thought_type: String,
    pub title: String,
    pub secondary_title: String,
    pub pill_containers: Option<Vec<ThoughtPillContainer>>,
    pub status: String,
}

/// Represents a container for thought pills
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ThoughtPillContainer {
    pub title: String,
    pub pills: Vec<ThoughtPill>,
}

/// Represents an individual thought pill
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ThoughtPill {
    pub id: String,
    pub text: String,
    #[serde(rename = "type")]
    pub thought_file_type: String,
}

/// Represents a file in the system
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct File {
    pub id: String,
    pub file_type: String,
    pub file_name: String,
    pub version_number: i32,
    pub version_id: String,
    pub status: String,
    pub file: FileContent,
    pub metadata: Option<Vec<FileMetadata>>,
}

/// Represents the content of a file
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileContent {
    pub text: Option<String>,
    pub text_chunk: Option<String>,
    pub modifided: Option<Vec<(i32, i32)>>,
}

/// Represents metadata for a file
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileMetadata {
    pub key: String,
    pub value: String,
}

/// Represents the type of processor
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq, Hash)]
pub enum ProcessorType {
    Plan,
    SearchDataCatalog,
    Metric,
    Dashboard,
    Custom(String),
}

impl ProcessorType {
    pub fn as_str(&self) -> &str {
        match self {
            ProcessorType::Plan => "plan",
            ProcessorType::SearchDataCatalog => "search_data_catalog",
            ProcessorType::Metric => "metric",
            ProcessorType::Dashboard => "dashboard",
            ProcessorType::Custom(s) => s,
        }
    }
}

impl From<&str> for ProcessorType {
    fn from(s: &str) -> Self {
        match s {
            "plan" => ProcessorType::Plan,
            "search_data_catalog" => ProcessorType::SearchDataCatalog,
            "metric" => ProcessorType::Metric,
            "dashboard" => ProcessorType::Dashboard,
            custom => ProcessorType::Custom(custom.to_string()),
        }
    }
}
