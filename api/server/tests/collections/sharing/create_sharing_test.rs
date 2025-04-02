use anyhow::Result;
use axum::http::StatusCode;
use database::enums::AssetPermissionRole;
use serde_json::json;
use uuid::Uuid;

use crate::common::{
    fixtures::{collections, users},
    http::client::TestClient,
};

/// Test successful sharing of a collection that belongs to the user
#[tokio::test]
async fn test_create_collection_sharing_success() -> Result<()> {
    // Setup
    let user = users::create_test_user().await?;
    let collection = collections::create_test_collection_for_user(&user.id).await?;

    // Create test client with user auth
    let client = TestClient::new_with_auth(&user.id);

    // Share the collection with a different user
    let other_user = users::create_test_user().await?;
    let response = client
        .post(&format!("/collections/{}/sharing", collection.id))
        .json(&json!([
            {
                "email": other_user.email,
                "role": AssetPermissionRole::Viewer
            }
        ]))
        .send()
        .await?;

    // Verify response
    assert_eq!(response.status(), StatusCode::OK);
    let response_text = response.text().await?;
    assert!(response_text.contains("Sharing permissions created successfully"));

    // Cleanup: Delete test data
    users::delete_test_user(&user.id).await?;
    users::delete_test_user(&other_user.id).await?;
    collections::delete_test_collection(&collection.id).await?;

    Ok(())
}

/// Test attempting to share a collection that doesn't exist
#[tokio::test]
async fn test_create_collection_sharing_collection_not_found() -> Result<()> {
    // Setup
    let user = users::create_test_user().await?;
    let non_existent_id = Uuid::new_v4();

    // Create test client with user auth
    let client = TestClient::new_with_auth(&user.id);

    // Attempt to share a non-existent collection
    let response = client
        .post(&format!("/collections/{}/sharing", non_existent_id))
        .json(&json!([
            {
                "email": "test@example.com",
                "role": AssetPermissionRole::Viewer
            }
        ]))
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

/// Test attempting to share a collection without proper permissions
#[tokio::test]
async fn test_create_collection_sharing_insufficient_permissions() -> Result<()> {
    // Setup
    let owner = users::create_test_user().await?;
    let collection = collections::create_test_collection_for_user(&owner.id).await?;
    let unprivileged_user = users::create_test_user().await?;

    // Create test client with unprivileged user auth
    let client = TestClient::new_with_auth(&unprivileged_user.id);

    // Attempt to share as unprivileged user
    let response = client
        .post(&format!("/collections/{}/sharing", collection.id))
        .json(&json!([
            {
                "email": "test@example.com",
                "role": AssetPermissionRole::Viewer
            }
        ]))
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

/// Test attempting to share with an invalid email
#[tokio::test]
async fn test_create_collection_sharing_invalid_email() -> Result<()> {
    // Setup
    let user = users::create_test_user().await?;
    let collection = collections::create_test_collection_for_user(&user.id).await?;

    // Create test client with user auth
    let client = TestClient::new_with_auth(&user.id);

    // Attempt to share with invalid email
    let response = client
        .post(&format!("/collections/{}/sharing", collection.id))
        .json(&json!([
            {
                "email": "not-a-valid-email",
                "role": AssetPermissionRole::Viewer
            }
        ]))
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