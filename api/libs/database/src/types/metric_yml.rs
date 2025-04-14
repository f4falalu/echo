use anyhow::Result;
use diesel::{
    deserialize::{FromSql, FromSqlRow},
    expression::AsExpression,
    pg::Pg,
    serialize::{IsNull, Output, ToSql},
    sql_types::Jsonb,
};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::Write;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone, FromSqlRow, AsExpression)]
#[diesel(sql_type = Jsonb)]
#[serde(rename_all = "camelCase")]
pub struct MetricYml {
    pub name: String,
    pub description: Option<String>,
    #[serde(alias = "time_frame")]
    pub time_frame: String,
    pub sql: String,
    #[serde(alias = "chart_config")]
    pub chart_config: ChartConfig,
    #[serde(alias = "dataset_ids")]
    pub dataset_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "selectedChartType")]
#[serde(rename_all = "camelCase")]
pub enum ChartConfig {
    #[serde(rename = "bar")]
    Bar(BarLineChartConfig),
    #[serde(rename = "line")]
    Line(BarLineChartConfig),
    #[serde(rename = "scatter")]
    Scatter(ScatterChartConfig),
    #[serde(rename = "pie")]
    Pie(PieChartConfig),
    #[serde(rename = "combo")]
    Combo(ComboChartConfig),
    #[serde(rename = "metric")]
    Metric(MetricChartConfig),
    #[serde(rename = "table")]
    Table(TableChartConfig),
}

impl<'de> Deserialize<'de> for ChartConfig {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        // Deserialize into a generic JSON value
        let value: Value = Deserialize::deserialize(deserializer)?;

        // Ensure it's an object
        let obj = value
            .as_object()
            .ok_or_else(|| serde::de::Error::custom("expected a JSON object"))?;

        // Look for the tag under either key
        let tag = obj
            .get("selectedChartType")
            .or_else(|| obj.get("selected_chart_type"))
            .and_then(|v| v.as_str())
            .ok_or_else(|| {
                serde::de::Error::custom(
                    "missing or invalid 'selectedChartType' or 'selected_chart_type' field",
                )
            })?;

        // Clone the object and remove both possible tag fields
        let mut obj_clone = obj.clone();
        obj_clone.remove("selectedChartType");
        obj_clone.remove("selected_chart_type");
        let config_value = Value::Object(obj_clone);

        // Match the tag to the appropriate variant
        match tag {
            "bar" => {
                let config = match serde_json::from_value::<BarLineChartConfig>(config_value) {
                    Ok(config) => config,
                    Err(e) => {
                        return Err(detailed_deserialization_error::<D::Error>("Bar chart", &e));
                    }
                };
                Ok(ChartConfig::Bar(config))
            }
            "line" => {
                let config = match serde_json::from_value::<BarLineChartConfig>(config_value) {
                    Ok(config) => config,
                    Err(e) => {
                        return Err(detailed_deserialization_error::<D::Error>("Line chart", &e));
                    }
                };
                Ok(ChartConfig::Line(config))
            }
            "scatter" => {
                let config = match serde_json::from_value::<ScatterChartConfig>(config_value) {
                    Ok(config) => config,
                    Err(e) => {
                        return Err(detailed_deserialization_error::<D::Error>(
                            "Scatter chart",
                            &e,
                        ));
                    }
                };
                Ok(ChartConfig::Scatter(config))
            }
            "pie" => {
                let config = match serde_json::from_value::<PieChartConfig>(config_value) {
                    Ok(config) => config,
                    Err(e) => {
                        return Err(detailed_deserialization_error::<D::Error>("Pie chart", &e));
                    }
                };
                Ok(ChartConfig::Pie(config))
            }
            "combo" => {
                let config = match serde_json::from_value::<ComboChartConfig>(config_value) {
                    Ok(config) => config,
                    Err(e) => {
                        return Err(detailed_deserialization_error::<D::Error>(
                            "Combo chart",
                            &e,
                        ));
                    }
                };
                Ok(ChartConfig::Combo(config))
            }
            "metric" => {
                let config = match serde_json::from_value::<MetricChartConfig>(config_value) {
                    Ok(config) => config,
                    Err(e) => {
                        return Err(detailed_deserialization_error::<D::Error>(
                            "Metric chart",
                            &e,
                        ));
                    }
                };
                Ok(ChartConfig::Metric(config))
            }
            "table" => {
                let config = match serde_json::from_value::<TableChartConfig>(config_value) {
                    Ok(config) => config,
                    Err(e) => {
                        return Err(detailed_deserialization_error::<D::Error>(
                            "Table chart",
                            &e,
                        ));
                    }
                };
                Ok(ChartConfig::Table(config))
            }
            unknown => Err(serde::de::Error::custom(format!(
                "unknown chart type: {}",
                unknown
            ))),
        }
    }
}

// Helper function to create detailed error messages for deserialization failures
fn detailed_deserialization_error<E: serde::de::Error>(
    chart_type: &str,
    err: &serde_json::Error,
) -> E {
    // Get the error message as a string
    let err_msg = err.to_string();

    // Match different error patterns to extract field information
    let detailed_error = match extract_detailed_error_info(&err_msg) {
        Some((field_name, expected_type, found_type)) => {
            // Complete type mismatch info available
            format!(
                "{} config error: field '{}' has invalid type: {}, expected {}",
                chart_type, field_name, found_type, expected_type
            )
        }
        None => {
            // Try to at least extract the field name
            if let Some(field_name) = extract_field_from_error(&err_msg) {
                format!(
                    "{} config error at field '{}': {}",
                    chart_type, field_name, err
                )
            } else {
                format!("{} config error: {}", chart_type, err)
            }
        }
    };

    E::custom(detailed_error)
}

// Helper function to extract detailed type mismatch information
fn extract_detailed_error_info(err_msg: &str) -> Option<(String, String, String)> {
    // Pattern for serde "invalid type" errors: "invalid type: X, expected Y at ..."
    if err_msg.starts_with("invalid type:") {
        // Extract expected and found types
        let parts: Vec<&str> = err_msg.split(", expected ").collect();
        if parts.len() >= 2 {
            let found_type = parts[0].replace("invalid type: ", "").trim().to_string();

            // Extract field path and expected type
            let remaining = parts[1];
            let field_parts: Vec<&str> = remaining.split(" at ").collect();
            let expected_type = field_parts[0].trim().to_string();

            // Try to extract field name
            if field_parts.len() >= 2 {
                if let Some(field_name) = extract_field_path(field_parts[1]) {
                    return Some((field_name, expected_type, found_type));
                }
            }

            // If we couldn't extract field but have types, use a placeholder
            return Some(("unknown_field".to_string(), expected_type, found_type));
        }
    }

    None
}

// Helper function to extract field path from location info
fn extract_field_path(location_info: &str) -> Option<String> {
    // Try to extract field name from different patterns

    // Pattern: key `field_name` at line X column Y
    if let Some(start_idx) = location_info.find("key `") {
        if let Some(end_idx) = location_info[start_idx + 5..].find('`') {
            return Some(location_info[start_idx + 5..start_idx + 5 + end_idx].to_string());
        }
    }

    // Pattern: at key "field_name"
    if let Some(start_idx) = location_info.find("at key \"") {
        if let Some(end_idx) = location_info[start_idx + 8..].find('"') {
            return Some(location_info[start_idx + 8..start_idx + 8 + end_idx].to_string());
        }
    }

    // Pattern: "field_name":
    if let Some(start_idx) = location_info.find('"') {
        if let Some(end_idx) = location_info[start_idx + 1..].find('"') {
            return Some(location_info[start_idx + 1..start_idx + 1 + end_idx].to_string());
        }
    }

    None
}

// Helper function to extract field name from error message
fn extract_field_from_error(err_msg: &str) -> Option<String> {
    // Try multiple patterns to extract field names

    // Pattern: key `field_name` at line X column Y
    if let Some(start_idx) = err_msg.find("key `") {
        if let Some(end_idx) = err_msg[start_idx + 5..].find('`') {
            return Some(err_msg[start_idx + 5..start_idx + 5 + end_idx].to_string());
        }
    }

    // Pattern: at key "field_name"
    if let Some(start_idx) = err_msg.find("at key \"") {
        if let Some(end_idx) = err_msg[start_idx + 8..].find('"') {
            return Some(err_msg[start_idx + 8..start_idx + 8 + end_idx].to_string());
        }
    }

    // Pattern: "field_name":
    if let Some(start_idx) = err_msg.find('"') {
        if let Some(end_idx) = err_msg[start_idx + 1..].find('"') {
            let field = &err_msg[start_idx + 1..start_idx + 1 + end_idx];
            // Avoid capturing things that aren't likely field names
            if !field.contains(' ') && field.len() > 0 && field.len() < 50 {
                return Some(field.to_string());
            }
        }
    }

    None
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(untagged)]
pub enum ShowLegendHeadline {
    Boolean(bool),
    String(String),
}

// Base chart config shared by all chart types
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BaseChartConfig {
    #[serde(alias = "column_label_formats")]
    pub column_label_formats: IndexMap<String, ColumnLabelFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "column_settings")]
    pub column_settings: Option<IndexMap<String, ColumnSettings>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub colors: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show_legend")]
    pub show_legend: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "grid_lines")]
    pub grid_lines: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show_legend_headline")]
    pub show_legend_headline: Option<ShowLegendHeadline>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "goal_lines")]
    pub goal_lines: Option<Vec<GoalLine>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trendlines: Option<Vec<Trendline>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "disable_tooltip")]
    pub disable_tooltip: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "y_axis_config")]
    pub y_axis_config: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "x_axis_config")]
    pub x_axis_config: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "category_axis_style_config")]
    pub category_axis_style_config: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "y2_axis_config")]
    pub y2_axis_config: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ColumnLabelFormat {
    #[serde(alias = "column_type")]
    pub column_type: String,
    #[serde(alias = "style")]
    pub style: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "display_name")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "number_separator_style")]
    pub number_separator_style: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "minimum_fraction_digits")]
    pub minimum_fraction_digits: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "maximum_fraction_digits")]
    pub maximum_fraction_digits: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "multiplier")]
    pub multiplier: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "prefix")]
    pub prefix: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "suffix")]
    pub suffix: Option<String>,
    #[serde(alias = "replace_missing_data_with")]
    pub replace_missing_data_with: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "compact_numbers")]
    pub compact_numbers: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "currency")]
    pub currency: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "date_format")]
    pub date_format: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "use_relative_time")]
    pub use_relative_time: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "is_utc")]
    pub is_utc: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "convert_number_to")]
    pub convert_number_to: Option<String>,
}

impl ColumnLabelFormat {
    /// Creates a new ColumnLabelFormat with appropriate defaults for the given type
    pub fn new_for_type(simple_type: &crate::types::SimpleType) -> Self {
        match simple_type {
            crate::types::SimpleType::Number => Self::new_number(),
            crate::types::SimpleType::String => Self::new_string(),
            crate::types::SimpleType::Date => Self::new_date(),
            crate::types::SimpleType::Boolean => Self::new_boolean(),
            crate::types::SimpleType::Other => Self::new_string(),
        }
    }

    /// Creates a new ColumnLabelFormat for number type
    pub fn new_number() -> Self {
        Self {
            column_type: "number".to_string(),
            style: "number".to_string(),
            display_name: None,
            number_separator_style: Some(",".to_string()),
            minimum_fraction_digits: Some(0),
            maximum_fraction_digits: Some(2),
            multiplier: None,
            prefix: None,
            suffix: None,
            replace_missing_data_with: None,
            compact_numbers: None,
            currency: None,
            date_format: None,
            use_relative_time: None,
            is_utc: None,
            convert_number_to: None,
        }
    }

    /// Creates a new ColumnLabelFormat for string type
    pub fn new_string() -> Self {
        Self {
            column_type: "string".to_string(),
            style: "string".to_string(),
            display_name: None,
            number_separator_style: None,
            minimum_fraction_digits: None,
            maximum_fraction_digits: None,
            multiplier: None,
            prefix: None,
            suffix: None,
            replace_missing_data_with: None,
            compact_numbers: None,
            currency: None,
            date_format: None,
            use_relative_time: None,
            is_utc: None,
            convert_number_to: None,
        }
    }

    /// Creates a new ColumnLabelFormat for date type
    pub fn new_date() -> Self {
        Self {
            column_type: "date".to_string(),
            style: "date".to_string(),
            display_name: None,
            number_separator_style: None,
            minimum_fraction_digits: None,
            maximum_fraction_digits: None,
            multiplier: None,
            prefix: None,
            suffix: None,
            replace_missing_data_with: None,
            compact_numbers: None,
            currency: None,
            date_format: Some("auto".to_string()),
            use_relative_time: None,
            is_utc: Some(false),
            convert_number_to: None,
        }
    }

    /// Creates a new ColumnLabelFormat for boolean type
    pub fn new_boolean() -> Self {
        Self::new_string() // Booleans use string formatting by default
    }

    /// Generate column formats from data metadata
    pub fn generate_formats_from_metadata(
        metadata: &crate::types::DataMetadata,
    ) -> indexmap::IndexMap<String, Self> {
        let mut formats = indexmap::IndexMap::new();

        for column in &metadata.column_metadata {
            let format = Self::new_for_type(&column.simple_type);
            formats.insert(column.name.clone(), format);
        }

        formats
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ColumnSettings {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show_data_labels")]
    pub show_data_labels: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show_data_labels_as_percentage")]
    pub show_data_labels_as_percentage: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "column_visualization")]
    pub column_visualization: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_width")]
    pub line_width: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_style")]
    pub line_style: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_type")]
    pub line_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_symbol_size")]
    pub line_symbol_size: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "bar_roundness")]
    pub bar_roundness: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_symbol_size_dot")]
    pub line_symbol_size_dot: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GoalLine {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show")]
    pub show: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "value")]
    pub value: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show_goal_line_label")]
    pub show_goal_line_label: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "goal_line_label")]
    pub goal_line_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "goal_line_color")]
    pub goal_line_color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Trendline {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show")]
    pub show: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "show_trendline_label")]
    pub show_trendline_label: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "trendline_label")]
    pub trendline_label: Option<String>,
    #[serde(alias = "type")]
    pub r#type: String,
    #[serde(alias = "column_id")]
    pub column_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "trend_line_color")]
    pub trend_line_color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BarLineChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(alias = "bar_and_line_axis")]
    pub bar_and_line_axis: BarAndLineAxis,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "bar_layout")]
    pub bar_layout: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "bar_sort_by")]
    pub bar_sort_by: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "bar_group_type")]
    pub bar_group_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "bar_show_total_at_top")]
    pub bar_show_total_at_top: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "line_group_type")]
    pub line_group_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BarAndLineAxis {
    #[serde(alias = "x")]
    pub x: Vec<String>,
    #[serde(alias = "y")]
    pub y: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "category")]
    pub category: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "tooltip")]
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScatterChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(alias = "scatter_axis")]
    pub scatter_axis: ScatterAxis,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "scatter_dot_size")]
    pub scatter_dot_size: Option<Vec<f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScatterAxis {
    pub x: Vec<String>,
    pub y: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PieChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(alias = "pie_chart_axis")]
    pub pie_chart_axis: PieChartAxis,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_display_label_as")]
    pub pie_display_label_as: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_show_inner_label")]
    pub pie_show_inner_label: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_inner_label_aggregate")]
    pub pie_inner_label_aggregate: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_inner_label_title")]
    pub pie_inner_label_title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_label_position")]
    pub pie_label_position: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_donut_width")]
    pub pie_donut_width: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "pie_minimum_slice_percentage")]
    pub pie_minimum_slice_percentage: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PieChartAxis {
    pub x: Vec<String>,
    pub y: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ComboChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(alias = "combo_chart_axis")]
    pub combo_chart_axis: ComboChartAxis,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ComboChartAxis {
    pub x: Vec<String>,
    pub y: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y2: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MetricChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(alias = "metric_column_id")]
    pub metric_column_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "metric_value_aggregate")]
    pub metric_value_aggregate: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "metric_header")]
    pub metric_header: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "metric_sub_header")]
    pub metric_sub_header: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "metric_value_label")]
    pub metric_value_label: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TableChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "table_column_order")]
    pub table_column_order: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "table_column_widths")]
    pub table_column_widths: Option<std::collections::HashMap<String, f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "table_header_background_color")]
    pub table_header_background_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "table_header_font_color")]
    pub table_header_font_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "table_column_font_color")]
    pub table_column_font_color: Option<String>,
}

impl MetricYml {
    pub fn new(yml_content: String) -> Result<Self> {
        let file: MetricYml = match serde_yaml::from_str(&yml_content) {
            Ok(file) => file,
            Err(e) => {
                // Extract field information from error message if possible
                let error_message = format!("Error parsing YAML: {}", e);

                // Try to extract field path from YAML error
                let yaml_error_str = e.to_string();
                let detailed_error =
                    if yaml_error_str.contains("at line") && yaml_error_str.contains("column") {
                        format!("Error parsing YAML at {}", yaml_error_str)
                    } else {
                        error_message
                    };

                return Err(anyhow::anyhow!(detailed_error));
            }
        };

        match file.validate() {
            Ok(_) => Ok(file),
            Err(e) => Err(anyhow::anyhow!("Error validating metric: {}", e)),
        }
    }

    //TODO: Need to validate a metric deeply.
    pub fn validate(&self) -> Result<()> {
        Ok(())
    }
}

impl FromSql<Jsonb, Pg> for MetricYml {
    fn from_sql(bytes: diesel::pg::PgValue) -> diesel::deserialize::Result<Self> {
        let value = <serde_json::Value as FromSql<Jsonb, Pg>>::from_sql(bytes)?;
        Ok(serde_json::from_value(value)?)
    }
}

impl ToSql<Jsonb, Pg> for MetricYml {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> diesel::serialize::Result {
        out.write_all(&[1])?; // JSONB version 1 header
        out.write_all(&serde_json::to_vec(self)?)?;
        Ok(IsNull::No)
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use crate::types::{ColumnMetaData, ColumnType, DataMetadata, SimpleType};

    use super::*;

    fn normalize_whitespace(s: &str) -> String {
        s.split_whitespace().collect::<Vec<&str>>().join(" ")
    }

    #[test]
    fn test_metric_yml_bar_serialization() -> Result<()> {
        let yml_content = "title: \"Average Time to Close by Rep\"\nsql: |\n  SELECT\n    rep_id,\n    AVG(time_to_close) AS average_time_to_close\n  FROM deal_metrics\n  GROUP BY rep_id\n  ORDER BY average_time_to_close DESC\nchart_config:\n  selected_chart_type: \"bar\"\n  selected_view: \"standard\"\n  bar_and_line_axis:\n    x: [\"rep_id\"]\n    y: [\"average_time_to_close\"]\n    category: [\"rep_id\"]\n  bar_layout: \"vertical\"\n  bar_group_type: \"group\"\n  column_label_formats: {}\n  colors: [\"#1f77b4\", \"#ff7f0e\", \"#2ca02c\", \"#d62728\"]\n  show_legend: false\n  grid_lines: true\n  column_settings: {}\ndata_metadata:\n  - name: \"rep_id\"\n    data_type: \"string\"\n  - name: \"average_time_to_close\"\n    data_type: \"number\"";

        let metric = MetricYml::new(yml_content.to_string())?;

        // Verify the basic fields
        assert_eq!(metric.name, "Average Time to Close by Rep");

        // Compare SQL with normalized whitespace
        let expected_sql = normalize_whitespace("SELECT rep_id, AVG(time_to_close) AS average_time_to_close FROM deal_metrics GROUP BY rep_id ORDER BY average_time_to_close DESC");
        let actual_sql = normalize_whitespace(&metric.sql);
        assert_eq!(actual_sql, expected_sql);

        // Verify chart config
        match metric.chart_config {
            ChartConfig::Bar(config) => {
                assert!(config.base.column_label_formats.is_empty());
                assert_eq!(config.bar_and_line_axis.x, vec![String::from("rep_id")]);
                assert_eq!(
                    config.bar_and_line_axis.y,
                    vec![String::from("average_time_to_close")]
                );
                assert_eq!(
                    config.bar_and_line_axis.category,
                    Some(vec![String::from("rep_id")])
                );
                assert_eq!(config.bar_layout.unwrap(), "vertical");
                assert_eq!(config.bar_group_type.unwrap(), "group");
                assert_eq!(
                    config.base.colors.unwrap(),
                    vec!["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"]
                );
                assert_eq!(config.base.show_legend.unwrap(), false);
                assert_eq!(config.base.grid_lines.unwrap(), true);
            }
            _ => panic!("Expected Bar chart type"),
        }

        Ok(())
    }

    #[test]
    fn test_column_label_format_constructors() {
        // Test number format
        let number_format = ColumnLabelFormat::new_number();
        assert_eq!(number_format.column_type, "number");
        assert_eq!(number_format.style, "number");
        assert_eq!(number_format.number_separator_style, Some(",".to_string()));
        assert_eq!(number_format.minimum_fraction_digits, Some(0));
        assert_eq!(number_format.maximum_fraction_digits, Some(2));

        // Test string format
        let string_format = ColumnLabelFormat::new_string();
        assert_eq!(string_format.column_type, "string");
        assert_eq!(string_format.style, "string");
        assert_eq!(string_format.number_separator_style, None);

        // Test date format
        let date_format = ColumnLabelFormat::new_date();
        assert_eq!(date_format.column_type, "date");
        assert_eq!(date_format.style, "date");
        assert_eq!(date_format.date_format, Some("auto".to_string()));
        assert_eq!(date_format.is_utc, Some(false));

        // Test boolean format - should be same as string
        let boolean_format = ColumnLabelFormat::new_boolean();
        assert_eq!(boolean_format.column_type, "string");
        assert_eq!(boolean_format.style, "string");
    }

    #[test]
    fn test_generate_formats_from_metadata() {
        // Create test metadata
        let metadata = DataMetadata {
            column_count: 3,
            row_count: 10,
            column_metadata: vec![
                ColumnMetaData {
                    name: "id".to_string(),
                    min_value: json!(1),
                    max_value: json!(100),
                    unique_values: 10,
                    simple_type: SimpleType::Number,
                    column_type: ColumnType::Int4,
                },
                ColumnMetaData {
                    name: "name".to_string(),
                    min_value: json!("A"),
                    max_value: json!("Z"),
                    unique_values: 5,
                    simple_type: SimpleType::String,
                    column_type: ColumnType::Varchar,
                },
                ColumnMetaData {
                    name: "created_at".to_string(),
                    min_value: json!("2023-01-01T00:00:00"),
                    max_value: json!("2023-12-31T23:59:59"),
                    unique_values: 10,
                    simple_type: SimpleType::Date,
                    column_type: ColumnType::Timestamp,
                },
            ],
        };

        // Generate formats
        let formats = ColumnLabelFormat::generate_formats_from_metadata(&metadata);

        // Check we have formats for all columns
        assert_eq!(formats.len(), 3);

        // Check individual formats
        let id_format = formats.get("id").unwrap();
        assert_eq!(id_format.column_type, "number");

        let name_format = formats.get("name").unwrap();
        assert_eq!(name_format.column_type, "string");

        let date_format = formats.get("created_at").unwrap();
        assert_eq!(date_format.column_type, "date");
        assert_eq!(date_format.style, "date");
    }
}
