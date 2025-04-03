use anyhow::{anyhow, Result};
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl, Queryable};
use diesel_async::RunQueryDsl;
use futures::future::{join};
use middleware::AuthenticatedUser;
use serde_yaml;
use uuid::Uuid;

use crate::metrics::types::{
    AssociatedCollection, AssociatedDashboard, BusterMetric, Dataset,
};
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use database::helpers::metric_files::fetch_metric_file_with_permissions;
use database::pool::get_pg_pool;
use database::schema::{
    asset_permissions, collections, collections_to_assets, dashboard_files, datasets,
    metric_files_to_dashboard_files, users,
};
use sharing::check_permission_access;

use super::Version;

#[derive(Queryable)]
struct DatasetInfo {
    id: Uuid,
    name: String,
    data_source_id: Uuid,
}

#[derive(Queryable)]
struct AssetPermissionInfo {
    role: AssetPermissionRole,
    email: String,
    name: Option<String>,
}

/// Fetch the dashboards associated with the given metric id
async fn fetch_associated_dashboards_for_metric(
    metric_id: Uuid,
) -> Result<Vec<AssociatedDashboard>> {
    let mut conn = get_pg_pool().get().await?;
    let associated_dashboards = metric_files_to_dashboard_files::table
        .inner_join(
            dashboard_files::table
                .on(dashboard_files::id.eq(metric_files_to_dashboard_files::dashboard_file_id)),
        )
        .filter(metric_files_to_dashboard_files::metric_file_id.eq(metric_id))
        .filter(dashboard_files::deleted_at.is_null())
        .filter(metric_files_to_dashboard_files::deleted_at.is_null())
        .select((dashboard_files::id, dashboard_files::name))
        .load::<(Uuid, String)>(&mut conn)
        .await?
        .into_iter()
        .map(|(id, name)| AssociatedDashboard { id, name })
        .collect();
    Ok(associated_dashboards)
}

/// Fetch the collections associated with the given metric id
async fn fetch_associated_collections_for_metric(
    metric_id: Uuid,
) -> Result<Vec<AssociatedCollection>> {
    let mut conn = get_pg_pool().get().await?;
    let associated_collections = collections_to_assets::table
        .inner_join(collections::table.on(collections::id.eq(collections_to_assets::collection_id)))
        .filter(collections_to_assets::asset_id.eq(metric_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .filter(collections::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .select((collections::id, collections::name))
        .load::<(Uuid, String)>(&mut conn)
        .await?
        .into_iter()
        .map(|(id, name)| AssociatedCollection { id, name })
        .collect();
    Ok(associated_collections)
}

/// Handler to retrieve a metric by ID with optional version number
///
/// If version_number is provided, returns that specific version of the metric.
/// If version_number is None, returns the latest version of the metric.
pub async fn get_metric_handler(
    metric_id: &Uuid,
    user: &AuthenticatedUser,
    version_number: Option<i32>,
) -> Result<BusterMetric> {
    // 1. Fetch metric file with permission
    let metric_file_with_permission = fetch_metric_file_with_permissions(metric_id, &user.id)
        .await
        .map_err(|e| anyhow!("Failed to fetch metric file with permissions: {}", e))?;

    let metric_file = if let Some(metric_file) = metric_file_with_permission {
        metric_file
    } else {
        return Err(anyhow!("Metric file not found"));
    };

    // 2. Check if user has at least FullAccess permission
    if !check_permission_access(
        metric_file.permission,
        &[
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
            AssetPermissionRole::Editor,
            AssetPermissionRole::Viewer,
        ],
        metric_file.metric_file.organization_id,
        &user.organizations,
    ) {
        return Err(anyhow!("You don't have permission to view this metric"));
    }

    let permission = if let Some(permission) = metric_file.permission {
        permission
    } else {
        return Err(anyhow!("You don't have permission to view this metric"));
    };

    let metric_file = metric_file.metric_file;

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

    // Determine which version to use based on version_number parameter
    let (metric_content, version_num) = if let Some(version) = version_number {
        // Get the specific version if it exists
        if let Some(v) = metric_file.version_history.get_version(version) {
            match &v.content {
                database::types::VersionContent::MetricYml(content) => {
                    (content.clone(), v.version_number)
                }
                _ => return Err(anyhow!("Invalid version content type")),
            }
        } else {
            return Err(anyhow!("Version {} not found", version));
        }
    } else {
        // Get the latest version
        if let Some(v) = metric_file.version_history.get_latest_version() {
            match &v.content {
                database::types::VersionContent::MetricYml(content) => {
                    (content.clone(), v.version_number)
                }
                _ => return Err(anyhow!("Invalid version content type")),
            }
        } else {
            // Fall back to current content if no version history
            (Box::new(metric_file.content.clone()), 1)
        }
    };

    // Convert content to pretty YAML
    let file = match serde_yaml::to_string(&metric_content) {
        Ok(yaml) => yaml,
        Err(e) => return Err(anyhow!("Failed to convert content to YAML: {}", e)),
    };

    // Data metadata is fetched directly from the metric_file database record
    let data_metadata = metric_file.data_metadata;

    let mut conn = get_pg_pool().get().await?;

    // Get dataset information for all dataset IDs
    let mut datasets = Vec::new();
    let mut first_data_source_id = None;
    for dataset_id in &metric_content.dataset_ids {
        if let Ok(dataset_info) = datasets::table
            .filter(datasets::id.eq(dataset_id))
            .filter(datasets::deleted_at.is_null())
            .select((datasets::id, datasets::name, datasets::data_source_id))
            .first::<DatasetInfo>(&mut conn)
            .await
        {
            datasets.push(Dataset {
                id: dataset_info.id.to_string(),
                name: dataset_info.name,
            });
            first_data_source_id = Some(dataset_info.data_source_id);
        }
    }

    // Get user information
    // let user_info = users::table
    //     .filter(users::id.eq(metric_file.created_by))
    //     .select((users::name, users::avatar_url))
    //     .first::<UserInfo>(&mut conn)
    //     .await
    //     .map_err(|e| anyhow!("Failed to get user information: {}", e))?;

    let mut versions: Vec<Version> = metric_file
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

    // Query individual permissions for this metric
    let individual_permissions_query = asset_permissions::table
        .inner_join(users::table.on(users::id.eq(asset_permissions::identity_id)))
        .filter(asset_permissions::asset_id.eq(metric_id))
        .filter(asset_permissions::asset_type.eq(AssetType::MetricFile))
        .filter(asset_permissions::identity_type.eq(IdentityType::User))
        .filter(asset_permissions::deleted_at.is_null())
        .select((asset_permissions::role, users::email, users::name))
        .load::<AssetPermissionInfo>(&mut conn)
        .await;

    // Get the user info for publicly_enabled_by if it exists
    let public_enabled_by_user = if let Some(enabled_by_id) = metric_file.publicly_enabled_by {
        users::table
            .filter(users::id.eq(enabled_by_id))
            .select(users::email)
            .first::<String>(&mut conn)
            .await
            .ok()
    } else {
        None
    };

    // Concurrently fetch associated dashboards and collections
    let metrics_id_clone = *metric_id;
    let dashboards_future = fetch_associated_dashboards_for_metric(metrics_id_clone);
    let collections_future = fetch_associated_collections_for_metric(metrics_id_clone);

    // Await both futures concurrently
    let (dashboards_result, collections_result) = join(dashboards_future, collections_future).await;

    // Handle results, logging errors but returning empty Vecs for failed tasks
    let dashboards = match dashboards_result {
        Ok(dashboards) => dashboards,
        Err(e) => {
            tracing::error!(
                "Failed to fetch associated dashboards for metric {}: {}",
                metric_id,
                e
            );
            vec![]
        }
    };

    let collections = match collections_result {
        Ok(collections) => collections,
        Err(e) => {
            tracing::error!(
                "Failed to fetch associated collections for metric {}: {}",
                metric_id,
                e
            );
            vec![]
        }
    };

    // Convert AssetPermissionInfo to BusterShareIndividual
    let individual_permissions = match individual_permissions_query {
        Ok(permissions) => {
            if permissions.is_empty() {
                None
            } else {
                Some(
                    permissions
                        .into_iter()
                        .map(|p| crate::metrics::types::BusterShareIndividual {
                            email: p.email,
                            role: p.role,
                            name: p.name,
                        })
                        .collect::<Vec<crate::metrics::types::BusterShareIndividual>>(),
                )
            }
        }
        Err(_) => None,
    };

    // Construct BusterMetric
    Ok(BusterMetric {
        id: metric_file.id,
        metric_type: "metric".to_string(),
        name: metric_file.name,
        version_number: version_num,
        description: metric_content.description,
        file_name: metric_file.file_name,
        time_frame: metric_content.time_frame,
        datasets,
        data_source_id: first_data_source_id.map_or("".to_string(), |id| id.to_string()),
        error: None,
        chart_config: Some(metric_content.chart_config),
        data_metadata,
        status: metric_file.verification,
        evaluation_score,
        evaluation_summary: metric_file.evaluation_summary.unwrap_or_default(),
        file,
        created_at: metric_file.created_at,
        updated_at: metric_file.updated_at,
        sent_by_id: metric_file.created_by,
        sent_by_name: "".to_string(),
        sent_by_avatar_url: None,
        code: None,
        dashboards,
        collections,
        versions,
        permission,
        sql: metric_content.sql,
        individual_permissions,
        publicly_accessible: metric_file.publicly_accessible,
        public_expiry_date: metric_file.public_expiry_date,
        public_enabled_by: public_enabled_by_user,
        public_password: None, // Currently not stored in the database
    })
}
