use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;

use crate::utils::clients::ai::litellm::ToolCall;

pub mod file_tools;

/// A trait that defines how tools should be implemented.
/// Any struct that wants to be used as a tool must implement this trait.
#[async_trait]
pub trait ToolExecutor: Send + Sync {
    /// Execute the tool with given arguments and return a result
    async fn execute(&self, tool_call: &ToolCall) -> Result<Value>;

    /// Return the JSON schema that describes this tool's interface
    fn get_schema(&self) -> serde_json::Value;

    /// Return the name of the tool
    fn get_name(&self) -> String;
}

trait IntoBoxedTool {
    fn boxed(self) -> Box<dyn ToolExecutor>;
}

impl<T: ToolExecutor + 'static> IntoBoxedTool for T {
    fn boxed(self) -> Box<dyn ToolExecutor> {
        Box::new(self)
    }
}
