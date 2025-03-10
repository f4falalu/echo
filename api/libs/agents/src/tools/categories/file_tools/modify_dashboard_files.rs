use std::sync::Arc;
use std::time::Instant;

use anyhow::Result;
use async_trait::async_trait;
use database::{models::DashboardFile, pool::get_pg_pool, schema::dashboard_files};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use indexmap::IndexMap;
use query_engine::data_types::DataType;
use serde_json::Value;
use tracing::{debug, error, info};

use super::{
    common::{
        apply_modifications_to_content, process_dashboard_file_modification, FileModificationBatch,
        ModificationResult, ModifyFilesOutput, ModifyFilesParams,
    },
    file_types::{dashboard_yml::DashboardYml, file::FileWithId},
    FileModificationTool,
};
use crate::{
    agent::Agent,
    tools::{file_tools::common::DASHBOARD_YML_SCHEMA, ToolExecutor},
};

#[derive(Debug)]
struct DashboardModificationBatch {
    pub files: Vec<DashboardFile>,
    pub ymls: Vec<DashboardYml>,
    pub failed_modifications: Vec<(String, String)>,
    pub modification_results: Vec<ModificationResult>,
    pub validation_messages: Vec<String>,
    pub validation_results: Vec<Vec<IndexMap<String, DataType>>>,
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
            self.agent.get_state_value("dashboards_available").await,
            self.agent.get_state_value("plan_available").await,
        ) {
            (Some(_), Some(_)) => true,
            _ => false,
        }
    }

    async fn execute(&self, params: Self::Params, tool_call_id: String) -> Result<Self::Output> {
        let start_time = Instant::now();

        debug!("Starting file modification execution");

        info!("Processing {} files for modification", params.files.len());

        // Initialize batch processing structures
        let mut batch = DashboardModificationBatch {
            files: Vec::new(),
            ymls: Vec::new(),
            failed_modifications: Vec::new(),
            modification_results: Vec::new(),
            validation_messages: Vec::new(),
            validation_results: Vec::new(),
        };

        // Get database connection
        let mut conn = get_pg_pool().get().await?;

        // Process each file modification
        for modification in params.files {
            // Get the dashboard file from database
            match dashboard_files::table
                .filter(dashboard_files::id.eq(modification.id))
                .filter(dashboard_files::deleted_at.is_null())
                .first::<DashboardFile>(&mut conn)
                .await
            {
                Ok(dashboard_file) => {
                    let duration = start_time.elapsed().as_millis() as i64;

                    // Process the modification
                    match process_dashboard_file_modification(
                        dashboard_file,
                        &modification,
                        duration,
                    )
                    .await
                    {
                        Ok((
                            dashboard_file,
                            dashboard_yml,
                            results,
                            validation_message,
                            validation_results,
                        )) => {
                            batch.files.push(dashboard_file);
                            batch.ymls.push(dashboard_yml);
                            batch.modification_results.extend(results);
                            batch.validation_messages.push(validation_message);
                            batch.validation_results.push(validation_results);
                        }
                        Err(e) => {
                            batch
                                .failed_modifications
                                .push((modification.file_name.clone(), e.to_string()));
                        }
                    }
                }
                Err(e) => {
                    batch.failed_modifications.push((
                        modification.file_name.clone(),
                        format!("Failed to find dashboard file: {}", e),
                    ));
                }
            }
        }

        // Update dashboard files in database
        if !batch.files.is_empty() {
            use diesel::insert_into;
            match insert_into(dashboard_files::table)
                .values(&batch.files)
                .on_conflict(dashboard_files::id)
                .do_update()
                .set((
                    dashboard_files::content.eq(excluded(dashboard_files::content)),
                    dashboard_files::updated_at.eq(excluded(dashboard_files::updated_at)),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => {
                    debug!("Successfully updated dashboard files in database");
                }
                Err(e) => {
                    error!("Failed to update dashboard files in database: {}", e);
                    return Err(anyhow::anyhow!(
                        "Failed to update dashboard files in database: {}",
                        e
                    ));
                }
            }
        }

        // Generate output
        let duration = start_time.elapsed().as_millis() as i64;
        let mut output = ModifyFilesOutput {
            message: format!("Modified {} dashboard files", batch.files.len()),
            duration,
            files: Vec::new(),
        };

        // Add files to output
        output
            .files
            .extend(batch.files.iter().enumerate().map(|(i, file)| {
                let yml = &batch.ymls[i];
                FileWithId {
                    id: file.id,
                    name: file.name.clone(),
                    file_type: "dashboard".to_string(),
                    yml_content: serde_yaml::to_string(&yml).unwrap_or_default(),
                    result_message: Some(batch.validation_messages[i].clone()),
                    results: Some(batch.validation_results[i].clone()),
                    created_at: file.created_at,
                    updated_at: file.updated_at,
                }
            }));

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

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;
    use crate::tools::categories::file_tools::common::{
        Modification, ModificationResult, apply_modifications_to_content,
    };
    use chrono::Utc;
    use serde_json::json;
    use uuid::Uuid;

    #[test]
    fn test_apply_modifications_to_content() {
        let original_content =
            "name: test_dashboard\ntype: dashboard\ndescription: A test dashboard";

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
        assert!(result3
            .unwrap_err()
            .to_string()
            .contains("Content to replace not found"));
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
