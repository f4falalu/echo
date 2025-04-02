use axum::http::StatusCode;
use diesel_async::RunQueryDsl;
use middleware::types::AuthenticatedUser;
use serde_json::json;
use uuid::Uuid;
use database::enums::UserOrganizationRole;

use crate::common::{
    assertions::response::ResponseAssertions,
    fixtures::builder::UserBuilder,
    http::test_app::TestApp,
};

#[tokio::test]
async fn test_create_data_source() {
    let app = TestApp::new().await.unwrap();
    
    // Create a test user with organization and proper role
    let user = UserBuilder::new()
        .with_organization("Test Org")
        .with_org_role(UserOrganizationRole::WorkspaceAdmin) // Ensure user has admin role
        .build(&app.db.pool)
        .await;
    
    // Prepare create request
    let create_req = json!({
        "name": "New Data Source",
        "env": "dev",
        "type": "postgres",
        "host": "localhost",
        "port": 5432,
        "username": "postgres",
        "password": "password",
        "default_database": "test",
        "default_schema": "public"
    });
    
    // Send create request
    let response = app
        .client
        .post("/api/data_sources")
        .header("Authorization", format!("Bearer {}", user.api_key))
        .json(&create_req)
        .send()
        .await
        .unwrap();
    
    // Assert response
    assert_eq!(response.status(), StatusCode::OK);
    
    let body = response.json::<serde_json::Value>().await.unwrap();
    assert!(body.get("id").is_some(), "Response should contain an ID");
    body.assert_has_key_with_value("name", "New Data Source");
    body.assert_has_key_with_value("db_type", "postgres");
    
    let credentials = &body["credentials"];
    assert!(credentials.is_object());
    
    // Test creating data source with same name (should fail)
    let duplicate_req = json!({
        "name": "New Data Source",
        "env": "dev",
        "type": "postgres",
        "host": "localhost",
        "port": 5432,
        "username": "postgres",
        "password": "password",
        "default_database": "test",
        "default_schema": "public"
    });
    
    let response = app
        .client
        .post("/api/data_sources")
        .header("Authorization", format!("Bearer {}", user.api_key))
        .json(&duplicate_req)
        .send()
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::CONFLICT);
    
    // Test creating data source with different environment
    let diff_env_req = json!({
        "name": "New Data Source",
        "env": "prod",
        "type": "postgres",
        "host": "localhost",
        "port": 5432,
        "username": "postgres",
        "password": "password",
        "default_database": "test",
        "default_schema": "public"
    });
    
    let response = app
        .client
        .post("/api/data_sources")
        .header("Authorization", format!("Bearer {}", user.api_key))
        .json(&diff_env_req)
        .send()
        .await
        .unwrap();
    
    // Should succeed since it's a different environment
    assert_eq!(response.status(), StatusCode::OK);
    
    // Test creating data source with insufficient permissions
    let regular_user = UserBuilder::new()
        .with_organization("Test Org")
        .with_org_role(UserOrganizationRole::User) // Regular user role
        .build(&app.db.pool)
        .await;
        
    let response = app
        .client
        .post("/api/data_sources")
        .header("Authorization", format!("Bearer {}", regular_user.api_key))
        .json(&create_req)
        .send()
        .await
        .unwrap();
        
    // Should fail due to insufficient permissions
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}