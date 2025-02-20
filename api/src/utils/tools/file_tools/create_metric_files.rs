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
    database_dep::{
        enums::Verification, lib::get_pg_pool, models::MetricFile, schema::metric_files,
    },
    utils::{agent::Agent, tools::ToolExecutor},
};

use super::{common::validate_sql, file_types::metric_yml::MetricYml, FileModificationTool};

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
    agent: Arc<Agent>,
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

    let metric_id = metric_yml
        .id
        .ok_or_else(|| "Missing required field 'id'".to_string())?;

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
    type Params = CreateMetricFilesParams;

    fn get_name(&self) -> String {
        "create_metric_files".to_string()
    }

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        let start_time = Instant::now();

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

        Ok(CreateMetricFilesOutput {
            message,
            duration,
            files: created_files,
        })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
          "name": "create_metric_files",
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
                      "description": "Name of the file"
                    },
                    "yml_content": {
                      "type": "string",
                      "description": "METRIC CONFIGURATION SCHEMA (DOCUMENTATION + SPEC) # This YAML file shows a JSON Schema-like specification for defining a 'metric.'# # REQUIRED at the top level:#   1) title: string#   2) dataset_ids: array of strings#   2) sql:   multi-line string (YAML pipe recommended)#   3) chart_config: must match exactly one of the possible chart sub-schemas #                  (bar/line, scatter, pie, combo, metric, table).#   4) data_metadata: array of columns. Each with { name, data_type }.# # 'columnLabelFormats' is a required field under chartConfig (in the base).## If a field is null or empty, simply omit it from your YAML rather than # including it with 'null.' That way, you keep the configuration clean.# ------------------------------------------------------------------------------type: objecttitle: 'Metric Configuration Schema'description: 'Specifies structure for a metric file, including SQL + one chart type.'properties:  # ----------------------  # 1. TITLE (REQUIRED)  # ----------------------  title:    type: string    description: >      A human-readable title for this metric (e.g. 'Total Sales').      Always required.      # ----------------------  # 2. DATASET IDS (REQUIRED)  # ----------------------  dataset_ids:    type: array    description: >      An array of dataset IDs that the metric belongs to.  # ----------------------  # 3. SQL (REQUIRED, multi-line recommended)  # ----------------------  sql:    type: string    description: >      A SQL query string used to compute or retrieve the metric's data.      It should be well-formatted, typically using YAML's pipe syntax (|).      Example:        sql: |          SELECT            date,            SUM(sales_amount) AS total_sales          FROM sales          GROUP BY date          ORDER BY date DESC      Always required.  # ----------------------  # 4. CHART CONFIG (REQUIRED, EXACTLY ONE TYPE)  # ----------------------  chart_config:    description: >      Defines visualization settings. Must match exactly one sub-schema      via oneOf: bar/line, scatter, pie, combo, metric, or table.    oneOf:      - $ref: '#/definitions/bar_line_chart_config'      - $ref: '#/definitions/scatter_chart_config'      - $ref: '#/definitions/pie_chart_config'      - $ref: '#/definitions/combo_chart_config'      - $ref: '#/definitions/metric_chart_config'      - $ref: '#/definitions/table_chart_config'  # ----------------------  # 5. DATA METADATA (REQUIRED)  # ----------------------  data_metadata:    type: array    description: >      An array describing each column in the metric's dataset.      Each item has a 'name' and a 'dataType'.    items:      type: object      properties:        name:          type: string          description: 'Column name.'        data_type:          type: string          description: 'Data type of the column (e.g., 'string', 'number', 'date').'      required:        - name        - data_typerequired:  - title  - sql  - chart_configdefinitions:  goal_line:    type: object    description: 'A line drawn on the chart to represent a goal/target.'    properties:      show:        type: boolean        description: >          If true, display the goal line. If you don't need it, omit the property.      value:        type: number        description: >          Numeric value of the goal line. Omit if unused.      show_goal_line_label:        type: boolean        description: >          If true, show a label on the goal line. Omit if you want the default behavior.      goal_line_label:        type: string        description: >          The label text to display near the goal line (if show_goal_line_label = true).      goal_line_color:        type: string        description: >          Color for the goal line (e.g., '#FF0000'). Omit if not specified.  trendline:    type: object    description: 'A trendline overlay (e.g. average line, regression).'    properties:      show:        type: boolean      show_trendline_label:        type: boolean      trendline_label:        type: string        description: 'Label text if show_trendline_label is true (e.g., 'Slope').'      type:        type: string        enum:          - average          - linear_regression          - logarithmic_regression          - exponential_regression          - polynomial_regression          - min          - max          - median        description: >          Trendline algorithm to use. Required.      trend_line_color:        type: string        description: 'Color for the trendline (e.g. '#000000').'      column_id:        type: string        description: >          Column ID to which this trendline applies. Required.    required:      - type      - column_id  bar_and_line_axis:    type: object    description: >      Axis definitions for bar or line charts: x, y, category, and optional tooltip.    properties:      x:        type: array        items:          type: string        description: 'Column ID(s) for the x-axis.'      y:        type: array        items:          type: string        description: 'Column ID(s) for the y-axis.'      category:        type: array        items:          type: string        description: 'Column ID(s) representing categories/groups.'      tooltip:        type: array        items:          type: string        description: 'Columns used in tooltips. Omit if you want the defaults.'    required:      - x      - y      - category  scatter_axis:    type: object    description: 'Axis definitions for scatter charts: x, y, optional category/size/tooltip.'    properties:      x:        type: array        items:          type: string      y:        type: array        items:          type: string      category:        type: array        items:          type: string        description: 'Optional. Omit if not used.'      size:        type: array        maxItems: 1        items:          type: string        description: 'If omitted, no size-based variation. If present, exactly one column ID.'      tooltip:        type: array        items:          type: string        description: 'Columns used in tooltips.'    required:      - x      - y  pie_chart_axis:    type: object    description: 'Axis definitions for pie charts: x, y, optional tooltip.'    properties:      x:        type: array        items:          type: string      y:        type: array        items:          type: string      tooltip:        type: array        items:          type: string    required:      - x      - y  combo_chart_axis:    type: object    description: 'Axis definitions for combo charts: x, y, optional y2/category/tooltip.'    properties:      x:        type: array        items:          type: string      y:        type: array        items:          type: string      y2:        type: array        items:          type: string        description: 'Optional secondary y-axis. Omit if unused.'      category:        type: array        items:          type: string      tooltip:        type: array        items:          type: string    required:      - x      - y  i_column_label_format:    type: object    description: >      Describes how a column's data is formatted (currency, percent, date, etc.).      If you do not need special formatting for a column, omit it from       'column_label_formats'.    properties:      column_type:        type: string        description: 'e.g., 'number', 'string', 'date''      style:        type: string        enum:          - currency          - percent          - number          - date          - string        description: 'Defines how values are displayed.'      display_name:        type: string        description: 'Override for the column label. Omit if unused.'      number_separator_style:        type: string        description: 'E.g., ',' for thousands separator or omit if no special style.'      minimum_fraction_digits:        type: number        description: 'Min decimal places. Omit if default is fine.'      maximum_fraction_digits:        type: number        description: 'Max decimal places. Omit if default is fine.'      multiplier:        type: number        description: 'E.g., 100 for percents. Omit if default is 1.'      prefix:        type: string        description: 'String to add before each value (e.g. '$').'      suffix:        type: string        description: 'String to add after each value (e.g. '%').'      replace_missing_data_with:        type: [ 'number', 'string' ]        description: 'If data is missing, use this value. Omit if default 0 is fine.'      compact_numbers:        type: boolean        description: 'If true, 10000 => 10K. Omit if not needed.'      currency:        type: string        description: 'ISO code for style=currency. Default 'USD' if omitted.'      date_format:        type: string        description: 'Dayjs format if style=date. Default 'LL' if omitted.'      use_relative_time:        type: boolean        description: 'If true, e.g., '2 days ago' might be used. Omit if not used.'      is_utc:        type: boolean        description: 'If true, interpret date as UTC. Omit if local time.'      convert_number_to:        type: string        description: 'Used if style=number but want day_of_week, etc. Omit if not used.'    required:      - column_type      - style  column_settings:    type: object    description: 'Overrides per-column for visualization (bar, line, dot, etc.).'    properties:      show_data_labels:        type: boolean      show_data_labels_as_percentage:        type: boolean      column_visualization:        type: string        enum: [ 'bar', 'line', 'dot' ]        description: >          If omitted, chart-level default is used.      line_width:        type: number        description: 'Thickness of the line. Omit if default is OK.'      line_style:        type: string        enum: [ 'area', 'line' ]      line_type:        type: string        enum: [ 'normal', 'smooth', 'step' ]      line_symbol_size:        type: number        description: 'Size of dots on a line. Omit if default is OK.'      bar_roundness:        type: number        description: 'Roundness of bar corners (0-50). Omit if default is OK.'      line_symbol_size_dot:        type: number        description: 'If column_visualization='dot', size of the dots. Omit if default is OK.'  base_chart_config:    type: object    properties:      selected_chart_type:        type: string        description: >          Must match the chart type in the sub-schema.           E.g., 'bar', 'line', 'scatter', 'pie', 'combo', 'metric', 'table'.      column_label_formats:        type: object        description: >          A map of columnId => label format object (i_column_label_format).           If you truly have no column formatting, you can provide an empty object,           but do not omit this field.         additionalProperties:          $ref: '#/definitions/i_column_label_format'      column_settings:        type: object        description: >          A map of columnId => column_settings.           Omit columns if no special customization is needed.        additionalProperties:          $ref: '#/definitions/column_settings'      colors:        type: array        items:          type: string        description: >          Array of color hex codes or color names. If omitted, use defaults.      show_legend:        type: boolean        description: 'Whether to display the legend. Omit if defaults apply.'      grid_lines:        type: boolean        description: 'Toggle grid lines. Omit if defaults apply.'      show_legend_headline:        type: string        description: 'Additional legend headline text. Omit if not used.'      goal_lines:        type: array        description: 'Array of goal_line objects. Omit if none.'        items:          $ref: '#/definitions/goal_line'      trendlines:        type: array        description: 'Array of trendline objects. Omit if none.'        items:          $ref: '#/definitions/trendline'      disable_tooltip:        type: boolean        description: 'If true, tooltips are disabled. Omit if not needed.'      y_axis_config:        type: object        description: 'If omitted, defaults apply.'        additionalProperties: true      x_axis_config:        type: object        additionalProperties: true      category_axis_style_config:        type: object        additionalProperties: true      y2_axis_config:        type: object        additionalProperties: true    required:      - selected_chart_type      - selected_view      - column_label_formats  bar_line_chart_config:    allOf:      - $ref: '#/definitions/base_chart_config'      - type: object        properties:          selected_chart_type:            enum: [ 'bar', 'line' ]          bar_and_line_axis:            $ref: '#/definitions/bar_and_line_axis'          bar_layout:            type: string            enum: [ 'horizontal', 'vertical' ]          bar_sort_by:            type: string          bar_group_type:            type: string            enum: [ 'stack', 'group', 'percentage-stack' ]          bar_show_total_at_top:            type: boolean          line_group_type:            type: string            enum: [ 'stack', 'percentage-stack' ]        required:          - bar_and_line_axis  scatter_chart_config:    allOf:      - $ref: '#/definitions/base_chart_config'      - type: object        properties:          selected_chart_type:            enum: [ 'scatter' ]          scatter_axis:            $ref: '#/definitions/scatter_axis'          scatter_dot_size:            type: array            minItems: 2            maxItems: 2            items:              type: number            description: 'If omitted, scatter dot sizes may follow a default range.'        required:          - scatter_axis  pie_chart_config:    allOf:      - $ref: '#/definitions/base_chart_config'      - type: object        properties:          selected_chart_type:            enum: [ 'pie' ]          pie_chart_axis:            $ref: '#/definitions/pie_chart_axis'          pie_display_label_as:            type: string            enum: [ 'percent', 'number' ]          pie_show_inner_label:            type: boolean          pie_inner_label_aggregate:            type: string            enum: [ 'sum', 'average', 'median', 'max', 'min', 'count' ]          pie_inner_label_title:            type: string          pie_label_position:            type: string            enum: [ 'inside', 'outside', 'none' ]          pie_donut_width:            type: number          pie_minimum_slice_percentage:            type: number        required:          - pie_chart_axis  combo_chart_config:    allOf:      - $ref: '#/definitions/base_chart_config'      - type: object        properties:          selected_chart_type:            enum: [ 'combo' ]          combo_chart_axis:            $ref: '#/definitions/combo_chart_axis'        required:          - combo_chart_axis  metric_chart_config:    allOf:      - $ref: '#/definitions/base_chart_config'      - type: object        properties:          selected_chart_type:            enum: [ 'metric' ]          metric_column_id:            type: string            description: 'Required. The column used for the metric's numeric value.'          metric_value_aggregate:            type: string            enum: [ 'sum', 'average', 'median', 'max', 'min', 'count', 'first' ]          metric_header:            type: string            description: 'If omitted, the column_id is used as default label.'          metric_sub_header:            type: string          metric_value_label:            type: string            description: 'If omitted, the label is derived from metric_column_id + aggregator.'        required:          - metric_column_id  table_chart_config:    allOf:      - $ref: '#/definitions/base_chart_config'      - type: object        properties:          selected_chart_type:            enum: [ 'table' ]          table_column_order:            type: array            items:              type: string          table_column_widths:            type: object            additionalProperties:              type: number          table_header_background_color:            type: string          table_header_font_color:            type: string          table_column_font_color:            type: string        required: []        description: >          For table type, the axis concept is irrelevant;           user may specify column order, widths, colors, etc."
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
