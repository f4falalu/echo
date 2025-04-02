use axum::http::StatusCode;
use chrono::Utc;
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{AssetPermission},
    pool::get_pg_pool,
    schema::{users, metric_files, asset_permissions},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde_json::json;
use uuid::Uuid;

use crate::common::{
    http::client::TestClient,
    fixtures::{users::create_test_user, metrics::create_test_metric_file},
};

#[tokio::test]
async fn test_update_metric_sharing_success() {
    // Setup test database connection
    let mut conn = get_pg_pool().get().await.unwrap();
    
    // 1. Create test owner and shared user
    let owner = create_test_user("owner@example.com");
    let org_id = Uuid::new_v4(); // Need org id for fixture
    diesel::insert_into(users::table)
        .values(&owner)
        .execute(&mut conn)
        .await
        .unwrap();
        
    let shared_user = create_test_user("shared@example.com");
    diesel::insert_into(users::table)
        .values(&shared_user)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 2. Create test metric
    let metric = create_test_metric_file(&owner.id, &org_id, None);
    diesel::insert_into(metric_files::table)
        .values(&metric)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 3. Create owner permission for test user
    let now = Utc::now();
    let owner_permission = AssetPermission {
        identity_id: owner.id,
        identity_type: IdentityType::User,
        asset_id: metric.id,
        asset_type: AssetType::MetricFile,
        role: AssetPermissionRole::Owner,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: owner.id,
        updated_by: owner.id,
    };
    
    // 4. Create existing CanView permission for shared user
    let shared_permission = AssetPermission {
        identity_id: shared_user.id,
        identity_type: IdentityType::User,
        asset_id: metric.id,
        asset_type: AssetType::MetricFile,
        role: AssetPermissionRole::CanView,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: owner.id,
        updated_by: owner.id,
    };
    
    // Insert both permissions
    diesel::insert_into(asset_permissions::table)
        .values(&vec![owner_permission, shared_permission])
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 5. Create test client
    let client = TestClient::new().await;
    
    // 6. Send update sharing request to change role from CanView to CanEdit
    let response = client
        .put(&format!("/metrics/{}/sharing", metric.id))
        .with_auth(&owner.id.to_string())
        .json(&json!({
            "users": [
                {
                    "email": "shared@example.com",
                    "role": "CanEdit"
                }
            ]
        }))
        .send()
        .await;
    
    // 7. Assert response
    assert_eq!(response.status(), StatusCode::OK);
    
    // 8. Check that permission was updated
    let permissions = asset_permissions::table
        .filter(asset_permissions::asset_id.eq(metric.id))
        .filter(asset_permissions::identity_id.eq(shared_user.id))
        .filter(asset_permissions::asset_type.eq(AssetType::MetricFile))
        .filter(asset_permissions::identity_type.eq(IdentityType::User))
        .filter(asset_permissions::deleted_at.is_null())
        .load::<AssetPermission>(&mut conn)
        .await
        .unwrap();
    
    assert_eq!(permissions.len(), 1);
    assert_eq!(permissions[0].role, AssetPermissionRole::CanEdit); // Role should be updated
}

#[tokio::test]
async fn test_update_metric_sharing_unauthorized() {
    // Setup test database connection
    let mut conn = get_pg_pool().get().await.unwrap();
    
    // 1. Create test owner, shared user, and unauthorized user
    let owner = create_test_user("owner@example.com");
    let org_id = Uuid::new_v4();
    diesel::insert_into(users::table)
        .values(&owner)
        .execute(&mut conn)
        .await
        .unwrap();
        
    let shared_user = create_test_user("shared@example.com");
    diesel::insert_into(users::table)
        .values(&shared_user)
        .execute(&mut conn)
        .await
        .unwrap();
    
    let unauthorized_user = create_test_user("unauthorized@example.com");
    diesel::insert_into(users::table)
        .values(&unauthorized_user)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 2. Create test metric
    let metric = create_test_metric_file(&owner.id, &org_id, None);
    diesel::insert_into(metric_files::table)
        .values(&metric)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 3. Create owner permission for owner and CanView for shared user
    let now = Utc::now();
    let owner_permission = AssetPermission {
        identity_id: owner.id,
        identity_type: IdentityType::User,
        asset_id: metric.id,
        asset_type: AssetType::MetricFile,
        role: AssetPermissionRole::Owner,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: owner.id,
        updated_by: owner.id,
    };
    
    let shared_permission = AssetPermission {
        identity_id: shared_user.id,
        identity_type: IdentityType::User,
        asset_id: metric.id,
        asset_type: AssetType::MetricFile,
        role: AssetPermissionRole::CanView,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: owner.id,
        updated_by: owner.id,
    };
    
    diesel::insert_into(asset_permissions::table)
        .values(&vec![owner_permission, shared_permission])
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 4. Create test client
    let client = TestClient::new().await;
    
    // 5. Send update sharing request as unauthorized user
    let response = client
        .put(&format!("/metrics/{}/sharing", metric.id))
        .with_auth(&unauthorized_user.id.to_string())
        .json(&json!({
            "users": [
                {
                    "email": "shared@example.com",
                    "role": "CanEdit"
                }
            ]
        }))
        .send()
        .await;
    
    // 6. Assert response is forbidden
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
    
    // 7. Check that permission was not updated
    let permissions = asset_permissions::table
        .filter(asset_permissions::asset_id.eq(metric.id))
        .filter(asset_permissions::identity_id.eq(shared_user.id))
        .filter(asset_permissions::asset_type.eq(AssetType::MetricFile))
        .filter(asset_permissions::identity_type.eq(IdentityType::User))
        .filter(asset_permissions::deleted_at.is_null())
        .load::<AssetPermission>(&mut conn)
        .await
        .unwrap();
    
    assert_eq!(permissions.len(), 1);
    assert_eq!(permissions[0].role, AssetPermissionRole::CanView); // Role should not change
}

#[tokio::test]
async fn test_update_metric_sharing_invalid_email() {
    // Setup test database connection
    let mut conn = get_pg_pool().get().await.unwrap();
    
    // 1. Create test owner
    let owner = create_test_user("owner@example.com");
    let org_id = Uuid::new_v4();
    diesel::insert_into(users::table)
        .values(&owner)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 2. Create test metric
    let metric = create_test_metric_file(&owner.id, &org_id, None);
    diesel::insert_into(metric_files::table)
        .values(&metric)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 3. Create owner permission
    let now = Utc::now();
    let owner_permission = AssetPermission {
        identity_id: owner.id,
        identity_type: IdentityType::User,
        asset_id: metric.id,
        asset_type: AssetType::MetricFile,
        role: AssetPermissionRole::Owner,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: owner.id,
        updated_by: owner.id,
    };
    
    diesel::insert_into(asset_permissions::table)
        .values(&owner_permission)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 4. Create test client
    let client = TestClient::new().await;
    
    // 5. Send update sharing request with invalid email
    let response = client
        .put(&format!("/metrics/{}/sharing", metric.id))
        .with_auth(&owner.id.to_string())
        .json(&json!({
            "users": [
                {
                    "email": "invalid-email-format",
                    "role": "CanView"
                }
            ]
        }))
        .send()
        .await;
    
    // 6. Assert response is bad request
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_update_metric_sharing_nonexistent_metric() {
    // Setup test database connection
    let mut conn = get_pg_pool().get().await.unwrap();
    
    // 1. Create test user
    let user = create_test_user("user@example.com");
    diesel::insert_into(users::table)
        .values(&user)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 2. Create test client
    let client = TestClient::new().await;
    
    // 3. Send update sharing request with non-existent metric id
    let nonexistent_id = Uuid::new_v4();
    let response = client
        .put(&format!("/metrics/{}/sharing", nonexistent_id))
        .with_auth(&user.id.to_string())
        .json(&json!({
            "users": [
                {
                    "email": "share@example.com",
                    "role": "CanView"
                }
            ]
        }))
        .send()
        .await;
    
    // 4. Assert response is not found
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_update_metric_public_sharing() {
    // Setup test database connection
    let mut conn = get_pg_pool().get().await.unwrap();
    
    // 1. Create test owner
    let owner = create_test_user("owner@example.com");
    let org_id = Uuid::new_v4();
    diesel::insert_into(users::table)
        .values(&owner)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 2. Create test metric
    let metric = create_test_metric_file(&owner.id, &org_id, None);
    diesel::insert_into(metric_files::table)
        .values(&metric)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 3. Create owner permission
    let now = Utc::now();
    let owner_permission = AssetPermission {
        identity_id: owner.id,
        identity_type: IdentityType::User,
        asset_id: metric.id,
        asset_type: AssetType::MetricFile,
        role: AssetPermissionRole::Owner,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        created_by: owner.id,
        updated_by: owner.id,
    };
    
    diesel::insert_into(asset_permissions::table)
        .values(&owner_permission)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 4. Create test client
    let client = TestClient::new().await;
    
    // Set expiration date to 7 days from now
    let expiration_date = (Utc::now() + chrono::Duration::days(7)).to_rfc3339();
    
    // 5. Send update sharing request with public access settings
    let response = client
        .put(&format!("/metrics/{}/sharing", metric.id))
        .with_auth(&owner.id.to_string())
        .json(&json!({
            "publicly_accessible": true,
            "public_expiration": expiration_date
        }))
        .send()
        .await;
    
    // 6. Assert response is successful
    assert_eq!(response.status(), StatusCode::OK);
    
    // 7. Check that the metric was updated with public access settings
    let updated_metric = metric_files::table
        .find(metric.id)
        .first::<database::models::MetricFile>(&mut conn)
        .await
        .unwrap();
    
    assert!(updated_metric.publicly_accessible);
    assert_eq!(updated_metric.publicly_enabled_by, Some(owner.id));
    assert!(updated_metric.public_expiry_date.is_some());
}