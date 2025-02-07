use anyhow::Result;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct MetricYml {
    pub id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub sql: String,
    pub chart_config: ChartConfig,
    pub data_metadata: Vec<DataMetadata>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DataMetadata {
    pub name: String,
    pub data_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "selectedChartType")]
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

// Base chart config shared by all chart types
#[derive(Debug, Serialize, Deserialize)]
pub struct BaseChartConfig {
    pub column_label_formats: std::collections::HashMap<String, ColumnLabelFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column_settings: Option<std::collections::HashMap<String, ColumnSettings>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub colors: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub show_legend: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub grid_lines: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub show_legend_headline: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub goal_lines: Option<Vec<GoalLine>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trendlines: Option<Vec<Trendline>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disable_tooltip: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y_axis_config: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub x_axis_config: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_axis_style_config: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y2_axis_config: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ColumnLabelFormat {
    pub column_type: String,
    pub style: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub number_separator_style: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub minimum_fraction_digits: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub maximum_fraction_digits: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub multiplier: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prefix: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suffix: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replace_missing_data_with: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub compact_numbers: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub date_format: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_relative_time: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_utc: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub convert_number_to: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ColumnSettings {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub show_data_labels: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub show_data_labels_as_percentage: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column_visualization: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line_width: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line_style: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line_symbol_size: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bar_roundness: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line_symbol_size_dot: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GoalLine {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub show: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub show_goal_line_label: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub goal_line_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub goal_line_color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Trendline {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub show: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub show_trendline_label: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trendline_label: Option<String>,
    pub r#type: String,
    pub column_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trend_line_color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BarLineChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    pub bar_and_line_axis: BarAndLineAxis,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bar_layout: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bar_sort_by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bar_group_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bar_show_total_at_top: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line_group_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BarAndLineAxis {
    pub x: Vec<String>,
    pub y: Vec<String>,
    pub category: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScatterChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    pub scatter_axis: ScatterAxis,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scatter_dot_size: Option<Vec<f64>>,
}

#[derive(Debug, Serialize, Deserialize)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct PieChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    pub pie_chart_axis: PieChartAxis,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pie_display_label_as: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pie_show_inner_label: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pie_inner_label_aggregate: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pie_inner_label_title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pie_label_position: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pie_donut_width: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pie_minimum_slice_percentage: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PieChartAxis {
    pub x: Vec<String>,
    pub y: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComboChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    pub combo_chart_axis: ComboChartAxis,
}

#[derive(Debug, Serialize, Deserialize)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct MetricChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    pub metric_column_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metric_value_aggregate: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metric_header: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metric_sub_header: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metric_value_label: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TableChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub table_column_order: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub table_column_widths: Option<std::collections::HashMap<String, f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub table_header_background_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub table_header_font_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub table_column_font_color: Option<String>,
}

impl MetricYml {
    pub fn new(yml_content: String) -> Result<Self> {
        let mut file: MetricYml = match serde_yaml::from_str(&yml_content) {
            Ok(file) => file,
            Err(e) => return Err(anyhow::anyhow!("Error parsing YAML: {}", e)),
        };

        if file.id.is_none() {
            file.id = Some(Uuid::new_v4());
        }

        match file.validate() {
            Ok(_) => Ok(file),
            Err(e) => Err(anyhow::anyhow!("Error compiling file: {}", e)),
        }
    }

    pub fn validate(&self) -> Result<()> {
        Ok(())
    }
}
