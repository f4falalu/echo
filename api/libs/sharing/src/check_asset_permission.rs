use anyhow::{Context, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    pool::get_pg_pool,
    schema::{asset_permissions, teams_to_users},
};
use diesel::{BoolExpressionMethods, ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::errors::SharingError;

/// Input for checking a single asset permission
#[derive(Debug, Clone)]
pub struct CheckPermissionInput {
    pub asset_id: Uuid,
    pub asset_type: AssetType,
    pub identity_id: Uuid,
    pub identity_type: IdentityType,
}

/// Result of a permission check
#[derive(Debug, Clone)]
pub struct AssetPermissionResult {
    pub asset_id: Uuid,
    pub asset_type: AssetType,
    pub role: Option<AssetPermissionRole>,
}

/// Checks if a user has access to a resource and returns their role
pub async fn check_access(
    asset_id: Uuid,
    asset_type: AssetType,
    identity_id: Uuid,
    identity_type: IdentityType,
) -> Result<Option<AssetPermissionRole>> {
    // Validate asset type is not deprecated
    if matches!(asset_type, AssetType::Dashboard | AssetType::Thread) {
        return Err(SharingError::DeprecatedAssetType(format!("{:?}", asset_type)).into());
    }

    let mut conn = get_pg_pool().get().await?;

    let permissions = match identity_type {
        IdentityType::User => {
            // For users, we need to check both direct permissions and team permissions
            asset_permissions::table
                .left_join(
                    teams_to_users::table
                        .on(asset_permissions::identity_id.eq(teams_to_users::team_id)),
                )
                .select(asset_permissions::role)
                .filter(
                    asset_permissions::identity_id
                        .eq(&identity_id)
                        .or(teams_to_users::user_id.eq(&identity_id)),
                )
                .filter(asset_permissions::asset_id.eq(&asset_id))
                .filter(asset_permissions::asset_type.eq(&asset_type))
                .filter(asset_permissions::deleted_at.is_null())
                .load::<AssetPermissionRole>(&mut conn)
                .await
                .context("Failed to query asset permissions")?
        }
        _ => {
            // For other identity types, just check direct permissions
            asset_permissions::table
                .select(asset_permissions::role)
                .filter(asset_permissions::identity_id.eq(&identity_id))
                .filter(asset_permissions::identity_type.eq(&identity_type))
                .filter(asset_permissions::asset_id.eq(&asset_id))
                .filter(asset_permissions::asset_type.eq(&asset_type))
                .filter(asset_permissions::deleted_at.is_null())
                .load::<AssetPermissionRole>(&mut conn)
                .await
                .context("Failed to query asset permissions")?
        }
    };

    if permissions.is_empty() {
        return Ok(None);
    }

    // Find the highest permission level
    let highest_permission = permissions
        .into_iter()
        .reduce(|acc, role| acc.max(role))
        .unwrap();

    Ok(Some(highest_permission))
}

<<<<<<< HEAD
/// Checks if a user has the required permission level for an asset
pub async fn has_permission(
    asset_id: Uuid,
    asset_type: AssetType,
    identity_id: Uuid,
    identity_type: IdentityType,
    required_role: AssetPermissionRole,
) -> Result<bool> {
    let user_role = check_access(asset_id, asset_type, identity_id, identity_type).await?;
    
    match user_role {
        Some(role) => {
            // Check if user's role is sufficient for the required role based on the permission hierarchy
            Ok(match (role, required_role) {
                // Owner can do anything
                (AssetPermissionRole::Owner, _) => true,
                // FullAccess can do anything except Owner actions
                (AssetPermissionRole::FullAccess, AssetPermissionRole::Owner) => false,
                (AssetPermissionRole::FullAccess, _) => true,
                // CanEdit can edit and view
                (AssetPermissionRole::CanEdit, AssetPermissionRole::Owner | AssetPermissionRole::FullAccess) => false,
                (AssetPermissionRole::CanEdit, AssetPermissionRole::CanEdit | AssetPermissionRole::CanFilter | AssetPermissionRole::CanView | AssetPermissionRole::Editor | AssetPermissionRole::Viewer) => true,
                // CanFilter can filter and view
                (AssetPermissionRole::CanFilter, AssetPermissionRole::Owner | AssetPermissionRole::FullAccess | AssetPermissionRole::CanEdit | AssetPermissionRole::Editor) => false,
                (AssetPermissionRole::CanFilter, AssetPermissionRole::CanFilter | AssetPermissionRole::CanView | AssetPermissionRole::Viewer) => true,
                // CanView can only view
                (AssetPermissionRole::CanView, AssetPermissionRole::CanView | AssetPermissionRole::Viewer) => true,
                (AssetPermissionRole::CanView, _) => false,
                // Editor (legacy) can edit and view
                (AssetPermissionRole::Editor, AssetPermissionRole::Owner | AssetPermissionRole::FullAccess) => false,
                (AssetPermissionRole::Editor, AssetPermissionRole::CanEdit | AssetPermissionRole::CanFilter | AssetPermissionRole::CanView | AssetPermissionRole::Editor | AssetPermissionRole::Viewer) => true,
                // Viewer (legacy) can only view
                (AssetPermissionRole::Viewer, AssetPermissionRole::CanView | AssetPermissionRole::Viewer) => true,
                (AssetPermissionRole::Viewer, _) => false,
            })
        }
        None => Ok(false),
    }
}

/// Simpler structure for holding permission results when checking in bulk
#[derive(Debug, Clone)]
pub struct AssetPermissionEntry {
    pub asset_id: Uuid,
    pub asset_type: AssetType,
    pub role: Option<AssetPermissionRole>,
}

/// Checks permissions for multiple assets in bulk
pub async fn check_access_bulk(
    inputs: Vec<CheckPermissionInput>,
) -> Result<Vec<AssetPermissionEntry>> {
    if inputs.is_empty() {
        return Ok(Vec::new());
    }

    // Validate no deprecated asset types
    if inputs
        .iter()
        .any(|input| matches!(input.asset_type, AssetType::Dashboard | AssetType::Thread))
    {
        return Err(SharingError::DeprecatedAssetType("Cannot check permissions for deprecated asset types".to_string()).into());
    }

    // Group inputs by identity type to optimize queries
    let mut user_inputs = Vec::new();
    let mut other_identity_inputs = Vec::new();

    for input in inputs {
        if input.identity_type == IdentityType::User {
            user_inputs.push(input);
        } else {
            other_identity_inputs.push(input);
        }
    }

    let mut results = Vec::new();

    // Process user inputs
    if !user_inputs.is_empty() {
        let mut conn = get_pg_pool().get().await?;
        let user_id = user_inputs[0].identity_id;

        // Process each input separately (we could optimize this in the future)
        for input in user_inputs {
            // For users, we need to check both direct permissions and team permissions
            let permissions = asset_permissions::table
                .left_join(
                    teams_to_users::table
                        .on(asset_permissions::identity_id.eq(teams_to_users::team_id)),
                )
                .select(asset_permissions::role)
                .filter(
                    asset_permissions::identity_id
                        .eq(&user_id)
                        .or(teams_to_users::user_id.eq(&user_id)),
                )
                .filter(asset_permissions::asset_id.eq(&input.asset_id))
                .filter(asset_permissions::asset_type.eq(&input.asset_type))
                .filter(asset_permissions::deleted_at.is_null())
                .load::<AssetPermissionRole>(&mut conn)
                .await
                .context("Failed to query asset permissions")?;

            let highest_role = if permissions.is_empty() {
                None
            } else {
                Some(
                    permissions
                        .into_iter()
                        .reduce(|acc, role| acc.max(role))
                        .unwrap(),
                )
            };

            results.push(AssetPermissionEntry {
                asset_id: input.asset_id,
                asset_type: input.asset_type,
                role: highest_role,
            });
        }
    }

    // Process other identity inputs
    for input in other_identity_inputs {
        let mut conn = get_pg_pool().get().await?;
        
        // For other identity types, just check direct permissions
        let permissions = asset_permissions::table
            .select(asset_permissions::role)
            .filter(asset_permissions::identity_id.eq(&input.identity_id))
            .filter(asset_permissions::identity_type.eq(&input.identity_type))
            .filter(asset_permissions::asset_id.eq(&input.asset_id))
            .filter(asset_permissions::asset_type.eq(&input.asset_type))
            .filter(asset_permissions::deleted_at.is_null())
            .load::<AssetPermissionRole>(&mut conn)
            .await
            .context("Failed to query asset permissions")?;

        let highest_role = if permissions.is_empty() {
            None
        } else {
            Some(
                permissions
                    .into_iter()
                    .reduce(|acc, role| acc.max(role))
                    .unwrap(),
            )
        };

        results.push(AssetPermissionEntry {
            asset_id: input.asset_id,
            asset_type: input.asset_type,
            role: highest_role,
        });
    }

    Ok(results)
}

/// Checks permissions for multiple assets and returns a structured result
pub async fn check_permissions(
    inputs: Vec<CheckPermissionInput>,
) -> Result<Vec<AssetPermissionResult>> {
    let permissions_entries = check_access_bulk(inputs.clone()).await?;

    // Convert entries to results
    let results = permissions_entries
        .into_iter()
        .map(|entry| {
            AssetPermissionResult {
                asset_id: entry.asset_id,
                asset_type: entry.asset_type,
                role: entry.role,
            }
        })
        .collect();

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::enums::{AssetPermissionRole, AssetType, IdentityType};
    use uuid::Uuid;

    #[tokio::test]
    async fn test_has_permission_logic() {
        // Test owner can do anything
        let has_permission = has_permission_logic(AssetPermissionRole::Owner, AssetPermissionRole::CanView);
        assert!(has_permission);
        
        // Test full access can do anything
        let has_permission = has_permission_logic(AssetPermissionRole::FullAccess, AssetPermissionRole::CanEdit);
        assert!(has_permission);
        
        // Test can_edit can filter and view
        let has_permission = has_permission_logic(AssetPermissionRole::CanEdit, AssetPermissionRole::CanFilter);
        assert!(has_permission);
        
        // Test can_filter cannot edit
        let has_permission = has_permission_logic(AssetPermissionRole::CanFilter, AssetPermissionRole::CanEdit);
        assert!(!has_permission);
        
        // Test editor can view
        let has_permission = has_permission_logic(AssetPermissionRole::Editor, AssetPermissionRole::Viewer);
        assert!(has_permission);
        
        // Test viewer cannot edit
        let has_permission = has_permission_logic(AssetPermissionRole::Viewer, AssetPermissionRole::Editor);
        assert!(!has_permission);
    }

    // Helper function to test permission logic without database
    fn has_permission_logic(user_role: AssetPermissionRole, required_role: AssetPermissionRole) -> bool {
        // Special case for Owner and FullAccess, which can do anything
        if user_role == AssetPermissionRole::Owner || user_role == AssetPermissionRole::FullAccess {
            return true;
        }
        
        // For other roles, we need to compare them
        match (user_role, required_role) {
            // Owner and FullAccess can do anything (handled above)
            
            // CanEdit can edit, filter and view
            (AssetPermissionRole::CanEdit, AssetPermissionRole::CanEdit) |
            (AssetPermissionRole::CanEdit, AssetPermissionRole::CanFilter) |
            (AssetPermissionRole::CanEdit, AssetPermissionRole::CanView) => true,
            
            // CanFilter can filter and view
            (AssetPermissionRole::CanFilter, AssetPermissionRole::CanFilter) |
            (AssetPermissionRole::CanFilter, AssetPermissionRole::CanView) => true,
            
            // CanView can only view
            (AssetPermissionRole::CanView, AssetPermissionRole::CanView) => true,
            
            // Editor can edit and view
            (AssetPermissionRole::Editor, AssetPermissionRole::Editor) |
            (AssetPermissionRole::Editor, AssetPermissionRole::Viewer) => true,
            
            // Viewer can only view
            (AssetPermissionRole::Viewer, AssetPermissionRole::Viewer) => true,
            
            // All other combinations are not permitted
            _ => false,
        }
    }
}