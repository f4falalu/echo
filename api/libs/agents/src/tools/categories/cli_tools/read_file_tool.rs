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
pub struct ReadFileContentParams {
    file_path: String,
    start_line: Option<usize>, // 1-based for user input, convert to 0-based internally
    end_line: Option<usize>,   // 1-based for user input, convert to 0-based internally
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ReadFileContentOutput {
    content: String,
    lines_read: usize,
    total_lines: usize,
}

pub struct ReadFileContentTool {
    agent: Arc<Agent>,
}

impl ReadFileContentTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for ReadFileContentTool {
    type Output = ReadFileContentOutput;
    type Params = ReadFileContentParams;

    fn get_name(&self) -> String {
        "read_file_content".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        let file_path = Path::new(&params.file_path);
        if !file_path.exists() {
            return Err(anyhow::anyhow!("File does not exist: {}", params.file_path));
        }
        if !file_path.is_file() {
            return Err(anyhow::anyhow!("Path is not a file: {}", params.file_path));
        }

        let full_content = fs::read_to_string(file_path)
            .map_err(|e| anyhow::anyhow!("Failed to read file '{}': {}", params.file_path, e))?;

        let lines: Vec<&str> = full_content.lines().collect();
        let total_lines = lines.len();

        let start_idx = params.start_line.map(|l| l.saturating_sub(1)).unwrap_or(0);
        let end_idx = params.end_line.map(|l| l.saturating_sub(1)).unwrap_or(total_lines.saturating_sub(1));

        // Basic validation for line numbers
        if start_idx >= total_lines || end_idx >= total_lines || start_idx > end_idx {
             return Err(anyhow::anyhow!(
                "Invalid line range [{}, {}] for file with {} lines.",
                params.start_line.unwrap_or(1),
                params.end_line.unwrap_or(total_lines),
                total_lines
            ));
        }

        let selected_lines = &lines[start_idx..=end_idx];
        let content = selected_lines.join("\n");
        let lines_read = selected_lines.len();

        Ok(ReadFileContentOutput {
            content,
            lines_read,
            total_lines,
        })
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Reads the content of a specified file. Can optionally read only a specific range of lines (1-based index).",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "The path to the file to read."
                    },
                    "start_line": {
                        "type": "integer",
                        "description": "Optional 1-based starting line number (inclusive)."
                    },
                    "end_line": {
                        "type": "integer",
                        "description": "Optional 1-based ending line number (inclusive)."
                    }
                },
                "required": ["file_path"]
            }
        })
    }
} 