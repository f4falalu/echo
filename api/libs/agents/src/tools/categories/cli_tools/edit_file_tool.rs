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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileModification {
    content_to_replace: String,
    new_content: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EditFileContentParams {
    file_path: String,
    modifications: Vec<FileModification>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EditFileContentOutput {
    success: bool,
    message: String,
}

pub struct EditFileContentTool {
    agent: Arc<Agent>,
}

impl EditFileContentTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }

    // Helper function similar to the one in modify_metrics
    fn apply_modifications(
        &self,
        initial_content: &str,
        modifications: &[FileModification],
        file_path: &str
    ) -> Result<String, anyhow::Error> {
        let mut current_content = initial_content.to_string();
        for (i, modification) in modifications.iter().enumerate() {
            let count = current_content.matches(&modification.content_to_replace).count();

            if count == 0 {
                return Err(anyhow::anyhow!(
                    "Modification {} for file '{}' failed: Content to replace not found: \"{}\"",
                    i + 1, file_path, modification.content_to_replace
                ));
            } else if count > 1 {
                 return Err(anyhow::anyhow!(
                    "Modification {} for file '{}' failed: Content to replace found multiple times ({}). Be more specific: \"{}\"",
                    i + 1, file_path, count, modification.content_to_replace
                ));
            }

            current_content = current_content.replace(&modification.content_to_replace, &modification.new_content);
        }
        Ok(current_content)
    }
}

#[async_trait]
impl ToolExecutor for EditFileContentTool {
    type Output = EditFileContentOutput;
    type Params = EditFileContentParams;

    fn get_name(&self) -> String {
        "edit_file_content".to_string()
    }

    async fn is_enabled(&self) -> bool {
        true
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        let file_path = Path::new(&params.file_path);
        if !file_path.exists() {
            return Err(anyhow::anyhow!("File does not exist: {}", params.file_path));
        }
        if !file_path.is_file() {
            return Err(anyhow::anyhow!("Path is not a file: {}", params.file_path));
        }

        let initial_content = fs::read_to_string(file_path)
            .map_err(|e| anyhow::anyhow!("Failed to read file '{}' for editing: {}", params.file_path, e))?;

        match self.apply_modifications(&initial_content, &params.modifications, &params.file_path) {
            Ok(modified_content) => {
                match fs::write(file_path, modified_content) {
                    Ok(_) => Ok(EditFileContentOutput {
                        success: true,
                        message: format!("Successfully edited file: {}", params.file_path),
                    }),
                    Err(e) => Err(anyhow::anyhow!("Failed to write edited content to file '{}': {}", params.file_path, e)),
                }
            }
            Err(e) => {
                // Error already contains details from apply_modifications
                Ok(EditFileContentOutput {
                     success: false,
                     message: e.to_string(),
                })
            }
        }
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Edits an existing file by applying a list of specific content replacements. Each 'content_to_replace' must match exactly once in the current file state for that step. WARNING: This overwrites the original file.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "The path to the file to edit."
                    },
                    "modifications": {
                        "type": "array",
                        "description": "List of modifications to apply sequentially.",
                        "items": {
                            "type": "object",
                            "required": ["content_to_replace", "new_content"],
                            "properties": {
                                "content_to_replace": {
                                    "type": "string",
                                    "description": "The exact block of text to find and replace. Must be unique in the file at the time of replacement."
                                },
                                "new_content": {
                                    "type": "string",
                                    "description": "The new text to insert in place of 'content_to_replace'."
                                }
                            }
                        }
                    }
                },
                "required": ["file_path", "modifications"]
            }
        })
    }
} 