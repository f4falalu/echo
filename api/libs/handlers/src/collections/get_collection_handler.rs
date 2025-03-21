use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    collections::fetch_collection,
    enums::{AssetPermissionRole, AssetType, IdentityType},
    pool::get_pg_pool,
    schema::{
        asset_permissions, collections_to_assets, dashboard_files, metric_files, users,
    },
};
use diesel::{ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl, Queryable};
use diesel_async::RunQueryDsl;
use tracing;
use uuid::Uuid;

use crate::collections::types::{
    AssetUser, BusterShareIndividual, CollectionAsset, CollectionState, GetCollectionRequest,
};

#[derive(Queryable)]
struct AssetPermissionInfo {
    role: AssetPermissionRole,
    email: String,
    name: Option<String>,
}

/// Type for querying asset data from database
#[derive(Queryable)]
struct AssetQueryResult {
    id: Uuid,
    name: String,
    user_name: Option<String>,
    email: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    asset_type: AssetType,
}

/// Handler for getting a single collection by ID
///
/// # Arguments
/// * `user_id` - The ID of the user requesting the collection
/// * `req` - The request containing the collection ID
///
/// # Returns
/// * `Result<CollectionState>` - The collection state if found and accessible

/// Format database asset query results into CollectionAsset objects
fn format_assets(assets: Vec<AssetQueryResult>) -> Vec<CollectionAsset> {
    assets
        .into_iter()
        .map(|asset| CollectionAsset {
            id: asset.id,
            name: asset.name,
            created_by: AssetUser {
                name: asset.user_name,
                email: asset.email.unwrap_or("chad@buster.so".to_string()),
            },
            created_at: asset.created_at,
            updated_at: asset.updated_at,
            asset_type: asset.asset_type,
        })
        .collect()
}

pub async fn get_collection_handler(
    _user_id: &Uuid,
    req: GetCollectionRequest,
) -> Result<CollectionState> {
    // Reuse the existing collection_utils function
    let collection = match fetch_collection(&req.id).await? {
        Some(collection) => collection,
        None => return Err(anyhow!("Collection not found")),
    };

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    // Query individual permissions for this collection
    let individual_permissions_query = asset_permissions::table
        .inner_join(users::table.on(users::id.eq(asset_permissions::identity_id)))
        .filter(asset_permissions::asset_id.eq(req.id))
        .filter(asset_permissions::asset_type.eq(AssetType::Collection))
        .filter(asset_permissions::identity_type.eq(IdentityType::User))
        .filter(asset_permissions::deleted_at.is_null())
        .select((
            asset_permissions::role,
            users::email,
            users::name,
        ))
        .load::<AssetPermissionInfo>(&mut conn)
        .await;

    // For collections, we'll default public fields to false/none
    // since the schema doesn't have these fields yet
    let public_info: Result<(bool, Option<Uuid>, Option<DateTime<Utc>>), anyhow::Error> =
        Ok((false, None, None));

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

    // Get public access info
    let (publicly_accessible, public_enabled_by, public_expiry_date) = match public_info {
        Ok((accessible, enabled_by_id, expiry)) => {
            // Get the user info for publicly_enabled_by if it exists
            let enabled_by_email = if let Some(enabled_by_id) = enabled_by_id {
                users::table
                    .filter(users::id.eq(enabled_by_id))
                    .select(users::email)
                    .first::<String>(&mut conn)
                    .await
                    .ok()
            } else {
                None
            };

            (accessible, enabled_by_email, expiry)
        }
        Err(_) => (false, None, None),
    };

    // Query for metric assets in the collection
    let metric_assets_result = collections_to_assets::table
        .inner_join(metric_files::table.on(metric_files::id.eq(collections_to_assets::asset_id)))
        .left_join(users::table.on(users::id.eq(metric_files::created_by)))
        .filter(collections_to_assets::collection_id.eq(req.id))
        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .filter(collections_to_assets::deleted_at.is_null())
        .filter(metric_files::deleted_at.is_null())
        .select((
            metric_files::id,
            metric_files::name,
            users::name.nullable(),
            users::email.nullable(),
            metric_files::created_at,
            metric_files::updated_at,
            collections_to_assets::asset_type,
        ))
        .load::<AssetQueryResult>(&mut conn)
        .await;

    // Query for dashboard assets in the collection
    let dashboard_assets_result = collections_to_assets::table
        .inner_join(
            dashboard_files::table.on(dashboard_files::id.eq(collections_to_assets::asset_id)),
        )
        .left_join(users::table.on(users::id.eq(dashboard_files::created_by)))
        .filter(collections_to_assets::collection_id.eq(req.id))
        .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
        .filter(collections_to_assets::deleted_at.is_null())
        .filter(dashboard_files::deleted_at.is_null())
        .select((
            dashboard_files::id,
            dashboard_files::name,
            users::name.nullable(),
            users::email.nullable(),
            dashboard_files::created_at,
            dashboard_files::updated_at,
            collections_to_assets::asset_type,
        ))
        .load::<AssetQueryResult>(&mut conn)
        .await;

    // Process metric assets
    let metric_assets = match metric_assets_result {
        Ok(assets) => assets,
        Err(e) => {
            tracing::error!("Failed to fetch metric assets: {}", e);
            vec![]
        }
    };

    // Process dashboard assets
    let dashboard_assets = match dashboard_assets_result {
        Ok(assets) => assets,
        Err(e) => {
            tracing::error!("Failed to fetch dashboard assets: {}", e);
            vec![]
        }
    };

    // Combine and format the assets
    let mut combined_assets = metric_assets;
    combined_assets.extend(dashboard_assets);

    // Only include assets in the response if we found some
    let formatted_assets = if combined_assets.is_empty() {
        None
    } else {
        Some(format_assets(combined_assets))
    };

    Ok(CollectionState {
        collection,
        assets: formatted_assets,
        permission: AssetPermissionRole::Owner,
        organization_permissions: false,
        individual_permissions,
        publicly_accessible,
        public_expiry_date,
        public_enabled_by,
        public_password: None,
    })
}
