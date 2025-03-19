use crate::common::{
    assertions::response::assert_status,
    fixtures::{collections::create_test_collection, users::create_test_user},
    http::client::TestClient,
};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::Collection,
    pool::get_pg_pool,
};
use diesel_async::RunQueryDsl;
use handlers::collections::sharing::ShareRecipient;
use sharing::check_asset_permission::check_access;
use sharing::create_asset_permission::create_share_by_email;
use uuid::Uuid;

#[tokio::test]
async fn update_sharing_returns_success_for_authorized_user() {
    // Setup test data
    let user = create_test_user().await;
    let user_id = user.id;
    let collection = create_test_collection(&user_id).await;
    let collection_id = collection.id;

    // Setup test client
    let client = TestClient::new().await;
    client.login_as(user).await;

    // Create a test user to share with
    let test_user = create_test_user().await;
    let test_email = test_user.email.clone();

    // First share with test user as ReadOnly
    create_share_by_email(
        &test_email,
        collection_id,
        AssetType::Collection,
        AssetPermissionRole::ReadOnly,
        user_id,
    )
    .await
    .unwrap();

    // Verify initial permission
    let initial_role = check_access(
        collection_id,
        AssetType::Collection,
        test_user.id,
        IdentityType::User,
    )
    .await
    .unwrap();
    assert_eq!(initial_role, Some(AssetPermissionRole::ReadOnly));

    // Create update request to change to FullAccess
    let request = vec![ShareRecipient {
        email: test_email.clone(),
        role: AssetPermissionRole::FullAccess,
    }];

    // Send request
    let response = client
        .put(&format!("/collections/{}/sharing", collection_id))
        .json(&request)
        .send()
        .await;

    // Verify response
    assert_status(&response, 200);

    // Verify permission was updated
    let updated_role = check_access(
        collection_id,
        AssetType::Collection,
        test_user.id,
        IdentityType::User,
    )
    .await
    .unwrap();
    assert_eq!(updated_role, Some(AssetPermissionRole::FullAccess));
}

#[tokio::test]
async fn update_sharing_returns_forbidden_for_unauthorized_user() {
    // Setup test data - owner and another user
    let owner = create_test_user().await;
    let user = create_test_user().await;
    let collection = create_test_collection(&owner.id).await;
    let collection_id = collection.id;

    // Share collection with user as ReadOnly
    create_share_by_email(
        &user.email,
        collection_id,
        AssetType::Collection,
        AssetPermissionRole::ReadOnly,
        owner.id,
    )
    .await
    .unwrap();

    // Setup test client - login as non-owner with only ReadOnly access
    let client = TestClient::new().await;
    client.login_as(user).await;

    // Try to update permissions
    let request = vec![ShareRecipient {
        email: "test@example.com".to_string(), 
        role: AssetPermissionRole::ReadOnly,
    }];

    // Send request
    let response = client
        .put(&format!("/collections/{}/sharing", collection_id))
        .json(&request)
        .send()
        .await;

    // Verify forbidden response
    assert_status(&response, 403);
}

#[tokio::test]
async fn update_sharing_returns_not_found_for_nonexistent_collection() {
    // Setup test data
    let user = create_test_user().await;
    let non_existent_id = Uuid::new_v4();

    // Setup test client
    let client = TestClient::new().await;
    client.login_as(user).await;

    // Create request
    let request = vec![ShareRecipient {
        email: "test@example.com".to_string(),
        role: AssetPermissionRole::ReadOnly,
    }];

    // Send request to non-existent collection
    let response = client
        .put(&format!("/collections/{}/sharing", non_existent_id))
        .json(&request)
        .send()
        .await;

    // Verify not found response
    assert_status(&response, 404);
}

#[tokio::test]
async fn update_sharing_returns_bad_request_for_invalid_email() {
    // Setup test data
    let user = create_test_user().await;
    let collection = create_test_collection(&user.id).await;
    let collection_id = collection.id;

    // Setup test client
    let client = TestClient::new().await;
    client.login_as(user).await;

    // Create request with invalid email
    let request = vec![ShareRecipient {
        email: "invalid-email".to_string(), // No @ symbol
        role: AssetPermissionRole::ReadOnly,
    }];

    // Send request
    let response = client
        .put(&format!("/collections/{}/sharing", collection_id))
        .json(&request)
        .send()
        .await;

    // Verify bad request response
    assert_status(&response, 400);
}