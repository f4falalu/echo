use std::sync::Arc;
use std::time::Instant;

use anyhow::{anyhow, Result};
use async_trait::async_trait;
use chrono::Utc;
use database::{pool::get_pg_pool, schema::metric_files};
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tracing::debug;
use uuid::Uuid;
use middleware::AuthenticatedUser;

use crate::{
    agent::Agent,
    tools::{
        file_tools::{
            common::{process_metric_file, METRIC_YML_SCHEMA},
            file_types::{file::FileWithId},
        },
        ToolExecutor,
    },
};

use super::{common::{validate_sql, generate_deterministic_uuid}, FileModificationTool};

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

    async fn is_enabled(&self) -> bool {
        match (
            self.agent.get_state_value("data_context").await,
            self.agent.get_state_value("plan_available").await,
        ) {
            (Some(_), Some(_)) => true,
            _ => false,
        }
    }

    async fn execute(&self, params: Self::Params, tool_call_id: String, user: AuthenticatedUser) -> Result<Self::Output> {
        let start_time = Instant::now();

        let files = params.files;
        let mut created_files = vec![];
        let mut failed_files = vec![];

        // Process metric files
        let mut metric_records = vec![];
        let mut metric_ymls = vec![];
        let mut results_vec = vec![];
        // First pass - validate and prepare all records
        for file in files {
            match process_metric_file(tool_call_id.clone(), file.name.clone(), file.yml_content.clone()).await {
                Ok((metric_file, metric_yml, message, results)) => {
                    metric_records.push(metric_file);
                    metric_ymls.push(metric_yml);
                    results_vec.push((message, results));
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
                        created_files.push(FileWithId {
                            id: metric_records[i].id,
                            name: metric_records[i].name.clone(),
                            file_type: "metric".to_string(),
                            yml_content: serde_yaml::to_string(&yml).unwrap_or_default(),
                            result_message: Some(results_vec[i].0.clone()),
                            results: Some(results_vec[i].1.clone()),
                            created_at: metric_records[i].created_at,
                            updated_at: metric_records[i].updated_at,
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

        self.agent
            .set_state_value(String::from("metrics_available"), Value::Bool(true))
            .await;

        self.agent
            .set_state_value(String::from("files_available"), Value::Bool(true))
            .await;

        Ok(CreateMetricFilesOutput {
            message,
            duration,
            files: created_files,
        })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
          "name": self.get_name(),
          "description": "Creates metric configuration files with YAML content following the metric schema specification",
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
                      "description": "This is a natural language name/title for the metric. It will be used to identify the metric in the UI."
                    },
                    "yml_content": {
                      "type": "string",
                      "description": METRIC_YML_SCHEMA
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
