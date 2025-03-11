use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::AssetPermission,
    pool::get_pg_pool,
    schema::asset_permissions,
};
use diesel::{prelude::*, upsert::excluded};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

#[derive(Debug)]
pub struct ShareCreationInput {
    pub asset_id: Uuid,
    pub asset_type: AssetType,
    pub identity_id: Uuid,
    pub identity_type: IdentityType,
    pub role: AssetPermissionRole,
}

/// Creates a new sharing record for an asset
pub async fn create_share(
    asset_id: Uuid,
    asset_type: AssetType,
    identity_id: Uuid,
    identity_type: IdentityType,
    role: AssetPermissionRole,
    created_by: Uuid,
) -> Result<AssetPermission> {
    let now = Utc::now();

    // Validate asset type is not deprecated
    if matches!(asset_type, AssetType::Dashboard | AssetType::Thread) {
        anyhow::bail!("Asset type {:?} is deprecated", asset_type);
    }

    let mut conn = get_pg_pool().get().await?;

    let permission = AssetPermission {
        identity_id,
        identity_type,
        asset_id,
        asset_type,
        role,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by,
        updated_by: created_by,
    };

    diesel::insert_into(asset_permissions::table)
        .values(&permission)
        .on_conflict((
            asset_permissions::identity_id,
            asset_permissions::asset_id,
            asset_permissions::asset_type,
            asset_permissions::identity_type,
        ))
        .do_update()
        .set((
            asset_permissions::role.eq(role),
            asset_permissions::updated_at.eq(now),
            asset_permissions::updated_by.eq(created_by),
            asset_permissions::deleted_at.eq::<Option<DateTime<Utc>>>(None),
        ))
        .get_result(&mut conn)
        .await
        .context("Failed to create/update asset permission")
}

/// Creates multiple sharing records in bulk
pub async fn create_shares_bulk(
    shares: Vec<ShareCreationInput>,
    created_by: Uuid,
) -> Result<Vec<AssetPermission>> {
    let now = Utc::now();

    // Validate no deprecated asset types
    if shares
        .iter()
        .any(|s| matches!(s.asset_type, AssetType::Dashboard | AssetType::Thread))
    {
        anyhow::bail!("Cannot create permissions for deprecated asset types");
    }

    let permissions: Vec<AssetPermission> = shares
        .into_iter()
        .map(|share| AssetPermission {
            identity_id: share.identity_id,
            identity_type: share.identity_type,
            asset_id: share.asset_id,
            asset_type: share.asset_type,
            role: share.role,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            created_by,
            updated_by: created_by,
        })
        .collect();

    let mut conn = get_pg_pool().get().await?;

    diesel::insert_into(asset_permissions::table)
        .values(&permissions)
        .on_conflict((
            asset_permissions::identity_id,
            asset_permissions::asset_id,
            asset_permissions::asset_type,
            asset_permissions::identity_type,
        ))
        .do_update()
        .set((
            asset_permissions::role.eq(excluded(asset_permissions::role)),
            asset_permissions::updated_at.eq(now),
            asset_permissions::updated_by.eq(created_by),
            asset_permissions::deleted_at.eq::<Option<DateTime<Utc>>>(None),
        ))
        .get_results(&mut conn)
        .await
        .context("Failed to create/update asset permissions in bulk")
}
