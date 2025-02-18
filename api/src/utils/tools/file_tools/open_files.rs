use anyhow::Result;
use async_trait::async_trait;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::{HashMap, HashSet},
    time::Instant,
};
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use super::FileModificationTool;
use crate::{
    database_dep::{
        lib::get_pg_pool,
        models::{DashboardFile, MetricFile},
        schema::{dashboard_files, metric_files},
    },
    utils::{
        tools::file_tools::file_types::{
            dashboard_yml::DashboardYml, file::FileEnum, metric_yml::MetricYml,
        },
        tools::ToolExecutor,
    },
};

use litellm::ToolCall;

#[derive(Debug, Serialize, Deserialize)]
struct FileRequest {
    id: String,
    file_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenFilesParams {
    files: Vec<FileRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OpenFilesOutput {
    pub message: String,
    pub duration: i64,
    pub results: Vec<FileEnum>,
}

pub struct OpenFilesTool;

impl OpenFilesTool {
    pub fn new() -> Self {
        Self
    }
}

impl FileModificationTool for OpenFilesTool {}

#[async_trait]
impl ToolExecutor for OpenFilesTool {
    type Output = OpenFilesOutput;

    fn get_name(&self) -> String {
        "open_files".to_string()
    }

    async fn execute(
        &self,
        tool_call: &ToolCall,
        user_id: &Uuid,
        session_id: &Uuid,
    ) -> Result<Self::Output> {
        let start_time = Instant::now();

        debug!("Starting file open operation");
        let params: OpenFilesParams = serde_json::from_str(&tool_call.function.arguments.clone())
            .map_err(|e| {
            error!(error = %e, "Failed to parse tool parameters");
            anyhow::anyhow!("Failed to parse tool parameters: {}", e)
        })?;

        let mut results = Vec::new();
        let mut error_messages = Vec::new();

        // Track requested IDs by type for later comparison
        let mut requested_ids: HashMap<String, HashSet<Uuid>> = HashMap::new();
        let mut found_ids: HashMap<String, HashSet<Uuid>> = HashMap::new();

        // Group requests by file type and track requested IDs
        let grouped_requests = params
            .files
            .into_iter()
            .filter_map(|req| match Uuid::parse_str(&req.id) {
                Ok(id) => {
                    requested_ids
                        .entry(req.file_type.clone())
                        .or_default()
                        .insert(id);
                    Some((req.file_type, id))
                }
                Err(_) => {
                    warn!(invalid_id = %req.id, "Invalid UUID format");
                    error_messages.push(format!("Invalid UUID format for id: {}", req.id));
                    None
                }
            })
            .fold(HashMap::new(), |mut acc, (file_type, id)| {
                acc.entry(file_type).or_insert_with(Vec::new).push(id);
                acc
            });

        // Process dashboard files
        if let Some(dashboard_ids) = grouped_requests.get("dashboard") {
            match get_dashboard_files(dashboard_ids).await {
                Ok(dashboard_files) => {
                    for (dashboard_yml, id, _) in dashboard_files {
                        found_ids
                            .entry("dashboard".to_string())
                            .or_default()
                            .insert(id);
                        results.push(FileEnum::Dashboard(dashboard_yml));
                    }
                }
                Err(e) => {
                    error!(error = %e, "Failed to process dashboard files");
                    error_messages.push(format!("Error processing dashboard files: {}", e));
                }
            }
        }

        // Process metric files
        if let Some(metric_ids) = grouped_requests.get("metric") {
            match get_metric_files(metric_ids).await {
                Ok(metric_files) => {
                    for (metric_yml, id, _) in metric_files {
                        found_ids
                            .entry("metric".to_string())
                            .or_default()
                            .insert(id);
                        results.push(FileEnum::Metric(metric_yml));
                    }
                }
                Err(e) => {
                    error!(error = %e, "Failed to process metric files");
                    error_messages.push(format!("Error processing metric files: {}", e));
                }
            }
        }

        // Generate message about missing files
        let mut missing_files = Vec::new();
        for (file_type, ids) in requested_ids.iter() {
            let found = found_ids.get(file_type).cloned().unwrap_or_default();
            let missing: Vec<_> = ids.difference(&found).collect();
            if !missing.is_empty() {
                warn!(
                    file_type = %file_type,
                    missing_count = missing.len(),
                    missing_ids = ?missing,
                    "Files not found"
                );
                missing_files.push(format!(
                    "{} {}s: {}",
                    missing.len(),
                    file_type,
                    missing
                        .iter()
                        .map(|id| id.to_string())
                        .collect::<Vec<_>>()
                        .join(", ")
                ));
            }
        }

        let message = build_status_message(&results, &missing_files, &error_messages);
        info!(
            total_requested = requested_ids.values().map(|ids| ids.len()).sum::<usize>(),
            total_found = results.len(),
            error_count = error_messages.len(),
            "Completed file open operation"
        );

        let duration = start_time.elapsed().as_millis();

        Ok(OpenFilesOutput {
            message,
            duration: duration as i64,
            results,
        })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "open_files",
            "description": "Opens one or more dashboard or metric files and returns their YML contents",
            "parameters": {
                "type": "object",
                "required": ["files"],
                "properties": {
                    "files": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": ["id", "file_type"],
                            "properties": {
                                "id": {
                                    "type": "string",
                                    "description": "The UUID of the file"
                                },
                                "file_type": {
                                    "type": "string",
                                    "enum": ["dashboard", "metric"],
                                    "description": "The type of file to read"
                                }
                            }
                        },
                        "description": "List of files to be opened"
                    }
                }
            }
        })
    }
}

async fn get_dashboard_files(ids: &[Uuid]) -> Result<Vec<(DashboardYml, Uuid, String)>> {
    debug!(dashboard_ids = ?ids, "Fetching dashboard files");
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        error!(error = %e, "Failed to get database connection");
        anyhow::anyhow!("Failed to get database connection: {}", e)
    })?;

    let files = match dashboard_files::table
        .filter(dashboard_files::id.eq_any(ids))
        .filter(dashboard_files::deleted_at.is_null())
        .load::<DashboardFile>(&mut conn)
        .await
    {
        Ok(files) => {
            debug!(
                count = files.len(),
                "Successfully loaded dashboard files from database"
            );
            files
        }
        Err(e) => {
            error!(error = %e, "Failed to load dashboard files from database");
            return Err(anyhow::anyhow!(
                "Error loading dashboard files from database: {}",
                e
            ));
        }
    };

    let mut results = Vec::new();
    for file in files {
        match serde_json::from_value(file.content.clone()) {
            Ok(dashboard_yml) => {
                debug!(dashboard_id = %file.id, "Successfully parsed dashboard YAML");
                results.push((dashboard_yml, file.id, file.updated_at.to_string()));
            }
            Err(e) => {
                warn!(
                    error = %e,
                    dashboard_id = %file.id,
                    "Failed to parse dashboard YAML"
                );
            }
        }
    }

    info!(
        requested_count = ids.len(),
        found_count = results.len(),
        "Completed dashboard files retrieval"
    );
    Ok(results)
}

async fn get_metric_files(ids: &[Uuid]) -> Result<Vec<(MetricYml, Uuid, String)>> {
    debug!(metric_ids = ?ids, "Fetching metric files");
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        error!(error = %e, "Failed to get database connection");
        anyhow::anyhow!("Failed to get database connection: {}", e)
    })?;

    let files = match metric_files::table
        .filter(metric_files::id.eq_any(ids))
        .filter(metric_files::deleted_at.is_null())
        .load::<MetricFile>(&mut conn)
        .await
    {
        Ok(files) => {
            debug!(
                count = files.len(),
                "Successfully loaded metric files from database"
            );
            files
        }
        Err(e) => {
            error!(error = %e, "Failed to load metric files from database");
            return Err(anyhow::anyhow!(
                "Error loading metric files from database: {}",
                e
            ));
        }
    };

    let mut results = Vec::new();
    for file in files {
        match serde_json::from_value(file.content.clone()) {
            Ok(metric_yml) => {
                debug!(metric_id = %file.id, "Successfully parsed metric YAML");
                results.push((metric_yml, file.id, file.updated_at.to_string()));
            }
            Err(e) => {
                warn!(
                    error = %e,
                    metric_id = %file.id,
                    "Failed to parse metric YAML"
                );
            }
        }
    }

    info!(
        requested_count = ids.len(),
        found_count = results.len(),
        "Completed metric files retrieval"
    );
    Ok(results)
}

fn build_status_message(
    results: &[FileEnum],
    missing_files: &[String],
    error_messages: &[String],
) -> String {
    let mut parts = Vec::new();

    // Add success message if any files were found
    if !results.is_empty() {
        parts.push(format!("Successfully opened {} files", results.len()));
    }

    // Add missing files information
    if !missing_files.is_empty() {
        parts.push(format!(
            "Could not find the following files: {}",
            missing_files.join("; ")
        ));
    }

    // Add any error messages
    if !error_messages.is_empty() {
        parts.push(format!(
            "Encountered the following issues: {}",
            error_messages.join("; ")
        ));
    }

    // If everything is empty, provide a clear message
    if parts.is_empty() {
        "No files were processed due to invalid input".to_string()
    } else {
        parts.join(". ")
    }
}

#[cfg(test)]
mod tests {
    use crate::utils::tools::file_tools::file_types::metric_yml::{
        BarAndLineAxis, BarLineChartConfig, BaseChartConfig, ChartConfig, DataMetadata,
    };

    use super::*;
    use chrono::Utc;
    use serde_json::json;

    fn create_test_dashboard() -> DashboardYml {
        DashboardYml {
            id: Some(Uuid::new_v4()),
            updated_at: Some(Utc::now()),
            name: "Test Dashboard".to_string(),
            rows: vec![],
        }
    }

    fn create_test_metric() -> MetricYml {
        MetricYml {
            id: Some(Uuid::new_v4()),
            updated_at: Some(Utc::now()),
            title: "Test Metric".to_string(),
            description: Some("Test Description".to_string()),
            sql: "SELECT * FROM test_table".to_string(),
            chart_config: ChartConfig::Bar(BarLineChartConfig {
                base: BaseChartConfig {
                    column_label_formats: HashMap::new(),
                    column_settings: None,
                    colors: None,
                    show_legend: None,
                    grid_lines: None,
                    show_legend_headline: None,
                    goal_lines: None,
                    trendlines: None,
                    disable_tooltip: None,
                    y_axis_config: None,
                    x_axis_config: None,
                    category_axis_style_config: None,
                    y2_axis_config: None,
                },
                bar_and_line_axis: BarAndLineAxis {
                    x: vec![],
                    y: vec![],
                    category: vec![],
                    tooltip: None,
                },
                bar_layout: None,
                bar_sort_by: None,
                bar_group_type: None,
                bar_show_total_at_top: None,
                line_group_type: None,
            }),
            data_metadata: Some(vec![
                DataMetadata {
                    name: "id".to_string(),
                    data_type: "number".to_string(),
                },
                DataMetadata {
                    name: "value".to_string(),
                    data_type: "string".to_string(),
                },
            ]),
        }
    }

    #[test]
    fn test_build_status_message_all_success() {
        let results = vec![
            FileEnum::Dashboard(create_test_dashboard()),
            FileEnum::Metric(create_test_metric()),
        ];
        let missing_files = vec![];
        let error_messages = vec![];

        let message = build_status_message(&results, &missing_files, &error_messages);
        assert_eq!(message, "Successfully opened 2 files");
    }

    #[test]
    fn test_build_status_message_with_missing() {
        let results = vec![
            FileEnum::Dashboard(create_test_dashboard()),
            FileEnum::Metric(create_test_metric()),
        ];
        let missing_files = vec![
            "1 dashboard: abc-123".to_string(),
            "2 metrics: def-456, ghi-789".to_string(),
        ];
        let error_messages = vec![];

        let message = build_status_message(&results, &missing_files, &error_messages);
        assert_eq!(
            message,
            "Successfully opened 2 files. Could not find the following files: 1 dashboard: abc-123; 2 metrics: def-456, ghi-789"
        );
    }

    #[test]
    fn test_build_status_message_with_errors() {
        let results = vec![];
        let missing_files = vec![];
        let error_messages = vec![
            "Invalid UUID format for id: xyz".to_string(),
            "Error processing metric files: connection failed".to_string(),
        ];

        let message = build_status_message(&results, &missing_files, &error_messages);
        assert_eq!(
            message,
            "Encountered the following issues: Invalid UUID format for id: xyz; Error processing metric files: connection failed"
        );
    }

    #[test]
    fn test_build_status_message_mixed_results() {
        let results = vec![FileEnum::Metric(create_test_metric())];
        let missing_files = vec!["1 dashboard: abc-123".to_string()];
        let error_messages = vec!["Invalid UUID format for id: xyz".to_string()];

        let message = build_status_message(&results, &missing_files, &error_messages);
        assert_eq!(
            message,
            "Successfully opened 1 files. Could not find the following files: 1 dashboard: abc-123. Encountered the following issues: Invalid UUID format for id: xyz"
        );
    }

    #[test]
    fn test_parse_valid_params() {
        let params_json = json!({
            "files": [
                {"id": "550e8400-e29b-41d4-a716-446655440000", "file_type": "dashboard"},
                {"id": "550e8400-e29b-41d4-a716-446655440001", "file_type": "metric"}
            ]
        });

        let params: OpenFilesParams = serde_json::from_value(params_json).unwrap();
        assert_eq!(params.files.len(), 2);
        assert_eq!(params.files[0].file_type, "dashboard");
        assert_eq!(params.files[1].file_type, "metric");
    }

    #[test]
    fn test_parse_invalid_uuid() {
        let params_json = json!({
            "files": [
                {"id": "not-a-uuid", "file_type": "dashboard"},
                {"id": "also-not-a-uuid", "file_type": "metric"}
            ]
        });

        let params: OpenFilesParams = serde_json::from_value(params_json).unwrap();
        for file in &params.files {
            let uuid_result = Uuid::parse_str(&file.id);
            assert!(uuid_result.is_err());
        }
    }

    #[test]
    fn test_parse_invalid_file_type() {
        let params_json = json!({
            "files": [
                {"id": "550e8400-e29b-41d4-a716-446655440000", "file_type": "invalid"},
                {"id": "550e8400-e29b-41d4-a716-446655440001", "file_type": "unknown"}
            ]
        });

        let params: OpenFilesParams = serde_json::from_value(params_json).unwrap();
        for file in &params.files {
            assert!(file.file_type != "dashboard" && file.file_type != "metric");
        }
    }

    // Mock tests for file retrieval
    #[tokio::test]
    async fn test_get_dashboard_files() {
        let test_id = Uuid::new_v4();
        let dashboard = create_test_dashboard();
        let test_files = vec![DashboardFile {
            id: test_id,
            name: dashboard.name.clone(),
            file_name: "test.yml".to_string(),
            content: serde_json::to_value(&dashboard).unwrap(),
            filter: None,
            organization_id: Uuid::new_v4(),
            created_by: Uuid::new_v4(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
        }];

        // TODO: Mock database connection and return test_files
    }

    #[tokio::test]
    async fn test_get_metric_files() {
        let test_id = Uuid::new_v4();
        let metric = create_test_metric();
        let test_files = vec![MetricFile {
            id: test_id,
            name: metric.title.clone(),
            file_name: "test.yml".to_string(),
            content: serde_json::to_value(&metric).unwrap(),
            verification: crate::database_dep::enums::Verification::NotRequested,
            evaluation_obj: None,
            evaluation_summary: None,
            evaluation_score: None,
            organization_id: Uuid::new_v4(),
            created_by: Uuid::new_v4(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
        }];

        // TODO: Mock database connection and return test_files
    }
}
