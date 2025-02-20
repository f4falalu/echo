use anyhow::Result;
use axum::async_trait;
use litellm::{Message, ToolCall};
use serde::Serialize;
use serde_json::Value;
use uuid::Uuid;

use crate::utils::agent::Agent;

pub mod agents_as_tools;
pub mod data_tools;
pub mod file_tools;
pub mod interaction_tools;

/// A trait that defines how tools should be implemented.
/// Any struct that wants to be used as a tool must implement this trait.
/// Tools are constructed with a reference to their agent and can access its capabilities.
#[async_trait]
pub trait ToolExecutor: Send + Sync {
    /// The type of the output of the tool
    type Output: Serialize + Send;

    /// Execute the tool with the given parameters.
    /// The tool has access to its agent's capabilities through its stored agent reference.
    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output>;

    /// Get the JSON schema for this tool
    fn get_schema(&self) -> Value;

    /// Get the name of this tool
    fn get_name(&self) -> String;
}

/// A wrapper type that converts any ToolExecutor to one that outputs Value
pub struct ValueToolExecutor<T: ToolExecutor> {
    inner: T,
}

impl<T: ToolExecutor> ValueToolExecutor<T> {
    pub fn new(inner: T) -> Self {
        Self { inner }
    }
}

#[async_trait]
impl<T: ToolExecutor> ToolExecutor for ValueToolExecutor<T> {
    type Output = Value;

    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        let result = self.inner.execute(tool_call).await?;
        Ok(serde_json::to_value(result)?)
    }

    fn get_schema(&self) -> Value {
        self.inner.get_schema()
    }

    fn get_name(&self) -> String {
        self.inner.get_name()
    }
}

/// Extension trait to add value conversion methods to ToolExecutor
pub trait IntoValueTool {
    fn into_value_tool(self) -> ValueToolExecutor<Self>
    where
        Self: ToolExecutor + Sized;
}

// Implement IntoValueTool for all types that implement ToolExecutor
impl<T: ToolExecutor> IntoValueTool for T {
    fn into_value_tool(self) -> ValueToolExecutor<Self> {
        ValueToolExecutor::new(self)
    }
}
