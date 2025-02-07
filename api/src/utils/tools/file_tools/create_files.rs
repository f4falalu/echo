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
    utils::{clients::ai::litellm::ToolCall, tools::ToolExecutor},
};

use super::file_types::{dashboard_yml::DashboardYml, file::FileEnum, metric_yml::MetricYml};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct FileParams {
    name: String,
    file_type: String,
    yml_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct CreateFilesParams {
    files: Vec<FileParams>,
}

#[derive(Debug, Serialize)]
pub struct CreateFilesOutput {
    message: String,
    files: Vec<FileEnum>,
}

pub struct CreateFilesTool;

#[async_trait]
impl ToolExecutor for CreateFilesTool {
    type Output = CreateFilesOutput;

    fn get_name(&self) -> String {
        "create_files".to_string()
    }

    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
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

        for file in files {
            match file.file_type.as_str() {
                "metric" => match create_metric_file(file.clone()).await {
                    Ok(f) => {
                        created_files.push(f);
                        continue;
                    }
                    Err(e) => {
                        failed_files.push((file.name, e.to_string()));
                        continue;
                    }
                },
                "dashboard" => match create_dashboard_file(file.clone()).await {
                    Ok(f) => {
                        created_files.push(f);
                        continue;
                    }
                    Err(e) => {
                        failed_files.push((file.name, e.to_string()));
                        continue;
                    }
                },
                _ => {
                    failed_files.push((file.name, format!("Invalid file type: {}. Currently only `metric` and `dashboard` types are supported.", file.file_type)));
                    continue;
                }
            };
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

        Ok(CreateFilesOutput {
            message,
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

async fn create_metric_file(file: FileParams) -> Result<FileEnum> {
    let metric_yml = match MetricYml::new(file.yml_content) {
        Ok(metric_file) => metric_file,
        Err(e) => return Err(e),
    };

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow::anyhow!(e)),
    };

    let metric_id = match &metric_yml.id {
        Some(id) => id,
        None => {
            return Err(anyhow::anyhow!(
                "Metric YML file does not have an id. This should never happen."
            ))
        }
    };

    let metric_file_record = MetricFile {
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

    match insert_into(metric_files::table)
        .values(&metric_file_record)
        .execute(&mut conn)
        .await
    {
        Ok(metric_file_record) => metric_file_record,
        Err(e) => return Err(anyhow::anyhow!("Failed to create metric file: {}", e)),
    };

    Ok(FileEnum::Metric(metric_yml))
}

async fn create_dashboard_file(file: FileParams) -> Result<FileEnum> {
    let dashboard_yml = match DashboardYml::new(file.yml_content) {
        Ok(dashboard_file) => dashboard_file,
        Err(e) => return Err(e),
    };

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow::anyhow!(e)),
    };

    let dashboard_id = match &dashboard_yml.id {
        Some(id) => id,
        None => {
            return Err(anyhow::anyhow!(
                "Dashboard YML file does not have an id. This should never happen."
            ))
        }
    };

    let dashboard_file_record = DashboardFile {
        id: dashboard_id.clone(),
        name: dashboard_yml
            .name
            .clone()
            .unwrap_or_else(|| "New Dashboard".to_string()),
        file_name: format!("{}.yml", file.name),
        content: serde_json::to_value(dashboard_yml.clone()).unwrap(),
        filter: None,
        organization_id: Uuid::new_v4(),
        created_by: Uuid::new_v4(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    match insert_into(dashboard_files::table)
        .values(&dashboard_file_record)
        .returning(dashboard_files::all_columns)
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => return Err(anyhow::anyhow!(e)),
    };

    Ok(FileEnum::Dashboard(dashboard_yml))
}
