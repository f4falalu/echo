use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::Verification,
    pool::get_pg_pool,
    schema::{metric_files, users},
};
use diesel::{ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl};
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
    pub name: String,
    pub last_edited: DateTime<Utc>,
    pub created_by_id: Uuid,
    pub created_by_name: String,
    pub created_by_email: String,
    pub created_by_avatar: Option<String>,
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
        .inner_join(users::table.on(metric_files::created_by.eq(users::id)))
        .select((
            (
                metric_files::id,
                metric_files::name,
                metric_files::created_by,
                metric_files::created_at,
                metric_files::updated_at,
                metric_files::verification,
                metric_files::content,
            ),
            (
                users::name.nullable(),
                users::email,
                users::avatar_url.nullable(),
            ),
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
            (
                Uuid,
                String,
                Uuid,
                DateTime<Utc>,
                DateTime<Utc>,
                Verification,
                serde_json::Value,
            ),
            (Option<String>, String, Option<String>),
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
            |(
                (id, name, created_by, _created_at, updated_at, status, _content),
                (created_by_name, created_by_email, created_by_avatar),
            )| {
                BusterMetricListItem {
                    id,
                    name,
                    last_edited: updated_at,
                    created_by_id: created_by,
                    created_by_name: created_by_name.unwrap_or(created_by_email.clone()),
                    created_by_email: created_by_email,
                    created_by_avatar: created_by_avatar,
                    status,
                    is_shared: false, // Would determine based on permissions
                }
            },
        )
        .collect();

    Ok(metrics)
}
