use anyhow::Result;
use axum::http::StatusCode;
use serde_json::json;
use uuid::Uuid;

use crate::common::TestApp;

#[tokio::test]
async fn test_update_dashboard_endpoint() -> Result<()> {
    // Setup test app
    let app = TestApp::new().await?;
    
    // Create a test dashboard first
    let create_response = app
        .client
        .post("/api/v1/dashboards")
        .bearer_auth(&app.test_user.token)
        .json(&json!({
            "name": "Test Dashboard",
            "description": "Test Description",
            "file": "name: Test Dashboard\ndescription: Test Description\nrows: []"
        }))
        .send()
        .await?;
    
    let create_body: serde_json::Value = create_response.json().await?;
    let dashboard_id = create_body["dashboard"]["id"].as_str().unwrap();
    
    // Make request to update dashboard
    let update_response = app
        .client
        .put(&format!("/api/v1/dashboards/{}", dashboard_id))
        .bearer_auth(&app.test_user.token)
        .json(&json!({
            "name": "Updated Dashboard Name",
            "description": "Updated description"
        }))
        .send()
        .await?;
    
    // Verify response
    assert_eq!(update_response.status(), StatusCode::OK);
    
    // Parse response body
    let update_body: serde_json::Value = update_response.json().await?;
    
    // Verify dashboard properties
    assert_eq!(update_body["dashboard"]["name"], "Updated Dashboard Name");
    assert_eq!(update_body["dashboard"]["description"], "Updated description");
    
    Ok(())
}

#[tokio::test]
async fn test_update_dashboard_with_file_endpoint() -> Result<()> {
    // Setup test app
    let app = TestApp::new().await?;
    
    // Create a test dashboard first
    let create_response = app
        .client
        .post("/api/v1/dashboards")
        .bearer_auth(&app.test_user.token)
        .json(&json!({
            "name": "Test Dashboard",
            "description": "Test Description",
            "file": "name: Test Dashboard\ndescription: Test Description\nrows: []"
        }))
        .send()
        .await?;
    
    let create_body: serde_json::Value = create_response.json().await?;
    let dashboard_id = create_body["dashboard"]["id"].as_str().unwrap();
    
    // YAML content for update
    let yaml_content = r#"
    name: File Updated Dashboard
    description: Updated from file
    rows: []
    "#;
    
    // Make request to update dashboard with file
    let update_response = app
        .client
        .put(&format!("/api/v1/dashboards/{}", dashboard_id))
        .bearer_auth(&app.test_user.token)
        .json(&json!({
            "file": yaml_content
        }))
        .send()
        .await?;
    
    // Verify response
    assert_eq!(update_response.status(), StatusCode::OK);
    
    // Parse response body
    let update_body: serde_json::Value = update_response.json().await?;
    
    // Verify dashboard properties
    assert_eq!(update_body["dashboard"]["name"], "File Updated Dashboard");
    assert_eq!(update_body["dashboard"]["description"], "Updated from file");
    
    Ok(())
}