use anyhow::Result;
use async_trait::async_trait;
use diesel::insert_into;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{
    database::{lib::get_pg_pool, schema::metric_files},
    utils::{clients::ai::litellm::ToolCall, tools::ToolExecutor},
};

use super::file_types::{dashboard_file::DashboardFile, metric_file::MetricFile};

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
                "metric" => create_metric_file(file)?,
                "dashboard" => create_dashboard_file(file)?,
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
    let metric_file = match MetricFile::new(file.yml_content) {
        Ok(metric_file) => metric_file,
        Err(e) => return Err(e),
    };

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(e),
    };

    // TODO: Add Metric File Record here.

    let metric_file_record = match insert_into(metric_files::table)
        .values(metric_file)
        .returning(metric_files::all_columns)
        .execute(&mut conn)
        .await
    {
        Ok(metric_file_record) => metric_file_record,
        Err(e) => return Err(e),
    };

    Ok(())
}

fn create_dashboard_file(file: FileParams) -> Result<()> {
    let dashboard_file = match DashboardFile::new(file.yml_content) {
        Ok(dashboard_file) => dashboard_file,
        Err(e) => return Err(e),
    };

    Ok(())
}
