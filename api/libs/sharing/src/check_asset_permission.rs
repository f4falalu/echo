use anyhow::{Context, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::AssetPermission,
    pool::get_pg_pool,
    schema::{asset_permissions, teams_to_users},
};
use diesel::{BoolExpressionMethods, ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use std::collections::HashMap;
use uuid::Uuid;

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
        anyhow::bail!("Asset type {:?} is deprecated", asset_type);
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

/// Checks permissions for multiple assets in bulk
pub async fn check_access_bulk(
    inputs: Vec<CheckPermissionInput>,
) -> Result<HashMap<(Uuid, AssetType), Option<AssetPermissionRole>>> {
    if inputs.is_empty() {
        return Ok(HashMap::new());
    }

    // Validate no deprecated asset types
    if inputs
        .iter()
        .any(|input| matches!(input.asset_type, AssetType::Dashboard | AssetType::Thread))
    {
        anyhow::bail!("Cannot check permissions for deprecated asset types");
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

    let mut results = HashMap::new();

    // Process user inputs
    if !user_inputs.is_empty() {
        // Create filters for the query
        let mut asset_filters = diesel::BoolExpressionMethods::or_filter(
            diesel::BoolExpressionMethods::or_filter(
                diesel::ExpressionMethods::eq(asset_permissions::asset_id, user_inputs[0].asset_id),
                diesel::ExpressionMethods::eq(
                    asset_permissions::asset_type,
                    user_inputs[0].asset_type,
                ),
            ),
            false,
        );

        for input in &user_inputs[1..] {
            asset_filters = diesel::BoolExpressionMethods::or_filter(
                asset_filters,
                diesel::BoolExpressionMethods::and_filter(
                    diesel::ExpressionMethods::eq(asset_permissions::asset_id, input.asset_id),
                    diesel::ExpressionMethods::eq(asset_permissions::asset_type, input.asset_type),
                ),
            );
        }

        let mut conn = get_pg_pool().get().await?;

        // Get all user permissions (direct and via teams)
        let user_id = user_inputs[0].identity_id;
        let user_permissions: Vec<(Uuid, AssetType, AssetPermissionRole)> =
            asset_permissions::table
                .left_join(
                    teams_to_users::table
                        .on(asset_permissions::identity_id.eq(teams_to_users::team_id)),
                )
                .select((
                    asset_permissions::asset_id,
                    asset_permissions::asset_type,
                    asset_permissions::role,
                ))
                .filter(
                    asset_permissions::identity_id
                        .eq(&user_id)
                        .or(teams_to_users::user_id.eq(&user_id)),
                )
                .filter(asset_filters)
                .filter(asset_permissions::deleted_at.is_null())
                .load::<(Uuid, AssetType, AssetPermissionRole)>(&mut conn)
                .await
                .context("Failed to query user asset permissions in bulk")?;

        // Group permissions by asset
        let mut asset_permissions_map: HashMap<(Uuid, AssetType), Vec<AssetPermissionRole>> =
            HashMap::new();
        for (asset_id, asset_type, role) in user_permissions {
            asset_permissions_map
                .entry((asset_id, asset_type))
                .or_insert_with(Vec::new)
                .push(role);
        }

        // Find highest permission for each asset
        for input in user_inputs {
            let key = (input.asset_id, input.asset_type);
            let highest_role = asset_permissions_map
                .get(&key)
                .and_then(|roles| roles.iter().cloned().reduce(|acc, role| acc.max(role)));
            results.insert(key, highest_role);
        }
    }

    // Process other identity inputs
    for input in other_identity_inputs {
        let mut conn = get_pg_pool().get().await?;
        
        let permissions: Vec<AssetPermissionRole> = asset_permissions::table
            .select(asset_permissions::role)
            .filter(asset_permissions::identity_id.eq(&input.identity_id))
            .filter(asset_permissions::identity_type.eq(&input.identity_type))
            .filter(asset_permissions::asset_id.eq(&input.asset_id))
            .filter(asset_permissions::asset_type.eq(&input.asset_type))
            .filter(asset_permissions::deleted_at.is_null())
            .load::<AssetPermissionRole>(&mut conn)
            .await
            .context("Failed to query asset permissions")?;

        let highest_role = permissions.into_iter().reduce(|acc, role| acc.max(role));

        results.insert((input.asset_id, input.asset_type), highest_role);
    }

    Ok(results)
}

/// Checks permissions for multiple assets and returns a structured result
pub async fn check_permissions(
    inputs: Vec<CheckPermissionInput>,
) -> Result<Vec<AssetPermissionResult>> {
    let permissions_map = check_access_bulk(inputs.clone()).await?;

    let results = inputs
        .into_iter()
        .map(|input| {
            let key = (input.asset_id, input.asset_type);
            let role = permissions_map.get(&key).cloned().flatten();

            AssetPermissionResult {
                asset_id: input.asset_id,
                asset_type: input.asset_type,
                role,
            }
        })
        .collect();

    Ok(results)
}
