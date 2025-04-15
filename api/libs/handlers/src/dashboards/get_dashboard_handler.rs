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
use crate::metrics::{get_metric_handler, BusterMetric, Dataset, Version};
use database::enums::{AssetPermissionRole, AssetType, IdentityType, Verification};
use database::helpers::dashboard_files::fetch_dashboard_file_with_permission;
use database::pool::get_pg_pool;
use database::schema::{
    asset_permissions, collections, collections_to_assets, dashboard_files, metric_files, users,
};
use database::types::{MetricYml, VersionHistory};
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
async fn fetch_associated_collections_for_dashboard(
    dashboard_id: Uuid,
) -> Result<Vec<DashboardCollection>> {
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
            name,
        })
        .collect();

    Ok(associated_collections)
}

/// Fetches minimal metric data for display on a dashboard, enforcing a specific permission level.
async fn get_metrics_for_dashboard(
    metric_ids: &[Uuid],
    dashboard_permission: AssetPermissionRole,
    // user: &AuthenticatedUser, // We might not need the user if we aren't doing fine-grained checks here
) -> Result<HashMap<Uuid, BusterMetric>> {
    if metric_ids.is_empty() {
        return Ok(HashMap::new());
    }

    let mut conn = get_pg_pool().get().await?;

    // Fetch all required MetricFile records in one query
    let metric_files_data = metric_files::table
        .filter(metric_files::id.eq_any(metric_ids))
        .filter(metric_files::deleted_at.is_null()) // Ensure metrics aren't deleted
        .load::<database::models::MetricFile>(&mut conn)
        .await?;

    let mut metrics_map = HashMap::new();

    // Process each fetched metric file
    for metric_file in metric_files_data {
        // Use latest content directly from the MetricFile record
        let metric_content: MetricYml = metric_file.content;
        let version_num = metric_file.version_history.get_version_number();

        // Convert content to YAML string for the 'file' field
        let file_yaml = match serde_yaml::to_string(&metric_content) {
            Ok(yaml) => yaml,
            Err(e) => {
                tracing::error!(metric_id = %metric_file.id, error = %e, "Failed to serialize metric content to YAML for dashboard view");
                // Skip this metric or handle error appropriately
                continue;
            }
        };

        // Simplified dataset fetching (if needed, adapt from get_metric_handler if complex logic required)
        let mut datasets = Vec::new();
        let mut first_data_source_id = None;
        // Placeholder: Fetching actual dataset names might require another query or joining.
        // For now, create dummy datasets based on IDs if necessary for the type.
        if !metric_content.dataset_ids.is_empty() {
            first_data_source_id = Some(Uuid::nil()); // Placeholder - needs actual lookup if required
            datasets = metric_content
                .dataset_ids
                .iter()
                .map(|id| Dataset {
                    id: id.to_string(),
                    name: format!("Dataset {}", id), // Placeholder name
                })
                .collect();
        }

        // Construct the BusterMetric, forcing the dashboard's permission level
        let buster_metric = BusterMetric {
            id: metric_file.id,
            metric_type: "metric".to_string(), // Assuming standard type
            name: metric_file.name,
            version_number: version_num,
            description: metric_content.description,
            file_name: metric_file.file_name,
            time_frame: metric_content.time_frame,
            datasets, // Using simplified dataset info
            data_source_id: first_data_source_id.map_or("".to_string(), |id| id.to_string()),
            error: None, // Assuming no error fetching this basic view
            chart_config: Some(metric_content.chart_config),
            data_metadata: metric_file.data_metadata,
            status: metric_file.verification,
            evaluation_score: metric_file.evaluation_score.map(|score| {
                // Simple mapping
                if score >= 0.8 {
                    "High".to_string()
                } else if score >= 0.5 {
                    "Moderate".to_string()
                } else {
                    "Low".to_string()
                }
            }),
            evaluation_summary: metric_file.evaluation_summary.unwrap_or_default(),
            file: file_yaml,
            created_at: metric_file.created_at,
            updated_at: metric_file.updated_at,
            sent_by_id: metric_file.created_by,
            sent_by_name: "".to_string(), // Placeholder - requires user lookup
            sent_by_avatar_url: None,     // Placeholder - requires user lookup
            code: None,                   // Assuming not needed for dashboard view
            dashboards: vec![],           // Omit associated dashboards/collections for simplicity
            collections: vec![],          // Omit associated dashboards/collections for simplicity
            versions: vec![],             // Omit detailed versions for simplicity
            permission: dashboard_permission, // <<< Force the permission level here
            sql: metric_content.sql,
            // Omit detailed sharing info for simplicity in this view
            individual_permissions: None,
            publicly_accessible: metric_file.publicly_accessible,
            public_expiry_date: metric_file.public_expiry_date,
            public_enabled_by: None, // Placeholder - requires user lookup
            public_password: metric_file.public_password,
        };

        metrics_map.insert(buster_metric.id, buster_metric);
    }

    Ok(metrics_map)
}

pub async fn get_dashboard_handler(
    dashboard_id: &Uuid,
    user: &AuthenticatedUser,
    version_number: Option<i32>,
    password: Option<String>,
) -> Result<BusterDashboardResponse> {
    // First check if the user has permission to view this dashboard
    let dashboard_with_permission_option =
        fetch_dashboard_file_with_permission(dashboard_id, &user.id).await?;

    // If dashboard not found, return error
    let dashboard_with_permission = match dashboard_with_permission_option {
        Some(dwp) => dwp,
        None => {
            tracing::warn!(dashboard_id = %dashboard_id, "Dashboard file not found during fetch");
            return Err(anyhow!("Dashboard not found"));
        }
    };

    let dashboard_file = dashboard_with_permission.dashboard_file;
    let direct_permission_level = dashboard_with_permission.permission;

    // Check if user has proper permission to view the dashboard
    let permission: AssetPermissionRole;
    tracing::debug!(dashboard_id = %dashboard_id, user_id = %user.id, "Checking permissions for dashboard");

    // Check for direct/admin permission first
    tracing::debug!(dashboard_id = %dashboard_id, "Checking direct/admin permissions first.");
    let has_sufficient_direct_permission = check_permission_access(
        direct_permission_level,
        &[
            AssetPermissionRole::CanView,
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
            AssetPermissionRole::CanFilter,
        ],
        dashboard_file.organization_id,
        &user.organizations,
    );
    tracing::debug!(dashboard_id = %dashboard_id, ?direct_permission_level, has_sufficient_direct_permission, "Direct permission check result");

    if has_sufficient_direct_permission {
        // User has direct/admin permission, use that role
        permission = direct_permission_level.unwrap_or(AssetPermissionRole::CanView); // Default just in case
        tracing::debug!(dashboard_id = %dashboard_id, user_id = %user.id, ?permission, "Granting access via direct/admin permission.");
    } else {
        // No sufficient direct/admin permission, check public access rules
        tracing::debug!(dashboard_id = %dashboard_id, "Insufficient direct/admin permission. Checking public access rules.");
        if !dashboard_file.publicly_accessible {
            tracing::warn!(dashboard_id = %dashboard_id, user_id = %user.id, "Permission denied (not public, insufficient direct permission).");
            return Err(anyhow!("You don't have permission to view this dashboard"));
        }
        tracing::debug!(dashboard_id = %dashboard_id, "Dashboard is publicly accessible.");

        // Check if the public access has expired
        if let Some(expiry_date) = dashboard_file.public_expiry_date {
            tracing::debug!(dashboard_id = %dashboard_id, ?expiry_date, "Checking expiry date");
            if expiry_date < chrono::Utc::now() {
                tracing::warn!(dashboard_id = %dashboard_id, "Public access expired");
                return Err(anyhow!("Public access to this dashboard has expired"));
            }
        }

        // Check if a password is required
        tracing::debug!(dashboard_id = %dashboard_id, has_password = dashboard_file.public_password.is_some(), "Checking password requirement");
        if let Some(required_password) = &dashboard_file.public_password {
            tracing::debug!(dashboard_id = %dashboard_id, "Password required. Checking provided password.");
            match password {
                Some(provided_password) => {
                    if provided_password != *required_password {
                        // Incorrect password provided
                        tracing::warn!(dashboard_id = %dashboard_id, user_id = %user.id, "Incorrect public password provided");
                        return Err(anyhow!("Incorrect password for public access"));
                    }
                    // Correct password provided, grant CanView via public access
                    tracing::debug!(dashboard_id = %dashboard_id, user_id = %user.id, "Correct public password provided. Granting CanView.");
                    permission = AssetPermissionRole::CanView;
                }
                None => {
                    // Password required but none provided
                    tracing::warn!(dashboard_id = %dashboard_id, user_id = %user.id, "Public password required but none provided");
                    return Err(anyhow!("public_password required for this dashboard"));
                }
            }
        } else {
            // Publicly accessible, not expired, and no password required
            tracing::debug!(dashboard_id = %dashboard_id, "Public access granted (no password required).");
            permission = AssetPermissionRole::CanView;
        }
    }

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

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

    // Fetch metrics using the specialized function, enforcing dashboard permission
    let metrics = get_metrics_for_dashboard(&metric_ids, permission).await?;

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
            tracing::error!(
                "Failed to fetch associated collections for dashboard {}: {}",
                dashboard_id,
                e
            );
            vec![]
        }
        Err(e) => {
            // JoinError
            tracing::error!(
                "Task join error fetching collections for dashboard {}: {}",
                dashboard_id,
                e
            );
            vec![]
        }
    };

    Ok(BusterDashboardResponse {
        access: permission,
        metrics,
        dashboard,
        permission,
        public_password: dashboard_file.public_password,
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
