use std::collections::HashMap;

use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl, Queryable, Selectable};
use diesel_async::RunQueryDsl;
use futures::future::join_all;
use middleware::AuthenticatedUser;
use serde_json::Value;
use serde_yaml;
use tokio::task::JoinHandle;
use uuid::Uuid;

use crate::dashboards::types::{BusterShareIndividual, DashboardCollection};
use crate::metrics::{get_metric_handler, BusterMetric, Version};
use database::enums::{AssetPermissionRole, AssetType, IdentityType, Verification};
use database::helpers::dashboard_files::fetch_dashboard_file_with_permission;
use database::pool::get_pg_pool;
use database::schema::{asset_permissions, collections, collections_to_assets, dashboard_files, users};
use database::types::VersionHistory;
use sharing::check_permission_access;

use super::{
    BusterDashboard, BusterDashboardResponse, DashboardConfig, DashboardRow, DashboardRowItem,
};

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

/// Fetches collections that the dashboard belongs to
async fn fetch_associated_collections_for_dashboard(dashboard_id: Uuid) -> Result<Vec<DashboardCollection>> {
    let mut conn = get_pg_pool().get().await?;
    
    let associated_collections = collections_to_assets::table
        .inner_join(collections::table.on(collections::id.eq(collections_to_assets::collection_id)))
        .filter(collections_to_assets::asset_id.eq(dashboard_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
        .filter(collections::deleted_at.is_null()) // Ensure collection isn't deleted
        .select((collections::id, collections::name))
        .load::<(Uuid, String)>(&mut conn)
        .await?
        .into_iter()
        .map(|(id, name)| DashboardCollection { 
            id: id.to_string(), 
            name 
        })
        .collect();
    
    Ok(associated_collections)
}

pub async fn get_dashboard_handler(
    dashboard_id: &Uuid,
    user: &AuthenticatedUser,
    version_number: Option<i32>,
) -> Result<BusterDashboardResponse> {
    // First check if the user has permission to view this dashboard
    let dashboard_with_permission =
        fetch_dashboard_file_with_permission(dashboard_id, &user.id).await?;

    // If dashboard not found, return error
    let dashboard_with_permission = match dashboard_with_permission {
        Some(dwp) => dwp,
        None => return Err(anyhow!("Dashboard not found")),
    };

    // Check if user has permission to view the dashboard
    // Users need at least CanView permission or any higher permission
    if !check_permission_access(
        dashboard_with_permission.permission,
        &[
            AssetPermissionRole::CanView,
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        dashboard_with_permission.dashboard_file.organization_id,
        &user.organizations,
    ) {
        return Err(anyhow!("You don't have permission to view this dashboard"));
    }

    // Extract permission for consistent use in response
    // If the asset is public and the user has no direct permission, default to CanView
    let permission = dashboard_with_permission.permission
        .unwrap_or(AssetPermissionRole::CanView);

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    let dashboard_file = dashboard_with_permission.dashboard_file;

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
        // Use current content but convert it to serde_json::Value
        let content_value = dashboard_file.content.to_value()?;
        (
            content_value,
            dashboard_file
                .version_history
                .get_latest_version()
                .map(|v| v.version_number)
                .unwrap_or(1),
        )
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
            row.items
                .iter()
                .filter_map(|item| Uuid::parse_str(&item.id).ok())
        })
        .collect();

    // Fetch all metrics concurrently (latest versions)
    let metric_futures: Vec<_> = metric_ids
        .iter()
        .map(|metric_id| get_metric_handler(metric_id, &user, None))
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
        .select((asset_permissions::role, users::email, users::name))
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

    // Clone dashboard_id for use in spawned task
    let d_id = *dashboard_id;

    // Spawn task to fetch collections concurrently
    let collections_handle: JoinHandle<Result<Vec<DashboardCollection>>> =
        tokio::spawn(async move { fetch_associated_collections_for_dashboard(d_id).await });

    // Construct the dashboard using content values where available
    let dashboard = BusterDashboard {
        config,
        created_at: dashboard_file.created_at,
        created_by: dashboard_file.created_by,
        description: content
            .get("description")
            .and_then(|v| v.as_str().map(String::from)),
        id: dashboard_file.id,
        name,
        updated_at: Some(updated_at),
        updated_by: dashboard_file.created_by,
        status: Verification::Verified,
        version_number: version_num,
        file: serde_yaml::to_string(&content)?,
        file_name: dashboard_file.file_name,
    };

    // Await collections result
    let collections_result = collections_handle.await;
    
    // Handle collections result
    let collections = match collections_result {
        Ok(Ok(c)) => c,
        Ok(Err(e)) => {
            tracing::error!("Failed to fetch associated collections for dashboard {}: {}", dashboard_id, e);
            vec![]
        }
        Err(e) => { // JoinError
            tracing::error!("Task join error fetching collections for dashboard {}: {}", dashboard_id, e);
            vec![]
        }
    };

    Ok(BusterDashboardResponse {
        access: permission,
        metrics,
        dashboard,
        permission,
        public_password: None,
        collections, // Now populated with associated collections
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
            let column_sizes = row.get("columnSizes").and_then(|sizes| {
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
