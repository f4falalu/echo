use std::sync::Arc;
use std::time::Instant;

use anyhow::Result;
use async_trait::async_trait;
use chrono::Utc;
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use super::{
    common::validate_metric_ids,
    file_types::{
        dashboard_yml::DashboardYml,
        file::{FileEnum, FileWithId},
    },
    FileModificationTool,
};
use crate::{
    database_dep::{lib::get_pg_pool, models::DashboardFile, schema::dashboard_files},
    utils::{
        agent::Agent,
        tools::{file_tools::common::DASHBOARD_YML_SCHEMA, ToolExecutor},
    },
};

use litellm::ToolCall;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Modification {
    pub new_content: String,
    pub line_numbers: Vec<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileModification {
    pub id: Uuid,
    pub file_name: String,
    pub modifications: Vec<Modification>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModifyFilesParams {
    pub files: Vec<FileModification>,
}

#[derive(Debug, Serialize)]
struct ModificationResult {
    file_id: Uuid,
    file_name: String,
    success: bool,
    original_lines: Vec<i64>,
    adjusted_lines: Vec<i64>,
    error: Option<String>,
    modification_type: String,
    timestamp: chrono::DateTime<Utc>,
    duration: i64,
}

#[derive(Debug)]
struct FileModificationBatch {
    dashboard_files: Vec<DashboardFile>,
    dashboard_ymls: Vec<DashboardYml>,
    failed_modifications: Vec<(String, String)>,
    modification_results: Vec<ModificationResult>,
}

#[derive(Debug)]
struct LineAdjustment {
    original_start: i64,
    original_end: i64,
    new_length: i64,
    offset: i64,
}

impl LineAdjustment {
    fn new(original_start: i64, original_end: i64, new_length: i64) -> Self {
        let original_length = original_end - original_start + 1;
        let offset = new_length - original_length;

        Self {
            original_start,
            original_end,
            new_length,
            offset,
        }
    }

    fn adjust_line_number(&self, line: i64) -> i64 {
        if line < self.original_start {
            line
        } else {
            line + self.offset
        }
    }
}

// Helper functions for line number validation and modification
fn validate_line_numbers(line_numbers: &[i64]) -> Result<()> {
    // Check if empty
    if line_numbers.is_empty() {
        return Err(anyhow::anyhow!("Line numbers array cannot be empty"));
    }

    // Check if we have exactly 2 numbers for the range
    if line_numbers.len() != 2 {
        return Err(anyhow::anyhow!(
            "Line numbers must specify a range with exactly 2 numbers [start,end], got {} numbers",
            line_numbers.len()
        ));
    }

    let start = line_numbers[0];
    let end = line_numbers[1];

    // Check if starts with at least 1
    if start < 1 {
        return Err(anyhow::anyhow!(
            "Line numbers must be 1-indexed, got starting line {}",
            start
        ));
    }

    // Check if end is greater than or equal to start
    if end < start {
        return Err(anyhow::anyhow!(
            "End line {} must be greater than or equal to start line {}",
            end,
            start
        ));
    }

    Ok(())
}

// Helper function to expand range into sequential numbers
fn expand_line_range(line_numbers: &[i64]) -> Vec<i64> {
    if line_numbers.len() != 2 {
        return line_numbers.to_vec();
    }
    let start = line_numbers[0];
    let end = line_numbers[1];
    (start..=end).collect()
}

fn apply_modifications_to_content(
    content: &str,
    modifications: &[Modification],
    file_name: &str,
) -> Result<String> {
    let mut lines: Vec<&str> = content.lines().collect();
    let mut modified_lines = lines.clone();
    let mut total_offset = 0;

    // Validate and sort modifications by starting line number
    let mut sorted_modifications = modifications.to_vec();
    sorted_modifications.sort_by_key(|m| m.line_numbers[0]);

    // Check for overlapping modifications
    for window in sorted_modifications.windows(2) {
        let first_end = window[0].line_numbers[1];
        let second_start = window[1].line_numbers[0];
        if second_start <= first_end {
            return Err(anyhow::anyhow!(
                "Overlapping modifications in file '{}': line {} overlaps with line {}",
                file_name,
                first_end,
                second_start
            ));
        }
    }

    // Apply modifications and track adjustments
    for modification in &sorted_modifications {
        // Validate line numbers
        validate_line_numbers(&modification.line_numbers)?;

        // Expand range into sequential numbers for processing
        let line_range = expand_line_range(&modification.line_numbers);

        // Adjust line numbers based on previous modifications
        let original_start = line_range[0] as usize - 1;
        let original_end = line_range[line_range.len() - 1] as usize - 1;
        let adjusted_start = (original_start as i64 + total_offset) as usize;

        // Validate line numbers are within bounds
        if original_end >= lines.len() {
            return Err(anyhow::anyhow!(
                "Line numbers out of bounds in file '{}': file has {} lines, but modification attempts to modify line {}",
                file_name,
                lines.len(),
                original_end + 1
            ));
        }

        // Split new content into lines
        let new_lines: Vec<&str> = modification.new_content.lines().collect();

        // Calculate the change in number of lines
        let old_length = original_end - original_start + 1;
        let new_length = new_lines.len();
        total_offset += new_length as i64 - old_length as i64;

        // Apply the modification
        let prefix = modified_lines[..adjusted_start].to_vec();
        let suffix = modified_lines[adjusted_start + old_length..].to_vec();

        modified_lines = [prefix, new_lines, suffix].concat();
    }

    Ok(modified_lines.join("\n"))
}

#[derive(Debug, Serialize)]
pub struct ModifyFilesOutput {
    message: String,
    duration: i64,
    files: Vec<FileWithId>,
}

pub struct ModifyDashboardFilesTool {
    agent: Arc<Agent>,
}

impl ModifyDashboardFilesTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

impl FileModificationTool for ModifyDashboardFilesTool {}

#[async_trait]
impl ToolExecutor for ModifyDashboardFilesTool {
    type Output = ModifyFilesOutput;
    type Params = ModifyFilesParams;

    fn get_name(&self) -> String {
        "modify_dashboard_files".to_string()
    }

    async fn is_enabled(&self) -> bool {
        match (
            self.agent.get_state_value("metrics_available").await,
            self.agent.get_state_value("dashboards_available").await,
        ) {
            (Some(_), Some(_)) => true,
            _ => false,
        }
    }

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        let start_time = Instant::now();

        debug!("Starting file modification execution");

        info!("Processing {} files for modification", params.files.len());

        // Initialize batch processing structures
        let mut batch = FileModificationBatch {
            dashboard_files: Vec::new(),
            dashboard_ymls: Vec::new(),
            failed_modifications: Vec::new(),
            modification_results: Vec::new(),
        };

        // Collect file IDs and create map
        let dashboard_ids: Vec<Uuid> = params.files.iter().map(|f| f.id).collect();
        let file_map: std::collections::HashMap<_, _> =
            params.files.iter().map(|f| (f.id, f)).collect();

        // Get database connection
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => {
                let duration = start_time.elapsed().as_millis() as i64;
                return Ok(ModifyFilesOutput {
                    message: format!("Failed to connect to database: {}", e),
                    files: Vec::new(),
                    duration,
                });
            }
        };

        // Fetch dashboard files
        if !dashboard_ids.is_empty() {
            use crate::database_dep::schema::dashboard_files::dsl::*;
            match dashboard_files
                .filter(id.eq_any(dashboard_ids))
                .filter(deleted_at.is_null())
                .load::<DashboardFile>(&mut conn)
                .await
            {
                Ok(files) => {
                    for file in files {
                        if let Some(modifications) = file_map.get(&file.id) {
                            match process_dashboard_file(
                                file,
                                modifications,
                                start_time.elapsed().as_millis() as i64,
                            )
                            .await
                            {
                                Ok((dashboard_file, dashboard_yml, results)) => {
                                    batch.dashboard_files.push(dashboard_file);
                                    batch.dashboard_ymls.push(dashboard_yml);
                                    batch.modification_results.extend(results);
                                }
                                Err(e) => {
                                    batch
                                        .failed_modifications
                                        .push((modifications.file_name.clone(), e.to_string()));
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    let duration = start_time.elapsed().as_millis() as i64;
                    return Ok(ModifyFilesOutput {
                        message: format!("Failed to fetch dashboard files: {}", e),
                        files: Vec::new(),
                        duration,
                    });
                }
            }
        }

        // Process results and generate output message
        let duration = start_time.elapsed().as_millis() as i64;
        let mut output = ModifyFilesOutput {
            message: String::new(),
            files: Vec::new(),
            duration,
        };

        // Update dashboard files in database
        if !batch.dashboard_files.is_empty() {
            use diesel::insert_into;
            match insert_into(dashboard_files::table)
                .values(&batch.dashboard_files)
                .on_conflict(dashboard_files::id)
                .do_update()
                .set((
                    dashboard_files::content.eq(excluded(dashboard_files::content)),
                    dashboard_files::updated_at.eq(Utc::now()),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => {
                    output.files.extend(
                        batch
                            .dashboard_files
                            .iter()
                            .zip(batch.dashboard_ymls.iter())
                            .map(|(file, yml)| FileWithId {
                                id: file.id,
                                name: file.name.clone(),
                                file_type: "dashboard".to_string(),
                                yml_content: serde_yaml::to_string(&yml).unwrap_or_default(),
                            }),
                    );
                }
                Err(e) => {
                    batch.failed_modifications.push((
                        "dashboard_files".to_string(),
                        format!("Failed to update dashboard files: {}", e),
                    ));
                }
            }
        }

        // Generate final message
        if batch.failed_modifications.is_empty() {
            output.message = format!(
                "Successfully modified {} dashboard files.",
                output.files.len()
            );
        } else {
            let success_msg = if !output.files.is_empty() {
                format!(
                    "Successfully modified {} dashboard files. ",
                    output.files.len()
                )
            } else {
                String::new()
            };

            let failures: Vec<String> = batch
                .failed_modifications
                .iter()
                .map(|(name, error)| format!("Failed to modify '{}': {}", name, error))
                .collect();

            output.message = format!(
                "{}Failed to modify {} dashboard files: {}",
                success_msg,
                batch.failed_modifications.len(),
                failures.join("; ")
            );
        }

        Ok(output)
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "modify_dashboard_files",
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["files"],
                "properties": {
                    "files": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["id", "file_name", "modifications"],
                            "properties": {
                                "id": {
                                    "type": "string",
                                    "description": "The UUID of the dashboard file to modify"
                                },
                                "file_name": {
                                    "type": "string",
                                    "description": "The name of the dashboard file being modified"
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
                                                    "type": "number"
                                                },
                                                "description": "Array containing exactly 2 numbers [start,end] specifying the range of lines to replace. For example, [1,5] replaces lines 1 through 5. For a single line, use [n,n] (e.g., [3,3] for line 3)."
                                            }
                                        },
                                        "additionalProperties": false
                                    },
                                    "description": "List of modifications to be made to the file."
                                }
                            },
                            "additionalProperties": false
                        },
                        "description": DASHBOARD_YML_SCHEMA
                    }
                },
                "additionalProperties": false
            },
            "description": "Makes multiple line-level modifications to one or more existing dashboard YAML files in a single call. Line numbers are specified as [start,end] ranges. If you need to update chart config or other sections within a file, use this. Guard Rail: Do not execute any file creation or modifications until a thorough data catalog search has been completed and reviewed."
        })
    }
}

async fn process_dashboard_file(
    mut file: DashboardFile,
    modification: &FileModification,
    duration: i64,
) -> Result<(DashboardFile, DashboardYml, Vec<ModificationResult>)> {
    debug!(
        file_id = %file.id,
        file_name = %modification.file_name,
        "Processing dashboard file modifications"
    );

    let mut results = Vec::new();

    // Parse existing content
    let current_yml: DashboardYml = match serde_json::from_value(file.content.clone()) {
        Ok(yml) => yml,
        Err(e) => {
            let error = format!("Failed to parse existing dashboard YAML: {}", e);
            error!(
                file_id = %file.id,
                file_name = %modification.file_name,
                error = %error,
                "YAML parsing error"
            );
            results.push(ModificationResult {
                file_id: file.id,
                file_name: modification.file_name.clone(),
                success: false,
                original_lines: vec![],
                adjusted_lines: vec![],
                error: Some(error.clone()),
                modification_type: "parsing".to_string(),
                timestamp: Utc::now(),
                duration,
            });
            return Err(anyhow::anyhow!(error));
        }
    };

    // Convert to YAML string for line modifications
    let current_content = match serde_yaml::to_string(&current_yml) {
        Ok(content) => content,
        Err(e) => {
            let error = format!("Failed to serialize dashboard YAML: {}", e);
            error!(
                file_id = %file.id,
                file_name = %modification.file_name,
                error = %error,
                "YAML serialization error"
            );
            results.push(ModificationResult {
                file_id: file.id,
                file_name: modification.file_name.clone(),
                success: false,
                original_lines: vec![],
                adjusted_lines: vec![],
                error: Some(error.clone()),
                modification_type: "serialization".to_string(),
                timestamp: Utc::now(),
                duration,
            });
            return Err(anyhow::anyhow!(error));
        }
    };

    // Track original line numbers before modifications
    let mut original_lines = Vec::new();
    let mut adjusted_lines = Vec::new();

    // Apply modifications
    for m in &modification.modifications {
        original_lines.extend(m.line_numbers.clone());
    }

    // Apply modifications and track results
    match apply_modifications_to_content(
        &current_content,
        &modification.modifications,
        &modification.file_name,
    ) {
        Ok(modified_content) => {
            // Create and validate new YML object
            match DashboardYml::new(modified_content) {
                Ok(new_yml) => {
                    debug!(
                        file_id = %file.id,
                        file_name = %modification.file_name,
                        "Successfully modified and validated dashboard file"
                    );

                    // Collect all metric IDs from rows
                    let metric_ids: Vec<Uuid> = new_yml
                        .rows
                        .iter()
                        .flat_map(|row| row.items.iter())
                        .map(|item| item.id)
                        .collect();

                    // Validate metric IDs if any exist
                    if !metric_ids.is_empty() {
                        match validate_metric_ids(&metric_ids).await {
                            Ok(missing_ids) if !missing_ids.is_empty() => {
                                let error =
                                    format!("Referenced metrics not found: {:?}", missing_ids);
                                error!(
                                    file_id = %file.id,
                                    file_name = %modification.file_name,
                                    error = %error,
                                    "Metric validation error"
                                );
                                results.push(ModificationResult {
                                    file_id: file.id,
                                    file_name: modification.file_name.clone(),
                                    success: false,
                                    original_lines: original_lines.clone(),
                                    adjusted_lines: adjusted_lines.clone(),
                                    error: Some(error.clone()),
                                    modification_type: "metric_validation".to_string(),
                                    timestamp: Utc::now(),
                                    duration,
                                });
                                return Err(anyhow::anyhow!(error));
                            }
                            Err(e) => {
                                let error = format!("Failed to validate metric IDs: {}", e);
                                error!(
                                    file_id = %file.id,
                                    file_name = %modification.file_name,
                                    error = %error,
                                    "Metric validation error"
                                );
                                results.push(ModificationResult {
                                    file_id: file.id,
                                    file_name: modification.file_name.clone(),
                                    success: false,
                                    original_lines: original_lines.clone(),
                                    adjusted_lines: adjusted_lines.clone(),
                                    error: Some(error.clone()),
                                    modification_type: "metric_validation".to_string(),
                                    timestamp: Utc::now(),
                                    duration,
                                });
                                return Err(anyhow::anyhow!(error));
                            }
                            Ok(_) => (), // All metrics exist
                        }
                    }

                    // Update file record
                    file.content = serde_json::to_value(&new_yml)?;
                    file.updated_at = Utc::now();

                    // Track successful modification
                    results.push(ModificationResult {
                        file_id: file.id,
                        file_name: modification.file_name.clone(),
                        success: true,
                        original_lines: original_lines.clone(),
                        adjusted_lines: adjusted_lines.clone(),
                        error: None,
                        modification_type: "content".to_string(),
                        timestamp: Utc::now(),
                        duration,
                    });

                    Ok((file, new_yml, results))
                }
                Err(e) => {
                    let error = format!("Failed to validate modified YAML: {}", e);
                    error!(
                        file_id = %file.id,
                        file_name = %modification.file_name,
                        error = %error,
                        "YAML validation error"
                    );
                    results.push(ModificationResult {
                        file_id: file.id,
                        file_name: modification.file_name.clone(),
                        success: false,
                        original_lines,
                        adjusted_lines: vec![],
                        error: Some(error.clone()),
                        modification_type: "validation".to_string(),
                        timestamp: Utc::now(),
                        duration,
                    });
                    Err(anyhow::anyhow!(error))
                }
            }
        }
        Err(e) => {
            let error = format!("Failed to apply modifications: {}", e);
            error!(
                file_id = %file.id,
                file_name = %modification.file_name,
                error = %error,
                "Modification application error"
            );
            results.push(ModificationResult {
                file_id: file.id,
                file_name: modification.file_name.clone(),
                success: false,
                original_lines,
                adjusted_lines: vec![],
                error: Some(error.clone()),
                modification_type: "modification".to_string(),
                timestamp: Utc::now(),
                duration,
            });
            Err(anyhow::anyhow!(error))
        }
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;
    use chrono::Utc;
    use serde_json::json;

    #[test]
    fn test_validate_line_numbers() {
        // Test valid range
        assert!(validate_line_numbers(&[1, 5]).is_ok());
        assert!(validate_line_numbers(&[1, 1]).is_ok()); // Single line

        // Test empty array
        let empty_err = validate_line_numbers(&[]).unwrap_err();
        assert!(empty_err.to_string().contains("cannot be empty"));

        // Test wrong number of elements
        let wrong_len_err = validate_line_numbers(&[1, 2, 3]).unwrap_err();
        assert!(wrong_len_err.to_string().contains("exactly 2 numbers"));

        // Test invalid range (end < start)
        let invalid_range_err = validate_line_numbers(&[5, 3]).unwrap_err();
        assert!(invalid_range_err
            .to_string()
            .contains("must be greater than or equal to"));

        // Test starting below 1
        let invalid_start_err = validate_line_numbers(&[0, 2]).unwrap_err();
        assert!(invalid_start_err.to_string().contains("must be 1-indexed"));
    }

    #[test]
    fn test_apply_modifications_to_content() {
        let original_content = "line1\nline2\nline3\nline4\nline5";

        // Test single modification replacing two lines
        let mods1 = vec![Modification {
            new_content: "new line2\nnew line3".to_string(),
            line_numbers: vec![2, 3], // Replace lines 2-3
        }];
        let result1 = apply_modifications_to_content(original_content, &mods1, "test.yml").unwrap();
        assert_eq!(
            result1.trim_end(),
            "line1\nnew line2\nnew line3\nline4\nline5"
        );

        // Test multiple non-overlapping modifications
        let mods2 = vec![
            Modification {
                new_content: "new line2".to_string(),
                line_numbers: vec![2, 2], // Single line replacement
            },
            Modification {
                new_content: "new line4".to_string(),
                line_numbers: vec![4, 4], // Single line replacement
            },
        ];
        let result2 = apply_modifications_to_content(original_content, &mods2, "test.yml").unwrap();
        assert_eq!(
            result2.trim_end(),
            "line1\nnew line2\nline3\nnew line4\nline5"
        );

        // Test overlapping modifications (should fail)
        let mods3 = vec![
            Modification {
                new_content: "new lines".to_string(),
                line_numbers: vec![2, 3],
            },
            Modification {
                new_content: "overlap".to_string(),
                line_numbers: vec![3, 4],
            },
        ];
        let result3 = apply_modifications_to_content(original_content, &mods3, "test.yml");
        assert!(result3.is_err());
        assert!(result3.unwrap_err().to_string().contains("overlaps"));

        // Test out of bounds modification
        let mods4 = vec![Modification {
            new_content: "new line".to_string(),
            line_numbers: vec![6, 6],
        }];
        let result4 = apply_modifications_to_content(original_content, &mods4, "test.yml");
        assert!(result4.is_err());
        assert!(result4.unwrap_err().to_string().contains("out of bounds"));
    }

    #[test]
    fn test_modification_result_tracking() {
        let result = ModificationResult {
            file_id: Uuid::new_v4(),
            file_name: "test.yml".to_string(),
            success: true,
            original_lines: vec![1, 2, 3],
            adjusted_lines: vec![1, 2],
            error: None,
            modification_type: "content".to_string(),
            timestamp: Utc::now(),
            duration: 0,
        };

        assert!(result.success);
        assert_eq!(result.original_lines, vec![1, 2, 3]);
        assert_eq!(result.adjusted_lines, vec![1, 2]);
        assert!(result.error.is_none());

        let error_result = ModificationResult {
            success: false,
            error: Some("Failed to parse YAML".to_string()),
            ..result
        };
        assert!(!error_result.success);
        assert!(error_result.error.is_some());
        assert_eq!(error_result.error.unwrap(), "Failed to parse YAML");
    }

    #[test]
    fn test_tool_parameter_validation() {
        let tool = ModifyDashboardFilesTool {
            agent: Arc::new(Agent::new(
                "o3-mini".to_string(),
                HashMap::new(),
                Uuid::new_v4(),
                Uuid::new_v4(),
                "test_agent".to_string(),
            )),
        };

        // Test valid parameters
        let valid_params = json!({
            "files": [{
                "id": Uuid::new_v4().to_string(),
                "file_name": "test.yml",
                "modifications": [{
                    "new_content": "test content",
                    "line_numbers": [1, 2]
                }]
            }]
        });
        let valid_args = serde_json::to_string(&valid_params).unwrap();
        let result = serde_json::from_str::<ModifyFilesParams>(&valid_args);
        assert!(result.is_ok());

        // Test missing required fields
        let missing_fields_params = json!({
            "files": [{
                "id": Uuid::new_v4().to_string()
                // missing file_name and modifications
            }]
        });
        let missing_args = serde_json::to_string(&missing_fields_params).unwrap();
        let result = serde_json::from_str::<ModifyFilesParams>(&missing_args);
        assert!(result.is_err());
    }
}
