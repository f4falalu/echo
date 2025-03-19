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
async fn test_create_metric_sharing_success() {
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
    let permission = AssetPermission {
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
        .values(&permission)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // 4. Create test client
    let client = TestClient::new().await;
    
    // 5. Send create sharing request
    let response = client
        .post(&format!("/metrics/{}/sharing", metric.id))
        .with_auth(&owner.id.to_string())
        .json(&json!({
            "emails": ["shared@example.com"],
            "role": "CanView"
        }))
        .send()
        .await;
    
    // 6. Assert response
    assert_eq!(response.status(), StatusCode::OK);
    
    // 7. Check that permission was created
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
    assert_eq!(permissions[0].role, AssetPermissionRole::CanView);
}