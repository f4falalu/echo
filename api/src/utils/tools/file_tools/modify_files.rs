use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;
use serde::{Deserialize, Serialize};

use crate::utils::{clients::ai::litellm::ToolCall, tools::ToolExecutor};
use super::FileModificationTool;

#[derive(Debug, Serialize, Deserialize)]
struct Modification {
    new_content: String,
    line_numbers: Vec<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
struct FileModification {
    file: String,
    modifications: Vec<Modification>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ModifyFilesParams {
    files_with_modifications: Vec<FileModification>,
}

#[derive(Debug, Serialize)]
pub struct ModifyFilesOutput {
    success: bool,
}

pub struct ModifyFilesTool;

impl FileModificationTool for ModifyFilesTool {}

#[async_trait]
impl ToolExecutor for ModifyFilesTool {
    type Output = ModifyFilesOutput;

    fn get_name(&self) -> String {
        "modify_files".to_string()
    }

    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        let params: ModifyFilesParams = serde_json::from_str(&tool_call.function.arguments.clone())?;
        // TODO: Implement actual file modification logic
        let output = ModifyFilesOutput {
            success: true,
        };

        Ok(output)
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "modify_files",
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["files_with_modifications"],
                "properties": {
                    "files_with_modifications": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["file", "modifications"],
                            "properties": {
                                "file": {
                                    "type": "string",
                                    "description": "The path to a yml file that needs to be modified."
                                },
                                "modifications": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "required": ["new_content", "line_numbers"],
                                        "properties": {
                                            "new_content": {
                                                "type": "string",
                                                "description": "The new content that will replace the existing lines. If continuous line changes are made, then you should keep them together."
                                            },
                                            "line_numbers": {
                                                "type": "array",
                                                "items": {
                                                    "type": "number",
                                                    "description": "Line numbers in the yml file."
                                                },
                                                "description": "Array of line numbers that need to be replaced, includes start and end line. If continuous lines are being edited please keep them together. i.e. [20, 34]"
                                            }
                                        },
                                        "additionalProperties": false
                                    },
                                    "description": "List of modifications to be made to the file."
                                }
                            },
                            "additionalProperties": false
                        },
                        "description": "Array of objects containing file paths and their respective modifications."
                    }
                },
                "additionalProperties": false
            },
            "description": "Makes multiple line-level modifications to one or more existing YAML files in a single call. If you need to update SQL, chart config, or other sections within a file, use this."
        })
    }
} 