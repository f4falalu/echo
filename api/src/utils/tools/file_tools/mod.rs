mod modify_files;
mod create_files;
pub mod file_types;
mod open_files;
mod search_data_catalog;
mod search_files;
mod send_to_user;

pub use modify_files::ModifyFilesTool;
pub use create_files::CreateFilesTool;
pub use open_files::OpenFilesTool;
pub use search_data_catalog::SearchDataCatalogTool;
pub use search_files::SearchFilesTool;
pub use send_to_user::SendToUserTool;

use crate::utils::tools::ToolExecutor;
use serde::Serialize;
use serde_json::Value;

/// Trait to mark tools that should have line numbers added to their file content output
pub trait FileModificationTool: ToolExecutor {
    /// Process the output Value before it's serialized to add line numbers to file content
    fn process_output_value(&self, value: &mut Value) {
        if let Some(obj) = value.as_object_mut() {
            // Process any string fields that might contain file content
            for (_, v) in obj.iter_mut() {
                if let Some(content) = v.as_str() {
                    *v = Value::String(add_line_numbers(content));
                } else if let Some(arr) = v.as_array_mut() {
                    // Handle arrays of objects that might contain file content
                    for item in arr.iter_mut() {
                        if let Some(content) = item.as_str() {
                            *item = Value::String(add_line_numbers(content));
                        }
                    }
                }
            }
        }
    }

    /// Custom serialization for tool output that needs line numbers
    fn serialize_output<T: Serialize>(&self, output: &T) -> Result<String, serde_json::Error> {
        let mut value = serde_json::to_value(output)?;
        self.process_output_value(&mut value);
        serde_json::to_string(&value)
    }
}

/// Adds line numbers to content in the format "line_number | content"
pub fn add_line_numbers(content: &str) -> String {
    content
        .lines()
        .enumerate()
        .map(|(i, line)| format!("{:>4} | {}", i + 1, line))
        .collect::<Vec<_>>()
        .join("\n")
}

