use std::sync::Arc;
use std::time::Instant;

use anyhow::{anyhow, Result};
use async_trait::async_trait;
use chrono::Utc;
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::debug;
use uuid::Uuid;

use crate::{
    database_dep::{lib::get_pg_pool, models::DashboardFile, schema::dashboard_files},
    utils::{agent::Agent, tools::ToolExecutor},
};

use super::{
    common::validate_metric_ids, file_types::dashboard_yml::DashboardYml, FileModificationTool,
};

use litellm::ToolCall;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardFileParams {
    pub name: String,
    pub yml_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDashboardFilesParams {
    pub files: Vec<DashboardFileParams>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDashboardFilesOutput {
    pub message: String,
    pub duration: i64,
    pub files: Vec<CreateDashboardFile>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDashboardFile {
    pub name: String,
    pub yml_content: String,
}

pub struct CreateDashboardFilesTool {
    agent: Arc<Agent>,
}

impl CreateDashboardFilesTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

impl FileModificationTool for CreateDashboardFilesTool {}

/// Process a dashboard file creation request
/// Returns Ok((DashboardFile, DashboardYml)) if successful, or an error message if failed
async fn process_dashboard_file(
    file: DashboardFileParams,
) -> Result<(DashboardFile, DashboardYml), String> {
    debug!("Processing dashboard file creation: {}", file.name);

    let dashboard_yml = DashboardYml::new(file.yml_content.clone())
        .map_err(|e| format!("Invalid YAML format: {}", e))?;

    let dashboard_id = dashboard_yml
        .id
        .ok_or_else(|| "Missing required field 'id'".to_string())?;

    // Collect and validate metric IDs from rows
    let metric_ids: Vec<Uuid> = dashboard_yml
        .rows
        .iter()
        .flat_map(|row| row.items.iter())
        .map(|item| item.id)
        .collect();

    if !metric_ids.is_empty() {
        match validate_metric_ids(&metric_ids).await {
            Ok(missing_ids) if !missing_ids.is_empty() => {
                return Err(format!("Invalid metric references: {:?}", missing_ids));
            }
            Err(e) => {
                return Err(format!("Failed to validate metrics: {}", e));
            }
            Ok(_) => (), // All metrics exist
        }
    }

    let dashboard_file = DashboardFile {
        id: dashboard_id,
        name: dashboard_yml.name.clone(),
        file_name: format!("{}.yml", file.name),
        content: serde_json::to_value(dashboard_yml.clone())
            .map_err(|e| format!("Failed to process dashboard: {}", e))?,
        filter: None,
        organization_id: Uuid::new_v4(),
        created_by: Uuid::new_v4(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    Ok((dashboard_file, dashboard_yml))
}

#[async_trait]
impl ToolExecutor for CreateDashboardFilesTool {
    type Output = CreateDashboardFilesOutput;

    fn get_name(&self) -> String {
        "create_dashboard_files".to_string()
    }

    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        let start_time = Instant::now();

        let params: CreateDashboardFilesParams =
            match serde_json::from_str(&tool_call.function.arguments.clone()) {
                Ok(params) => params,
                Err(e) => {
                    return Err(anyhow!("Failed to parse create files parameters: {}", e));
                }
            };

        // Get current thread for context
        let current_thread = self
            .agent
            .get_current_thread()
            .await
            .ok_or_else(|| anyhow::anyhow!("No current thread"))?;

        let files = params.files;
        let mut created_files = vec![];
        let mut failed_files = vec![];

        // Process dashboard files
        let mut dashboard_records = vec![];
        let mut dashboard_ymls = vec![];

        // First pass - validate and prepare all records
        for file in files {
            match process_dashboard_file(file.clone()).await {
                Ok((dashboard_file, dashboard_yml)) => {
                    dashboard_records.push(dashboard_file);
                    dashboard_ymls.push(dashboard_yml);
                }
                Err(e) => {
                    failed_files.push((file.name, e));
                }
            }
        }

        // Second pass - bulk insert records
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => return Err(anyhow!(e)),
        };

        // Insert dashboard files
        if !dashboard_records.is_empty() {
            match insert_into(dashboard_files::table)
                .values(&dashboard_records)
                .execute(&mut conn)
                .await
            {
                Ok(_) => {
                    for (i, yml) in dashboard_ymls.into_iter().enumerate() {
                        created_files.push(CreateDashboardFile {
                            name: dashboard_records[i]
                                .file_name
                                .trim_end_matches(".yml")
                                .to_string(),
                            yml_content: serde_yaml::to_string(&yml).unwrap_or_default(),
                        });
                    }
                }
                Err(e) => {
                    failed_files.extend(dashboard_records.iter().map(|r| {
                        (
                            r.file_name.clone(),
                            format!("Failed to create dashboard file: {}", e),
                        )
                    }));
                }
            }
        }

        let message = if failed_files.is_empty() {
            format!(
                "Successfully created {} dashboard files.",
                created_files.len()
            )
        } else {
            let success_msg = if !created_files.is_empty() {
                format!(
                    "Successfully created {} dashboard files. ",
                    created_files.len()
                )
            } else {
                String::new()
            };

            let failures: Vec<String> = failed_files
                .iter()
                .map(|(name, error)| format!("Failed to create '{}': {}", name, error))
                .collect();

            if failures.len() == 1 {
                format!("{}{}.", success_msg.trim(), failures[0])
            } else {
                format!(
                    "{}Failed to create {} dashboard files:\n{}",
                    success_msg,
                    failures.len(),
                    failures.join("\n")
                )
            }
        };

        let duration = start_time.elapsed().as_millis() as i64;

        Ok(CreateDashboardFilesOutput {
            message,
            duration,
            files: created_files,
        })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "create_dashboard_files",
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
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "description": "The name of the dashboard file to be created. This should exclude the file extension. (i.e. '.yml')"
                                },
                                "yml_content": {
                                    "type": "string",
                                    "description": "The YAML content defining the dashboard configuration"
                                }
                            },
                            "additionalProperties": false
                        },
                        "description": "Array of dashboard files to create."
                    }
                },
                "additionalProperties": false
            },
            "description": "Creates **new** dashboard files. Use this if no existing dashboard file can fulfill the user's needs. Guard Rail: Do not execute any file creation or modifications until a thorough data catalog search has been completed and reviewed."
        })
    }
}
