use crate::check_asset_permission::{check_access, has_permission};
use anyhow::Result;
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use diesel::{prelude::*, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use database::pool::get_pg_pool;
use database::schema::asset_permissions;
use chrono::Utc;
use uuid::Uuid;

// Helper function to insert a test permission
async fn insert_test_permission(
    asset_id: Uuid,
    asset_type: AssetType,
    identity_id: Uuid,
    identity_type: IdentityType,
    role: AssetPermissionRole,
) -> Result<()> {
    let mut conn = get_pg_pool().get().await?;
    
    diesel::insert_into(asset_permissions::table)
        .values((
            asset_permissions::asset_id.eq(asset_id),
            asset_permissions::asset_type.eq(asset_type),
            asset_permissions::identity_id.eq(identity_id),
            asset_permissions::identity_type.eq(identity_type),
            asset_permissions::role.eq(role),
            asset_permissions::created_at.eq(Utc::now()),
            asset_permissions::updated_at.eq(Utc::now()),
        ))
        .execute(&mut conn)
        .await?;
    
    Ok(())
}

// Helper function to clean up test data
async fn cleanup_test_permission(asset_id: Uuid, identity_id: Uuid) -> Result<()> {
    let mut conn = get_pg_pool().get().await?;
    
    diesel::delete(
        asset_permissions::table
            .filter(asset_permissions::asset_id.eq(asset_id))
            .filter(asset_permissions::identity_id.eq(identity_id))
    )
    .execute(&mut conn)
    .await?;
    
    Ok(())
}

#[tokio::test]
async fn test_check_access() -> Result<()> {
    // Setup test data
    let asset_id = Uuid::new_v4();
    let identity_id = Uuid::new_v4();
    let asset_type = AssetType::Collection;
    let identity_type = IdentityType::User;
    let role = AssetPermissionRole::CanEdit;
    
    // Insert a test permission
    insert_test_permission(asset_id, asset_type, identity_id, identity_type, role).await?;
    
    // Test check_access function
    let result = check_access(asset_id, asset_type, identity_id, identity_type).await?;
    
    // Verify the result
    assert_eq!(result, Some(AssetPermissionRole::CanEdit));
    
    // Clean up
    cleanup_test_permission(asset_id, identity_id).await?;
    
    Ok(())
}

#[tokio::test]
async fn test_check_access_no_permission() -> Result<()> {
    // Setup test with random IDs that shouldn't exist
    let asset_id = Uuid::new_v4();
    let identity_id = Uuid::new_v4();
    let asset_type = AssetType::Collection;
    let identity_type = IdentityType::User;
    
    // Test check_access function
    let result = check_access(asset_id, asset_type, identity_id, identity_type).await?;
    
    // Verify the result
    assert_eq!(result, None);
    
    Ok(())
}

#[tokio::test]
async fn test_has_permission() -> Result<()> {
    // Setup test data
    let asset_id = Uuid::new_v4();
    let identity_id = Uuid::new_v4();
    let asset_type = AssetType::Collection;
    let identity_type = IdentityType::User;
    let role = AssetPermissionRole::CanEdit;
    
    // Insert a test permission
    insert_test_permission(asset_id, asset_type, identity_id, identity_type, role).await?;
    
    // Test various permission checks
    
    // User has CanEdit, checking for CanView (should be true)
    let result1 = has_permission(
        asset_id, 
        asset_type, 
        identity_id, 
        identity_type, 
        AssetPermissionRole::CanView
    ).await?;
    assert!(result1, "CanEdit should grant CanView permission");
    
    // User has CanEdit, checking for CanEdit (should be true)
    let result2 = has_permission(
        asset_id, 
        asset_type, 
        identity_id, 
        identity_type, 
        AssetPermissionRole::CanEdit
    ).await?;
    assert!(result2, "CanEdit should grant CanEdit permission");
    
    // User has CanEdit, checking for FullAccess (should be false)
    let result3 = has_permission(
        asset_id, 
        asset_type, 
        identity_id, 
        identity_type, 
        AssetPermissionRole::FullAccess
    ).await?;
    assert!(!result3, "CanEdit should NOT grant FullAccess permission");
    
    // Clean up
    cleanup_test_permission(asset_id, identity_id).await?;
    
    Ok(())
}

#[tokio::test]
async fn test_permission_hierarchy() -> Result<()> {
    // Setup test data
    let asset_id = Uuid::new_v4();
    let identity_id = Uuid::new_v4();
    let asset_type = AssetType::Collection;
    let identity_type = IdentityType::User;
    
    // Test with Owner role
    insert_test_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::Owner).await?;
    assert!(has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::CanView).await?);
    assert!(has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::CanEdit).await?);
    assert!(has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::FullAccess).await?);
    assert!(has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::Owner).await?);
    cleanup_test_permission(asset_id, identity_id).await?;
    
    // Test with FullAccess role
    insert_test_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::FullAccess).await?;
    assert!(has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::CanView).await?);
    assert!(has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::CanEdit).await?);
    assert!(has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::FullAccess).await?);
    assert!(!has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::Owner).await?);
    cleanup_test_permission(asset_id, identity_id).await?;
    
    // Test with CanEdit role
    insert_test_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::CanEdit).await?;
    assert!(has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::CanView).await?);
    assert!(has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::CanEdit).await?);
    assert!(!has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::FullAccess).await?);
    assert!(!has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::Owner).await?);
    cleanup_test_permission(asset_id, identity_id).await?;
    
    // Test with CanView role
    insert_test_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::CanView).await?;
    assert!(has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::CanView).await?);
    assert!(!has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::CanEdit).await?);
    assert!(!has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::FullAccess).await?);
    assert!(!has_permission(asset_id, asset_type, identity_id, identity_type, AssetPermissionRole::Owner).await?);
    cleanup_test_permission(asset_id, identity_id).await?;
    
    Ok(())
}

#[tokio::test]
async fn test_no_permissions() -> Result<()> {
    // Use random IDs that should not exist
    let asset_id = Uuid::new_v4();
    let identity_id = Uuid::new_v4();
    let asset_type = AssetType::Collection;
    let identity_type = IdentityType::User;
    
    // Test has_permission with no existing permissions
    let result = has_permission(
        asset_id, 
        asset_type, 
        identity_id, 
        identity_type, 
        AssetPermissionRole::CanView
    ).await?;
    
    // Should return false since no permissions exist
    assert!(!result);
    
    Ok(())
}