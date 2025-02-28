use anyhow::Result;
use serde::{de::DeserializeOwned, Serialize};
use serde_json::Value;

/// A trait that defines how tools should be implemented.
/// Any struct that wants to be used as a tool must implement this trait.
/// 
/// // Add this near the top of the file, with other trait implementations
#[async_trait::async_trait]
impl<T: ToolExecutor<Output = Value, Params = Value> + Send + Sync> ToolExecutor for Box<T> {
    type Output = Value;
    type Params = Value;

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        (**self).execute(params).await
    }

    fn get_schema(&self) -> Value {
        (**self).get_schema()
    }

    fn get_name(&self) -> String {
        (**self).get_name()
    }

    async fn is_enabled(&self) -> bool {
        (**self).is_enabled().await
    }
}

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
struct ToolCallExecutor<T: ToolExecutor> {
    inner: Box<T>,
}

impl<T: ToolExecutor> ToolCallExecutor<T> {
    fn new(inner: T) -> Self {
        Self {
            inner: Box::new(inner),
        }
    }
}

#[async_trait::async_trait]
impl<T: ToolExecutor + Send + Sync> ToolExecutor for ToolCallExecutor<T>
where
    T::Params: serde::de::DeserializeOwned,
    T::Output: serde::Serialize,
{
    type Output = Value;
    type Params = Value;

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        let params = serde_json::from_value(params)?;
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