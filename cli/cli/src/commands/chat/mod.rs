mod args;
mod logic;
mod config;

pub use args::ChatArgs;
use anyhow::Result;

/// Public entry point for the chat command.
pub async fn chat_command(args: ChatArgs) -> Result<()> {
    logic::run_chat(args).await
} 