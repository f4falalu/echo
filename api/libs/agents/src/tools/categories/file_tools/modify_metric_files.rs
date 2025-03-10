use std::sync::Arc;
use std::time::Instant;

use anyhow::Result;
use async_trait::async_trait;
use chrono::Utc;
use database::{enums::Verification, models::MetricFile, pool::get_pg_pool, schema::metric_files};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use indexmap::IndexMap;
use query_engine::data_types::DataType;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::{debug, info};
use uuid::Uuid;

use super::{
    common::{FileModification, Modification, ModificationResult, apply_modifications_to_content, process_metric_file_modification},
    file_types::{file::FileWithId, metric_yml::MetricYml},
    FileModificationTool,
};
use crate::{
    agent::Agent,
    tools::{file_tools::common::METRIC_YML_SCHEMA, ToolExecutor},
};

#[derive(Debug, Serialize, Deserialize)]
pub struct ModifyFilesParams {
    /// List of files to modify with their corresponding modifications
    pub files: Vec<FileModification>,
}

#[derive(Debug)]
struct FileModificationBatch {
    metric_files: Vec<MetricFile>,
    metric_ymls: Vec<MetricYml>,
    failed_modifications: Vec<(String, String)>,
    modification_results: Vec<ModificationResult>,
    validation_messages: Vec<String>,
    validation_results: Vec<Vec<IndexMap<String, DataType>>>,
}

#[derive(Debug, Serialize)]
pub struct ModifyFilesOutput {
    message: String,
    duration: i64,
    files: Vec<FileWithId>,
}

pub struct ModifyMetricFilesTool {
    agent: Arc<Agent>,
}

impl ModifyMetricFilesTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

impl FileModificationTool for ModifyMetricFilesTool {}

#[async_trait]
impl ToolExecutor for ModifyMetricFilesTool {
    type Output = ModifyFilesOutput;
    type Params = ModifyFilesParams;

    fn get_name(&self) -> String {
        "update_metrics".to_string()
    }

    async fn is_enabled(&self) -> bool {
        match (
            self.agent.get_state_value("metrics_available").await,
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
        let mut batch = FileModificationBatch {
            metric_files: Vec::new(),
            metric_ymls: Vec::new(),
            failed_modifications: Vec::new(),
            modification_results: Vec::new(),
            validation_messages: Vec::new(),
            validation_results: Vec::new(),
        };

        // Collect file IDs and create map
        let metric_ids: Vec<Uuid> = params.files.iter().map(|f| f.id).collect();
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

        // Fetch metric files
        if !metric_ids.is_empty() {
            match metric_files::table
                .filter(metric_files::id.eq_any(metric_ids))
                .filter(metric_files::deleted_at.is_null())
                .load::<MetricFile>(&mut conn)
                .await
            {
                Ok(files) => {
                    for file in files {
                        if let Some(modifications) = file_map.get(&file.id) {
                            match process_metric_file_modification(
                                file,
                                modifications,
                                start_time.elapsed().as_millis() as i64,
                            )
                            .await
                            {
                                Ok((
                                    metric_file,
                                    metric_yml,
                                    results,
                                    validation_message,
                                    validation_results,
                                )) => {
                                    batch.metric_files.push(metric_file);
                                    batch.metric_ymls.push(metric_yml);
                                    batch.modification_results.extend(results);
                                    batch.validation_messages.push(validation_message);
                                    batch.validation_results.push(validation_results);
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
                        message: format!("Failed to fetch metric files: {}", e),
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

        // Update metric files in database
        if !batch.metric_files.is_empty() {
            use diesel::insert_into;
            match insert_into(metric_files::table)
                .values(&batch.metric_files)
                .on_conflict(metric_files::id)
                .do_update()
                .set((
                    metric_files::content.eq(excluded(metric_files::content)),
                    metric_files::updated_at.eq(Utc::now()),
                    metric_files::verification.eq(Verification::NotRequested),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => {
                    output
                        .files
                        .extend(batch.metric_files.iter().enumerate().map(|(i, file)| {
                            let yml = &batch.metric_ymls[i];
                            FileWithId {
                                id: file.id,
                                name: file.name.clone(),
                                file_type: "metric".to_string(),
                                yml_content: serde_yaml::to_string(&yml).unwrap_or_default(),
                                result_message: Some(batch.validation_messages[i].clone()),
                                results: Some(batch.validation_results[i].clone()),
                                created_at: file.created_at,
                                updated_at: file.updated_at,
                            }
                        }));
                }
                Err(e) => {
                    batch.failed_modifications.push((
                        "metric_files".to_string(),
                        format!("Failed to update metric files: {}", e),
                    ));
                }
            }
        }

        // Generate final message
        if batch.failed_modifications.is_empty() {
            output.message = format!("Successfully modified {} files.", output.files.len());
        } else {
            let success_msg = if !output.files.is_empty() {
                format!("Successfully modified {} files. ", output.files.len())
            } else {
                String::new()
            };

            let failures: Vec<String> = batch
                .failed_modifications
                .iter()
                .map(|(name, error)| format!("Failed to modify '{}': {}", name, error))
                .collect();

            output.message = format!(
                "{}Failed to modify {} files: {}",
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
          "description": "Modifies existing metric configuration files by replacing specified content with new content",
          "strict": true,
          "parameters": {
            "type": "object",
            "required": [
              "files"
            ],
            "properties": {
              "files": {
                "type": "array",
                "description": METRIC_YML_SCHEMA,
                "items": {
                  "type": "object",
                  "required": [
                    "id",
                    "file_name",
                    "modifications"
                  ],
                  "properties": {
                    "id": {
                      "type": "string",
                      "description": "UUID of the file to modify"
                    },
                    "file_name": {
                      "type": "string",
                      "description": "Name of the file to modify"
                    },
                    "modifications": {
                      "type": "array",
                      "description": "List of content replacements to apply to the file",
                      "items": {
                        "type": "object",
                        "required": [
                          "content_to_replace",
                          "new_content"
                        ],
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
                      }
                    }
                  },
                  "additionalProperties": false
                }
              }
            },
            "additionalProperties": false
          }
        })
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
        let original_content = "name: test_metric\ntype: counter\ndescription: A test metric";

        // Test single modification
        let mods1 = vec![Modification {
            content_to_replace: "type: counter".to_string(),
            new_content: "type: gauge".to_string(),
        }];
        let result1 = apply_modifications_to_content(original_content, &mods1, "test.yml").unwrap();
        assert_eq!(
            result1,
            "name: test_metric\ntype: gauge\ndescription: A test metric"
        );

        // Test multiple non-overlapping modifications
        let mods2 = vec![
            Modification {
                content_to_replace: "test_metric".to_string(),
                new_content: "new_metric".to_string(),
            },
            Modification {
                content_to_replace: "A test metric".to_string(),
                new_content: "An updated metric".to_string(),
            },
        ];
        let result2 = apply_modifications_to_content(original_content, &mods2, "test.yml").unwrap();
        assert_eq!(
            result2,
            "name: new_metric\ntype: counter\ndescription: An updated metric"
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
        let tool = ModifyMetricFilesTool {
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
