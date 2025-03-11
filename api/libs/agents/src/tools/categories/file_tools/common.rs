use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    enums::Verification,
    models::{DashboardFile, MetricFile},
    pool::get_pg_pool,
    schema::{datasets, metric_files},
    types::VersionHistory,
};
use indexmap::IndexMap;
use query_engine::{data_source_query_routes::query_engine::query_engine, data_types::DataType};
use serde_json::{self};
use serde_yaml;
use tracing::{debug, error};
use uuid::Uuid;

use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;

use serde::{Deserialize, Serialize};

use super::file_types::{dashboard_yml::DashboardYml, file::FileWithId, metric_yml::MetricYml};

// Import the types needed for the modification function

/// Validates SQL query using existing query engine by attempting to run it
/// Returns a tuple with a message about the number of records and the results (if ≤ 13 records)
pub async fn validate_sql(
    sql: &str,
    dataset_id: &Uuid,
) -> Result<(String, Vec<IndexMap<String, DataType>>)> {
    debug!("Validating SQL query for dataset {}", dataset_id);

    if sql.trim().is_empty() {
        return Err(anyhow!("SQL query cannot be empty"));
    }

    let mut conn = get_pg_pool().get().await?;

    let data_source_id = match datasets::table
        .filter(datasets::id.eq(dataset_id))
        .select(datasets::data_source_id)
        .first::<Uuid>(&mut conn)
        .await
    {
        Ok(data_source_id) => data_source_id,
        Err(e) => return Err(anyhow!("Error getting data source id: {}", e)),
    };

    // Try to execute the query using query_engine
    let results = match query_engine(&data_source_id, &sql.to_string(), None).await {
        Ok(results) => results,
        Err(e) => return Err(anyhow!("SQL validation failed: {}", e)),
    };

    let num_records = results.len();

    // Create appropriate message based on number of records
    let message = if num_records == 0 {
        "No records were found".to_string()
    } else {
        format!("{} records were returned", num_records)
    };

    // Return records only if there are 13 or fewer
    let return_records = if num_records <= 13 {
        results
    } else {
        Vec::new() // Empty vec when more than 13 records
    };

    Ok((message, return_records))
}

/// Validates existence of metric IDs in database
/// Returns Result with list of missing IDs if any
pub async fn validate_metric_ids(ids: &[Uuid]) -> Result<Vec<Uuid>> {
    let mut conn = get_pg_pool().get().await?;

    // Query for existing IDs
    let existing_ids = metric_files::table
        .filter(metric_files::id.eq_any(ids))
        .filter(metric_files::deleted_at.is_null())
        .select(metric_files::id)
        .load::<Uuid>(&mut conn)
        .await?;

    // Find missing IDs by comparing with input IDs
    let missing_ids: Vec<Uuid> = ids
        .iter()
        .filter(|id| !existing_ids.contains(id))
        .cloned()
        .collect();

    Ok(missing_ids)
}

pub const METRIC_YML_SCHEMA: &str = r##"
# METRIC CONFIGURATION - YML STRUCTURE
# -------------------------------------
# Required top-level fields:
#
# name: "Your Metric Title"
# description: "A detailed description of what this metric measures and how it should be interpreted"  # Optional
# dataset_ids: ["123e4567-e89b-12d3-a456-426614174000"]  # Dataset UUIDs (not names)
# time_frame: "Last 30 days"  # Human-readable time period covered by the query
# sql: |
#   SELECT 
#     date,
#     SUM(amount) AS total
#   FROM sales
#   GROUP BY date
# 
# chart_config:
#   selected_chart_type: "bar"  # One of: bar, line, scatter, pie, combo, metric, table
#   column_label_formats: {     # REQUIRED - Must define formatting for all columns
#     "date": {
#       "column_type": "date",
#       "style": "date",
#       "date_format": "MMM DD, YYYY"
#     },
#     "total": {
#       "column_type": "number",
#       "style": "currency",
#       "currency": "USD",
#       "minimum_fraction_digits": 2
#     }
#   }
#   bar_and_line_axis: {...}  # Required for bar and line charts OR
#   scatter_axis: {...}  # Required for scatter charts OR
#   pie_chart_axis: {...}  # Required for pie charts OR
#   combo_chart_axis: {...}  # Required for combo charts OR
#   metric_column_id: "column_id"  # Required for metric charts
#
# data_metadata:  # Column definitions
#   - name: "date"
#     data_type: "date"
#   - name: "total" 
#     data_type: "number"
# -------------------------------------

type: object
title: "Metric Configuration Schema"
description: "Metric definition with SQL query and visualization settings"

properties:
  # NAME
  name:
    type: string
    description: "Human-readable title (e.g., 'Total Sales')"

  # DESCRIPTION
  description:
    type: string
    description: "A detailed description of what this metric measures and how it should be interpreted"

  # DATASET IDS
  dataset_ids:
    type: array
    description: "UUIDs of datasets this metric belongs to"
    items:
      type: string
      format: "uuid"
      description: "UUID string of the dataset (not the dataset name)"
    
  # TIME FRAME
  time_frame:
    type: string
    description: "Human-readable time period covered by the query (e.g., 'Last 30 days', 'All time', 'August 1, 2024 - January 1, 2025', 'Comparison: August 2025 to August 2024')"

  # SQL QUERY
  sql:
    type: string
    description: "SQL query using YAML pipe syntax (|)"

  # CHART CONFIGURATION
  chart_config:
    description: "Visualization settings (must match one chart type)"
    oneOf: # REQUIRED
      - $ref: "#/definitions/bar_line_chart_config"
      - $ref: "#/definitions/scatter_chart_config"
      - $ref: "#/definitions/pie_chart_config"
      - $ref: "#/definitions/combo_chart_config"
      - $ref: "#/definitions/metric_chart_config"
      - $ref: "#/definitions/table_chart_config"

  # DATA METADATA
  data_metadata:
    type: array
    description: "Column definitions with name and data_type"
    items:
      type: object
      properties:
        name:
          type: string
          description: "Column name"
        data_type:
          type: string
          description: "Data type (string, number, date)"
      required:
        - name
        - data_type

required:
  - name
  - dataset_ids
  - time_frame
  - sql
  - chart_config

definitions:
  # BASE CHART CONFIG (common to all chart types)
  base_chart_config:
    type: object
    properties:
      selected_chart_type:
        type: string
        description: "Chart type (bar, line, scatter, pie, combo, metric, table)"
      column_label_formats:
        type: object
        description: The formatting for each column.
        additionalProperties:
          $ref: "#/definitions/column_label_format"
      column_settings:
        type: object
        description: "Visual settings {columnId: settingsObject}"
        additionalProperties:
          $ref: "#/definitions/column_settings"
      colors:
        type: array
        items:
          type: string
      show_legend:
        type: boolean
      grid_lines:
        type: boolean
      goal_lines:
        type: array
        items:
          $ref: "#/definitions/goal_line"
      trendlines:
        type: array
        items:
          $ref: "#/definitions/trendline"
    required:
      - selected_chart_type
      - column_label_formats

  # COLUMN FORMATTING
  column_label_format:
    type: object
    properties:
      column_type:
        type: string
        description: "number, string, date"
      style:
        type: string
        enum: ["currency", "percent", "number", "date", "string"]
      display_name:
        type: string
        description: "Custom display name for the column"
      number_separator_style:
        type: string
        description: "Style for number separators"
      minimum_fraction_digits:
        type: integer
        description: "Minimum number of fraction digits to display"
      maximum_fraction_digits:
        type: integer
        description: "Maximum number of fraction digits to display"
      multiplier:
        type: number
        description: "Value to multiply the number by before display"
      prefix:
        type: string
        description: "Text to display before the value"
      suffix:
        type: string
        description: "Text to display after the value"
      replace_missing_data_with:
        description: "Value to display when data is missing"
      compact_numbers:
        type: boolean
        description: "Whether to display numbers in compact form (e.g., 1K, 1M)"
      currency:
        type: string
        description: "Currency code for currency formatting (e.g., USD, EUR)"
      date_format:
        type: string
        description: "Format string for date display"
      use_relative_time:
        type: boolean
        description: "Whether to display dates as relative time (e.g., '2 days ago')"
      is_utc:
        type: boolean
        description: "Whether to interpret dates as UTC"
      convert_number_to:
        type: string
        description: "Convert number to a different format"
    required:
      - column_type
      - style

  # COLUMN VISUAL SETTINGS
  column_settings:
    type: object
    properties:
      show_data_labels:
        type: boolean
      column_visualization:
        type: string
        enum: ["bar", "line", "dot"]
      line_width:
        type: number
      line_style:
        type: string
        enum: ["area", "line"]
      line_type:
        type: string
        enum: ["normal", "smooth", "step"]

  # CHART-SPECIFIC CONFIGURATIONS
  bar_line_chart_config:
    allOf:
      - $ref: "#/definitions/base_chart_config"
      - type: object
        properties:
          selected_chart_type:
            enum: ["bar", "line"]
          bar_and_line_axis:
            type: object
            properties:
              x:
                type: array
                items:
                  type: string
              y:
                type: array
                items:
                  type: string
              category:
                type: array
                items:
                  type: string
            required:
              - x
              - y
              - category
          bar_layout:
            type: string
            enum: ["horizontal", "vertical"]
          bar_group_type:
            type: string
            enum: ["stack", "group", "percentage-stack"]
        required:
          - selected_chart_type
          - bar_and_line_axis

  scatter_chart_config:
    allOf:
      - $ref: "#/definitions/base_chart_config"
      - type: object
        properties:
          selected_chart_type:
            enum: ["scatter"]
          scatter_axis:
            type: object
            properties:
              x:
                type: array
                items:
                  type: string
              y:
                type: array
                items:
                  type: string
            required:
              - x
              - y
        required:
          - selected_chart_type
          - scatter_axis

  pie_chart_config:
    allOf:
      - $ref: "#/definitions/base_chart_config"
      - type: object
        properties:
          selected_chart_type:
            enum: ["pie"]
          pie_chart_axis:
            type: object
            properties:
              x:
                type: array
                items:
                  type: string
              y:
                type: array
                items:
                  type: string
            required:
              - x
              - y
        required:
          - selected_chart_type
          - pie_chart_axis

  combo_chart_config:
    allOf:
      - $ref: "#/definitions/base_chart_config"
      - type: object
        properties:
          selected_chart_type:
            enum: ["combo"]
          combo_chart_axis:
            type: object
            properties:
              x:
                type: array
                items:
                  type: string
              y:
                type: array
                items:
                  type: string
            required:
              - x
              - y
        required:
          - selected_chart_type
          - combo_chart_axis

  metric_chart_config:
    allOf:
      - $ref: "#/definitions/base_chart_config"
      - type: object
        properties:
          selected_chart_type:
            enum: ["metric"]
          metric_column_id:
            type: string
          metric_value_aggregate:
            type: string
            enum: ["sum", "average", "median", "max", "min", "count", "first"]
        required:
          - selected_chart_type
          - metric_column_id

  table_chart_config:
    allOf:
      - $ref: "#/definitions/base_chart_config"
      - type: object
        properties:
          selected_chart_type:
            enum: ["table"]
          table_column_order:
            type: array
            items:
              type: string
        required:
          - selected_chart_type
          # No additional required fields for table chart

  # HELPER OBJECTS
  goal_line:
    type: object
    properties:
      show:
        type: boolean
      value:
        type: number
      goal_line_label:
        type: string

  trendline:
    type: object
    properties:
      type:
        type: string
        enum: ["average", "linear_regression", "min", "max", "median"]
      column_id:
        type: string
    required:
      - type
      - column_id
"##;

pub const DASHBOARD_YML_SCHEMA: &str = r##"
# DASHBOARD CONFIGURATION - YML STRUCTURE
# ----------------------------------------
# Required fields:
#
# name: "Your Dashboard Title"
# description: "A description of the dashboard, it's metrics, and its purpose."
# rows: 
#   - items:
#       - id: "metric-uuid-1"  # UUIDv4 of an existing metric
#         width: 6             # Width value between 3-12
#       - id: "metric-uuid-2"
#         width: 6
#   - items:
#       - id: "metric-uuid-3"
#         width: 12
#
# Rules:
# 1. Each row can have up to 4 items
# 2. Each item width must be between 3-12
# 3. Sum of widths in a row must not exceed 12
# ----------------------------------------

type: object
title: 'Dashboard Configuration Schema'
description: 'Specifies the structure and constraints of a dashboard config file.'
properties:
  name:
    type: string
    description: "The title of the dashboard (e.g. 'Sales & Marketing Dashboard')"
  description:
    type: string
    description: "A description of the dashboard, its metrics, and its purpose"
  rows:
    type: array
    description: "Array of row objects, each containing metric items"
    items:
      type: object
      properties:
        items:
          type: array
          description: "Array of metrics to display in this row (max 4 items)"
          max_items: 4
          items:
            type: object
            properties:
              id:
                type: string
                description: "UUIDv4 identifier of an existing metric"
              width:
                type: integer
                description: "Width value (3-12, sum per row ≤ 12)"
                minimum: 3
                maximum: 12
            required:
              - id
              - width
      required:
        - items
required:
  - name
  - description
  - rows
"##;

/// Process a metric file creation request
/// Returns Ok((MetricFile, MetricYml, String, Vec<IndexMap<String, DataType>))) if successful, or an error message if failed
/// The string is a message about the number of records returned by the SQL query
/// The vector of IndexMap<String, DataType> is the results of the SQL query.  Returns empty vector if more than 13 records or no results.
pub async fn process_metric_file(
    tool_call_id: String,
    file_name: String,
    yml_content: String,
) -> Result<
    (
        MetricFile,
        MetricYml,
        String,
        Vec<IndexMap<String, DataType>>,
    ),
    String,
> {
    debug!("Processing metric file: {}", file_name);

    let metric_yml =
        MetricYml::new(yml_content.clone()).map_err(|e| format!("Invalid YAML format: {}", e))?;

    let metric_id = generate_deterministic_uuid(&tool_call_id, &file_name, "metric").unwrap();

    // Check if dataset_ids is empty
    if metric_yml.dataset_ids.is_empty() {
        return Err("Missing required field 'dataset_ids'".to_string());
    }

    // Use the first dataset_id for SQL validation
    let dataset_id = metric_yml.dataset_ids[0];
    debug!("Validating SQL using dataset_id: {}", dataset_id);

    // Validate SQL with the selected dataset_id and get results
    let (message, results) = match validate_sql(&metric_yml.sql, &dataset_id).await {
        Ok(results) => results,
        Err(e) => return Err(format!("Invalid SQL query: {}", e)),
    };

    let metric_yml_json = match serde_json::to_value(metric_yml.clone()) {
        Ok(json) => json,
        Err(e) => return Err(format!("Failed to process metric: {}", e)),
    };

    let metric_file = MetricFile {
        id: metric_id,
        name: file_name.clone(),
        file_name: file_name.clone(),
        content: metric_yml_json.clone(),
        created_by: Uuid::new_v4(),
        verification: Verification::NotRequested,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id: Uuid::new_v4(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: VersionHistory::new(1, metric_yml_json),
    };

    Ok((metric_file, metric_yml, message, results))
}

/// Process a metric file modification request
/// Returns Ok((MetricFile, MetricYml, Vec<ModificationResult>, String, Vec<IndexMap<String, DataType>>)) if successful, or an error if failed
/// The string is a message about the number of records returned by the SQL query
/// The vector of IndexMap<String, DataType> is the results of the SQL query. Returns empty vector if more than 13 records or no results.
pub async fn process_metric_file_modification(
    mut file: MetricFile,
    modification: &FileModification,
    duration: i64,
) -> Result<(
    MetricFile,
    MetricYml,
    Vec<ModificationResult>,
    String,
    Vec<IndexMap<String, DataType>>,
)> {
    debug!(
        file_id = %file.id,
        file_name = %modification.file_name,
        "Processing metric file modifications"
    );

    let mut results = Vec::new();

    // Parse existing content
    let current_yml: MetricYml = match serde_json::from_value(file.content.clone()) {
        Ok(yml) => yml,
        Err(e) => {
            let error = format!("Failed to parse existing metric YAML: {}", e);
            error!(
                file_id = %file.id,
                file_name = %modification.file_name,
                error = %error,
                "YAML parsing error"
            );
            results.push(ModificationResult {
                file_id: file.id,
                file_name: modification.file_name.clone(),
                success: false,
                error: Some(error.clone()),
                modification_type: "parsing".to_string(),
                timestamp: Utc::now(),
                duration,
            });
            return Err(anyhow::anyhow!(error));
        }
    };

    // Convert to YAML string for content modifications
    let current_content = match serde_yaml::to_string(&current_yml) {
        Ok(content) => content,
        Err(e) => {
            let error = format!("Failed to serialize metric YAML: {}", e);
            error!(
                file_id = %file.id,
                file_name = %modification.file_name,
                error = %error,
                "YAML serialization error"
            );
            results.push(ModificationResult {
                file_id: file.id,
                file_name: modification.file_name.clone(),
                success: false,
                error: Some(error.clone()),
                modification_type: "serialization".to_string(),
                timestamp: Utc::now(),
                duration,
            });
            return Err(anyhow::anyhow!(error));
        }
    };

    // Apply modifications and track results
    match apply_modifications_to_content(
        &current_content,
        &modification.modifications,
        &modification.file_name,
    ) {
        Ok(modified_content) => {
            // Create and validate new YML object
            match MetricYml::new(modified_content) {
                Ok(new_yml) => {
                    debug!(
                        file_id = %file.id,
                        file_name = %modification.file_name,
                        "Successfully modified and validated metric file"
                    );

                    // Validate SQL and get dataset_id from the first dataset
                    if new_yml.dataset_ids.is_empty() {
                        let error = "Missing required field 'dataset_ids'".to_string();
                        results.push(ModificationResult {
                            file_id: file.id,
                            file_name: modification.file_name.clone(),
                            success: false,
                            error: Some(error.clone()),
                            modification_type: "validation".to_string(),
                            timestamp: Utc::now(),
                            duration,
                        });
                        return Err(anyhow::anyhow!(error));
                    }

                    let dataset_id = new_yml.dataset_ids[0];
                    match validate_sql(&new_yml.sql, &dataset_id).await {
                        Ok((message, validation_results)) => {
                            // Update file record
                            file.content = serde_json::to_value(&new_yml)?;
                            file.updated_at = Utc::now();

                            // Track successful modification
                            results.push(ModificationResult {
                                file_id: file.id,
                                file_name: modification.file_name.clone(),
                                success: true,
                                error: None,
                                modification_type: "content".to_string(),
                                timestamp: Utc::now(),
                                duration,
                            });

                            Ok((file, new_yml, results, message, validation_results))
                        }
                        Err(e) => {
                            let error = format!("SQL validation failed: {}", e);
                            error!(
                                file_id = %file.id,
                                file_name = %modification.file_name,
                                error = %error,
                                "SQL validation error"
                            );
                            results.push(ModificationResult {
                                file_id: file.id,
                                file_name: modification.file_name.clone(),
                                success: false,
                                error: Some(error.clone()),
                                modification_type: "sql_validation".to_string(),
                                timestamp: Utc::now(),
                                duration,
                            });
                            Err(anyhow::anyhow!(error))
                        }
                    }
                }
                Err(e) => {
                    let error = format!("Failed to validate modified YAML: {}", e);
                    error!(
                        file_id = %file.id,
                        file_name = %modification.file_name,
                        error = %error,
                        "YAML validation error"
                    );
                    results.push(ModificationResult {
                        file_id: file.id,
                        file_name: modification.file_name.clone(),
                        success: false,
                        error: Some(error.clone()),
                        modification_type: "validation".to_string(),
                        timestamp: Utc::now(),
                        duration,
                    });
                    Err(anyhow::anyhow!(error))
                }
            }
        }
        Err(e) => {
            let error = format!("Failed to apply modifications: {}", e);
            error!(
                file_id = %file.id,
                file_name = %modification.file_name,
                error = %error,
                "Modification application error"
            );
            results.push(ModificationResult {
                file_id: file.id,
                file_name: modification.file_name.clone(),
                success: false,
                error: Some(error.clone()),
                modification_type: "modification".to_string(),
                timestamp: Utc::now(),
                duration,
            });
            Err(anyhow::anyhow!(error))
        }
    }
}

/// Generates a deterministic UUID based on tool call ID, file name, and file type
pub fn generate_deterministic_uuid(
    tool_call_id: &str,
    file_name: &str,
    file_type: &str,
) -> Result<Uuid> {
    // Use a fixed namespace for the application
    let namespace_uuid = Uuid::NAMESPACE_OID;

    // Combine inputs to create a unique name
    let name = format!("{}:{}:{}", tool_call_id, file_name, file_type);

    // Generate v5 UUID (SHA1 based)
    Ok(Uuid::new_v5(&namespace_uuid, name.as_bytes()))
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Modification {
    /// The content to be replaced in the file
    pub content_to_replace: String,
    /// The new content that will replace the existing content
    pub new_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileModification {
    /// UUID of the file to modify
    pub id: Uuid,
    /// Name of the file to modify
    pub file_name: String,
    /// List of modifications to apply to the file
    pub modifications: Vec<Modification>,
}

#[derive(Debug, Serialize)]
pub struct ModificationResult {
    pub file_id: Uuid,
    pub file_name: String,
    pub success: bool,
    pub error: Option<String>,
    pub modification_type: String,
    pub timestamp: chrono::DateTime<Utc>,
    pub duration: i64,
}

pub fn apply_modifications_to_content(
    content: &str,
    modifications: &[Modification],
    file_name: &str,
) -> Result<String> {
    let mut modified_content = content.to_string();

    for modification in modifications {
        if !modified_content.contains(&modification.content_to_replace) {
            return Err(anyhow::anyhow!(
                "Content to replace not found in file '{}': '{}'",
                file_name,
                modification.content_to_replace
            ));
        }
        modified_content =
            modified_content.replace(&modification.content_to_replace, &modification.new_content);
    }

    Ok(modified_content)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModifyFilesParams {
    /// List of files to modify with their corresponding modifications
    pub files: Vec<FileModification>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModifyFilesOutput {
    pub message: String,
    pub duration: i64,
    pub files: Vec<FileWithId>,
}

#[derive(Debug)]
pub struct FileModificationBatch<T> {
    pub files: Vec<T>,
    pub failed_modifications: Vec<(String, String)>,
    pub modification_results: Vec<ModificationResult>,
}

/// Process a dashboard file modification request
/// Returns Ok((DashboardFile, DashboardYml, Vec<ModificationResult>, String, Vec<IndexMap<String, DataType>>)) if successful, or an error if failed
/// The string is a message about the number of records returned by the SQL query
/// The vector of IndexMap<String, DataType> is the results of the SQL query. Returns empty vector if more than 13 records or no results.
pub async fn process_dashboard_file_modification(
    mut file: DashboardFile,
    modification: &FileModification,
    duration: i64,
) -> Result<(
    DashboardFile,
    DashboardYml,
    Vec<ModificationResult>,
    String,
    Vec<IndexMap<String, DataType>>,
)> {
    debug!(
        file_id = %file.id,
        file_name = %modification.file_name,
        "Processing dashboard file modifications"
    );

    let mut results = Vec::new();

    // Parse existing content
    let current_yml: DashboardYml = match serde_json::from_value(file.content.clone()) {
        Ok(yml) => yml,
        Err(e) => {
            let error = format!("Failed to parse existing dashboard YAML: {}", e);
            error!(
                file_id = %file.id,
                file_name = %modification.file_name,
                error = %error,
                "YAML parsing error"
            );
            results.push(ModificationResult {
                file_id: file.id,
                file_name: modification.file_name.clone(),
                success: false,
                error: Some(error.clone()),
                modification_type: "parsing".to_string(),
                timestamp: Utc::now(),
                duration,
            });
            return Err(anyhow::anyhow!(error));
        }
    };

    // Convert to YAML string for content modifications
    let current_content = match serde_yaml::to_string(&current_yml) {
        Ok(content) => content,
        Err(e) => {
            let error = format!("Failed to serialize dashboard YAML: {}", e);
            error!(
                file_id = %file.id,
                file_name = %modification.file_name,
                error = %error,
                "YAML serialization error"
            );
            results.push(ModificationResult {
                file_id: file.id,
                file_name: modification.file_name.clone(),
                success: false,
                error: Some(error.clone()),
                modification_type: "serialization".to_string(),
                timestamp: Utc::now(),
                duration,
            });
            return Err(anyhow::anyhow!(error));
        }
    };

    // Apply modifications and track results
    match apply_modifications_to_content(
        &current_content,
        &modification.modifications,
        &modification.file_name,
    ) {
        Ok(modified_content) => {
            // Create and validate new YML object
            match DashboardYml::new(modified_content) {
                Ok(new_yml) => {
                    debug!(
                        file_id = %file.id,
                        file_name = %modification.file_name,
                        "Successfully modified and validated dashboard file"
                    );

                    // Collect all metric IDs from rows
                    let metric_ids: Vec<Uuid> = new_yml
                        .rows
                        .iter()
                        .flat_map(|row| row.items.iter())
                        .map(|item| item.id)
                        .collect();

                    // Validate metric IDs if any exist
                    if !metric_ids.is_empty() {
                        match validate_metric_ids(&metric_ids).await {
                            Ok(missing_ids) if !missing_ids.is_empty() => {
                                let error =
                                    format!("Referenced metrics not found: {:?}", missing_ids);
                                error!(
                                    file_id = %file.id,
                                    file_name = %modification.file_name,
                                    error = %error,
                                    "Metric validation error"
                                );
                                results.push(ModificationResult {
                                    file_id: file.id,
                                    file_name: modification.file_name.clone(),
                                    success: false,
                                    error: Some(error.clone()),
                                    modification_type: "metric_validation".to_string(),
                                    timestamp: Utc::now(),
                                    duration,
                                });
                                return Err(anyhow::anyhow!(error));
                            }
                            Err(e) => {
                                let error = format!("Failed to validate metric IDs: {}", e);
                                error!(
                                    file_id = %file.id,
                                    file_name = %modification.file_name,
                                    error = %error,
                                    "Metric validation error"
                                );
                                results.push(ModificationResult {
                                    file_id: file.id,
                                    file_name: modification.file_name.clone(),
                                    success: false,
                                    error: Some(error.clone()),
                                    modification_type: "metric_validation".to_string(),
                                    timestamp: Utc::now(),
                                    duration,
                                });
                                return Err(anyhow::anyhow!(error));
                            }
                            Ok(_) => (), // All metrics exist
                        }
                    }

                    // Update file record
                    file.content = serde_json::to_value(&new_yml)?;
                    file.updated_at = Utc::now();

                    // Track successful modification
                    results.push(ModificationResult {
                        file_id: file.id,
                        file_name: modification.file_name.clone(),
                        success: true,
                        error: None,
                        modification_type: "content".to_string(),
                        timestamp: Utc::now(),
                        duration,
                    });

                    // Return success with empty validation results since dashboards don't have SQL
                    Ok((file, new_yml, results, String::new(), Vec::new()))
                }
                Err(e) => {
                    let error = format!("Failed to validate modified YAML: {}", e);
                    error!(
                        file_id = %file.id,
                        file_name = %modification.file_name,
                        error = %error,
                        "YAML validation error"
                    );
                    results.push(ModificationResult {
                        file_id: file.id,
                        file_name: modification.file_name.clone(),
                        success: false,
                        error: Some(error.clone()),
                        modification_type: "validation".to_string(),
                        timestamp: Utc::now(),
                        duration,
                    });
                    Err(anyhow::anyhow!(error))
                }
            }
        }
        Err(e) => {
            let error = format!("Failed to apply modifications: {}", e);
            error!(
                file_id = %file.id,
                file_name = %modification.file_name,
                error = %error,
                "Modification application error"
            );
            results.push(ModificationResult {
                file_id: file.id,
                file_name: modification.file_name.clone(),
                success: false,
                error: Some(error.clone()),
                modification_type: "modification".to_string(),
                timestamp: Utc::now(),
                duration,
            });
            Err(anyhow::anyhow!(error))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_validate_sql_empty() {
        let dataset_id = Uuid::new_v4();
        let result = validate_sql("", &dataset_id).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("cannot be empty"));
    }

    // Note: We'll need integration tests with a real database for testing actual SQL validation
    // Unit tests can only cover basic cases like empty SQL
}
