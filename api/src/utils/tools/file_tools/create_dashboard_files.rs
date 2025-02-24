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
    common::validate_metric_ids, file_types::{dashboard_yml::DashboardYml, file::{FileEnum, FileWithId}}, FileModificationTool,
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

#[derive(Debug, Serialize)]
pub struct CreateDashboardFilesOutput {
    pub message: String,
    pub duration: i64,
    pub files: Vec<FileWithId>,
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
    type Params = CreateDashboardFilesParams;

    fn get_name(&self) -> String {
        "create_dashboard_files".to_string()
    }

    async fn is_enabled(&self) -> bool {
        match self.agent.get_state_value("metrics_available").await {
            Some(_) => true,
            None => false,
        }
    }

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        let start_time = Instant::now();

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
                        created_files.push(FileWithId {
                            id: dashboard_records[i].id,
                            name: dashboard_records[i].name.clone(),
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

        self.agent
            .set_state_value(String::from("files_available"), Value::Bool(true))
            .await;

        self.agent
            .set_state_value(String::from("dashboards_available"), Value::Bool(true))
            .await;

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
                                    "description": "# DASHBOARD SCHEMA (DOCUMENTATION + SPEC)# --- # This YAML file demonstrates how to structure a 'dashboard configuration' file.# The file is annotated with comments that serve as documentation for users.## Each dashboard should have:#   1) A top-level 'title; (string).#   2) A 'rows' field, which is an array of row definitions.#   3) Each row contains an array called 'items' with up to 4 metric objects.#   4) Each metric object has:#         - id (string) : The UUIDv4 identifier of the metric. You should know which metric you want to reference before putting it here.#         - width (int) : must be at least 3 and at most 12#   5) The sum of all widths within a given row should not exceed 12.## This file uses a JSON Schema-like structure but written in YAML. You could# place this in a 'dashboard-schema.yml' for reference or use it as documentation# within your code repository.## ------------------------------------------------------------------------------type: objecttitle: 'Dashboard Configuration Schema'description: 'Specifies the structure and constraints of a dashboard config file.'properties:  # ----------------------  # 1. TITLE  # ----------------------  title:    type: string    description: >      The title of the entire dashboard (e.g. 'Sales & Marketing Dashboard').      This field is mandatory.      # ----------------------      # 2. ROWS      # ----------------------      rows:        type: array        description: >          An array of row objects. Each row represents a 'horizontal band' of          metrics or widgets across the dashboard.        items:          # We define the schema for each row object here.          type: object          properties:            # The row object has 'items' that define individual metrics/widgets.            items:              type: array              description: >                A list (array) of metric definitions. Each metric is represented                by an object that must specify an 'id' and a 'width'.                - Up to 4 items per row (no more).                - Each 'width' must be between 3 and 12.                - The sum of all 'width' values in a single row should not exceed 12.                  # We limit the number of items to 4.              max_items: 4                  # Each array entry must conform to the schema below.              items:                type: object                properties:                  id:                    type: string                    description: >                      The metric's UUIDv4 identifier. You should know which metric you want to reference before putting it here.                      Example: '123e4567-e89b-12d3-a456-426614174000'                                        width:                    type: integer                    description: >                      The width allocated to this metric within the row.                      Valid values range from 3 to 12.                      Combined with other items in the row, the total 'width'                      must not exceed 12.                    minimum: 3                    maximum: 12                # Both fields are mandatory for each item.                required:                  - id                  - width          # The 'items' field must be present in each row.          required:            - items        # Top-level 'title' and 'rows' are required for every valid dashboard config.    required:      - title        # ------------------------------------------------------------------------------    # NOTE ON WIDTH SUM VALIDATION:    # ------------------------------------------------------------------------------    # Classic JSON Schema doesn't have a direct, simple way to enforce that the sum    # of all 'width' fields in a row is <= 12. One common approach is to use    # 'allOf', 'if/then' or 'contains' with advanced constructs, or simply rely on    # custom validation logic in your application.    #    # If you rely on external validation logic, you can highlight in your docs that    # end users must ensure each row's total width does not exceed 12.    # ------------------------------------------------------------------------------    ```"
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
