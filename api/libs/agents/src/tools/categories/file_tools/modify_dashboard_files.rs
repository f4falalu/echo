use std::sync::Arc;
use std::time::Instant;

use anyhow::Result;
use async_trait::async_trait;
use chrono::Utc;
use database::{models::DashboardFile, pool::get_pg_pool, schema::dashboard_files};
use diesel::{insert_into, upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use super::{
    common::{FileModification, Modification, ModificationResult, apply_modifications_to_content, validate_metric_ids},
    file_types::{
        dashboard_yml::DashboardYml,
        file::{FileEnum, FileWithId},
    },
    FileModificationTool,
};
use crate::{
    agent::Agent,
    tools::{file_tools::common::DASHBOARD_YML_SCHEMA, ToolExecutor},
};

use litellm::ToolCall;

#[derive(Debug, Serialize, Deserialize)]
pub struct ModifyFilesParams {
    /// List of files to modify with their corresponding modifications
    pub files: Vec<FileModification>,
}

#[derive(Debug)]
struct FileModificationBatch {
    dashboard_files: Vec<DashboardFile>,
    dashboard_ymls: Vec<DashboardYml>,
    failed_modifications: Vec<(String, String)>,
    modification_results: Vec<ModificationResult>,
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
        "update_dashboards".to_string()
    }

    async fn is_enabled(&self) -> bool {
        match (
            self.agent.get_state_value("metrics_available").await,
            self.agent.get_state_value("dashboards_available").await,
            self.agent.get_state_value("plan_available").await,
        ) {
            (Some(_), Some(_), Some(_)) => true,
            _ => false,
        }
    }

    async fn execute(&self, params: Self::Params, tool_call_id: String) -> Result<Self::Output> {
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
            match dashboard_files::table
                .filter(dashboard_files::id.eq_any(dashboard_ids))
                .filter(dashboard_files::deleted_at.is_null())
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
                                result_message: None,
                                results: None,
                                created_at: file.created_at,
                                updated_at: file.updated_at,
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
            "name": self.get_name(),
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
                                        "required": ["content_to_replace", "new_content"],
                                        "properties": {
                                            "content_to_replace": {
                                                "type": "string",
                                                "description": "The exact content in the file that should be replaced. Must match exactly."
                                            },
                                            "new_content": {
                                                "type": "string",
                                                "description": "The new content that will replace the matched content. Make sure to include proper indentation and formatting."
                                            }
                                        },
                                        "additionalProperties": false
                                    },
                                    "description": "List of content replacements to apply to the file."
                                }
                            },
                            "additionalProperties": false
                        },
                        "description": DASHBOARD_YML_SCHEMA
                    }
                },
                "additionalProperties": false
            },
            "description": "Makes content-based modifications to one or more existing dashboard YAML files in a single call. Each modification specifies the exact content to replace and its replacement. If you need to update chart config or other sections within a file, use this. Guard Rail: Do not execute any file creation or modifications until a thorough data catalog search has been completed and reviewed."
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
                error: Some(error.clone()),
                modification_type: "serialization".to_string(),
                timestamp: Utc::now(),
                duration,
            });
            return Err(anyhow::anyhow!(error));
        }
    };

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
    fn test_apply_modifications_to_content() {
        let original_content = "name: test_dashboard\ntype: dashboard\ndescription: A test dashboard";

        // Test single modification
        let mods1 = vec![Modification {
            content_to_replace: "type: dashboard".to_string(),
            new_content: "type: custom_dashboard".to_string(),
        }];
        let result1 = apply_modifications_to_content(original_content, &mods1, "test.yml").unwrap();
        assert_eq!(
            result1,
            "name: test_dashboard\ntype: custom_dashboard\ndescription: A test dashboard"
        );

        // Test multiple non-overlapping modifications
        let mods2 = vec![
            Modification {
                content_to_replace: "test_dashboard".to_string(),
                new_content: "new_dashboard".to_string(),
            },
            Modification {
                content_to_replace: "A test dashboard".to_string(),
                new_content: "An updated dashboard".to_string(),
            },
        ];
        let result2 = apply_modifications_to_content(original_content, &mods2, "test.yml").unwrap();
        assert_eq!(
            result2,
            "name: new_dashboard\ntype: dashboard\ndescription: An updated dashboard"
        );

        // Test content not found
        let mods3 = vec![Modification {
            content_to_replace: "nonexistent content".to_string(),
            new_content: "new content".to_string(),
        }];
        let result3 = apply_modifications_to_content(original_content, &mods3, "test.yml");
        assert!(result3.is_err());
        assert!(result3.unwrap_err().to_string().contains("Content to replace not found"));
    }

    #[test]
    fn test_modification_result_tracking() {
        let result = ModificationResult {
            file_id: Uuid::new_v4(),
            file_name: "test.yml".to_string(),
            success: true,
            error: None,
            modification_type: "content".to_string(),
            timestamp: Utc::now(),
            duration: 0,
        };

        assert!(result.success);
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
                    "content_to_replace": "old content",
                    "new_content": "new content"
                }]
            }]
        });
        let valid_args = serde_json::to_string(&valid_params).unwrap();
        let result = serde_json::from_str::<ModifyFilesParams>(&valid_args);
        assert!(result.is_ok());

        // Test missing required fields
        let missing_fields_params = json!({
            "files": [{
                "id": Uuid::new_v4().to_string(),
                "file_name": "test.yml"
                // missing modifications
            }]
        });
        let missing_args = serde_json::to_string(&missing_fields_params).unwrap();
        let result = serde_json::from_str::<ModifyFilesParams>(&missing_args);
        assert!(result.is_err());
    }
}
