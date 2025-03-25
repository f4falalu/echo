use uuid::Uuid;
use serde_json::json;
use crate::common::{
    env::{create_env, TestEnv},
    http::client::TestClient,
    assertions::response::assert_api_ok,
};
use database::enums::AssetType;
use diesel::sql_query;
use diesel_async::RunQueryDsl;

#[tokio::test]
async fn test_post_chat_with_asset_no_prompt() {
    // Setup test environment
    let env = create_env().await;
    let client = TestClient::new(&env);
    
    // Create test user and metric
    let user_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let metric_id = create_test_metric(&env, user_id).await;
    
    // Test POST request with asset_id but no prompt
    let response = client
        .post("/api/v1/chats")
        .header("X-User-Id", user_id.to_string())
        .json(&json!({
            "asset_id": metric_id,
            "asset_type": "metric"
        }))
        .send()
        .await;
    
    // Assert success and verify response
    let data = assert_api_ok(response).await;
    
    // Verify chat was created
    assert!(data["chat"]["id"].is_string());
    
    // Verify messages were created (at least 2 messages should exist)
    let messages = data["messages"].as_object().unwrap();
    assert!(messages.len() >= 2);
    
    // Verify file association in database
    verify_file_association(&env, metric_id, data["chat"]["id"].as_str().unwrap()).await;
}

#[tokio::test]
async fn test_post_chat_with_legacy_metric_id() {
    // Setup test environment
    let env = create_env().await;
    let client = TestClient::new(&env);
    
    // Create test user and metric
    let user_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let metric_id = create_test_metric(&env, user_id).await;
    
    // Test POST request with legacy metric_id
    let response = client
        .post("/api/v1/chats")
        .header("X-User-Id", user_id.to_string())
        .json(&json!({
            "prompt": "Analyze this metric",
            "metric_id": metric_id
        }))
        .send()
        .await;
    
    // Assert success and verify response
    let data = assert_api_ok(response).await;
    
    // Verify chat was created
    assert!(data["chat"]["id"].is_string());
    
    // Verify file association in database
    verify_file_association(&env, metric_id, data["chat"]["id"].as_str().unwrap()).await;
}

#[tokio::test]
async fn test_post_chat_with_asset_id_but_no_asset_type() {
    // Setup test environment
    let env = create_env().await;
    let client = TestClient::new(&env);
    
    // Create test user and metric
    let user_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let metric_id = create_test_metric(&env, user_id).await;
    
    // Test POST request with asset_id but no asset_type (should fail)
    let response = client
        .post("/api/v1/chats")
        .header("X-User-Id", user_id.to_string())
        .json(&json!({
            "asset_id": metric_id
        }))
        .send()
        .await;
    
    // Assert error status code
    assert_eq!(response.status().as_u16(), 400);
}

// Helper functions to set up the test data
async fn create_test_metric(env: &TestEnv, user_id: Uuid) -> Uuid {
    let mut conn = env.db_pool.get().await.unwrap();
    
    // Insert test user
    sql_query("INSERT INTO users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING")
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .bind::<diesel::sql_types::Text, _>("test@example.com")
        .bind::<diesel::sql_types::Text, _>("Test User")
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Insert test organization
    let org_id = Uuid::parse_str("00000000-0000-0000-0000-000000000100").unwrap();
    sql_query("INSERT INTO organizations (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind::<diesel::sql_types::Uuid, _>(org_id)
        .bind::<diesel::sql_types::Text, _>("Test Organization")
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Insert test metric
    let metric_id = Uuid::parse_str("00000000-0000-0000-0000-000000000040").unwrap();
    
    sql_query(r#"
        INSERT INTO metric_files (
            id, name, file_name, content, organization_id, created_by, updated_by, 
            verification, version_history
        ) 
        VALUES (
            $1, 'Test Metric', 'test_metric.yml', 
            '{"name":"Test Metric","description":"A test metric"}', 
            $2, $3, $3, 'PENDING', '{}'
        )
        ON CONFLICT DO NOTHING
    "#)
        .bind::<diesel::sql_types::Uuid, _>(metric_id)
        .bind::<diesel::sql_types::Uuid, _>(org_id)
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .execute(&mut conn)
        .await
        .unwrap();
    
    metric_id
}

async fn verify_file_association(env: &TestEnv, metric_id: Uuid, chat_id: &str) {
    let mut conn = env.db_pool.get().await.unwrap();
    
    // Check if there's a message associated with the metric file
    let result: Vec<(i32,)> = sql_query(r#"
        SELECT COUNT(*) FROM messages_to_files
        WHERE metric_file_id = $1 AND message_id IN (
            SELECT id FROM messages WHERE thread_id = $2
        )
    "#)
        .bind::<diesel::sql_types::Uuid, _>(metric_id)
        .bind::<diesel::sql_types::Uuid, _>(Uuid::parse_str(chat_id).unwrap())
        .load(&mut conn)
        .await
        .unwrap();
    
    assert!(result[0].0 > 0, "No file association found for the metric in messages");
}