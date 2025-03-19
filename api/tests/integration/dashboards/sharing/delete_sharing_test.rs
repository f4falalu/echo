use axum::{
    body::Body,
    http::{header, Method, Request, StatusCode},
};
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use serde_json::json;
use uuid::Uuid;

use crate::common::{
    fixtures::{dashboards::create_test_dashboard, users::create_test_user},
    http::client::TestClient,
};

#[tokio::test]
async fn test_delete_dashboard_sharing() {
    // Setup test data
    let client = TestClient::new().await;
    let test_user = create_test_user();
    let dashboard = create_test_dashboard();
    
    // Create a user to share with
    let shared_user = create_test_user();
    
    // Setup sharing permission manually
    client.setup_asset_permission(
        dashboard.id,
        AssetType::DashboardFile,
        shared_user.id,
        IdentityType::User,
        AssetPermissionRole::CanView,
        test_user.id,
    ).await;
    
    // Create the delete request
    let request = Request::builder()
        .method(Method::DELETE)
        .uri(format!("/dashboards/{}/sharing", dashboard.id))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-User-ID", test_user.id.to_string())
        .body(Body::from(
            serde_json::to_string(&vec![shared_user.email.clone()]).unwrap(),
        ))
        .unwrap();
    
    // Send the request
    let response = client.app.oneshot(request).await.unwrap();
    
    // Verify response
    assert_eq!(response.status(), StatusCode::OK);
    
    // Verify that the sharing permission is actually deleted
    let permissions = client
        .get_asset_permissions(dashboard.id, AssetType::DashboardFile)
        .await;
    
    // Should only contain the owner's permission
    assert_eq!(permissions.len(), 1);
    assert_eq!(permissions[0].identity_id, test_user.id);
}

#[tokio::test]
async fn test_delete_dashboard_sharing_not_found() {
    // Setup
    let client = TestClient::new().await;
    let user = create_test_user();
    let non_existent_id = Uuid::new_v4();
    
    // Create request with non-existent dashboard
    let request = Request::builder()
        .method(Method::DELETE)
        .uri(format!("/dashboards/{}/sharing", non_existent_id))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-User-ID", user.id.to_string())
        .body(Body::from(
            serde_json::to_string(&vec!["test@example.com".to_string()]).unwrap(),
        ))
        .unwrap();
    
    // Send request
    let response = client.app.oneshot(request).await.unwrap();
    
    // Verify 404 response
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_delete_dashboard_sharing_insufficient_permissions() {
    // Setup
    let client = TestClient::new().await;
    let owner = create_test_user();
    let user_without_permission = create_test_user();
    let dashboard = create_test_dashboard();
    
    // Set up the dashboard with owner
    client.setup_asset_permission(
        dashboard.id,
        AssetType::DashboardFile,
        owner.id,
        IdentityType::User,
        AssetPermissionRole::Owner,
        owner.id,
    ).await;
    
    // Create request from user without permission
    let request = Request::builder()
        .method(Method::DELETE)
        .uri(format!("/dashboards/{}/sharing", dashboard.id))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-User-ID", user_without_permission.id.to_string())
        .body(Body::from(
            serde_json::to_string(&vec!["test@example.com".to_string()]).unwrap(),
        ))
        .unwrap();
    
    // Send request
    let response = client.app.oneshot(request).await.unwrap();
    
    // Verify 403 Forbidden response
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn test_delete_dashboard_sharing_invalid_email() {
    // Setup
    let client = TestClient::new().await;
    let user = create_test_user();
    let dashboard = create_test_dashboard();
    
    // Set up the dashboard with owner
    client.setup_asset_permission(
        dashboard.id,
        AssetType::DashboardFile,
        user.id,
        IdentityType::User,
        AssetPermissionRole::Owner,
        user.id,
    ).await;
    
    // Create request with invalid email
    let request = Request::builder()
        .method(Method::DELETE)
        .uri(format!("/dashboards/{}/sharing", dashboard.id))
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-User-ID", user.id.to_string())
        .body(Body::from(
            serde_json::to_string(&vec!["invalid-email-no-at-sign".to_string()]).unwrap(),
        ))
        .unwrap();
    
    // Send request
    let response = client.app.oneshot(request).await.unwrap();
    
    // Verify 400 Bad Request response
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}