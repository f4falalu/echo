use anyhow::{Context, Result};
use database::{
    enums::{AssetType, IdentityType},
    models::{AssetPermission, User},
    pool::get_pg_pool,
    schema::{asset_permissions, users},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::{errors::SharingError, types::{AssetPermissionWithUser, UserInfo}};

/// Lists all permissions for a given asset
pub async fn list_shares(
    asset_id: Uuid,
    asset_type: AssetType,
) -> Result<Vec<AssetPermissionWithUser>> {
    // Validate asset type is not deprecated
    if matches!(asset_type, AssetType::Dashboard | AssetType::Thread) {
        return Err(SharingError::DeprecatedAssetType(format!("{:?}", asset_type)).into());
    }

    let mut conn = get_pg_pool().get().await?;

    // Get all active permissions for the asset
    let permissions = asset_permissions::table
        .filter(asset_permissions::asset_id.eq(asset_id))
        .filter(asset_permissions::asset_type.eq(asset_type))
        .filter(asset_permissions::deleted_at.is_null())
        .load::<AssetPermission>(&mut conn)
        .await
        .context("Failed to load asset permissions")?;

    // Collect all user IDs to fetch in a single query
    let user_ids: Vec<Uuid> = permissions
        .iter()
        .filter(|p| p.identity_type == IdentityType::User)
        .map(|p| p.identity_id)
        .collect();

    // Fetch all users in a single query if there are user IDs
    let users_map = if !user_ids.is_empty() {
        users::table
            .filter(users::id.eq_any(user_ids))
            .load::<User>(&mut conn)
            .await
            .context("Failed to load users")?
            .into_iter()
            .map(|user| (user.id, UserInfo::from(user)))
            .collect::<std::collections::HashMap<_, _>>()
    } else {
        std::collections::HashMap::new()
    };

    // Convert permissions to response objects with user info
    let result = permissions
        .into_iter()
        .map(|permission| {
            let user_info = if permission.identity_type == IdentityType::User {
                users_map.get(&permission.identity_id).cloned()
            } else {
                None
            };

            AssetPermissionWithUser::from((permission, user_info))
        })
        .collect();

    Ok(result)
}

/// Lists all permissions for a given asset, filtered by identity type
pub async fn list_shares_by_identity_type(
    asset_id: Uuid,
    asset_type: AssetType,
    identity_type: IdentityType,
) -> Result<Vec<AssetPermissionWithUser>> {
    // Validate asset type is not deprecated
    if matches!(asset_type, AssetType::Dashboard | AssetType::Thread) {
        return Err(SharingError::DeprecatedAssetType(format!("{:?}", asset_type)).into());
    }

    let mut conn = get_pg_pool().get().await?;

    // Get all active permissions for the asset with the specified identity type
    let permissions = asset_permissions::table
        .filter(asset_permissions::asset_id.eq(asset_id))
        .filter(asset_permissions::asset_type.eq(asset_type))
        .filter(asset_permissions::identity_type.eq(identity_type))
        .filter(asset_permissions::deleted_at.is_null())
        .load::<AssetPermission>(&mut conn)
        .await
        .context("Failed to load asset permissions")?;

    // Handle user information if needed
    let mut result = Vec::with_capacity(permissions.len());
    
    if identity_type == IdentityType::User {
        // Collect all user IDs to fetch
        let user_ids: Vec<Uuid> = permissions.iter().map(|p| p.identity_id).collect();
        
        // Fetch all users in a single query
        let users_map = users::table
            .filter(users::id.eq_any(user_ids))
            .load::<User>(&mut conn)
            .await
            .context("Failed to load users")?
            .into_iter()
            .map(|user| (user.id, UserInfo::from(user)))
            .collect::<std::collections::HashMap<_, _>>();
            
        // Create result with user info
        for permission in permissions {
            let user_info = users_map.get(&permission.identity_id).cloned();
            result.push(AssetPermissionWithUser::from((permission, user_info)));
        }
    } else {
        // For non-user identities, no additional info needed
        for permission in permissions {
            result.push(AssetPermissionWithUser::from((permission, None)));
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::enums::{AssetType, IdentityType};
    use uuid::Uuid;

    // Additional tests would be implemented here, using a test database
    // or mocks for database interactions
}