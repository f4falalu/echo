use anyhow::Result;
use async_trait::async_trait;
use serde::Serialize;
use serde_json::Value;
use litellm::ToolCall;


pub mod file_tools;

/// A trait that defines how tools should be implemented.
/// Any struct that wants to be used as a tool must implement this trait.
#[async_trait]
pub trait ToolExecutor: Send + Sync {
    /// The type of the output of the tool
    type Output: Serialize + Send;

    /// Execute the tool with given arguments and return a result
    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output>;

    /// Return the JSON schema that describes this tool's interface
    fn get_schema(&self) -> serde_json::Value;

    /// Return the name of the tool
    fn get_name(&self) -> String;
}

/// A wrapper type that converts any ToolExecutor to one that outputs Value
pub struct ValueToolExecutor<T: ToolExecutor>(T);

#[async_trait]
impl<T: ToolExecutor> ToolExecutor for ValueToolExecutor<T> {
    type Output = Value;

    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        let result = self.0.execute(tool_call).await?;
        Ok(serde_json::to_value(result)?)
    }

    fn get_schema(&self) -> Value {
        self.0.get_schema()
    }

    fn get_name(&self) -> String {
        self.0.get_name()
    }
}

/// Extension trait to add value conversion methods to ToolExecutor
pub trait IntoValueTool {
    fn into_value_tool(self) -> ValueToolExecutor<Self> where Self: ToolExecutor + Sized;
}

// Implement IntoValueTool for all types that implement ToolExecutor
impl<T: ToolExecutor> IntoValueTool for T {
    fn into_value_tool(self) -> ValueToolExecutor<Self> {
        ValueToolExecutor(self)
    }
}
