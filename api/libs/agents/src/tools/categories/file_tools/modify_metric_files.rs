use std::sync::Arc;
use std::time::Instant;

use anyhow::Result;
use async_trait::async_trait;
use chrono::Utc;
use database::{enums::Verification, models::MetricFile, pool::get_pg_pool, schema::metric_files, types::MetricYml};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use indexmap::IndexMap;
use middleware::AuthenticatedUser;
use query_engine::data_types::DataType;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::{debug, info, error};
use uuid::Uuid;

use super::{
    common::{FileModification, Modification, ModificationResult, process_metric_file_modification, ModifyFilesParams, ModifyFilesOutput, FileModificationBatch, apply_modifications_to_content},
    file_types::{file::FileWithId},
    FileModificationTool,
};
use crate::{
    agent::Agent,
    tools::{file_tools::common::METRIC_YML_SCHEMA, ToolExecutor},
};

#[derive(Debug)]
struct MetricModificationBatch {
    pub files: Vec<MetricFile>,
    pub ymls: Vec<MetricYml>,
    pub failed_modifications: Vec<(String, String)>,
    pub modification_results: Vec<ModificationResult>,
    pub validation_messages: Vec<String>,
    pub validation_results: Vec<Vec<IndexMap<String, DataType>>>,
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

    async fn execute(&self, params: Self::Params, tool_call_id: String, user: AuthenticatedUser) -> Result<Self::Output> {
        let start_time = Instant::now();

        debug!("Starting file modification execution");

        info!("Processing {} files for modification", params.files.len());

        // Initialize batch processing structures
        let mut batch = MetricModificationBatch {
            files: Vec::new(),
            ymls: Vec::new(),
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
                                    batch.files.push(metric_file);
                                    batch.ymls.push(metric_yml);
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
        if !batch.files.is_empty() {
            use diesel::insert_into;
            match insert_into(metric_files::table)
                .values(&batch.files)
                .on_conflict(metric_files::id)
                .do_update()
                .set((
                    metric_files::content.eq(excluded(metric_files::content)),
                    metric_files::updated_at.eq(excluded(metric_files::updated_at)),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => {
                    debug!("Successfully updated metric files in database");
                }
                Err(e) => {
                    error!("Failed to update metric files in database: {}", e);
                    return Err(anyhow::anyhow!(
                        "Failed to update metric files in database: {}",
                        e
                    ));
                }
            }
        }

        // Generate output
        let duration = start_time.elapsed().as_millis() as i64;
        let mut output = ModifyFilesOutput {
            message: format!("Modified {} metric files", batch.files.len()),
            duration,
            files: Vec::new(),
        };

        // Add files to output
        output.files.extend(batch.files.iter().enumerate().map(|(i, file)| {
            let yml = &batch.ymls[i];
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
