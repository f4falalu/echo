use anyhow::{anyhow, Result};
use diesel::{ExpressionMethods, QueryDsl, Queryable, Selectable};
use diesel_async::RunQueryDsl;
use serde_json::{json, Value};
use uuid::Uuid;
use futures::future::{try_join_all, join_all};
use chrono::{DateTime, Utc};
use serde_yaml;

use crate::files::dashboard_files::types::{
    BusterDashboard, BusterDashboardResponse, DashboardConfig, DashboardRow, DashboardRowItem,
};
use crate::files::metric_files::helpers::get_metric;
use database::enums::{AssetPermissionRole, Verification};
use database::pool::get_pg_pool;
use database::schema::dashboard_files;

#[derive(Queryable, Selectable)]
#[diesel(table_name = dashboard_files)]
struct QueryableDashboardFile {
    id: Uuid,
    name: String,
    file_name: String,
    content: Value,
    filter: Option<String>,
    organization_id: Uuid,
    created_by: Uuid,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

pub async fn get_dashboard(dashboard_id: &Uuid, user_id: &Uuid) -> Result<BusterDashboardResponse> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    // Query the dashboard file
    let dashboard_file = dashboard_files::table
        .filter(dashboard_files::id.eq(dashboard_id))
        .filter(dashboard_files::deleted_at.is_null())
        .select((
            dashboard_files::id,
            dashboard_files::name,
            dashboard_files::file_name,
            dashboard_files::content,
            dashboard_files::filter,
            dashboard_files::organization_id,
            dashboard_files::created_by,
            dashboard_files::created_at,
            dashboard_files::updated_at,
        ))
        .first::<QueryableDashboardFile>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => anyhow!("Dashboard file not found"),
            _ => anyhow!("Database error: {}", e),
        })?;

    // Parse the content to get metric IDs and other dashboard info
    let content = dashboard_file.content.clone();
    let config = parse_dashboard_config(&content)?;

    // Get updated_at from content if available, otherwise use the database value
    let updated_at = content
        .get("updated_at")
        .and_then(Value::as_str)
        .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or(dashboard_file.updated_at);

    // Get name from content if available, otherwise use the database value
    let name = content
        .get("name")
        .and_then(Value::as_str)
        .unwrap_or(&dashboard_file.name)
        .to_string();

    // Collect all metric IDs from the rows
    let metric_ids: Vec<Uuid> = config
        .rows
        .iter()
        .flat_map(|row| {
            row.items.iter().filter_map(|item| {
                Uuid::parse_str(&item.id).ok()
            })
        })
        .collect();

    // Fetch all metrics concurrently
    let metric_futures: Vec<_> = metric_ids
        .iter()
        .map(|metric_id| get_metric(metric_id, user_id))
        .collect();

    let metric_results = join_all(metric_futures).await;
    let metrics: Vec<_> = metric_results
        .into_iter()
        .filter_map(|result| result.ok())
        .collect();

    // Construct the dashboard using content values where available
    let dashboard = BusterDashboard {
        config,
        created_at: dashboard_file.created_at.to_string(),
        created_by: dashboard_file.created_by.to_string(),
        deleted_at: None,
        description: content.get("description").and_then(|v| v.as_str().map(String::from)),
        id: content
            .get("id")
            .and_then(Value::as_str)
            .unwrap_or(&dashboard_file.id.to_string())
            .to_string(),
        name,
        updated_at: Some(updated_at.to_string()),
        updated_by: dashboard_file.created_by.to_string(),
        status: Verification::Verified,
        version_number: content
            .get("version_number")
            .and_then(Value::as_i64)
            .unwrap_or(1) as i32,
        file: serde_yaml::to_string(&dashboard_file.content)?,
        file_name: dashboard_file.file_name,
    };

    Ok(BusterDashboardResponse {
        access: AssetPermissionRole::Owner,
        metrics,
        dashboard,
        permission: AssetPermissionRole::Owner,
        public_password: None,
        collections: vec![],
    })
}

fn parse_dashboard_config(content: &Value) -> Result<DashboardConfig> {
    let rows = content
        .get("rows")
        .ok_or_else(|| anyhow!("Missing rows in dashboard content"))?
        .as_array()
        .ok_or_else(|| anyhow!("Rows is not an array"))?
        .iter()
        .map(|row| {
            let items = row
                .get("items")
                .ok_or_else(|| anyhow!("Missing items in row"))?
                .as_array()
                .ok_or_else(|| anyhow!("Items is not an array"))?
                .iter()
                .map(|item| {
                    Ok(DashboardRowItem {
                        id: item
                            .get("id")
                            .ok_or_else(|| anyhow!("Missing id in item"))?
                            .as_str()
                            .ok_or_else(|| anyhow!("Id is not a string"))?
                            .to_string(),
                    })
                })
                .collect::<Result<Vec<_>>>()?;

            Ok(DashboardRow {
                items,
                row_height: None,
                column_sizes: None,
            })
        })
        .collect::<Result<Vec<_>>>()?;

    Ok(DashboardConfig { rows })
}
