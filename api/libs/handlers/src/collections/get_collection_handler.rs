use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{collections::fetch_collection, enums::{AssetPermissionRole, AssetType, IdentityType}, pool::get_pg_pool, schema::{asset_permissions, collections, users}};
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl, Queryable};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::collections::types::{BusterShareIndividual, CollectionState, GetCollectionRequest};

#[derive(Queryable)]
struct AssetPermissionInfo {
    identity_id: Uuid,
    role: AssetPermissionRole,
    email: String,
    name: Option<String>,
}

/// Handler for getting a single collection by ID
///
/// # Arguments
/// * `user_id` - The ID of the user requesting the collection
/// * `req` - The request containing the collection ID
///
/// # Returns
/// * `Result<CollectionState>` - The collection state if found and accessible
pub async fn get_collection_handler(
    user_id: &Uuid,
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
            asset_permissions::identity_id,
            asset_permissions::role,
            users::email,
            users::name,
        ))
        .load::<AssetPermissionInfo>(&mut conn)
        .await;
    
    // For collections, we'll default public fields to false/none
    // since the schema doesn't have these fields yet
    let public_info: Result<(bool, Option<Uuid>, Option<DateTime<Utc>>), anyhow::Error> = Ok((false, None, None));
    
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

    Ok(CollectionState {
        collection,
        assets: None,
        permission: AssetPermissionRole::Owner,
        organization_permissions: false,
        individual_permissions,
        publicly_accessible,
        public_expiry_date,
        public_enabled_by,
        public_password: None,
    })
}
