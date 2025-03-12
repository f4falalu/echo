use anyhow::{anyhow, Result};
use database::types::MetricYml;
use indexmap::IndexMap;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashSet;
use uuid::Uuid;

use query_engine::data_source_helpers;
use query_engine::data_types::DataType;

use crate::metrics::get_metric_handler;

/// Request structure for the get_metric_data handler
#[derive(Debug, Deserialize)]
pub struct GetMetricDataRequest {
    pub metric_id: Uuid,
    pub limit: Option<i64>,
}

#[derive(Debug, Serialize)]
pub enum SimpleType {
    #[serde(rename = "text")]
    Text,
    #[serde(rename = "number")]
    Number,
    #[serde(rename = "date")]
    Date,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ColumnType {
    Text,
    Float,
    Integer,
    Date,
    Float8,
    Timestamp,
    Timestamptz,
    Bool,
    Time,
    Boolean,
    Json,
    Jsonb,
    Int8,
    Int4,
    Int2,
    Decimal,
    Char,
    #[serde(rename = "character varying")]
    CharacterVarying,
    Character,
    Varchar,
    Number,
    Numeric,
    Tinytext,
    Mediumtext,
    Longtext,
    Nchar,
    Nvarchat,
    Ntext,
    Float4,
}

#[derive(Debug, Serialize)]
pub struct ColumnMetaData {
    pub name: String,
    pub min_value: serde_json::Value,
    pub max_value: serde_json::Value,
    pub unique_values: i32,
    pub simple_type: SimpleType,
    #[serde(rename = "type")]
    pub column_type: ColumnType,
}

/// Structure for the metric data response
#[derive(Debug, Serialize)]
pub struct MetricDataResponse {
    pub metric_id: Uuid,
    pub data: Vec<IndexMap<String, DataType>>,
    pub data_metadata: MetricData,
}

#[derive(Debug, Serialize)]
pub struct MetricData {
    pub column_count: i64,
    pub row_count: i64,
    pub column_metadata: Vec<ColumnMetaData>,
}

/// Handler to retrieve both the metric definition and its associated data
pub async fn get_metric_data_handler(
    request: GetMetricDataRequest,
    user: AuthenticatedUser,
) -> Result<MetricDataResponse> {
    tracing::info!(
        "Getting metric data for metric_id: {}, user_id: {}",
        request.metric_id,
        user.id
    );

    let user_id = user.id;

    // Retrieve the metric definition
    let metric = get_metric_handler(&request.metric_id, &user_id).await?;

    // Parse the metric definition from YAML to get SQL and dataset IDs
    let metric_yml = serde_yaml::from_str::<MetricYml>(&metric.file)?;
    let sql = metric_yml.sql;
    let dataset_ids = metric_yml.dataset_ids;

    if dataset_ids.is_empty() {
        return Err(anyhow!("No dataset IDs found in metric"));
    }

    // Get the first dataset ID to use for querying
    let primary_dataset_id = dataset_ids[0];

    // Get the data source ID for the dataset
    let dataset_sources = data_source_helpers::get_data_sources_for_datasets(&dataset_ids).await?;

    if dataset_sources.is_empty() {
        return Err(anyhow!(
            "Could not find data sources for the specified datasets"
        ));
    }

    // Find the data source for the primary dataset
    let data_source = dataset_sources
        .iter()
        .find(|ds| ds.dataset_id == primary_dataset_id)
        .ok_or_else(|| anyhow!("Primary dataset not found"))?;

    tracing::info!(
        "Querying data for metric. Dataset: {}, Data source: {}",
        data_source.name,
        data_source.data_source_id
    );

    // Execute the query to get the metric data
    let result = match query_engine::data_source_query_routes::query_engine::query_engine(
        &data_source.data_source_id,
        &sql,
        request.limit,
    )
    .await
    {
        Ok(data) => data,
        Err(e) => {
            tracing::error!("Error executing metric query: {}", e);
            return Err(anyhow!("Error executing metric query: {}", e));
        }
    };

    let column_count = result.first().map(|row| row.len()).unwrap_or(0) as i64;
    let row_count = result.len() as i64;

    // Compute column metadata
    let mut column_metadata = Vec::new();
    if let Some(first_row) = result.first() {
        for (col_name, sample_value) in first_row.iter() {
            let mut value_map = HashSet::new();
            let mut min_value = None;
            let mut max_value = None;

            // Analyze column data
            for row in &result {
                if let Some(value) = row.get(col_name) {
                    value_map.insert(format!("{:?}", value));
                    update_min_max(value, &mut min_value, &mut max_value);
                }
            }

            let (simple_type, column_type) = determine_types(sample_value);

            // Only include min/max for numeric and date types
            let (min_value, max_value) = match simple_type {
                SimpleType::Number | SimpleType::Date => (
                    min_value.unwrap_or(serde_json::Value::Null),
                    max_value.unwrap_or(serde_json::Value::Null),
                ),
                _ => (serde_json::Value::Null, serde_json::Value::Null),
            };

            column_metadata.push(ColumnMetaData {
                name: col_name.clone(),
                min_value,
                max_value,
                unique_values: value_map.len() as i32,
                simple_type,
                column_type,
            });
        }
    }

    // Construct and return the response
    Ok(MetricDataResponse {
        metric_id: request.metric_id,
        data: result,
        data_metadata: MetricData {
            column_count,
            row_count,
            column_metadata,
        },
    })
}

fn update_min_max(
    value: &DataType,
    min_value: &mut Option<serde_json::Value>,
    max_value: &mut Option<serde_json::Value>,
) {
    match value {
        DataType::Int2(Some(v)) => {
            let num = serde_json::Number::from(*v as i64);
            update_numeric_min_max(num, min_value, max_value);
        }
        DataType::Int4(Some(v)) => {
            let num = serde_json::Number::from(*v as i64);
            update_numeric_min_max(num, min_value, max_value);
        }
        DataType::Int8(Some(v)) => {
            let num = serde_json::Number::from(*v);
            update_numeric_min_max(num, min_value, max_value);
        }
        DataType::Float4(Some(v)) => {
            if let Some(num) = serde_json::Number::from_f64(*v as f64) {
                update_numeric_min_max(num, min_value, max_value);
            }
        }
        DataType::Float8(Some(v)) => {
            if let Some(num) = serde_json::Number::from_f64(*v) {
                update_numeric_min_max(num, min_value, max_value);
            }
        }
        DataType::Date(Some(v)) => {
            let v = v.to_string();
            update_string_min_max(&v, min_value, max_value);
        }
        DataType::Timestamp(Some(v)) => {
            let v = v.to_string();
            update_string_min_max(&v, min_value, max_value);
        }
        DataType::Timestamptz(Some(v)) => {
            let v = v.to_string();
            update_string_min_max(&v, min_value, max_value);
        }
        _ => {}
    }
}

fn update_numeric_min_max(
    value: serde_json::Number,
    min_value: &mut Option<serde_json::Value>,
    max_value: &mut Option<serde_json::Value>,
) {
    let value = serde_json::Value::Number(value);
    match (min_value.as_ref(), max_value.as_ref()) {
        (None, None) => {
            *min_value = Some(value.clone());
            *max_value = Some(value);
        }
        (Some(current_min), Some(current_max)) => {
            if let (Some(current_min), Some(current_max), Some(new_val)) =
                (current_min.as_f64(), current_max.as_f64(), value.as_f64())
            {
                if new_val < current_min {
                    *min_value = Some(value.clone());
                }
                if new_val > current_max {
                    *max_value = Some(value);
                }
            }
        }
        _ => {}
    }
}

fn update_string_min_max(
    value: &str,
    min_value: &mut Option<serde_json::Value>,
    max_value: &mut Option<serde_json::Value>,
) {
    let value = serde_json::Value::String(value.to_string());
    match (min_value.as_ref(), max_value.as_ref()) {
        (None, None) => {
            *min_value = Some(value.clone());
            *max_value = Some(value);
        }
        (Some(current_min), Some(current_max)) => {
            if let (Some(current_min), Some(current_max), Some(new_val)) =
                (current_min.as_str(), current_max.as_str(), value.as_str())
            {
                if new_val < current_min {
                    *min_value = Some(value.clone());
                }
                if new_val > current_max {
                    *max_value = Some(value);
                }
            }
        }
        _ => {}
    }
}

fn determine_types(value: &DataType) -> (SimpleType, ColumnType) {
    match value {
        DataType::Text(_) => (SimpleType::Text, ColumnType::Text),
        DataType::Char(_) => (SimpleType::Text, ColumnType::Char),
        DataType::Int2(_) => (SimpleType::Number, ColumnType::Int2),
        DataType::Int4(_) => (SimpleType::Number, ColumnType::Int4),
        DataType::Int8(_) => (SimpleType::Number, ColumnType::Int8),
        DataType::Float4(_) => (SimpleType::Number, ColumnType::Float4),
        DataType::Float8(_) => (SimpleType::Number, ColumnType::Float8),
        DataType::Decimal(_) => (SimpleType::Number, ColumnType::Decimal),
        DataType::Date(_) => (SimpleType::Date, ColumnType::Date),
        DataType::Timestamp(_) => (SimpleType::Date, ColumnType::Timestamp),
        DataType::Timestamptz(_) => (SimpleType::Date, ColumnType::Timestamptz),
        DataType::Time(_) => (SimpleType::Date, ColumnType::Time),
        DataType::Bool(_) => (SimpleType::Text, ColumnType::Boolean),
        DataType::Json(_) => (SimpleType::Text, ColumnType::Json),
        _ => (SimpleType::Text, ColumnType::Text),
    }
}
