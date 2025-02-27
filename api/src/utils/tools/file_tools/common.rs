use anyhow::{anyhow, Result};
use tracing::debug;
use uuid::Uuid;

use crate::database_dep::{lib::get_pg_pool, schema::metric_files};
use crate::utils::query_engine::query_engine::query_engine;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;

/// Validates SQL query using existing query engine by attempting to run it
/// Returns Ok(()) if valid, Err with description if invalid
pub async fn validate_sql(sql: &str, dataset_id: &Uuid) -> Result<()> {
    debug!("Validating SQL query for dataset {}", dataset_id);

    if sql.trim().is_empty() {
        return Err(anyhow!("SQL query cannot be empty"));
    }

    // Try to execute the query using query_engine
    match query_engine(dataset_id, &sql.to_string()).await {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("SQL validation failed: {}", e)),
    }
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
# METRIC CONFIGURATION - YAML STRUCTURE
# -------------------------------------
# Required top-level fields:
#
# title: "Your Metric Title"
# dataset_ids: ["uuid1", "uuid2"]  # Dataset UUIDs this metric belongs to
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
  # TITLE
  title:
    type: string
    description: "Human-readable title (e.g., 'Total Sales')"

  # DATASET IDS
  dataset_ids:
    type: array
    description: "UUIDs of datasets this metric belongs to"
    
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
  - title
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
      selected_view:
        type: string
        description: "View name"
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
      - selected_view
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
# DASHBOARD CONFIGURATION - YAML STRUCTURE
# ----------------------------------------
# Required fields:
#
# title: "Your Dashboard Title"
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
  title:
    type: string
    description: "The title of the dashboard (e.g. 'Sales & Marketing Dashboard')"
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
  - title
  - rows
"##;

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
