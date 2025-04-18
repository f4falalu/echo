use std::{env, sync::Arc, time::Instant};

use anyhow::{anyhow, Result};
use async_trait::async_trait;
use braintrust::{get_prompt_system_message, BraintrustClient};
use chrono::Utc;
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::AssetPermission,
    pool::get_pg_pool,
    schema::{asset_permissions, metric_files},
};
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use futures::future::join_all;
use indexmap::IndexMap;
use query_engine::data_types::DataType;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{
    agent::Agent,
    tools::{
        file_tools::{
            common::{process_metric_file, METRIC_YML_SCHEMA},
            file_types::file::FileWithId,
        },
        ToolExecutor,
    },
};

use super::FileModificationTool;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MetricFileParams {
    pub name: String,
    pub yml_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateMetricFilesParams {
    pub files: Vec<MetricFileParams>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateMetricFilesOutput {
    pub message: String,
    pub duration: i64,
    pub files: Vec<FileWithId>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateMetricFile {
    pub name: String,
    pub yml_content: String,
}

pub struct CreateMetricFilesTool {
    agent: Arc<Agent>,
}

impl CreateMetricFilesTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

impl FileModificationTool for CreateMetricFilesTool {}

#[async_trait]
impl ToolExecutor for CreateMetricFilesTool {
    type Output = CreateMetricFilesOutput;
    type Params = CreateMetricFilesParams;

    fn get_name(&self) -> String {
        "create_metrics".to_string()
    }

    async fn execute(&self, params: Self::Params, tool_call_id: String) -> Result<Self::Output> {
        let start_time = Instant::now();

        let files = params.files;
        let mut created_files = vec![];
        let mut failed_files = vec![];

        // Create futures for concurrent processing
        let process_futures = files
            .into_iter()
            .map(|file| {
                let tool_call_id_clone = tool_call_id.clone();
                let user_id = self.agent.get_user_id();
                
                async move {
                    let result = process_metric_file(
                        tool_call_id_clone,
                        file.name.clone(),
                        file.yml_content.clone(),
                        &user_id,
                    )
                    .await;
                    
                    (file.name.clone(), result)
                }
            })
            .collect::<Vec<_>>();

        // Wait for all futures to complete
        let results = join_all(process_futures).await;

        // Process results
        let mut metric_records = vec![];
        let mut metric_ymls = vec![];
        let mut results_vec = vec![];

        for (file_name, result) in results {
            match result {
                Ok((metric_file, metric_yml, message, results)) => {
                    metric_records.push(metric_file);
                    metric_ymls.push(metric_yml);
                    results_vec.push((message, results));
                }
                Err(e) => {
                    failed_files.push((file_name, e));
                }
            }
        }

        // Second pass - bulk insert records
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => return Err(anyhow!(e)),
        };

        // Insert metric files
        if !metric_records.is_empty() {
            match insert_into(metric_files::table)
                .values(&metric_records)
                .execute(&mut conn)
                .await
            {
                Ok(_) => {
                    // Get the user ID from the agent state
                    let user_id = self.agent.get_user_id();

                    // Create asset permissions for each metric file
                    let now = Utc::now();
                    let asset_permissions: Vec<AssetPermission> = metric_records
                        .iter()
                        .map(|record| AssetPermission {
                            identity_id: user_id,
                            identity_type: IdentityType::User,
                            asset_id: record.id,
                            asset_type: AssetType::MetricFile,
                            role: AssetPermissionRole::Owner,
                            created_at: now,
                            updated_at: now,
                            deleted_at: None,
                            created_by: user_id,
                            updated_by: user_id,
                        })
                        .collect();

                    // Insert asset permissions
                    match insert_into(asset_permissions::table)
                        .values(&asset_permissions)
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => {
                            tracing::debug!(
                                "Successfully inserted asset permissions for {} metric files",
                                asset_permissions.len()
                            );
                        }
                        Err(e) => {
                            tracing::error!("Error inserting asset permissions: {}", e);
                            // Continue with the process even if permissions failed
                            // We'll still return the created files
                        }
                    }

                    for (i, yml) in metric_ymls.into_iter().enumerate() {
                        created_files.push(FileWithId {
                            id: metric_records[i].id,
                            name: metric_records[i].name.clone(),
                            file_type: "metric".to_string(),
                            yml_content: serde_yaml::to_string(&yml).unwrap_or_default(),
                            result_message: Some(results_vec[i].0.clone()),
                            results: Some(results_vec[i].1.clone()),
                            created_at: metric_records[i].created_at,
                            updated_at: metric_records[i].updated_at,
                            version_number: metric_records[i].version_history.get_version_number(),
                        });
                    }
                }
                Err(e) => {
                    failed_files.extend(metric_records.iter().map(|r| {
                        (
                            r.file_name.clone(),
                            format!("Failed to create metric file: {}", e),
                        )
                    }));
                }
            }
        }

        let message = if failed_files.is_empty() {
            format!("Successfully created {} metric files.", created_files.len())
        } else {
            let success_msg = if !created_files.is_empty() {
                format!(
                    "Successfully created {} metric files. ",
                    created_files.len()
                )
            } else {
                String::new()
            };

            let failures: Vec<String> = failed_files
                .iter()
                .map(|(name, error)| format!("Failed to create '{}': {}.\n\nPlease recreate the metric from scratch rather than attempting to modify. This error could be due to:\n- Using a dataset that doesn't exist (please reevaluate the available datasets in the chat conversation)\n- Invalid configuration in the metric file\n- Special characters in the metric name or SQL query\n- Syntax errors in the SQL query", name, error))
                .collect();

            if failures.len() == 1 {
                format!("{}{}.", success_msg.trim(), failures[0])
            } else {
                format!(
                    "{}Failed to create {} metric files:\n{}",
                    success_msg,
                    failures.len(),
                    failures.join("\n")
                )
            }
        };

        let duration = start_time.elapsed().as_millis() as i64;

        if !created_files.is_empty() {
            self.agent
                .set_state_value(String::from("metrics_available"), Value::Bool(true))
                .await;

            self.agent
                .set_state_value(String::from("files_available"), Value::Bool(true))
                .await;
        }

        // Set review_needed flag if execution was successful
        if failed_files.is_empty() {
            self.agent
                .set_state_value(String::from("review_needed"), Value::Bool(true))
                .await;
        }

        Ok(CreateMetricFilesOutput {
            message,
            duration,
            files: created_files,
        })
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
          "name": self.get_name(),
          "description": get_create_metrics_description().await,
          "strict": true,
          "parameters": {
            "type": "object",
            "required": ["files"],
            "properties": {
              "files": {
                "type": "array",
                "items": {
                  "type": "object",
                  "required": ["name", "yml_content"],
                  "strict": true,
                  "properties": {
                    "name": {
                      "type": "string",
                      "description": get_metric_name_description().await
                    },
                    "yml_content": {
                      "type": "string",
                      "description": get_metric_yml_description().await
                    }
                  },
                  "additionalProperties": false
                },
                "description": "List of file parameters to create. The files will contain YAML content that adheres to the metric schema specification."
              }
            },
            "additionalProperties": false
          }
        })
    }
}

async fn get_create_metrics_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "Creates metric configuration files with YAML content following the metric schema specification. Before using this tool, carefully consider the appropriate visualization type (bar, line, scatter, pie, combo, metric, table) and its specific configuration requirements. Each visualization has unique axis settings, formatting options, and data structure needs that must be thoroughly planned to create effective metrics.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "d53d2ab6-932a-496d-a38d-4858c281beb0").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "Creates metric configuration files with YAML content following the metric schema specification. Before using this tool, carefully consider the appropriate visualization type (bar, line, scatter, pie, combo, metric, table) and its specific configuration requirements. Each visualization has unique axis settings, formatting options, and data structure needs that must be thoroughly planned to create effective metrics.".to_string()
        }
    }
}

async fn get_metric_name_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "The natural language name/title for the metric, exactly matching the 'name' field within the YML content. This name will identify the metric in the UI. Do not include file extensions or use file path characters.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "fb906ebe-9fee-4e62-ab11-ec8f4b473c07").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "The natural language name/title for the metric, exactly matching the 'name' field within the YML content. This name will identify the metric in the UI. Do not include file extensions or use file path characters.".to_string()
        }
    }
}

async fn get_metric_yml_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        // Revert to just returning the schema string
        return METRIC_YML_SCHEMA.to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "54d01b7c-07c9-4c80-8ec7-8026ab8242a9").await {
        Ok(message) => message, 
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            // Revert to just returning the schema string on error
            METRIC_YML_SCHEMA.to_string()
        }
    }
}
