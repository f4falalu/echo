use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{collections::HashMap, sync::Arc};
use tokio::sync::broadcast;
use uuid::Uuid; // Add for Value

use crate::{
    agent::{Agent, AgentError, AgentExt},
    models::AgentThread,
    tools::{
        // Import necessary tools
        categories::cli_tools::{
            // Import CLI tools with updated names
            BashTool,
            GlobTool,
            GrepTool,
            LSTool,
            ViewTool,
            EditTool,
            ReplaceTool,
        },
        IntoToolCallExecutor,
        ToolExecutor,
    },
};

use litellm::AgentMessage;

// Type alias for the enablement condition closure
type EnablementCondition = Box<dyn Fn(&HashMap<String, Value>) -> bool + Send + Sync>;

#[derive(Debug, Serialize, Deserialize)]
pub struct BusterCliAgentOutput {
    pub message: String,
    pub duration: i64,
    pub thread_id: Uuid,
    pub messages: Vec<AgentMessage>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BusterCliAgentInput {
    pub prompt: String,
    pub thread_id: Option<Uuid>,
    pub message_id: Option<Uuid>,
}

#[derive(Clone)]
pub struct BusterCliAgent {
    agent: Arc<Agent>,
}

impl AgentExt for BusterCliAgent {
    fn get_agent(&self) -> &Arc<Agent> {
        &self.agent
    }
}

impl BusterCliAgent {
    async fn load_tools(&self) -> Result<()> {
        // Create tools using the shared Arc and updated names
        let bash_tool = BashTool::new(Arc::clone(&self.agent));
        let edit_tool = EditTool::new(Arc::clone(&self.agent));
        let glob_tool = GlobTool::new(Arc::clone(&self.agent));
        let grep_tool = GrepTool::new(Arc::clone(&self.agent));
        let ls_tool = LSTool::new(Arc::clone(&self.agent));
        let view_tool = ViewTool::new(Arc::clone(&self.agent));
        let replace_tool = ReplaceTool::new(Arc::clone(&self.agent));

        // Add tools - Pass None directly since these tools are always enabled
        self.agent
            .add_tool(
                bash_tool.get_name(),
                bash_tool.into_tool_call_executor(),
                None::<EnablementCondition>,
            )
            .await;
        self.agent
            .add_tool(
                edit_tool.get_name(),
                edit_tool.into_tool_call_executor(),
                None::<EnablementCondition>,
            )
            .await;
        self.agent
            .add_tool(
                glob_tool.get_name(),
                glob_tool.into_tool_call_executor(),
                None::<EnablementCondition>,
            )
            .await;
        self.agent
            .add_tool(
                grep_tool.get_name(),
                grep_tool.into_tool_call_executor(),
                None::<EnablementCondition>,
            )
            .await;
        self.agent
            .add_tool(
                ls_tool.get_name(),
                ls_tool.into_tool_call_executor(),
                None::<EnablementCondition>,
            )
            .await;
        self.agent
            .add_tool(
                view_tool.get_name(),
                view_tool.into_tool_call_executor(),
                None::<EnablementCondition>,
            )
            .await;
        self.agent
            .add_tool(
                replace_tool.get_name(),
                replace_tool.into_tool_call_executor(),
                None::<EnablementCondition>,
            )
            .await;

        Ok(())
    }

    pub async fn new(
        user_id: Uuid,
        session_id: Uuid,
        api_key: Option<String>,  // Add parameter
        base_url: Option<String>, // Add parameter
        cwd: Option<String>,      // Add parameter
    ) -> Result<Self> {
        // Create agent with o3-mini model and empty tools map initially
        let agent = Arc::new(Agent::new(
            "o3-mini".to_string(), // Use o3-mini as requested
            user_id,
            session_id,
            "buster_cli_agent".to_string(),
            api_key,  // Pass through
            base_url, // Pass through
            get_system_message(&cwd.unwrap_or_else(|| ".".to_string())),
        ));

        let cli_agent = Self { agent };
        cli_agent.load_tools().await?; // Load the tools after creating the Arc
        Ok(cli_agent)
    }

    pub async fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        let agent = Arc::new(Agent::from_existing(
            existing_agent,
            "buster_cli_agent".to_string(),
            "You are a helpful CLI assistant. Use the available tools to interact with the file system and execute commands.".to_string()
        ));
        let manager = Self { agent };
        manager.load_tools().await?; // Load tools with None condition
        Ok(manager)
    }

    pub async fn run(
        &self,
        thread: &mut AgentThread,
        initialization_prompt: Option<String>, // Allow optional prompt
    ) -> Result<broadcast::Receiver<Result<AgentMessage, AgentError>>> {
        if let Some(prompt) = initialization_prompt {
            thread.set_developer_message(prompt);
        } else {
            // Maybe set a default CLI prompt?
            thread.set_developer_message("You are a helpful CLI assistant. Use the available tools to interact with the file system and execute commands.".to_string());
        }

        let rx = self.stream_process_thread(thread).await?;
        Ok(rx)
    }

    /// Shutdown the agent
    pub async fn shutdown(&self) -> Result<()> {
        self.get_agent().shutdown().await
    }
}

// Note: System message is now a function accepting cwd
fn get_system_message(cwd: &str) -> String {
    // Simple fallback if Braintrust isn't configured
    // Consider adding Braintrust support similar to BusterSuperAgent if needed
    format!(
        r#"
### Role & Task
You are Buster CLI, a helpful AI assistant operating directly in the user's command line environment.
Your primary goal is to assist the user with file system operations, file content manipulation, and executing shell commands based on their requests.

### Current Working Directory
The user is currently operating in the following directory: `{}`

### Actions Available (Tools)
- **Bash**: Executes shell commands using 'sh -c' with optional timeout. Use this for general command execution.
- **GlobTool**: Finds files matching a glob pattern (e.g., '*.js', 'src/**/*.ts') with results sorted by modification time.
- **GrepTool**: Searches file contents using regular expressions with support for file pattern inclusion.
- **LS**: Lists files and directories in a given path with optional glob patterns to ignore.
- **View**: Reads file contents with optional line offset and limit. Can read multiple files in a single operation.
- **Edit**: Edits files by replacing specific text strings, with validation to ensure safe replacements.
- **Replace**: Writes content to a file, creating it if it doesn't exist or overwriting if it does.

### Tool Capabilities
- Many tools support batch operations by accepting arrays of inputs
- The View tool can read multiple files at once using the file_paths parameter
- The Edit tool checks for multiple occurrences to avoid accidental replacements
- The Replace tool always overwrites existing files

### Important Guidelines
1.  **Safety First:** Be extremely cautious with Edit, Replace, and Bash tools. These can modify or delete data or execute arbitrary code. 
    *   If a request seems potentially destructive or ambiguous, explain the action you intend to take and *ask for confirmation* before proceeding.
    *   For Bash commands, prefer simpler, safer commands. Avoid complex chains or commands with side effects unless explicitly requested and confirmed.
2.  **Clarity:** Clearly state the actions you are taking and the results (success or failure). If a tool fails, report the error message.
3.  **File Paths:** Assume relative paths are based on the user's *Current Working Directory* unless the user provides an absolute path.
4.  **Conciseness:** Provide responses suitable for a terminal interface. Use markdown for code blocks when showing file content or commands.
5.  **No Assumptions:** Don't assume files or directories exist unless you've verified with LS or GlobTool.
"#,
        cwd
    )
}
