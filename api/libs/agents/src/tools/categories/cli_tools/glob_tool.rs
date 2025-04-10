use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use glob::glob;
use std::path::PathBuf;
use crate::{
    agent::Agent,
    tools::ToolExecutor
};

#[derive(Serialize, Deserialize, Debug)]
pub struct FindFilesGlobParams {
    pattern: String,
    base_directory: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FindFilesGlobOutput {
    matched_files: Vec<String>,
}

pub struct FindFilesGlobTool {
    agent: Arc<Agent>,
}

impl FindFilesGlobTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for FindFilesGlobTool {
    type Output = FindFilesGlobOutput;
    type Params = FindFilesGlobParams;

    fn get_name(&self) -> String {
        "find_files_glob".to_string()
    }

    async fn is_enabled(&self) -> bool {
        true
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        let base_path = match params.base_directory {
            Some(dir) => PathBuf::from(dir),
            None => std::env::current_dir().map_err(|e| anyhow::anyhow!("Failed to get current directory: {}", e))?,
        };

        let full_pattern = base_path.join(&params.pattern);
        let pattern_str = full_pattern.to_str().ok_or_else(|| anyhow::anyhow!("Invalid pattern path"))?;

        let mut matched_files = Vec::new();
        match glob(pattern_str) {
            Ok(paths) => {
                for entry in paths {
                    match entry {
                        Ok(path) => {
                            if let Some(s) = path.to_str() {
                                matched_files.push(s.to_string());
                            }
                        }
                        Err(e) => eprintln!("Error processing glob entry: {}", e), // Log error but continue
                    }
                }
                Ok(FindFilesGlobOutput { matched_files })
            }
            Err(e) => Err(anyhow::anyhow!("Glob pattern error: {}", e)),
        }
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Finds files matching a glob pattern (e.g., '*.rs', 'src/**/*.toml'). Optionally specify a base directory to search from (defaults to current directory).",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {
                        "type": "string",
                        "description": "The glob pattern to search for."
                    },
                    "base_directory": {
                        "type": "string",
                        "description": "Optional path to the directory to start the search from."
                    }
                },
                "required": ["pattern"]
            }
        })
    }
} 