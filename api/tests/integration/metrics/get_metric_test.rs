use uuid::Uuid;
use crate::common::{
    env::{create_env, TestEnv},
    http::client::TestClient,
    assertions::response::assert_api_ok,
};
use chrono::Utc;
use database::enums::{AssetPermissionRole, AssetType, AssetTypeEnum, IdentityTypeEnum};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;

#[tokio::test]
async fn test_get_metric_with_sharing_info() {
    // Setup test environment
    let env = create_env().await;
    let client = TestClient::new(&env);
    
    // Create test user and metric
    let user_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let metric_id = create_test_metric(&env, user_id).await;
    
    // Add sharing permissions
    add_test_permissions(&env, metric_id, user_id).await;
    
    // Add public sharing
    enable_public_sharing(&env, metric_id, user_id).await;
    
    // Test GET request
    let response = client
        .get(&format!("/api/v1/metrics/{}", metric_id))
        .header("X-User-Id", user_id.to_string())
        .send()
        .await;
    
    // Assert success and verify response
    let data = assert_api_ok(response).await;
    
    // Check fields
    assert_eq!(data["id"], metric_id.to_string());
    assert_eq!(data["type"], "metric");
    
    // Check sharing fields
    assert_eq!(data["publicly_accessible"], true);
    assert!(data["public_expiry_date"].is_string());
    assert_eq!(data["public_enabled_by"], "test@example.com");
    assert_eq!(data["individual_permissions"].as_array().unwrap().len(), 1);
    
    let permission = &data["individual_permissions"][0];
    assert_eq!(permission["email"], "test2@example.com");
    assert_eq!(permission["role"], "viewer");
    assert_eq!(permission["name"], "Test User 2");
    
    // Check that dashboards and collections arrays exist but are empty
    // since we haven't associated any in this test
    assert!(data["dashboards"].is_array());
    assert!(data["collections"].is_array());
    assert_eq!(data["dashboards"].as_array().unwrap().len(), 0);
    assert_eq!(data["collections"].as_array().unwrap().len(), 0);
}

#[tokio::test]
async fn test_get_metric_with_associations() {
    // Setup test environment
    let env = create_env().await;
    let client = TestClient::new(&env);
    
    // Create test user and metric
    let user_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let metric_id = create_test_metric(&env, user_id).await;
    
    // Create dashboard and collection and associate them with the metric
    let (dashboard_id, collection_id) = create_associations(&env, metric_id, user_id).await;
    
    // Test GET request
    let response = client
        .get(&format!("/api/v1/metrics/{}", metric_id))
        .header("X-User-Id", user_id.to_string())
        .send()
        .await;
    
    // Assert success and verify response
    let data = assert_api_ok(response).await;
    
    // Check fields
    assert_eq!(data["id"], metric_id.to_string());
    
    // Check that dashboards array contains our dashboard
    assert!(data["dashboards"].is_array());
    assert_eq!(data["dashboards"].as_array().unwrap().len(), 1);
    assert_eq!(data["dashboards"][0]["id"], dashboard_id.to_string());
    assert_eq!(data["dashboards"][0]["name"], "Test Dashboard");
    
    // Check that collections array contains our collection
    assert!(data["collections"].is_array());
    assert_eq!(data["collections"].as_array().unwrap().len(), 1);
    assert_eq!(data["collections"][0]["id"], collection_id.to_string());
    assert_eq!(data["collections"][0]["name"], "Test Collection");
}

// Helper functions to set up the test data
async fn create_test_metric(env: &TestEnv, user_id: Uuid) -> Uuid {
    let mut conn = env.db_pool.get().await.unwrap();
    
    // Insert test user
    diesel::sql_query("INSERT INTO users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING")
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .bind::<diesel::sql_types::Text, _>("test@example.com")
        .bind::<diesel::sql_types::Text, _>("Test User")
        .execute(&mut conn)
        .await
        .unwrap();
        
    // Insert another test user
    let user2_id = Uuid::parse_str("00000000-0000-0000-0000-000000000002").unwrap();
    diesel::sql_query("INSERT INTO users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING")
        .bind::<diesel::sql_types::Uuid, _>(user2_id)
        .bind::<diesel::sql_types::Text, _>("test2@example.com")
        .bind::<diesel::sql_types::Text, _>("Test User 2")
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Insert test metric
    let metric_id = Uuid::parse_str("00000000-0000-0000-0000-000000000010").unwrap();
    let org_id = Uuid::parse_str("00000000-0000-0000-0000-000000000100").unwrap();
    
    // Insert test organization if needed
    diesel::sql_query("INSERT INTO organizations (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind::<diesel::sql_types::Uuid, _>(org_id)
        .bind::<diesel::sql_types::Text, _>("Test Organization")
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Insert metric
    diesel::sql_query(r#"
        INSERT INTO metric_files (id, name, file_name, content, verification, organization_id, created_by, version_history) 
        VALUES ($1, 'Test Metric', 'test.yml', '{"description": "Test description", "time_frame": "daily", "dataset_ids": [], "chart_config": {}, "sql": "SELECT 1;"}', 'notRequested', $2, $3, '{}'::jsonb)
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

async fn add_test_permissions(env: &TestEnv, metric_id: Uuid, user_id: Uuid) {
    let mut conn = env.db_pool.get().await.unwrap();
    
    // Get the second user
    let user2_id = Uuid::parse_str("00000000-0000-0000-0000-000000000002").unwrap();
    
    // Add permission for user2 as viewer
    diesel::sql_query(r#"
        INSERT INTO asset_permissions (identity_id, identity_type, asset_id, asset_type, role, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $6)
        ON CONFLICT DO NOTHING
    "#)
        .bind::<diesel::sql_types::Uuid, _>(user2_id)
        .bind::<diesel::sql_types::Text, _>(IdentityTypeEnum::User.to_string())
        .bind::<diesel::sql_types::Uuid, _>(metric_id)
        .bind::<diesel::sql_types::Text, _>(AssetTypeEnum::MetricFile.to_string())
        .bind::<diesel::sql_types::Text, _>(AssetPermissionRole::CanView.to_string())
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .execute(&mut conn)
        .await
        .unwrap();
}

async fn enable_public_sharing(env: &TestEnv, metric_id: Uuid, user_id: Uuid) {
    let mut conn = env.db_pool.get().await.unwrap();
    
    // Set public access
    let expiry_date = Utc::now() + chrono::Duration::days(7);
    
    diesel::sql_query(r#"
        UPDATE metric_files 
        SET publicly_accessible = true, publicly_enabled_by = $1, public_expiry_date = $2
        WHERE id = $3
    "#)
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .bind::<diesel::sql_types::Timestamptz, _>(expiry_date)
        .bind::<diesel::sql_types::Uuid, _>(metric_id)
        .execute(&mut conn)
        .await
        .unwrap();
}

async fn create_associations(env: &TestEnv, metric_id: Uuid, user_id: Uuid) -> (Uuid, Uuid) {
    let mut conn = env.db_pool.get().await.unwrap();
    
    // Create test organization if not already created
    let org_id = Uuid::parse_str("00000000-0000-0000-0000-000000000100").unwrap();
    diesel::sql_query("INSERT INTO organizations (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING")
        .bind::<diesel::sql_types::Uuid, _>(org_id)
        .bind::<diesel::sql_types::Text, _>("Test Organization")
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Create a dashboard
    let dashboard_id = Uuid::parse_str("00000000-0000-0000-0000-000000000020").unwrap();
    diesel::sql_query(r#"
        INSERT INTO dashboard_files (id, name, file_name, content, organization_id, created_by, version_history) 
        VALUES ($1, 'Test Dashboard', 'test-dashboard.yml', '{}', $2, $3, '{}'::jsonb)
        ON CONFLICT DO NOTHING
    "#)
        .bind::<diesel::sql_types::Uuid, _>(dashboard_id)
        .bind::<diesel::sql_types::Uuid, _>(org_id)
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Create a collection
    let collection_id = Uuid::parse_str("00000000-0000-0000-0000-000000000030").unwrap();
    diesel::sql_query(r#"
        INSERT INTO collections (id, name, description, created_by, updated_by, organization_id) 
        VALUES ($1, 'Test Collection', 'Test collection description', $2, $2, $3)
        ON CONFLICT DO NOTHING
    "#)
        .bind::<diesel::sql_types::Uuid, _>(collection_id)
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .bind::<diesel::sql_types::Uuid, _>(org_id)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Associate metric with dashboard
    diesel::sql_query(r#"
        INSERT INTO metric_files_to_dashboard_files (metric_file_id, dashboard_file_id, created_by) 
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
    "#)
        .bind::<diesel::sql_types::Uuid, _>(metric_id)
        .bind::<diesel::sql_types::Uuid, _>(dashboard_id)
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Associate metric with collection
    diesel::sql_query(r#"
        INSERT INTO collections_to_assets (collection_id, asset_id, asset_type, created_by, updated_by) 
        VALUES ($1, $2, $3, $4, $4)
        ON CONFLICT DO NOTHING
    "#)
        .bind::<diesel::sql_types::Uuid, _>(collection_id)
        .bind::<diesel::sql_types::Uuid, _>(metric_id)
        .bind::<diesel::sql_types::Text, _>("metric_file")
        .bind::<diesel::sql_types::Uuid, _>(user_id)
        .execute(&mut conn)
        .await
        .unwrap();
    
    (dashboard_id, collection_id)
}