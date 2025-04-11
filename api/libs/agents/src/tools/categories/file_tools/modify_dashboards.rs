use std::time::Instant;
use std::{env, sync::Arc};

use anyhow::Result;
use async_trait::async_trait;
use braintrust::{get_prompt_system_message, BraintrustClient};
use database::{
    models::DashboardFile, pool::get_pg_pool, schema::dashboard_files, types::DashboardYml,
};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use indexmap::IndexMap;
use query_engine::data_types::DataType;
use serde_json::Value;
use tracing::{debug, error, info};

use super::{
    common::{
        process_dashboard_file_modification, ModificationResult, ModifyFilesOutput,
        ModifyFilesParams, FailedFileModification,
    },
    file_types::file::FileWithId,
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

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
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

                    // Process the dashboard file modification
                    match process_dashboard_file_modification(
                        dashboard_file.clone(),
                        &modification,
                        duration,
                    )
                    .await
                    {
                        Ok((
                            mut dashboard_file,
                            dashboard_yml,
                            results,
                            validation_message,
                            validation_results,
                        )) => {
                            // Calculate next version number from existing version history
                            let next_version =
                                match dashboard_file.version_history.get_latest_version() {
                                    Some(version) => version.version_number + 1,
                                    None => 1,
                                };

                            // Add new version to history
                            dashboard_file
                                .version_history
                                .add_version(next_version, dashboard_yml.clone());

                            // Ensure the name field is updated
                            // This is redundant but ensures the name is set correctly
                            dashboard_file.name = dashboard_yml.name.clone();

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

        // Update dashboard files in database with version history
        if !batch.files.is_empty() {
            use diesel::insert_into;
            match insert_into(dashboard_files::table)
                .values(&batch.files)
                .on_conflict(dashboard_files::id)
                .do_update()
                .set((
                    dashboard_files::content.eq(excluded(dashboard_files::content)),
                    dashboard_files::updated_at.eq(excluded(dashboard_files::updated_at)),
                    // Add version history and name to ensure they're updated
                    dashboard_files::version_history.eq(excluded(dashboard_files::version_history)),
                    // Explicitly set name even though it's in content to ensure it's updated in case content parsing fails
                    dashboard_files::name.eq(excluded(dashboard_files::name)),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => {
                    debug!("Successfully updated dashboard files with versioning");
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
            message: format!(
                "Modified {} dashboard files and created new versions. {} failures.",
                batch.files.len(),
                batch.failed_modifications.len()
            ),
            duration,
            files: Vec::new(),
            failed_files: Vec::new(),
        };

        // Add successful files to output
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
                    version_number: file.version_history.get_version_number(),
                }
            }));

        // Add failed modifications to output
        output.failed_files.extend(
            batch
                .failed_modifications
                .into_iter()
                .map(|(file_name, error)| FailedFileModification { file_name, error }),
        );

        Ok(output)
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": get_modify_dashboards_description().await,
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["files"],
                "properties": {
                    "files": {
                        "type": "array",
                        "description": get_modify_dashboards_yml_description().await,
                        "items": {
                            "type": "object",
                            "required": ["id", "file_name", "modifications"],
                            "properties": {
                                "id": {
                                    "type": "string",
                                    "description": get_dashboard_modification_id_description().await
                                },
                                "file_name": {
                                    "type": "string",
                                    "description": get_modify_dashboards_file_name_description().await
                                },
                                "modifications": {
                                    "type": "array",
                                    "description": get_modify_dashboards_modifications_description().await,
                                    "items": {
                                        "type": "object",
                                        "required": ["content_to_replace", "new_content"],
                                        "properties": {
                                            "content_to_replace": {
                                                "type": "string",
                                                "description": get_modify_dashboards_content_to_replace_description().await
                                            },
                                            "new_content": {
                                                "type": "string",
                                                "description": get_modify_dashboards_new_content_description().await
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

async fn get_modify_dashboards_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "Modifies existing dashboard configuration files by replacing specified content with new content. If the dashboard fundamentally changes, the name should be updated to reflect the changes. However, if the core dashboard topic remains the same, the name should stay unchanged.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "e48ea999-fd99-4b17-9dbe-8b048af96eab").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "Modifies existing dashboard configuration files by replacing specified content with new content. If the dashboard fundamentally changes, the name should be updated to reflect the changes. However, if the core dashboard topic remains the same, the name should stay unchanged.".to_string()
        }
    }
}

async fn get_modify_dashboards_yml_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return format!("{}. When making significant changes to a dashboard, update the name to reflect these changes. If the dashboard's core topic remains the same, keep the original name.", DASHBOARD_YML_SCHEMA);
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "9d2cc19b-32be-49bf-a2c2-1a82d0806230").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            format!("{}. When making significant changes to a dashboard, update the name to reflect these changes. If the dashboard's core topic remains the same, keep the original name.", DASHBOARD_YML_SCHEMA)
        }
    }
}

async fn get_dashboard_modification_id_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "UUID of the file to modify".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "1d9cda62-53eb-4c5c-9c33-d3f81667b249").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "UUID of the file to modify".to_string()
        }
    }
}

async fn get_modify_dashboards_file_name_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "Name of the dashboard file to modify".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "5e0761df-2668-40f3-874e-84eb54c66e4d").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "Name of the dashboard file to modify".to_string()
        }
    }
}

async fn get_modify_dashboards_modifications_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "List of content modifications to make to the dashboard file".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "ee5789a9-fd99-4afd-a5c4-88f2ebe58fe9").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "List of content modifications to make to the dashboard file".to_string()
        }
    }
}

async fn get_modify_dashboards_new_content_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "The new content to replace the existing content with. If fundamentally changing the dashboard's purpose or focus, update the name property accordingly. If the core topic remains the same, maintain the original name.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "258a84a6-ec1a-4f45-b586-04853272deeb").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "The new content to replace the existing content with. If fundamentally changing the dashboard's purpose or focus, update the name property accordingly. If the core topic remains the same, maintain the original name.".to_string()
        }
    }
}

async fn get_modify_dashboards_content_to_replace_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "The exact content in the file that should be replaced. Precise matching is crucial: the provided content must match exactly and be specific enough to target only the intended section, avoiding unintended replacements. This should typically be a small, specific snippet; replacing the entire file content is usually not intended unless the entire dashboard definition needs a complete overhaul. Use an empty string to append the new content to the end of the file."
            .to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "7e89b1f9-30ed-4f0c-b4da-32ce03f31635").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "The exact content in the file that should be replaced. Precise matching is crucial: the provided content must match exactly and be specific enough to target only the intended section, avoiding unintended replacements. This should typically be a small, specific snippet; replacing the entire file content is usually not intended unless the entire dashboard definition needs a complete overhaul. Use an empty string to append the new content to the end of the file.".to_string()
        }
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use crate::tools::categories::file_tools::common::{
        apply_modifications_to_content, Modification, ModificationResult,
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

    #[test]
    fn test_apply_modifications_append() {
        let original_content = "name: test_dashboard\ntype: dashboard\ndescription: A test dashboard";

        // Test appending content with empty content_to_replace
        let mods = vec![Modification {
            content_to_replace: "".to_string(),
            new_content: "\nvisibility: public".to_string(),
        }];
        let result = apply_modifications_to_content(original_content, &mods, "test.yml").unwrap();
        assert_eq!(
            result,
            "name: test_dashboard\ntype: dashboard\ndescription: A test dashboard\nvisibility: public"
        );
    }
}
