use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::process::Command;
use crate::{
    agent::Agent,
    tools::ToolExecutor
};

#[derive(Serialize, Deserialize, Debug)]
pub struct RunBashParams {
    command: String,
    working_directory: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RunBashOutput {
    stdout: String,
    stderr: String,
    exit_code: Option<i32>,
}

pub struct RunBashCommandTool {
    agent: Arc<Agent>,
}

impl RunBashCommandTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for RunBashCommandTool {
    type Output = RunBashOutput;
    type Params = RunBashParams;

    fn get_name(&self) -> String {
        "run_bash_command".to_string()
    }

    async fn is_enabled(&self) -> bool {
        true
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        let mut command = Command::new("sh");
        command.arg("-c").arg(&params.command);

        if let Some(dir) = &params.working_directory {
            command.current_dir(dir);
        }

        match command.output() {
            Ok(output) => {
                Ok(RunBashOutput {
                    stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                    stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                    exit_code: output.status.code(),
                })
            }
            Err(e) => {
                Err(anyhow::anyhow!("Failed to execute command '{}': {}", params.command, e))
            }
        }
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Executes a shell command using 'sh -c'. Specify an optional working directory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The shell command to execute."
                    },
                    "working_directory": {
                        "type": "string",
                        "description": "Optional path to the directory where the command should be run."
                    }
                },
                "required": ["command"]
            }
        })
    }
} 