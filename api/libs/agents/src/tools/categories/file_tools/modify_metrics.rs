use std::{env, sync::Arc, time::Instant};

use anyhow::Result;
use async_trait::async_trait;
use braintrust::{get_prompt_system_message, BraintrustClient};
use database::{
    models::MetricFile, pool::get_pg_pool, schema::metric_files,
    types::MetricYml,
};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use indexmap::IndexMap;
use query_engine::data_types::DataType;
use serde_json::Value;
use tracing::{debug, error, info};
use uuid::Uuid;

use super::{
    common::{
        process_metric_file_modification, ModificationResult, ModifyFilesOutput,
        ModifyFilesParams,
    },
    file_types::file::FileWithId,
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
        matches!((
            self.agent.get_state_value("metrics_available").await,
            self.agent.get_state_value("plan_available").await,
        ), (Some(_), Some(_)))
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
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
        let _output = ModifyFilesOutput {
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
        output
            .files
            .extend(batch.files.iter().enumerate().map(|(i, file)| {
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

    async fn get_schema(&self) -> Value {
        serde_json::json!({
          "name": self.get_name(),
          "description": get_modify_metrics_description().await,
          "strict": true,
          "parameters": {
            "type": "object",
            "required": ["files"],
            "properties": {
              "files": {
                "type": "array",
                "description": get_modify_metrics_yml_description().await,
                "items": {
                  "type": "object",
                  "required": ["id", "file_name", "modifications"],
                  "properties": {
                    "id": {
                      "type": "string",
                      "description": get_metric_id_description().await
                    },
                    "file_name": {
                      "type": "string",
                      "description": get_modify_metrics_file_name_description().await
                    },
                    "modifications": {
                      "type": "array",
                      "description": get_modify_metrics_modifications_description().await,
                      "items": {
                        "type": "object",
                        "required": [
                          "content_to_replace",
                          "new_content"
                        ],
                        "properties": {
                          "content_to_replace": {
                            "type": "string",
                            "description": get_modify_metrics_content_to_replace_description().await
                          },
                          "new_content": {
                            "type": "string",
                            "description": get_modify_metrics_new_content_description().await
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

async fn get_modify_metrics_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "Modifies existing metric configuration files by replacing specified content with new content".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "d7aafe5a-95bc-4ad4-9c02-27e9124a9cd4").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "Modifies existing metric configuration files by replacing specified content with new content".to_string()
        }
    }
}

async fn get_modify_metrics_yml_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return METRIC_YML_SCHEMA.to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "54d01b7c-07c9-4c80-8ec7-8026ab8242a9").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            METRIC_YML_SCHEMA.to_string()
        }
    }
}

async fn get_modify_metrics_file_name_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "Name of the metric file to modify".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "5e9e0a31-760a-483f-8876-41f2027bf731").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "Name of the metric file to modify".to_string()
        }
    }
}

async fn get_modify_metrics_modifications_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "List of content modifications to make to the metric file".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "c56d3034-e527-45b6-aa2e-18fb5e3240de").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "List of content modifications to make to the metric file".to_string()
        }
    }
}

async fn get_modify_metrics_new_content_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "The new content to replace the existing content with".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "28467bdb-6cab-49ce-bca5-193d26c620b2").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "The new content to replace the existing content with".to_string()
        }
    }
}

async fn get_modify_metrics_content_to_replace_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "The exact content in the file that should be replaced. Must match exactly.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "ad7e79f0-dd3a-4239-9548-ee7f4ef3be5a").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "The exact content in the file that should be replaced. Must match exactly.".to_string()
        }
    }
}

async fn get_metric_id_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "UUID of the file to modify".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "471a0880-72f9-4989-bf47-397884a944fd").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "UUID of the file to modify".to_string()
        }
    }
}

#[cfg(test)]
mod tests {

    use crate::tools::file_tools::common::{apply_modifications_to_content, Modification};

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

        // Test valid parameters
        let valid_params = json!({
            "files": [{
                "id": Uuid::new_v4().to_string(),
                "file_name": "test.yml",
                "modifications": [{
                    "new_content": "new content",
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
