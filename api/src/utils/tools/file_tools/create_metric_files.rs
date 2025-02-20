use std::time::Instant;
use std::sync::Arc;

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
        models::MetricFile,
        schema::metric_files,
    },
    utils::{agent::Agent, tools::ToolExecutor},
};

use super::{
    common::{validate_sql},
    file_types::metric_yml::MetricYml,
    FileModificationTool,
};

use litellm::ToolCall;

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
    pub files: Vec<CreateMetricFile>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateMetricFile {
    pub name: String,
    pub yml_content: String,
}

pub struct CreateMetricFilesTool {
    agent: Arc<Agent>
}

impl CreateMetricFilesTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

impl FileModificationTool for CreateMetricFilesTool {}

/// Process a metric file creation request
/// Returns Ok((MetricFile, MetricYml)) if successful, or an error message if failed
async fn process_metric_file(file: MetricFileParams) -> Result<(MetricFile, MetricYml), String> {
    debug!("Processing metric file creation: {}", file.name);

    let metric_yml = MetricYml::new(file.yml_content.clone())
        .map_err(|e| format!("Invalid YAML format: {}", e))?;

    let metric_id = metric_yml.id.ok_or_else(|| {
        "Missing required field 'id'".to_string()
    })?;

    // Check if dataset_ids is empty
    if metric_yml.dataset_ids.is_empty() {
        return Err("Missing required field 'dataset_ids'".to_string());
    }

    // Use the first dataset_id for SQL validation
    let dataset_id = metric_yml.dataset_ids[0];
    debug!("Validating SQL using dataset_id: {}", dataset_id);

    // Validate SQL with the selected dataset_id
    if let Err(e) = validate_sql(&metric_yml.sql, &dataset_id).await {
        return Err(format!("Invalid SQL query: {}", e));
    }

    let metric_file = MetricFile {
        id: metric_id,
        name: metric_yml.title.clone(),
        file_name: format!("{}.yml", file.name),
        content: serde_json::to_value(metric_yml.clone())
            .map_err(|e| format!("Failed to process metric: {}", e))?,
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

#[async_trait]
impl ToolExecutor for CreateMetricFilesTool {
    type Output = CreateMetricFilesOutput;

    fn get_name(&self) -> String {
        "create_metric_files".to_string()
    }

    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        let start_time = Instant::now();

        let params: CreateMetricFilesParams = match serde_json::from_str(&tool_call.function.arguments.clone()) {
            Ok(params) => params,
            Err(e) => {
                return Err(anyhow!("Failed to parse create files parameters: {}", e));
            }
        };

        // Get current thread for context
        let current_thread = self.agent.get_current_thread().await
            .ok_or_else(|| anyhow::anyhow!("No current thread"))?;

        let files = params.files;
        let mut created_files = vec![];
        let mut failed_files = vec![];

        // Process metric files
        let mut metric_records = vec![];
        let mut metric_ymls = vec![];

        // First pass - validate and prepare all records
        for file in files {
            match process_metric_file(file.clone()).await {
                Ok((metric_file, metric_yml)) => {
                    metric_records.push(metric_file);
                    metric_ymls.push(metric_yml);
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

        // Insert metric files
        if !metric_records.is_empty() {
            match insert_into(metric_files::table)
                .values(&metric_records)
                .execute(&mut conn)
                .await
            {
                Ok(_) => {
                    for (i, yml) in metric_ymls.into_iter().enumerate() {
                        created_files.push(CreateMetricFile {
                            name: metric_records[i]
                                .file_name
                                .trim_end_matches(".yml")
                                .to_string(),
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

        let message = if failed_files.is_empty() {
            format!("Successfully created {} metric files.", created_files.len())
        } else {
            let success_msg = if !created_files.is_empty() {
                format!("Successfully created {} metric files. ", created_files.len())
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
                    "{}Failed to create {} metric files:\n{}",
                    success_msg,
                    failures.len(),
                    failures.join("\n")
                )
            }
        };

        let duration = start_time.elapsed().as_millis() as i64;

        Ok(CreateMetricFilesOutput {
            message,
            duration,
            files: created_files,
        })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "create_metric_files",
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
                                    "description": "The name of the metric file to be created. This should exclude the file extension. (i.e. '.yml')"
                                },
                                "yml_content": {
                                    "type": "string",
                                    "description": "The YAML content defining the metric configuration"
                                }
                            },
                            "additionalProperties": false
                        },
                        "description": "Array of metric files to create."
                    }
                },
                "additionalProperties": false
            },
            "description": "Creates **new** metric files. Use this if no existing metric file can fulfill the user's needs. Guard Rail: Do not execute any file creation or modifications until a thorough data catalog search has been completed and reviewed."
        })
    }
}