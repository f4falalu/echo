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
    database_dep::{
        enums::Verification,
        lib::get_pg_pool,
        models::{DashboardFile, MetricFile},
        schema::{dashboard_files, metric_files},
    },
    utils::tools::ToolExecutor,
};

use super::{
    common::{validate_metric_ids, validate_sql},
    file_types::{dashboard_yml::DashboardYml, metric_yml::MetricYml},
    FileModificationTool,
};

use litellm::ToolCall;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileParams {
    pub name: String,
    pub file_type: String,
    pub yml_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFilesParams {
    pub files: Vec<FileParams>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFilesOutput {
    pub message: String,
    pub duration: i64,
    pub files: Vec<CreateFilesFile>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFilesFile {
    pub name: String,
    pub file_type: String,
    pub yml_content: String,
}

pub struct CreateFilesTool;

impl CreateFilesTool {
    pub fn new() -> Self {
        Self
    }
}

impl FileModificationTool for CreateFilesTool {}

/// Process a metric file creation request
/// Returns Ok((MetricFile, MetricYml)) if successful, or an error message if failed
async fn process_metric_file(file: FileParams) -> Result<(MetricFile, MetricYml), String> {
    debug!("Processing metric file creation: {}", file.name);

    let metric_yml = MetricYml::new(file.yml_content.clone())
        .map_err(|e| format!("Failed to parse metric YAML: {}", e))?;

    let metric_id = metric_yml.id.ok_or_else(|| {
        "Metric YML file does not have an id. This should never happen.".to_string()
    })?;

    // Validate SQL
    if let Err(e) = validate_sql(&metric_yml.sql, &metric_id).await {
        return Err(format!("SQL validation failed: {}", e));
    }

    let metric_file = MetricFile {
        id: metric_id,
        name: metric_yml.title.clone(),
        file_name: format!("{}.yml", file.name),
        content: serde_json::to_value(metric_yml.clone())
            .map_err(|e| format!("Failed to serialize metric content: {}", e))?,
        created_by: Uuid::new_v4(),
        verification: Verification::NotRequested,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id: Uuid::new_v4(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    Ok((metric_file, metric_yml))
}

/// Process a dashboard file creation request
/// Returns Ok((DashboardFile, DashboardYml)) if successful, or an error message if failed
async fn process_dashboard_file(file: FileParams) -> Result<(DashboardFile, DashboardYml), String> {
    debug!("Processing dashboard file creation: {}", file.name);

    let dashboard_yml = DashboardYml::new(file.yml_content.clone())
        .map_err(|e| format!("Failed to parse dashboard YAML: {}", e))?;

    let dashboard_id = dashboard_yml.id.ok_or_else(|| {
        "Dashboard YML file does not have an id. This should never happen.".to_string()
    })?;

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
                return Err(format!("Referenced metrics not found: {:?}", missing_ids));
            }
            Err(e) => {
                return Err(format!("Failed to validate metric IDs: {}", e));
            }
            Ok(_) => (), // All metrics exist
        }
    }

    let dashboard_file = DashboardFile {
        id: dashboard_id,
        name: dashboard_yml.name.clone(),
        file_name: format!("{}.yml", file.name),
        content: serde_json::to_value(dashboard_yml.clone())
            .map_err(|e| format!("Failed to serialize dashboard content: {}", e))?,
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
impl ToolExecutor for CreateFilesTool {
    type Output = CreateFilesOutput;

    fn get_name(&self) -> String {
        "create_files".to_string()
    }

    async fn execute(
        &self,
        tool_call: &ToolCall,
        user_id: &Uuid,
        session_id: &Uuid,
    ) -> Result<Self::Output> {
        let start_time = Instant::now();

        let params: CreateFilesParams =
            match serde_json::from_str(&tool_call.function.arguments.clone()) {
                Ok(params) => params,
                Err(e) => {
                    return Err(anyhow!("Failed to parse create files parameters: {}", e));
                }
            };

        let files = params.files;
        let mut created_files = vec![];
        let mut failed_files = vec![];

        // Separate files by type and validate/prepare them
        let mut metric_records = vec![];
        let mut dashboard_records = vec![];
        let mut metric_ymls = vec![];
        let mut dashboard_ymls = vec![];

        // First pass - validate and prepare all records
        for file in files {
            match file.file_type.as_str() {
                "metric" => match process_metric_file(file.clone()).await {
                    Ok((metric_file, metric_yml)) => {
                        metric_records.push(metric_file);
                        metric_ymls.push(metric_yml);
                    }
                    Err(e) => {
                        failed_files.push((file.name, e));
                    }
                },
                "dashboard" => match process_dashboard_file(file.clone()).await {
                    Ok((dashboard_file, dashboard_yml)) => {
                        dashboard_records.push(dashboard_file);
                        dashboard_ymls.push(dashboard_yml);
                    }
                    Err(e) => {
                        failed_files.push((file.name, e));
                    }
                },
                _ => {
                    failed_files.push((
                        file.name,
                        format!(
                            "Invalid file type: {}. Currently only `metric` and `dashboard` types are supported.",
                            file.file_type
                        ),
                    ));
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
                    for (i, yml) in metric_ymls.into_iter().enumerate() {
                        created_files.push(CreateFilesFile {
                            name: metric_records[i]
                                .file_name
                                .trim_end_matches(".yml")
                                .to_string(),
                            file_type: "metric".to_string(),
                            yml_content: serde_yaml::to_string(&yml).unwrap_or_default(),
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

        // Insert dashboard files
        if !dashboard_records.is_empty() {
            match insert_into(dashboard_files::table)
                .values(&dashboard_records)
                .execute(&mut conn)
                .await
            {
                Ok(_) => {
                    for (i, yml) in dashboard_ymls.into_iter().enumerate() {
                        created_files.push(CreateFilesFile {
                            name: dashboard_records[i]
                                .file_name
                                .trim_end_matches(".yml")
                                .to_string(),
                            file_type: "dashboard".to_string(),
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
            format!("Successfully created {} files.", created_files.len())
        } else {
            let success_msg = if !created_files.is_empty() {
                format!("Successfully created {} files. ", created_files.len())
            } else {
                String::new()
            };

            let failures: Vec<String> = failed_files
                .iter()
                .map(|(name, error)| format!("Failed to create '{}': {}", name, error))
                .collect();

            format!(
                "{}Failed to create {} files: {}",
                success_msg,
                failed_files.len(),
                failures.join("; ")
            )
        };

        let duration = start_time.elapsed().as_millis() as i64;

        Ok(CreateFilesOutput {
            message,
            duration,
            files: created_files,
        })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "create_files",
            "strict": true,
            "parameters": {
                "type": "object",
                "required": ["files"],
                "properties": {
                    "files": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["name", "file_type", "yml_content"],
                            "properties": {
                                "name": {
                                    "type": "string",
                                    "description": "The name of the file to be created. This should exclude the file extension. (i.e. '.yml')"
                                },
                                "file_type": {
                                    "type": "string",
                                    "enum": ["metric", "dashboard"],
                                    "description": "The type of file to create. All files in a single request must be of the same type. Metrics and dashboards cannot be created in the same request."
                                },
                                "yml_content": {
                                    "type": "string",
                                    "description": "The YAML content defining the metric or dashboard configuration"
                                }
                            },
                            "additionalProperties": false
                        },
                        "description": "Array of files to create. All files in a single request must be of the same type (either all metrics or all dashboards). Metrics must be created in a separate request from dashboards since dashboards depend on existing metrics."
                    }
                },
                "additionalProperties": false
            },
            "description": "Creates **new** metric or dashboard files. Use this if no existing file can fulfill the user's needs. IMPORTANT: Metrics and dashboards must be created in separate requests - you cannot mix them in the same request. Create metrics first, then create dashboards that reference those metrics in a separate request."
        })
    }
}
