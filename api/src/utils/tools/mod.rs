use anyhow::Result;
use axum::async_trait;
use litellm::{Message, ToolCall};
use serde::Serialize;
use serde_json::Value;
use tokio::sync::mpsc;
use uuid::Uuid;


pub mod agents_as_tools;
pub mod data_tools;
pub mod file_tools;
pub mod interaction_tools;

/// A trait that defines how tools should be implemented.
/// Any struct that wants to be used as a tool must implement this trait.
#[async_trait]
pub trait ToolExecutor: Send + Sync {
    /// The type of the output of the tool
    type Output: Serialize + Send;

    /// Execute the tool with the given parameters and optionally stream progress
    async fn execute(
        &self,
        tool_call: &ToolCall,
        user_id: &Uuid,
        session_id: &Uuid,
        stream_tx: Option<mpsc::Sender<Result<Message>>>,
    ) -> Result<Self::Output>;

    /// Get the JSON schema for this tool
    fn get_schema(&self) -> Value;

    /// Get the name of this tool
    fn get_name(&self) -> String;

    /// Helper method to send a progress message if streaming is enabled
    async fn send_progress(
        &self,
        stream_tx: &Option<mpsc::Sender<Result<Message>>>,
        message: Message,
    ) -> Result<()> {
        if let Some(tx) = stream_tx {
            tx.send(Ok(message)).await?;
        }
        Ok(())
    }
}

/// A wrapper type that converts any ToolExecutor to one that outputs Value
pub struct ValueToolExecutor<T: ToolExecutor>(T);

#[async_trait]
impl<T: ToolExecutor> ToolExecutor for ValueToolExecutor<T> {
    type Output = Value;

    async fn execute(
        &self,
        tool_call: &ToolCall,
        user_id: &Uuid,
        session_id: &Uuid,
        stream_tx: Option<mpsc::Sender<Result<Message>>>,
    ) -> Result<Self::Output> {
        let result = self
            .0
            .execute(tool_call, user_id, session_id, stream_tx)
            .await?;
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
    fn into_value_tool(self) -> ValueToolExecutor<Self>
    where
        Self: ToolExecutor + Sized;
}

// Implement IntoValueTool for all types that implement ToolExecutor
impl<T: ToolExecutor> IntoValueTool for T {
    fn into_value_tool(self) -> ValueToolExecutor<Self> {
        ValueToolExecutor(self)
    }
}
