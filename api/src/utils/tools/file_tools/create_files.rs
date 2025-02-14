use std::time::Instant;

use anyhow::Result;
use async_trait::async_trait;
use chrono::Utc;
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::{
    database::{
        enums::Verification,
        lib::get_pg_pool,
        models::{DashboardFile, MetricFile},
        schema::{dashboard_files, metric_files},
    },
    utils::tools::ToolExecutor,
};

use super::{
    file_types::{dashboard_yml::DashboardYml, file::FileEnum, metric_yml::MetricYml},
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

#[async_trait]
impl ToolExecutor for CreateFilesTool {
    type Output = CreateFilesOutput;

    fn get_name(&self) -> String {
        "create_files".to_string()
    }

    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        let start_time = Instant::now();

        let params: CreateFilesParams =
            match serde_json::from_str(&tool_call.function.arguments.clone()) {
                Ok(params) => params,
                Err(e) => {
                    return Err(anyhow::anyhow!(
                        "Failed to parse create files parameters: {}",
                        e
                    ));
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
                "metric" => {
                    match MetricYml::new(file.yml_content.clone()) {
                        Ok(metric_yml) => {
                            if let Some(metric_id) = &metric_yml.id {
                                let metric_file = MetricFile {
                                    id: metric_id.clone(),
                                    name: metric_yml.title.clone(),
                                    file_name: format!("{}.yml", file.name),
                                    content: serde_json::to_value(metric_yml.clone()).unwrap(),
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
                                metric_records.push(metric_file);
                                metric_ymls.push(metric_yml);
                            } else {
                                failed_files.push((file.name, "Metric YML file does not have an id. This should never happen.".to_string()));
                            }
                        }
                        Err(e) => {
                            failed_files.push((file.name, e.to_string()));
                        }
                    }
                }
                "dashboard" => {
                    match DashboardYml::new(file.yml_content.clone()) {
                        Ok(dashboard_yml) => {
                            if let Some(dashboard_id) = &dashboard_yml.id {
                                let dashboard_file = DashboardFile {
                                    id: dashboard_id.clone(),
                                    name: dashboard_yml.name.clone(),
                                    file_name: format!("{}.yml", file.name),
                                    content: serde_json::to_value(dashboard_yml.clone()).unwrap(),
                                    filter: None,
                                    organization_id: Uuid::new_v4(),
                                    created_by: Uuid::new_v4(),
                                    created_at: Utc::now(),
                                    updated_at: Utc::now(),
                                    deleted_at: None,
                                };
                                dashboard_records.push(dashboard_file);
                                dashboard_ymls.push(dashboard_yml);
                            } else {
                                failed_files.push((file.name, "Dashboard YML file does not have an id. This should never happen.".to_string()));
                            }
                        }
                        Err(e) => {
                            failed_files.push((file.name, e.to_string()));
                        }
                    }
                }
                _ => {
                    failed_files.push((file.name, format!("Invalid file type: {}. Currently only `metric` and `dashboard` types are supported.", file.file_type)));
                }
            }
        }

        // Second pass - bulk insert records
        let mut conn = match get_pg_pool().get().await {
            Ok(conn) => conn,
            Err(e) => return Err(anyhow::anyhow!(e)),
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
                            name: metric_records[i].file_name.trim_end_matches(".yml").to_string(),
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
                            name: dashboard_records[i].file_name.trim_end_matches(".yml").to_string(),
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
                                    "description": "The name of the file to be created. This should exlude the file extension. (i.e. '.yml')"
                                },
                                "file_type": {
                                    "type": "string",
                                    "enum": ["metric", "dashboard"],
                                    "description": ""
                                },
                                "yml_content": {
                                    "type": "string",
                                    "description": "The YAML content to be included in the created file"
                                }
                            },
                            "additionalProperties": false
                        },
                        "description": "Array of files to create"
                    }
                },
                "additionalProperties": false
            },
            "description": "Creates **new** metric or dashboard files. Use this if no existing file can fulfill the user's needs. This will automatically open the metric/dashboard for the user."
        })
    }
}
