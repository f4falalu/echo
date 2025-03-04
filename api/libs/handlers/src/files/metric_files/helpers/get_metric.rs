use anyhow::{anyhow, Result};
use diesel::{ExpressionMethods, QueryDsl, Queryable, Selectable};
use diesel_async::RunQueryDsl;
use serde_json::{json, Value};
use uuid::Uuid;
use serde_yaml;

use crate::files::metric_files::types::BusterMetric;
use crate::files::{ColumnMetaData, ColumnType, DataMetadata, MinMaxValue, SimpleType};
use database::enums::Verification;
use database::pool::get_pg_pool;
use database::schema::metric_files;

#[derive(Queryable, Selectable)]
#[diesel(table_name = metric_files)]
struct QueryableMetricFile {
    id: Uuid,
    name: String,
    file_name: String,
    content: Value,
    verification: Verification,
    evaluation_obj: Option<Value>,
    evaluation_summary: Option<String>,
    evaluation_score: Option<f64>,
    created_by: Uuid,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

pub async fn get_metric(metric_id: &Uuid, user_id: &Uuid) -> Result<BusterMetric> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    // Query the metric file
    let metric_file = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null())
        .select((
            metric_files::id,
            metric_files::name,
            metric_files::file_name,
            metric_files::content,
            metric_files::verification,
            metric_files::evaluation_obj,
            metric_files::evaluation_summary,
            metric_files::evaluation_score,
            metric_files::created_by,
            metric_files::created_at,
            metric_files::updated_at,
        ))
        .first::<QueryableMetricFile>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => anyhow!("Metric file not found or unauthorized"),
            _ => anyhow!("Database error: {}", e),
        })?;

    // Extract fields directly from the JSON content
    let content = &metric_file.content;
    
    let title = content
        .get("title")
        .and_then(Value::as_str)
        .unwrap_or("Untitled")
        .to_string();

    let description = content
        .get("description")
        .and_then(|v| match v {
            Value::Null => None,
            v => v.as_str().map(String::from),
        });

    let sql = content
        .get("sql")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();

    // Get chart config directly
    let chart_config = content.get("chart_config").cloned().unwrap_or(json!({}));

    // Parse data metadata if it exists
    let data_metadata = content.get("data_metadata").map(|metadata| {
        DataMetadata {
            column_count: metadata.as_array().map(|arr| arr.len() as i32).unwrap_or(1),
            column_metadata: metadata
                .as_array()
                .map(|columns| {
                    columns
                        .iter()
                        .map(|col| ColumnMetaData {
                            name: col
                                .get("name")
                                .and_then(Value::as_str)
                                .unwrap_or("unknown")
                                .to_string(),
                            min_value: MinMaxValue::Number(0.0), // Default value
                            max_value: MinMaxValue::Number(0.0), // Default value
                            unique_values: 0, // Default value
                            simple_type: match col.get("data_type").and_then(Value::as_str) {
                                Some("string") => SimpleType::Text,
                                Some("number") => SimpleType::Number,
                                Some("boolean") => SimpleType::Boolean,
                                Some("date") => SimpleType::Date,
                                _ => SimpleType::Number,
                            },
                            column_type: match col.get("data_type").and_then(Value::as_str) {
                                Some("string") => ColumnType::Text,
                                Some("number") => ColumnType::Number,
                                Some("boolean") => ColumnType::Boolean,
                                Some("date") => ColumnType::Date,
                                _ => ColumnType::Number,
                            },
                        })
                        .collect()
                })
                .unwrap_or_default(),
            row_count: 1, // Default value since it's not in your JSON structure
        }
    });

    // Construct BusterMetric
    Ok(BusterMetric {
        id: metric_file.id.to_string(),
        metric_type: "metric".to_string(),
        title,
        version_number: 1,
        description,
        file_name: metric_file.file_name,
        time_frame: "TODO".to_string(),
        dataset_id: "TODO".to_string(),
        data_source_id: "TODO".to_string(),
        dataset_name: None,
        error: None,
        chart_config: Some(chart_config),
        data_metadata,
        status: metric_file.verification,
        evaluation_score: metric_file.evaluation_score.map(|score| score.to_string()),
        evaluation_summary: metric_file.evaluation_summary.unwrap_or_default(),
        file: serde_json::to_string(&content).unwrap_or_default(),
        created_at: metric_file.created_at.to_string(),
        updated_at: metric_file.updated_at.to_string(),
        sent_by_id: metric_file.created_by.to_string(),
        sent_by_name: "".to_string(),
        sent_by_avatar_url: None,
        code: None,
        dashboards: vec![],
        collections: vec![],
    })
}
