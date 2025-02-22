use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MetricYml {
    pub id: Option<Uuid>,
    pub updated_at: Option<DateTime<Utc>>,
    #[serde(alias = "name")]
    pub title: String,
    pub description: Option<String>,
    pub sql: String,
    pub chart_config: ChartConfig,
    pub data_metadata: Option<Vec<DataMetadata>>,
    pub dataset_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DataMetadata {
    pub name: String,
    pub data_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "selected_chart_type")]
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
#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BarAndLineAxis {
    pub x: Vec<String>,
    pub y: Vec<String>,
    pub category: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScatterChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    pub scatter_axis: ScatterAxis,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scatter_dot_size: Option<Vec<f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PieChartAxis {
    pub x: Vec<String>,
    pub y: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tooltip: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComboChartConfig {
    #[serde(flatten)]
    pub base: BaseChartConfig,
    pub combo_chart_axis: ComboChartAxis,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[derive(Debug, Serialize, Deserialize, Clone)]
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

        file.updated_at = Some(Utc::now());

        match file.validate() {
            Ok(_) => Ok(file),
            Err(e) => Err(anyhow::anyhow!("Error compiling file: {}", e)),
        }
    }

    //TODO: Need to validate a metric deeply.
    pub fn validate(&self) -> Result<()> {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn normalize_whitespace(s: &str) -> String {
        s.split_whitespace().collect::<Vec<&str>>().join(" ")
    }

    #[test]
    fn test_metric_yml_bar_serialization() -> Result<()> {
        let yml_content = "title: \"Average Time to Close by Rep\"\nsql: |\n  SELECT\n    rep_id,\n    AVG(time_to_close) AS average_time_to_close\n  FROM deal_metrics\n  GROUP BY rep_id\n  ORDER BY average_time_to_close DESC\nchart_config:\n  selected_chart_type: \"bar\"\n  selected_view: \"standard\"\n  bar_and_line_axis:\n    x: [\"rep_id\"]\n    y: [\"average_time_to_close\"]\n    category: [\"rep_id\"]\n  bar_layout: \"vertical\"\n  bar_group_type: \"group\"\n  column_label_formats: {}\n  colors: [\"#1f77b4\", \"#ff7f0e\", \"#2ca02c\", \"#d62728\"]\n  show_legend: false\n  grid_lines: true\n  column_settings: {}\ndata_metadata:\n  - name: \"rep_id\"\n    data_type: \"string\"\n  - name: \"average_time_to_close\"\n    data_type: \"number\"";

        let metric = MetricYml::new(yml_content.to_string())?;

        // Verify the basic fields
        assert_eq!(metric.title, "Average Time to Close by Rep");

        // Compare SQL with normalized whitespace
        let expected_sql = normalize_whitespace("SELECT rep_id, AVG(time_to_close) AS average_time_to_close FROM deal_metrics GROUP BY rep_id ORDER BY average_time_to_close DESC");
        let actual_sql = normalize_whitespace(&metric.sql);
        assert_eq!(actual_sql, expected_sql);

        // Verify chart config
        match metric.chart_config {
            ChartConfig::Bar(config) => {
                assert!(config.base.column_label_formats.is_empty());
                assert_eq!(config.bar_and_line_axis.x, vec![String::from("rep_id")]);
                assert_eq!(config.bar_and_line_axis.y, vec![String::from("average_time_to_close")]);
                assert_eq!(config.bar_and_line_axis.category, Some(vec![String::from("rep_id")]));
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

        // Verify data metadata
        let metadata = metric.data_metadata.unwrap();
        assert_eq!(metadata.len(), 2);
        assert_eq!(metadata[0].name, "rep_id");
        assert_eq!(metadata[0].data_type, "string");
        assert_eq!(metadata[1].name, "average_time_to_close");
        assert_eq!(metadata[1].data_type, "number");

        // Verify auto-generated fields
        assert!(metric.id.is_some());
        assert!(metric.updated_at.is_some());

        Ok(())
    }
}
