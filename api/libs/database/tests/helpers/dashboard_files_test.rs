use anyhow::Result;
use chrono::Utc;
use database::enums::{AssetPermissionRole, AssetType};
use database::helpers::dashboard_files::{
    fetch_dashboard_file_with_permission, fetch_dashboard_files_with_permissions,
};
use database::models::{Collection, CollectionToAsset};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use tokio;
use uuid::Uuid;

use crate::helpers::test_utils::{TestDb, insert_test_dashboard_file, insert_test_permission, cleanup_test_data};

/// Tests the fetch_dashboard_file_with_permission function with direct permission
#[tokio::test]
async fn test_dashboard_file_direct_permission() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    
    // Create test user and file
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let dashboard_file = test_db.create_test_dashboard_file(&owner_id).await?;
    let dashboard_id = dashboard_file.id;
    
    // Insert the test dashboard file
    insert_test_dashboard_file(&dashboard_file).await?;
    
    // Test cases with different permission roles
    for role in [
        AssetPermissionRole::Owner,
        AssetPermissionRole::FullAccess,
        AssetPermissionRole::CanEdit,
        AssetPermissionRole::CanFilter,
        AssetPermissionRole::CanView,
    ] {
        // Create and insert permission
        let permission = test_db
            .create_asset_permission(&dashboard_id, AssetType::DashboardFile, &owner_id, role)
            .await?;
        insert_test_permission(&permission).await?;
        
        // Fetch file with permissions
        let result = fetch_dashboard_file_with_permission(&dashboard_id, &owner_id).await?;
        
        // Assert file is found and has correct permission
        assert!(result.is_some(), "Dashboard file should be found");
        let file_with_permission = result.unwrap();
        assert_eq!(file_with_permission.dashboard_file.id, dashboard_id);
        assert_eq!(file_with_permission.permission, Some(role));
    }
    
    // Clean up
    cleanup_test_data(&[dashboard_id]).await?;
    
    Ok(())
}

/// Tests the fetch_dashboard_file_with_permission function when no permission exists
#[tokio::test]
async fn test_dashboard_file_no_permission() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    
    // Create test user and file
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let dashboard_file = test_db.create_test_dashboard_file(&owner_id).await?;
    let dashboard_id = dashboard_file.id;
    
    // Insert the test dashboard file
    insert_test_dashboard_file(&dashboard_file).await?;
    
    // Fetch file with permissions (no permission exists)
    let result = fetch_dashboard_file_with_permission(&dashboard_id, &Uuid::new_v4()).await?;
    
    // Assert file is found but has no permission
    assert!(result.is_some(), "Dashboard file should be found");
    let file_with_permission = result.unwrap();
    assert_eq!(file_with_permission.dashboard_file.id, dashboard_id);
    assert_eq!(file_with_permission.permission, None);
    
    // Clean up
    cleanup_test_data(&[dashboard_id]).await?;
    
    Ok(())
}

/// Tests the fetch_dashboard_file_with_permission function with public accessibility
#[tokio::test]
async fn test_dashboard_file_public_access() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    
    // Create test user and file
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let mut dashboard_file = test_db.create_test_dashboard_file(&owner_id).await?;
    
    // Make the file publicly accessible
    dashboard_file.publicly_accessible = true;
    dashboard_file.publicly_enabled_by = Some(owner_id);
    dashboard_file.public_expiry_date = Some(Utc::now() + chrono::Duration::days(1));
    
    let dashboard_id = dashboard_file.id;
    
    // Insert the test dashboard file
    insert_test_dashboard_file(&dashboard_file).await?;
    
    // Fetch file with permissions for a random user (no direct permission)
    let random_user_id = Uuid::new_v4();
    let result = fetch_dashboard_file_with_permission(&dashboard_id, &random_user_id).await?;
    
    // Assert file is found and has CanView permission due to public access
    assert!(result.is_some(), "Dashboard file should be found");
    let file_with_permission = result.unwrap();
    assert_eq!(file_with_permission.dashboard_file.id, dashboard_id);
    assert_eq!(file_with_permission.permission, Some(AssetPermissionRole::CanView));
    
    // Clean up
    cleanup_test_data(&[dashboard_id]).await?;
    
    Ok(())
}

/// Tests the fetch_dashboard_file_with_permission function with expired public accessibility
#[tokio::test]
async fn test_dashboard_file_expired_public_access() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    
    // Create test user and file
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let mut dashboard_file = test_db.create_test_dashboard_file(&owner_id).await?;
    
    // Make the file publicly accessible but expired
    dashboard_file.publicly_accessible = true;
    dashboard_file.publicly_enabled_by = Some(owner_id);
    dashboard_file.public_expiry_date = Some(Utc::now() - chrono::Duration::days(1)); // Expired
    
    let dashboard_id = dashboard_file.id;
    
    // Insert the test dashboard file
    insert_test_dashboard_file(&dashboard_file).await?;
    
    // Fetch file with permissions for a random user (no direct permission)
    let random_user_id = Uuid::new_v4();
    let result = fetch_dashboard_file_with_permission(&dashboard_id, &random_user_id).await?;
    
    // Assert file is found but has no permission (public access expired)
    assert!(result.is_some(), "Dashboard file should be found");
    let file_with_permission = result.unwrap();
    assert_eq!(file_with_permission.dashboard_file.id, dashboard_id);
    assert_eq!(file_with_permission.permission, None);
    
    // Clean up
    cleanup_test_data(&[dashboard_id]).await?;
    
    Ok(())
}

/// Tests the fetch_dashboard_files_with_permissions function for multiple files
#[tokio::test]
async fn test_fetch_multiple_dashboard_files() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    
    // Create test user and files
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    
    // Create and insert three test dashboard files with different permissions
    let dashboard_file1 = test_db.create_test_dashboard_file(&owner_id).await?;
    let dashboard_id1 = dashboard_file1.id;
    insert_test_dashboard_file(&dashboard_file1).await?;
    
    let mut dashboard_file2 = test_db.create_test_dashboard_file(&owner_id).await?;
    dashboard_file2.publicly_accessible = true;
    dashboard_file2.public_expiry_date = Some(Utc::now() + chrono::Duration::days(1));
    let dashboard_id2 = dashboard_file2.id;
    insert_test_dashboard_file(&dashboard_file2).await?;
    
    let dashboard_file3 = test_db.create_test_dashboard_file(&owner_id).await?;
    let dashboard_id3 = dashboard_file3.id;
    insert_test_dashboard_file(&dashboard_file3).await?;
    
    // Create and insert permissions
    let permission1 = test_db
        .create_asset_permission(&dashboard_id1, AssetType::DashboardFile, &owner_id, AssetPermissionRole::CanEdit)
        .await?;
    insert_test_permission(&permission1).await?;
    
    let permission3 = test_db
        .create_asset_permission(&dashboard_id3, AssetType::DashboardFile, &owner_id, AssetPermissionRole::CanView)
        .await?;
    insert_test_permission(&permission3).await?;
    
    // Fetch multiple files with permissions
    let ids = vec![dashboard_id1, dashboard_id2, dashboard_id3];
    let results = fetch_dashboard_files_with_permissions(&ids, &owner_id).await?;
    
    // Assert correct permissions for each file
    assert_eq!(results.len(), 3, "Should return 3 files");
    
    // Find each file in results and check its permission
    for result in &results {
        if result.dashboard_file.id == dashboard_id1 {
            assert_eq!(result.permission, Some(AssetPermissionRole::CanEdit));
        } else if result.dashboard_file.id == dashboard_id2 {
            assert_eq!(result.permission, Some(AssetPermissionRole::CanView)); // Public file
        } else if result.dashboard_file.id == dashboard_id3 {
            assert_eq!(result.permission, Some(AssetPermissionRole::CanView));
        } else {
            panic!("Unexpected file ID in results");
        }
    }
    
    // Clean up
    cleanup_test_data(&ids).await?;
    
    Ok(())
}

/// Tests access to a dashboard file through collection permissions
#[tokio::test]
async fn test_dashboard_file_collection_access() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test users and files
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let viewer_id = Uuid::new_v4(); // Another user who will have access to collection but not directly to dashboard
    
    // Create dashboard file
    let dashboard_file = test_db.create_test_dashboard_file(&owner_id).await?;
    let dashboard_id = dashboard_file.id;
    insert_test_dashboard_file(&dashboard_file).await?;
    
    // Create collection
    let collection_id = Uuid::new_v4();
    let collection = Collection {
        id: collection_id,
        name: format!("Test Collection {}", test_db.test_id),
        description: Some("Test collection description".to_string()),
        created_by: owner_id,
        updated_by: owner_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        organization_id: test_db.organization_id,
    };
    
    // Insert collection
    diesel::insert_into(database::schema::collections::table)
        .values(&collection)
        .execute(&mut conn)
        .await?;
    
    // Create association between dashboard and collection
    let collection_to_asset = CollectionToAsset {
        collection_id,
        asset_id: dashboard_id,
        asset_type: AssetType::DashboardFile,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: owner_id,
        updated_by: owner_id,
    };
    
    // Insert association
    diesel::insert_into(database::schema::collections_to_assets::table)
        .values(&collection_to_asset)
        .execute(&mut conn)
        .await?;
    
    // Give viewer permission to collection but not to dashboard
    let collection_permission = test_db
        .create_asset_permission(&collection_id, AssetType::Collection, &viewer_id, AssetPermissionRole::CanEdit)
        .await?;
    insert_test_permission(&collection_permission).await?;
    
    // Fetch dashboard file with permissions as viewer
    let result = fetch_dashboard_file_with_permission(&dashboard_id, &viewer_id).await?;
    
    // Assert viewer can view dashboard through collection permission
    assert!(result.is_some(), "Dashboard file should be found");
    let file_with_permission = result.unwrap();
    assert_eq!(file_with_permission.dashboard_file.id, dashboard_id);
    assert_eq!(file_with_permission.permission, Some(AssetPermissionRole::CanEdit));
    
    // Clean up
    cleanup_test_data(&[dashboard_id]).await?;
    
    // Delete collection and associations
    diesel::delete(database::schema::collections_to_assets::table)
        .filter(database::schema::collections_to_assets::collection_id.eq(collection_id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::collections::table)
        .filter(database::schema::collections::id.eq(collection_id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::asset_permissions::table)
        .filter(database::schema::asset_permissions::asset_id.eq(collection_id))
        .execute(&mut conn)
        .await?;
    
    Ok(())
}

/// Tests permission precedence when both direct and collection permissions exist
#[tokio::test]
async fn test_dashboard_file_permission_precedence() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and files
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    
    // Create dashboard file
    let dashboard_file = test_db.create_test_dashboard_file(&owner_id).await?;
    let dashboard_id = dashboard_file.id;
    insert_test_dashboard_file(&dashboard_file).await?;
    
    // Create collection
    let collection_id = Uuid::new_v4();
    let collection = Collection {
        id: collection_id,
        name: format!("Test Collection {}", test_db.test_id),
        description: Some("Test collection description".to_string()),
        created_by: owner_id,
        updated_by: owner_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        organization_id: test_db.organization_id,
    };
    
    // Insert collection
    diesel::insert_into(database::schema::collections::table)
        .values(&collection)
        .execute(&mut conn)
        .await?;
    
    // Create association between dashboard and collection
    let collection_to_asset = CollectionToAsset {
        collection_id,
        asset_id: dashboard_id,
        asset_type: AssetType::DashboardFile,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: owner_id,
        updated_by: owner_id,
    };
    
    // Insert association
    diesel::insert_into(database::schema::collections_to_assets::table)
        .values(&collection_to_asset)
        .execute(&mut conn)
        .await?;
    
    // Create both direct and collection permissions to test precedence
    
    // Direct permission - CanView (lower)
    let direct_permission = test_db
        .create_asset_permission(&dashboard_id, AssetType::DashboardFile, &owner_id, AssetPermissionRole::CanView)
        .await?;
    insert_test_permission(&direct_permission).await?;
    
    // Collection permission - CanEdit (higher)
    let collection_permission = test_db
        .create_asset_permission(&collection_id, AssetType::Collection, &owner_id, AssetPermissionRole::CanEdit)
        .await?;
    insert_test_permission(&collection_permission).await?;
    
    // Fetch dashboard file with permissions
    let result = fetch_dashboard_file_with_permission(&dashboard_id, &owner_id).await?;
    
    // Assert collection permission (CanEdit) is used over direct permission (CanView)
    assert!(result.is_some(), "Dashboard file should be found");
    let file_with_permission = result.unwrap();
    assert_eq!(file_with_permission.dashboard_file.id, dashboard_id);
    assert_eq!(file_with_permission.permission, Some(AssetPermissionRole::CanEdit));
    
    // Clean up
    cleanup_test_data(&[dashboard_id]).await?;
    
    // Delete collection and associations
    diesel::delete(database::schema::collections_to_assets::table)
        .filter(database::schema::collections_to_assets::collection_id.eq(collection_id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::collections::table)
        .filter(database::schema::collections::id.eq(collection_id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::asset_permissions::table)
        .filter(database::schema::asset_permissions::asset_id.eq(collection_id))
        .execute(&mut conn)
        .await?;
    
    Ok(())
}

/// Tests permission combination with public access and other permissions
#[tokio::test]
async fn test_dashboard_file_public_and_collection_access() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and files
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let viewer_id = Uuid::new_v4(); // Another user
    
    // Create dashboard file with public access
    let mut dashboard_file = test_db.create_test_dashboard_file(&owner_id).await?;
    
    // Make the file publicly accessible
    dashboard_file.publicly_accessible = true;
    dashboard_file.publicly_enabled_by = Some(owner_id);
    dashboard_file.public_expiry_date = Some(Utc::now() + chrono::Duration::days(1));
    
    let dashboard_id = dashboard_file.id;
    insert_test_dashboard_file(&dashboard_file).await?;
    
    // Create collection
    let collection_id = Uuid::new_v4();
    let collection = Collection {
        id: collection_id,
        name: format!("Test Collection {}", test_db.test_id),
        description: Some("Test collection description".to_string()),
        created_by: owner_id,
        updated_by: owner_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        organization_id: test_db.organization_id,
    };
    
    // Insert collection
    diesel::insert_into(database::schema::collections::table)
        .values(&collection)
        .execute(&mut conn)
        .await?;
    
    // Create association between dashboard and collection
    let collection_to_asset = CollectionToAsset {
        collection_id,
        asset_id: dashboard_id,
        asset_type: AssetType::DashboardFile,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: owner_id,
        updated_by: owner_id,
    };
    
    // Insert association
    diesel::insert_into(database::schema::collections_to_assets::table)
        .values(&collection_to_asset)
        .execute(&mut conn)
        .await?;
    
    // Case 1: User with no explicit permissions should get CanView from public access
    let result1 = fetch_dashboard_file_with_permission(&dashboard_id, &viewer_id).await?;
    assert!(result1.is_some(), "Dashboard file should be found");
    let file_with_permission1 = result1.unwrap();
    assert_eq!(file_with_permission1.permission, Some(AssetPermissionRole::CanView));
    
    // Case 2: User with collection permission higher than public access
    let collection_permission = test_db
        .create_asset_permission(&collection_id, AssetType::Collection, &viewer_id, AssetPermissionRole::CanEdit)
        .await?;
    insert_test_permission(&collection_permission).await?;
    
    let result2 = fetch_dashboard_file_with_permission(&dashboard_id, &viewer_id).await?;
    assert!(result2.is_some(), "Dashboard file should be found");
    let file_with_permission2 = result2.unwrap();
    assert_eq!(file_with_permission2.permission, Some(AssetPermissionRole::CanEdit));
    
    // Clean up
    cleanup_test_data(&[dashboard_id]).await?;
    
    // Delete collection and associations
    diesel::delete(database::schema::collections_to_assets::table)
        .filter(database::schema::collections_to_assets::collection_id.eq(collection_id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::collections::table)
        .filter(database::schema::collections::id.eq(collection_id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::asset_permissions::table)
        .filter(database::schema::asset_permissions::asset_id.eq(collection_id))
        .execute(&mut conn)
        .await?;
    
    Ok(())
}

/// Tests that deleted files are not returned
#[tokio::test]
async fn test_deleted_dashboard_file_not_returned() -> Result<()> {
    // Initialize test environment
    let test_db = TestDb::new().await?;
    
    // Create test user and file
    let user = test_db.create_test_user().await?;
    let owner_id = user.id;
    let mut dashboard_file = test_db.create_test_dashboard_file(&owner_id).await?;
    
    // Mark the file as deleted
    dashboard_file.deleted_at = Some(Utc::now());
    
    let dashboard_id = dashboard_file.id;
    
    // Insert the deleted dashboard file
    insert_test_dashboard_file(&dashboard_file).await?;
    
    // Create permission
    let permission = test_db
        .create_asset_permission(&dashboard_id, AssetType::DashboardFile, &owner_id, AssetPermissionRole::Owner)
        .await?;
    insert_test_permission(&permission).await?;
    
    // Fetch file with permissions
    let result = fetch_dashboard_file_with_permission(&dashboard_id, &owner_id).await?;
    
    // Assert file is not found (because it's deleted)
    assert!(result.is_none(), "Deleted dashboard file should not be found");
    
    // Clean up
    cleanup_test_data(&[dashboard_id]).await?;
    
    Ok(())
}