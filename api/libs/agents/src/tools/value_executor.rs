use anyhow::Result;
use serde_json::Value;

use crate::tools::executor::ToolExecutor;

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

    async fn handle_shutdown(&self) -> Result<()> {
        self.inner.handle_shutdown().await
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