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

use super::file_types::{dashboard_yml::DashboardYml, metric_yml::MetricYml};

#[derive(Debug, Serialize, Deserialize)]
struct FileParams {
    name: String,
    file_type: String,
    yml_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct CreateFilesParams {
    files: Vec<FileParams>,
}

pub struct CreateFilesTool;

#[async_trait]
impl ToolExecutor for CreateFilesTool {
    fn get_name(&self) -> String {
        "create_files".to_string()
    }

    async fn execute(&self, tool_call: &ToolCall) -> Result<Value> {
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

        for file in files {
            match file.file_type.as_str() {
                "metric" => create_metric_file(file).await?,
                "dashboard" => create_dashboard_file(file).await?,
                _ => return Err(anyhow::anyhow!("Invalid file type: {}. Currently only `metric` and `dashboard` types are supported.", file.file_type)),
            }
        }

        Ok(Value::Array(vec![]))
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

async fn create_metric_file(file: FileParams) -> Result<()> {
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
        content: serde_json::to_value(metric_yml).unwrap(),
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

    let metric_file_record = match insert_into(metric_files::table)
        .values(metric_file_record)
        .returning(metric_files::all_columns)
        .execute(&mut conn)
        .await
    {
        Ok(metric_file_record) => metric_file_record,
        Err(e) => return Err(anyhow::anyhow!("Failed to create metric file: {}", e)),
    };

    Ok(())
}

async fn create_dashboard_file(file: FileParams) -> Result<()> {
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
        name: dashboard_yml.name.clone().unwrap_or_else(|| "New Dashboard".to_string()),
        file_name: format!("{}.yml", file.name),
        content: serde_json::to_value(dashboard_yml).unwrap(),
        filter: None,
        organization_id: Uuid::new_v4(),
        created_by: Uuid::new_v4(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    match insert_into(dashboard_files::table)
        .values(dashboard_file_record)
        .returning(dashboard_files::all_columns)
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow::anyhow!(e)),
    }
}
