use chrono::{DateTime, Utc};
use serde::{Serialize, Deserialize, Serializer};
use std::collections::HashMap;
use uuid::Uuid;

/// Payload structure for the Braintrust API
#[derive(Serialize, Debug)]
pub struct EventPayload {
    pub events: Vec<Span>,
}

/// Span data structure with automatic timing
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Span {
    pub id: String,
    pub span_id: String,
    pub root_span_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub span_parents: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub input: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output: Option<serde_json::Value>,
    pub metrics: Metrics,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub span_attributes: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, String>>,
}

/// Metrics for tracking span performance
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Metrics {
    #[serde(serialize_with = "serialize_datetime_as_timestamp")]
    pub start: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none", serialize_with = "serialize_option_datetime_as_timestamp")]
    pub end: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<i64>, // Duration in milliseconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completion_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_tokens: Option<u32>,
}

impl Span {
    /// Create a new span with automatic start time
    pub fn new(name: &str, span_type: &str, root_span_id: &str, parent_span_id: Option<&str>) -> Self {
        let span_id = Uuid::new_v4().to_string();
        Self {
            id: Uuid::new_v4().to_string(),
            span_id: span_id.clone(),
            root_span_id: root_span_id.to_string(),
            span_parents: parent_span_id.map(|id| vec![id.to_string()]),
            input: None,
            output: None,
            metrics: Metrics {
                start: Utc::now(),
                end: None,
                duration_ms: None,
                prompt_tokens: None,
                completion_tokens: None,
                total_tokens: None,
            },
            span_attributes: Some(HashMap::from([
                ("name".to_string(), name.to_string()),
                ("type".to_string(), span_type.to_string()),
            ])),
            metadata: None,
        }
    }

    /// Update span with input
    pub fn set_input(mut self, input: serde_json::Value) -> Self {
        self.input = Some(input);
        self
    }

    /// Alias for set_input
    pub fn with_input(self, input: serde_json::Value) -> Self {
        self.set_input(input)
    }

    /// Update span with output and calculate duration
    pub fn set_output(mut self, output: serde_json::Value) -> Self {
        let end = Utc::now();
        self.output = Some(output);
        self.metrics.end = Some(end);
        self.metrics.duration_ms = Some((end - self.metrics.start).num_milliseconds());
        self
    }

    /// Alias for set_output
    pub fn with_output(self, output: serde_json::Value) -> Self {
        self.set_output(output)
    }

    /// Add token counts (e.g., for LLM spans)
    pub fn set_tokens(mut self, prompt_tokens: u32, completion_tokens: u32) -> Self {
        self.metrics.prompt_tokens = Some(prompt_tokens);
        self.metrics.completion_tokens = Some(completion_tokens);
        self.metrics.total_tokens = Some(prompt_tokens + completion_tokens);
        self
    }

    /// Add metadata
    pub fn add_metadata(mut self, key: &str, value: &str) -> Self {
        let mut metadata = self.metadata.unwrap_or_default();
        metadata.insert(key.to_string(), value.to_string());
        self.metadata = Some(metadata);
        self
    }

    /// Alias for add_metadata
    pub fn with_metadata(self, key: &str, value: &str) -> Self {
        self.add_metadata(key, value)
    }

    /// Get the span ID
    pub fn span_id(&self) -> &str {
        &self.span_id
    }
}

// Custom serializer for DateTime<Utc> to convert to timestamp
fn serialize_datetime_as_timestamp<S>(date: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_i64(date.timestamp())
}

// Custom serializer for Option<DateTime<Utc>> to convert to timestamp
fn serialize_option_datetime_as_timestamp<S>(
    date: &Option<DateTime<Utc>>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    match date {
        Some(date) => serialize_datetime_as_timestamp(date, serializer),
        None => serializer.serialize_none(),
    }
}
