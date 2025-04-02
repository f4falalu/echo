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
async fn test_get_chat_with_sharing_info() {
    // Setup test environment
    let env = create_env().await;
    let client = TestClient::new(&env);
    
    // Create test user and chat
    let user_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let chat_id = create_test_chat(&env, user_id).await;
    
    // Add sharing permissions
    add_test_permissions(&env, chat_id, user_id).await;
    
    // Add public sharing
    enable_public_sharing(&env, chat_id, user_id).await;
    
    // Test GET request
    let response = client
        .get(&format!("/api/v1/chats/{}", chat_id))
        .header("X-User-Id", user_id.to_string())
        .send()
        .await;
    
    // Assert success and verify response
    let data = assert_api_ok(response).await;
    
    // Check fields
    assert_eq!(data["id"], chat_id.to_string());
    
    // Check sharing fields
    assert_eq!(data["publicly_accessible"], true);
    assert!(data["public_expiry_date"].is_string());
    assert_eq!(data["public_enabled_by"], "test@example.com");
    assert_eq!(data["individual_permissions"].as_array().unwrap().len(), 1);
    
    let permission = &data["individual_permissions"][0];
    assert_eq!(permission["email"], "test2@example.com");
    assert_eq!(permission["role"], "viewer");
    assert_eq!(permission["name"], "Test User 2");
}

// Helper functions to set up the test data
async fn create_test_chat(env: &TestEnv, user_id: Uuid) -> Uuid {
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
    
    // Insert test chat
    let chat_id = Uuid::parse_str("00000000-0000-0000-0000-000000000030").unwrap();
    let org_id = Uuid::parse_str("00000000-0000-0000-0000-000000000100").unwrap();
    
    // Insert test organization if needed
    sql_query("INSERT INTO organizations (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind::<diesel::sql_types::Uuid, _>(org_id)
        .bind::<diesel::sql_types::Text, _>("Test Organization")
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Insert chat
    sql_query(r#"
        INSERT INTO chats (id, title, organization_id, created_by, updated_by, publicly_accessible) 
        VALUES ($1, 'Test Chat', $2, $3, $3, false)
        ON CONFLICT DO NOTHING
    "#)
        .bind::<diesel::sql_types::Uuid, _>(chat_id)
        .bind::<diesel::sql_types::Uuid, _>(org_id)
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .execute(&mut conn)
        .await
        .unwrap();
    
    chat_id
}

async fn add_test_permissions(env: &TestEnv, chat_id: Uuid, user_id: Uuid) {
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
        .bind::<diesel::sql_types::Uuid, _>(chat_id)
        .bind::<diesel::sql_types::Text, _>(AssetTypeEnum::Chat.to_string())
        .bind::<diesel::sql_types::Text, _>(AssetPermissionRole::CanView.to_string())
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .execute(&mut conn)
        .await
        .unwrap();
}

async fn enable_public_sharing(env: &TestEnv, chat_id: Uuid, user_id: Uuid) {
    let mut conn = env.db_pool.get().await.unwrap();
    
    // Set public access
    let expiry_date = Utc::now() + chrono::Duration::days(7);
    
    sql_query(r#"
        UPDATE chats 
        SET publicly_accessible = true, publicly_enabled_by = $1, public_expiry_date = $2
        WHERE id = $3
    "#)
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .bind::<diesel::sql_types::Timestamptz, _>(expiry_date)
        .bind::<diesel::sql_types::Uuid, _>(chat_id)
        .execute(&mut conn)
        .await
        .unwrap();
}