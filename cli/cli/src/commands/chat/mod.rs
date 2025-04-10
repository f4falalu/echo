mod args;
mod config;
mod logic;

use anyhow::Result;
pub use args::ChatArgs;

/// Public entry point for the chat command.
pub async fn chat_command(args: ChatArgs) -> Result<()> {
    logic::run_chat(args).await
}
