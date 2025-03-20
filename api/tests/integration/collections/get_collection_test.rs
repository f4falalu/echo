use uuid::Uuid;
use crate::common::{
    env::{create_env, TestEnv},
    http::client::TestClient,
    assertions::response::assert_api_ok,
};
use chrono::Utc;
use database::enums::{AssetPermissionRole, AssetTypeEnum, IdentityTypeEnum};
use diesel::sql_query;
use diesel_async::RunQueryDsl;

#[tokio::test]
async fn test_get_collection_with_sharing_info() {
    // Setup test environment
    let env = create_env().await;
    let client = TestClient::new(&env);
    
    // Create test user and collection
    let user_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let collection_id = create_test_collection(&env, user_id).await;
    
    // Add sharing permissions
    add_test_permissions(&env, collection_id, user_id).await;
    
    // Add public sharing
    enable_public_sharing(&env, collection_id, user_id).await;
    
    // Test GET request
    let response = client
        .get(&format!("/api/v1/collections/{}", collection_id))
        .header("X-User-Id", user_id.to_string())
        .send()
        .await;
    
    // Assert success and verify response
    let data = assert_api_ok(response).await;
    
    // Check fields
    assert_eq!(data["id"], collection_id.to_string());
    
    // Check sharing fields - collections don't have public fields yet
    assert_eq!(data["publicly_accessible"], false);
    assert!(data["public_expiry_date"].is_null());
    assert!(data["public_enabled_by"].is_null());
    assert_eq!(data["individual_permissions"].as_array().unwrap().len(), 1);
    
    let permission = &data["individual_permissions"][0];
    assert_eq!(permission["email"], "test2@example.com");
    assert_eq!(permission["role"], "viewer");
    assert_eq!(permission["name"], "Test User 2");
}

// Helper functions to set up the test data
async fn create_test_collection(env: &TestEnv, user_id: Uuid) -> Uuid {
    let mut conn = env.db_pool.get().await.unwrap();
    
    // Insert test user
    sql_query("INSERT INTO users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING")
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .bind::<diesel::sql_types::Text, _>("test@example.com")
        .bind::<diesel::sql_types::Text, _>("Test User")
        .execute(&mut conn)
        .await
        .unwrap();
        
    // Insert another test user
    let user2_id = Uuid::parse_str("00000000-0000-0000-0000-000000000002").unwrap();
    sql_query("INSERT INTO users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING")
        .bind::<diesel::sql_types::Uuid, _>(user2_id)
        .bind::<diesel::sql_types::Text, _>("test2@example.com")
        .bind::<diesel::sql_types::Text, _>("Test User 2")
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Insert test collection
    let collection_id = Uuid::parse_str("00000000-0000-0000-0000-000000000040").unwrap();
    let org_id = Uuid::parse_str("00000000-0000-0000-0000-000000000100").unwrap();
    
    // Insert test organization if needed
    sql_query("INSERT INTO organizations (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind::<diesel::sql_types::Uuid, _>(org_id)
        .bind::<diesel::sql_types::Text, _>("Test Organization")
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Insert collection
    sql_query(r#"
        INSERT INTO collections (id, name, description, organization_id, created_by) 
        VALUES ($1, 'Test Collection', 'Test description', $2, $3)
        ON CONFLICT DO NOTHING
    "#)
        .bind::<diesel::sql_types::Uuid, _>(collection_id)
        .bind::<diesel::sql_types::Uuid, _>(org_id)
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .execute(&mut conn)
        .await
        .unwrap();
    
    collection_id
}

async fn add_test_permissions(env: &TestEnv, collection_id: Uuid, user_id: Uuid) {
    let mut conn = env.db_pool.get().await.unwrap();
    
    // Get the second user
    let user2_id = Uuid::parse_str("00000000-0000-0000-0000-000000000002").unwrap();
    
    // Add permission for user2 as viewer
    sql_query(r#"
        INSERT INTO asset_permissions (identity_id, identity_type, asset_id, asset_type, role, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $6)
        ON CONFLICT DO NOTHING
    "#)
        .bind::<diesel::sql_types::Uuid, _>(user2_id)
        .bind::<diesel::sql_types::Text, _>(IdentityTypeEnum::User.to_string())
        .bind::<diesel::sql_types::Uuid, _>(collection_id)
        .bind::<diesel::sql_types::Text, _>(AssetTypeEnum::Collection.to_string())
        .bind::<diesel::sql_types::Text, _>(AssetPermissionRole::CanView.to_string())
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .execute(&mut conn)
        .await
        .unwrap();
}

async fn enable_public_sharing(_env: &TestEnv, _collection_id: Uuid, _user_id: Uuid) {
    // Collections don't have public sharing fields yet, so this is a no-op
}