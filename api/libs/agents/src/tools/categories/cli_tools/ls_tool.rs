use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use chrono::{DateTime, Utc};
use crate::{
    agent::Agent,
    tools::ToolExecutor
};

#[derive(Serialize, Deserialize, Debug)]
pub struct ListDirectoryParams {
    path: String,
    recursive: Option<bool>,
    show_hidden: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DirectoryEntry {
    name: String,
    path: String,
    is_dir: bool,
    size: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    modified_at: Option<String>, // ISO 8601 format
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ListDirectoryOutput {
    entries: Vec<DirectoryEntry>,
}

pub struct ListDirectoryTool {
    agent: Arc<Agent>,
}

impl ListDirectoryTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }

    // Helper function to walk directory
    fn walk_dir(&self, dir: &Path, recursive: bool, show_hidden: bool, entries: &mut Vec<DirectoryEntry>) -> Result<(), anyhow::Error> {
        for entry_result in fs::read_dir(dir)? {
            let entry = entry_result?;
            let path = entry.path();
            let file_name = entry.file_name().to_string_lossy().to_string();

            if !show_hidden && file_name.starts_with('.') {
                continue;
            }

            let metadata = entry.metadata()?;
            let is_dir = metadata.is_dir();
            let size = if is_dir { None } else { Some(metadata.len()) };
            let modified_at: Option<DateTime<Utc>> = metadata.modified().ok().map(DateTime::from);

            entries.push(DirectoryEntry {
                name: file_name,
                path: path.to_string_lossy().to_string(),
                is_dir,
                size,
                modified_at: modified_at.map(|dt| dt.to_rfc3339()),
            });

            if recursive && is_dir {
                self.walk_dir(&path, recursive, show_hidden, entries)?;
            }
        }
        Ok(())
    }
}

#[async_trait]
impl ToolExecutor for ListDirectoryTool {
    type Output = ListDirectoryOutput;
    type Params = ListDirectoryParams;

    fn get_name(&self) -> String {
        "list_directory".to_string()
    }

    async fn is_enabled(&self) -> bool {
        true
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        let path = PathBuf::from(&params.path);
        if !path.exists() {
            return Err(anyhow::anyhow!("Path does not exist: {}", params.path));
        }
        if !path.is_dir() {
             return Err(anyhow::anyhow!("Path is not a directory: {}", params.path));
        }

        let recursive = params.recursive.unwrap_or(false);
        let show_hidden = params.show_hidden.unwrap_or(false);
        let mut entries = Vec::new();

        match self.walk_dir(&path, recursive, show_hidden, &mut entries) {
             Ok(_) => Ok(ListDirectoryOutput { entries }),
             Err(e) => Err(anyhow::anyhow!("Failed to list directory '{}': {}", params.path, e))
        }
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Lists the contents of a specified directory. Can optionally list recursively and show hidden files (starting with '.').",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "The path to the directory to list."
                    },
                    "recursive": {
                        "type": "boolean",
                        "description": "Set to true to list contents recursively. Defaults to false."
                    },
                    "show_hidden": {
                        "type": "boolean",
                        "description": "Set to true to include hidden files/directories. Defaults to false."
                    }
                },
                "required": ["path"]
            }
        })
    }
} 