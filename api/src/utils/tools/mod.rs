use anyhow::{anyhow, Result};
use litellm::ToolCall;
use serde::{de::DeserializeOwned, Serialize};
use serde_json::Value;

pub mod agents_as_tools;
pub mod data_tools;
pub mod file_tools;
pub mod interaction_tools;
pub mod planning_tools;

/// A trait that defines how tools should be implemented.
/// Any struct that wants to be used as a tool must implement this trait.
/// Tools are constructed with a reference to their agent and can access its capabilities.
#[async_trait::async_trait]
pub trait ToolExecutor: Send + Sync {
    /// The type of the output of the tool
    type Output: Serialize + Send;

    /// The type of the parameters for this tool
    type Params: DeserializeOwned + Send;

    /// Execute the tool with the given parameters.
    async fn execute(&self, params: Self::Params) -> Result<Self::Output>;

    /// Get the JSON schema for this tool
    fn get_schema(&self) -> Value;

    /// Get the name of this tool
    fn get_name(&self) -> String;

    /// Check if this tool is currently enabled
    async fn is_enabled(&self) -> bool;

    /// Handle shutdown signal. Default implementation does nothing.
    /// Tools should override this if they need to perform cleanup on shutdown.
    async fn handle_shutdown(&self) -> Result<()> {
        Ok(())
    }
}

/// A wrapper type that converts any ToolExecutor to one that outputs Value
pub struct ValueToolExecutor<T: ToolExecutor + Send + Sync> {
    inner: T,
}

impl<T: ToolExecutor + Send + Sync> ValueToolExecutor<T> {
    pub fn new(inner: T) -> Self {
        Self { inner }
    }
}

#[async_trait::async_trait]
impl<T: ToolExecutor + Send + Sync> ToolExecutor for ValueToolExecutor<T> {
    type Output = Value;
    type Params = T::Params;

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        let result = self.inner.execute(params).await?;
        Ok(serde_json::to_value(result)?)
    }

    fn get_schema(&self) -> Value {
        self.inner.get_schema()
    }

    fn get_name(&self) -> String {
        self.inner.get_name()
    }

    async fn is_enabled(&self) -> bool {
        self.inner.is_enabled().await
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
