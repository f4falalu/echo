use anyhow::Result;
use chrono::Utc;
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{Collection, User},
    pool::get_pg_pool,
    schema::{asset_permissions, collections, users},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use http::StatusCode;
use uuid::Uuid;

use crate::common::{
    fixtures::users::create_test_user,
    http::client::test_client,
};

#[tokio::test]
async fn test_list_collection_sharing() -> Result<()> {
    // Create test users
    let mut conn = get_pg_pool().get().await?;
    
    // Create owner user
    let user = create_test_user();
    let user_id = user.id;
    let user_email = user.email.clone();
    let org_id = Uuid::new_v4(); // For simplicity, we're just generating a UUID
    
    // Insert owner user
    diesel::insert_into(users::table)
        .values(&user)
        .execute(&mut conn)
        .await?;
        
    // Create another user
    let other_user = create_test_user();
    let other_user_id = other_user.id;
    
    // Insert other user
    diesel::insert_into(users::table)
        .values(&other_user)
        .execute(&mut conn)
        .await?;
    
    // Create a test collection
    let collection_id = Uuid::new_v4();
    let collection = Collection {
        id: collection_id,
        name: "Test Collection".to_string(),
        description: Some("Test Description".to_string()),
        created_by: user_id,
        updated_by: user_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        organization_id: org_id,
    };
    
    // Insert the collection
    diesel::insert_into(collections::table)
        .values(&collection)
        .execute(&mut conn)
        .await?;
    
    // Create a sharing permission
    create_test_permission(collection_id, other_user_id, AssetPermissionRole::CanView).await?;
    
    // Create a test client with the user's session
    let client = test_client(&user_email).await?;
    
    // Make the request to list sharing permissions
    let response = client
        .get(&format!("/collections/{}/sharing", collection_id))
        .send()
        .await?;
    
    // Assert the response status
    assert_eq!(response.status(), StatusCode::OK);
    
    // Parse the response
    let response_json: serde_json::Value = response.json().await?;
    let permissions = response_json.get("data")
        .and_then(|d| d.get("permissions"))
        .and_then(|p| p.as_array())
        .unwrap_or(&vec![]);
    
    // Assert there's at least one permission entry
    assert!(!permissions.is_empty());
    
    // Assert the permission entry has the expected structure
    let permission = &permissions[0];
    assert!(permission.get("user_id").is_some());
    assert!(permission.get("email").is_some());
    assert!(permission.get("role").is_some());
    
    Ok(())
}

#[tokio::test]
async fn test_list_collection_sharing_not_found() -> Result<()> {
    // Create owner user
    let mut conn = get_pg_pool().get().await?;
    
    let user = create_test_user();
    let user_email = user.email.clone();
    
    // Insert owner user
    diesel::insert_into(users::table)
        .values(&user)
        .execute(&mut conn)
        .await?;
    
    // Create a test client with the user's session
    let client = test_client(&user_email).await?;
    
    // Make the request with a random non-existent collection ID
    let response = client
        .get(&format!("/collections/{}/sharing", Uuid::new_v4()))
        .send()
        .await?;
    
    // Assert the response status
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    
    Ok(())
}

#[tokio::test]
async fn test_list_collection_sharing_forbidden() -> Result<()> {
    // Create test users
    let mut conn = get_pg_pool().get().await?;
    
    // Create owner user
    let owner = create_test_user();
    let owner_id = owner.id;
    let org_id = Uuid::new_v4(); // For simplicity, we're just generating a UUID
    
    // Insert owner user
    diesel::insert_into(users::table)
        .values(&owner)
        .execute(&mut conn)
        .await?;
        
    // Create another user (that doesn't have access)
    let other_user = create_test_user();
    let other_user_email = other_user.email.clone();
    
    // Insert other user
    diesel::insert_into(users::table)
        .values(&other_user)
        .execute(&mut conn)
        .await?;
    
    // Create a test collection
    let collection_id = Uuid::new_v4();
    let collection = Collection {
        id: collection_id,
        name: "Test Collection".to_string(),
        description: Some("Test Description".to_string()),
        created_by: owner_id,
        updated_by: owner_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        organization_id: org_id,
    };
    
    // Insert the collection
    diesel::insert_into(collections::table)
        .values(&collection)
        .execute(&mut conn)
        .await?;
    
    // Note: We don't create a permission for other_user, so they should be forbidden
    
    // Create a test client with the unauthorized user's session
    let client = test_client(&other_user_email).await?;
    
    // Make the request with the collection ID
    let response = client
        .get(&format!("/collections/{}/sharing", collection_id))
        .send()
        .await?;
    
    // Assert the response status
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
    
    Ok(())
}


// Helper function to create a test permission
async fn create_test_permission(asset_id: Uuid, user_id: Uuid, role: AssetPermissionRole) -> Result<()> {
    let mut conn = get_pg_pool().get().await?;
    
    // Ensure the user_id exists
    let user = users::table
        .filter(users::id.eq(user_id))
        .first::<User>(&mut conn)
        .await?;
    
    // Create the permission
    let permission_id = Uuid::new_v4();
    diesel::insert_into(asset_permissions::table)
        .values((
            asset_permissions::id.eq(permission_id),
            asset_permissions::asset_id.eq(asset_id),
            asset_permissions::asset_type.eq(AssetType::Collection),
            asset_permissions::identity_id.eq(user_id),
            asset_permissions::identity_type.eq(IdentityType::User),
            asset_permissions::role.eq(role),
            asset_permissions::created_at.eq(Utc::now()),
            asset_permissions::updated_at.eq(Utc::now()),
            asset_permissions::created_by.eq(user_id),
            asset_permissions::updated_by.eq(user_id),
        ))
        .execute(&mut conn)
        .await?;
        
    Ok(())
}