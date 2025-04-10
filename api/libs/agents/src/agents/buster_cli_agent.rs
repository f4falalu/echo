use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, env, sync::Arc};
use tokio::sync::broadcast;
use uuid::Uuid;
use serde_json::Value; // Add for Value

use crate::{
    agent::{Agent, AgentError, AgentExt},
    models::AgentThread,
    tools::{ // Import necessary tools
        categories::cli_tools::{ // Import CLI tools using correct struct names from mod.rs
            EditFileContentTool, // Use correct export
            FindFilesGlobTool,   // Use correct export
            ListDirectoryTool,   // Use correct export
            ReadFileContentTool, // Use correct export
            RunBashCommandTool,  // Use correct export
            SearchFileContentGrepTool, // Use correct export
            WriteFileContentTool, // Use correct export
        },
        IntoToolCallExecutor, ToolExecutor,
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
        // Create tools using the shared Arc and correct struct names
        let bash_tool = RunBashCommandTool::new(Arc::clone(&self.agent));
        let edit_file_tool = EditFileContentTool::new(Arc::clone(&self.agent));
        let glob_tool = FindFilesGlobTool::new(Arc::clone(&self.agent));
        let grep_tool = SearchFileContentGrepTool::new(Arc::clone(&self.agent));
        let ls_tool = ListDirectoryTool::new(Arc::clone(&self.agent));
        let read_file_tool = ReadFileContentTool::new(Arc::clone(&self.agent));
        let write_file_tool = WriteFileContentTool::new(Arc::clone(&self.agent));

        // Add tools - Pass None directly since these tools are always enabled
        self.agent.add_tool(bash_tool.get_name(), bash_tool.into_tool_call_executor(), None::<EnablementCondition>).await;
        self.agent.add_tool(edit_file_tool.get_name(), edit_file_tool.into_tool_call_executor(), None::<EnablementCondition>).await;
        self.agent.add_tool(glob_tool.get_name(), glob_tool.into_tool_call_executor(), None::<EnablementCondition>).await;
        self.agent.add_tool(grep_tool.get_name(), grep_tool.into_tool_call_executor(), None::<EnablementCondition>).await;
        self.agent.add_tool(ls_tool.get_name(), ls_tool.into_tool_call_executor(), None::<EnablementCondition>).await;
        self.agent.add_tool(read_file_tool.get_name(), read_file_tool.into_tool_call_executor(), None::<EnablementCondition>).await;
        self.agent.add_tool(write_file_tool.get_name(), write_file_tool.into_tool_call_executor(), None::<EnablementCondition>).await;

        Ok(())
    }

    pub async fn new(
        user_id: Uuid, 
        session_id: Uuid, 
        api_key: Option<String>, // Add parameter
        base_url: Option<String> // Add parameter
    ) -> Result<Self> {
        // Create agent with o3-mini model and empty tools map initially
        let agent = Arc::new(Agent::new(
            "o3-mini".to_string(), // Use o3-mini as requested
            user_id,
            session_id,
            "buster_cli_agent".to_string(),
            api_key, // Pass through
            base_url // Pass through
        ));

        let cli_agent = Self { agent };
        cli_agent.load_tools().await?; // Load the tools after creating the Arc
        Ok(cli_agent)
    }

    pub async fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        let agent = Arc::new(Agent::from_existing(
            existing_agent,
            "buster_cli_agent".to_string(),
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
    format!(r#"
### Role & Task
You are Buster CLI, a helpful AI assistant operating directly in the user's command line environment.
Your primary goal is to assist the user with file system operations, file content manipulation, and executing shell commands based on their requests.

### Current Working Directory
The user is currently operating in the following directory: `{}`

### Actions Available (Tools)
- **run_bash_command**: Executes shell commands using `sh -c`. Use this for general command execution.
- **find_files_glob**: Finds files and directories matching a glob pattern (e.g., `*.txt`, `src/**/mod.rs`).
- **search_file_content_grep**: Searches for text (or regex patterns) within the content of specified files.
- **list_directory**: Lists files and directories within a given path. Can list recursively and show hidden files.
- **read_file_content**: Reads the content of a file. Can read specific line ranges (1-based).
- **edit_file_content**: Performs specific find-and-replace operations within an existing file. This *overwrites* the original file.
- **write_file_content**: Creates a new file or completely overwrites an existing file with the provided content.

### Important Guidelines
1.  **Safety First:** Be extremely cautious with `edit_file_content`, `write_file_content`, and `run_bash_command`. These tools can modify or delete data or execute arbitrary code. 
    *   If a request seems potentially destructive or ambiguous, explain the action you intend to take and *ask for confirmation* before proceeding.
    *   For `run_bash_command`, prefer simpler, safer commands. Avoid complex chains or commands with side effects unless explicitly requested and confirmed.
2.  **Clarity:** Clearly state the actions you are taking and the results (success or failure). If a tool fails, report the error message.
3.  **File Paths:** Assume relative paths are based on the user's *Current Working Directory* unless the user provides an absolute path.
4.  **Conciseness:** Provide responses suitable for a terminal interface. Use markdown for code blocks when showing file content or commands.
5.  **No Assumptions:** Don't assume files or directories exist unless you've verified with `list_directory` or `find_files_glob`.
"#, cwd)
} 