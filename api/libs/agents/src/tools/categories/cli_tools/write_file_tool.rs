use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::Path;
use crate::{
    agent::Agent,
    tools::ToolExecutor
};

#[derive(Serialize, Deserialize, Debug)]
pub struct WriteFileContentParams {
    file_path: String,
    content: String,
    overwrite: Option<bool>, // Defaults to false
}

#[derive(Serialize, Deserialize, Debug)]
pub struct WriteFileContentOutput {
    success: bool,
    message: String,
}

pub struct WriteFileContentTool {
    agent: Arc<Agent>,
}

impl WriteFileContentTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for WriteFileContentTool {
    type Output = WriteFileContentOutput;
    type Params = WriteFileContentParams;

    fn get_name(&self) -> String {
        "write_file_content".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        let file_path = Path::new(&params.file_path);
        let overwrite = params.overwrite.unwrap_or(false);

        if file_path.exists() && !overwrite {
            return Ok(WriteFileContentOutput {
                success: false,
                message: format!(
                    "File '{}' already exists. Set 'overwrite' to true to replace it.",
                    params.file_path
                ),
            });
        }

        // Ensure parent directory exists
        if let Some(parent_dir) = file_path.parent() {
            if !parent_dir.exists() {
                 fs::create_dir_all(parent_dir).map_err(|e| {
                     anyhow::anyhow!("Failed to create parent directory for '{}': {}", params.file_path, e)
                 })?;
            }
        }

        match fs::write(file_path, &params.content) {
            Ok(_) => Ok(WriteFileContentOutput {
                success: true,
                message: format!("Successfully wrote content to file: {}", params.file_path),
            }),
            Err(e) => Err(anyhow::anyhow!("Failed to write to file '{}': {}", params.file_path, e)),
        }
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Writes the given content to a specified file path. Creates the file if it doesn't exist. Use the 'overwrite' parameter to control behavior for existing files (defaults to false, preventing overwrite).",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "The path of the file to write to."
                    },
                    "content": {
                        "type": "string",
                        "description": "The text content to write into the file."
                    },
                    "overwrite": {
                        "type": "boolean",
                        "description": "Set to true to overwrite the file if it already exists. Defaults to false."
                    }
                },
                "required": ["file_path", "content"]
            }
        })
    }
} 