use std::collections::HashMap;

use anyhow::{anyhow, Result};
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl, Queryable, Selectable};
use diesel_async::RunQueryDsl;
use serde_json::Value;
use uuid::Uuid;
use futures::future::join_all;
use chrono::{DateTime, Utc};
use serde_yaml;

use crate::dashboards::types::BusterShareIndividual;
use crate::metrics::{get_metric_handler, BusterMetric, Version};
use database::enums::{AssetPermissionRole, AssetType, IdentityType, Verification};
use database::pool::get_pg_pool;
use database::schema::{asset_permissions, dashboard_files, users};
use database::types::VersionHistory;

use super::{BusterDashboard, BusterDashboardResponse, DashboardConfig, DashboardRow, DashboardRowItem};

#[derive(Queryable, Selectable)]
#[diesel(table_name = dashboard_files)]
struct QueryableDashboardFile {
    id: Uuid,
    name: String,
    file_name: String,
    content: Value,
    #[allow(dead_code)]
    filter: Option<String>,
    #[allow(dead_code)]
    organization_id: Uuid,
    created_by: Uuid,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
    publicly_accessible: bool,
    publicly_enabled_by: Option<Uuid>,
    public_expiry_date: Option<chrono::DateTime<chrono::Utc>>,
    version_history: VersionHistory,
}

#[derive(Queryable)]
struct AssetPermissionInfo {
    role: AssetPermissionRole,
    email: String,
    name: Option<String>,
}

pub async fn get_dashboard_handler(dashboard_id: &Uuid, user_id: &Uuid, version_number: Option<i32>) -> Result<BusterDashboardResponse> {
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
            dashboard_files::publicly_accessible,
            dashboard_files::publicly_enabled_by,
            dashboard_files::public_expiry_date,
            dashboard_files::version_history,
        ))
        .first::<QueryableDashboardFile>(&mut conn)
        .await
        .map_err(|e| match e {
            diesel::result::Error::NotFound => anyhow!("Dashboard file not found or unauthorized"),
            _ => anyhow!("Database error: {}", e),
        })?;

    // Determine which version to use based on version_number parameter
    let (content, version_num) = if let Some(version) = version_number {
        // Get the specific version if it exists
        if let Some(v) = dashboard_file.version_history.get_version(version) {
            match &v.content {
                database::types::VersionContent::DashboardYml(content) => {
                    let content_value = content.to_value()?;
                    (content_value, v.version_number)
                }
                _ => return Err(anyhow!("Invalid version content type")),
            }
        } else {
            return Err(anyhow!("Version {} not found", version));
        }
    } else {
        // Use current content as is
        (dashboard_file.content.clone(), 
         dashboard_file.version_history.get_latest_version()
            .map(|v| v.version_number)
            .unwrap_or(1))
    };
    
    // Parse the content to get metric IDs and other dashboard info
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

    // Fetch all metrics concurrently (latest versions)
    let metric_futures: Vec<_> = metric_ids
        .iter()
        .map(|metric_id| get_metric_handler(metric_id, user_id, None))
        .collect();

    let metric_results = join_all(metric_futures).await;
    let metrics: HashMap<Uuid, BusterMetric> = metric_results
        .into_iter()
        .filter_map(|result| result.ok())
        .map(|metric| (metric.id, metric))
        .collect();

    // Query individual permissions for this dashboard
    let individual_permissions_query = asset_permissions::table
        .inner_join(users::table.on(users::id.eq(asset_permissions::identity_id)))
        .filter(asset_permissions::asset_id.eq(dashboard_id))
        .filter(asset_permissions::asset_type.eq(AssetType::DashboardFile))
        .filter(asset_permissions::identity_type.eq(IdentityType::User))
        .filter(asset_permissions::deleted_at.is_null())
        .select((
            asset_permissions::role,
            users::email,
            users::name,
        ))
        .load::<AssetPermissionInfo>(&mut conn)
        .await;

    // Get the user info for publicly_enabled_by if it exists
    let public_enabled_by_user = if let Some(enabled_by_id) = dashboard_file.publicly_enabled_by {
        users::table
            .filter(users::id.eq(enabled_by_id))
            .select(users::email)
            .first::<String>(&mut conn)
            .await
            .ok()
    } else {
        None
    };
    
    // Extract versions from version history
    let mut versions: Vec<Version> = dashboard_file
        .version_history
        .0
        .values()
        .map(|v| Version {
            version_number: v.version_number,
            updated_at: v.updated_at,
        })
        .collect();

    // Sort versions by version_number in ascending order
    versions.sort_by(|a, b| a.version_number.cmp(&b.version_number));

    // Convert AssetPermissionInfo to BusterShareIndividual
    let individual_permissions = match individual_permissions_query {
        Ok(permissions) => {
            if permissions.is_empty() {
                None
            } else {
                Some(
                    permissions
                        .into_iter()
                        .map(|p| BusterShareIndividual {
                            email: p.email,
                            role: p.role,
                            name: p.name,
                        })
                        .collect::<Vec<BusterShareIndividual>>(),
                )
            }
        }
        Err(_) => None,
    };

    // Construct the dashboard using content values where available
    let dashboard = BusterDashboard {
        config,
        created_at: dashboard_file.created_at,
        created_by: dashboard_file.created_by,
        description: content.get("description").and_then(|v| v.as_str().map(String::from)),
        id: dashboard_file.id,
        name,
        updated_at: Some(updated_at),
        updated_by: dashboard_file.created_by,
        status: Verification::Verified,
        version_number: version_num,
        file: serde_yaml::to_string(&content)?,
        file_name: dashboard_file.file_name,
    };

    Ok(BusterDashboardResponse {
        access: AssetPermissionRole::Owner,
        metrics,
        dashboard,
        permission: AssetPermissionRole::Owner,
        public_password: None,
        collections: vec![],  // Empty collections for now
        // New sharing fields
        individual_permissions,
        publicly_accessible: dashboard_file.publicly_accessible,
        public_expiry_date: dashboard_file.public_expiry_date,
        public_enabled_by: public_enabled_by_user,
        // Version information
        versions,
    })
}

fn parse_dashboard_config(content: &Value) -> Result<DashboardConfig> {
    let rows = content
        .get("rows")
        .ok_or_else(|| anyhow!("Missing rows in dashboard content"))?
        .as_array()
        .ok_or_else(|| anyhow!("Rows is not an array"))?
        .iter()
        .enumerate()
        .map(|(index, row)| {
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

            // Extract column_sizes from the row if available
            let column_sizes = row
                .get("columnSizes")
                .and_then(|sizes| {
                    sizes.as_array().map(|arr| {
                        arr.iter()
                            .filter_map(|size| size.as_u64().map(|s| s as u32))
                            .collect::<Vec<u32>>()
                    })
                });

            // Extract row_height from the row if available
            let row_height = row
                .get("rowHeight")
                .and_then(|height| height.as_u64().map(|h| h as u32));

            Ok(DashboardRow {
                id: (index + 1).to_string(),
                items,
                row_height,
                column_sizes,
            })
        })
        .collect::<Result<Vec<_>>>()?;

    Ok(DashboardConfig { rows })
}
