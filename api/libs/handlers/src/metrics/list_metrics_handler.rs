use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{enums::Verification, pool::get_pg_pool, schema::metric_files};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct MetricsListRequest {
    pub page_token: i64,
    pub page_size: i64,
    pub shared_with_me: Option<bool>,
    pub only_my_metrics: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BusterMetricListItem {
    pub id: Uuid,
    pub title: String,
    pub last_edited: DateTime<Utc>,
    pub created_by_id: Uuid,
    pub created_by_name: String,
    pub created_by_email: String,
    pub created_by_avatar: String,
    pub status: Verification,
    pub is_shared: bool,
}

pub async fn list_metrics_handler(
    user_id: &Uuid,
    request: MetricsListRequest,
) -> Result<Vec<BusterMetricListItem>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    // Calculate offset from page_token
    let offset = request.page_token * request.page_size;

    // Build the base query
    let mut metric_statement = metric_files::table
        .select((
            metric_files::id,
            metric_files::name,
            metric_files::created_by,
            metric_files::created_at,
            metric_files::updated_at,
            metric_files::verification,
            metric_files::content,
        ))
        .filter(metric_files::deleted_at.is_null())
        .distinct()
        .order((metric_files::updated_at.desc(), metric_files::id.asc()))
        .offset(offset)
        .limit(request.page_size)
        .into_boxed();

    // Add filters for shared_with_me and only_my_metrics if provided
    if let Some(true) = request.only_my_metrics {
        metric_statement =
            diesel::QueryDsl::filter(metric_statement, metric_files::created_by.eq(user_id));
    }

    // Execute the query
    let metric_results = match metric_statement
        .load::<(
            Uuid,
            String,
            Uuid,
            DateTime<Utc>,
            DateTime<Utc>,
            Verification,
            serde_json::Value,
        )>(&mut conn)
        .await
    {
        Ok(results) => results,
        Err(e) => return Err(anyhow!("Error getting metric results: {}", e)),
    };

    // Transform query results into BusterMetricListItem
    let metrics = metric_results
        .into_iter()
        .map(
            |(id, name, created_by, _created_at, updated_at, status, content)| {
                BusterMetricListItem {
                    id,
                    title: name,
                    last_edited: updated_at,
                    created_by_id: created_by,
                    created_by_name: "todo".to_string(), // Would fetch from users table
                    created_by_email: "todo".to_string(), // Would fetch from users table
                    created_by_avatar: "todo".to_string(), // Would fetch from users table
                    status,
                    is_shared: false, // Would determine based on permissions
                }
            },
        )
        .collect();

    Ok(metrics)
}
