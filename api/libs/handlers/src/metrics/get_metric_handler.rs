use anyhow::{anyhow, Result};
use diesel::{
    ExpressionMethods, NullableExpressionMethods, QueryDsl, Queryable, Selectable, SelectableHelper,
};
use diesel_async::RunQueryDsl;
use serde_json::{json, Value};
use serde_yaml;
use uuid::Uuid;

use crate::metrics::types::{
    BusterMetric, ColumnMetaData, ColumnType, DataMetadata, Dataset, MinMaxValue, SimpleType,
};
use agents::tools::file_tools::file_types::metric_yml::MetricYml;
use database::enums::Verification;
use database::pool::get_pg_pool;
use database::schema::{datasets, metric_files, users};

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

#[derive(Queryable)]
struct DatasetInfo {
    id: Uuid,
    name: String,
}

#[derive(Queryable)]
#[diesel(table_name = users)]
struct UserInfo {
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
    name: Option<String>,
    #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)]
    avatar_url: Option<String>,
}

/// Handler to retrieve a metric by ID
pub async fn get_metric_handler(metric_id: &Uuid, user_id: &Uuid) -> Result<BusterMetric> {
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

    // Parse the content as MetricYml
    let metric_yml: MetricYml = serde_json::from_value(metric_file.content.clone())?;

    // Map evaluation score to High/Moderate/Low
    let evaluation_score = metric_file.evaluation_score.map(|score| {
        if score >= 0.8 {
            "High".to_string()
        } else if score >= 0.5 {
            "Moderate".to_string()
        } else {
            "Low".to_string()
        }
    });

    // Convert content to pretty YAML
    let file = match serde_yaml::to_string(&metric_file.content) {
        Ok(yaml) => yaml,
        Err(e) => return Err(anyhow!("Failed to convert content to YAML: {}", e)),
    };

    // Parse data metadata from MetricYml
    let data_metadata = metric_yml.data_metadata.map(|metadata| {
        DataMetadata {
            column_count: metadata.len() as i32,
            column_metadata: metadata
                .iter()
                .map(|col| ColumnMetaData {
                    name: col.name.clone(),
                    min_value: MinMaxValue::Number(0.0), // Default value
                    max_value: MinMaxValue::Number(0.0), // Default value
                    unique_values: 0,                    // Default value
                    simple_type: match col.data_type.as_str() {
                        "string" => SimpleType::Text,
                        "number" => SimpleType::Number,
                        "boolean" => SimpleType::Boolean,
                        "date" => SimpleType::Date,
                        _ => SimpleType::Text,
                    },
                    column_type: match col.data_type.as_str() {
                        "string" => ColumnType::Text,
                        "number" => ColumnType::Number,
                        "boolean" => ColumnType::Boolean,
                        "date" => ColumnType::Date,
                        _ => ColumnType::Text,
                    },
                })
                .collect(),
            row_count: 1, // Default value since it's not in the MetricYml structure
        }
    });

    // Get dataset information for all dataset IDs
    let mut datasets = Vec::new();
    for dataset_id in &metric_yml.dataset_ids {
        if let Ok(dataset_info) = datasets::table
            .filter(datasets::id.eq(dataset_id))
            .filter(datasets::deleted_at.is_null())
            .select((datasets::id, datasets::name))
            .first::<DatasetInfo>(&mut conn)
            .await
        {
            datasets.push(Dataset {
                id: dataset_info.id.to_string(),
                name: dataset_info.name,
            });
        }
    }

    // Get user information
    let user_info = users::table
        .filter(users::id.eq(metric_file.created_by))
        .select((users::name, users::avatar_url))
        .first::<UserInfo>(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to get user information: {}", e))?;

    // Construct BusterMetric
    Ok(BusterMetric {
        id: metric_file.id.to_string(),
        metric_type: "metric".to_string(),
        title: metric_yml.title,
        version_number: 1,
        description: metric_yml.description,
        file_name: metric_file.file_name,
        time_frame: metric_yml
            .updated_at
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_else(|| "".to_string()),
        datasets,
        data_source_id: "".to_string(), // This would need to be fetched from another source
        error: None,
        chart_config: Some(serde_json::to_value(&metric_yml.chart_config)?),
        data_metadata,
        status: metric_file.verification,
        evaluation_score,
        evaluation_summary: metric_file.evaluation_summary.unwrap_or_default(),
        file,
        created_at: metric_file.created_at.to_rfc3339(),
        updated_at: metric_file.updated_at.to_rfc3339(),
        sent_by_id: metric_file.created_by.to_string(),
        sent_by_name: user_info.name.unwrap_or("".to_string()),
        sent_by_avatar_url: user_info.avatar_url,
        code: None,
        dashboards: vec![],  // TODO: Get associated dashboards
        collections: vec![], // TODO: Get associated collections
    })
}
