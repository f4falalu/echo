use anyhow::Result;
use axum::http::StatusCode;
use database::enums::AssetPermissionRole;
use uuid::Uuid;
use serde_json::json;

use crate::common::{
    fixtures::{collections, users},
    http::client::TestClient,
};

/// Test successfully deleting sharing permissions for a collection that belongs to the user
#[tokio::test]
async fn test_delete_collection_sharing_success() -> Result<()> {
    // Setup
    let user = users::create_test_user().await?;
    let collection = collections::create_test_collection_for_user(&user.id).await?;

    // Create test client with user auth
    let client = TestClient::new_with_auth(&user.id);

    // Create a test user to share with
    let other_user = users::create_test_user().await?;
    
    // First share the collection with another user
    let share_response = client
        .post(&format!("/collections/{}/sharing", collection.id))
        .json(&json!([
            {
                "email": other_user.email.clone(),
                "role": AssetPermissionRole::Viewer
            }
        ]))
        .send()
        .await?;
    
    assert_eq!(share_response.status(), StatusCode::OK);

    // Now delete the sharing permission
    let delete_response = client
        .delete(&format!("/collections/{}/sharing", collection.id))
        .json(&json!([other_user.email.clone()]))
        .send()
        .await?;

    // Verify response
    assert_eq!(delete_response.status(), StatusCode::OK);
    let response_text = delete_response.text().await?;
    assert!(response_text.contains("Sharing permissions deleted successfully"));

    // Cleanup: Delete test data
    users::delete_test_user(&user.id).await?;
    users::delete_test_user(&other_user.id).await?;
    collections::delete_test_collection(&collection.id).await?;

    Ok(())
}

/// Test attempting to delete sharing permissions for a collection that doesn't exist
#[tokio::test]
async fn test_delete_collection_sharing_collection_not_found() -> Result<()> {
    // Setup
    let user = users::create_test_user().await?;
    let non_existent_id = Uuid::new_v4();

    // Create test client with user auth
    let client = TestClient::new_with_auth(&user.id);

    // Attempt to delete sharing for a non-existent collection
    let response = client
        .delete(&format!("/collections/{}/sharing", non_existent_id))
        .json(&json!(["test@example.com"]))
        .send()
        .await?;

    // Verify response
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    let response_text = response.text().await?;
    assert!(response_text.contains("Collection not found"));

    // Cleanup
    users::delete_test_user(&user.id).await?;

    Ok(())
}

/// Test attempting to delete sharing permissions without proper authorization
#[tokio::test]
async fn test_delete_collection_sharing_insufficient_permissions() -> Result<()> {
    // Setup
    let owner = users::create_test_user().await?;
    let collection = collections::create_test_collection_for_user(&owner.id).await?;
    let unprivileged_user = users::create_test_user().await?;

    // Create test client with unprivileged user auth
    let client = TestClient::new_with_auth(&unprivileged_user.id);

    // Attempt to delete sharing as unprivileged user
    let response = client
        .delete(&format!("/collections/{}/sharing", collection.id))
        .json(&json!(["test@example.com"]))
        .send()
        .await?;

    // Verify response
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
    let response_text = response.text().await?;
    assert!(response_text.contains("Insufficient permissions"));

    // Cleanup
    users::delete_test_user(&owner.id).await?;
    users::delete_test_user(&unprivileged_user.id).await?;
    collections::delete_test_collection(&collection.id).await?;

    Ok(())
}

/// Test attempting to delete sharing with an invalid email format
#[tokio::test]
async fn test_delete_collection_sharing_invalid_email() -> Result<()> {
    // Setup
    let user = users::create_test_user().await?;
    let collection = collections::create_test_collection_for_user(&user.id).await?;

    // Create test client with user auth
    let client = TestClient::new_with_auth(&user.id);

    // Attempt to delete sharing with invalid email
    let response = client
        .delete(&format!("/collections/{}/sharing", collection.id))
        .json(&json!(["not-a-valid-email"]))
        .send()
        .await?;

    // Verify response
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let response_text = response.text().await?;
    assert!(response_text.contains("Invalid email"));

    // Cleanup
    users::delete_test_user(&user.id).await?;
    collections::delete_test_collection(&collection.id).await?;

    Ok(())
}