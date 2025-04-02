use anyhow::Result;
use axum::{
    extract::Extension,
    routing::post,
    Router,
};
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use middleware::auth::AuthenticatedUser;
use serde_json::{json, Value};
use sharing::create_share;
use src::routes::rest::routes::chats::create_chat_sharing_rest_handler;
use tests::common::{
    assertions::response::ResponseAssertions,
    fixtures::builder::FixtureBuilder,
    http::client::TestClient,
};
use uuid::Uuid;

// Test for POST /chats/:id/sharing
// Creates a test server, adds test data, and makes a request to share a chat
#[tokio::test]
async fn test_create_chat_sharing_success() -> Result<()> {
    // Set up test fixtures
    let mut fixture = FixtureBuilder::new().await?;
    
    // Create a test user (this will be the owner of the chat)
    let user = fixture.create_user().await?;
    
    // Create a test chat owned by the user
    let chat = fixture.create_chat(&user.id).await?;
    
    // Create another user to share with
    let share_recipient = fixture.create_user().await?;
    
    // Create a manual permission so our test user has FullAccess to the chat
    create_share(
        chat.id,
        AssetType::Chat,
        user.id,
        IdentityType::User,
        AssetPermissionRole::Owner,
        user.id,
    )
    .await?;
    
    // Set up the test server with our endpoint
    let app = Router::new()
        .route("/chats/:id/sharing", post(create_chat_sharing_rest_handler))
        .layer(Extension(AuthenticatedUser {
            id: user.id,
            email: user.email.clone(),
            org_id: None,
        }));
    
    let client = TestClient::new(app);
    
    // Make the request
    let payload = json!([
        {
            "email": share_recipient.email,
            "role": "Viewer"
        }
    ]);
    
    let response = client
        .post(&format!("/chats/{}/sharing", chat.id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is successful
    response.assert_status_ok()?;
    
    Ok(())
}

#[tokio::test]
async fn test_create_chat_sharing_unauthorized() -> Result<()> {
    // Set up test fixtures
    let mut fixture = FixtureBuilder::new().await?;
    
    // Create two test users
    let owner = fixture.create_user().await?;
    let non_owner = fixture.create_user().await?;
    
    // Create a test chat owned by the first user
    let chat = fixture.create_chat(&owner.id).await?;
    
    // Create a manual permission so the owner has Owner access
    create_share(
        chat.id,
        AssetType::Chat,
        owner.id,
        IdentityType::User,
        AssetPermissionRole::Owner,
        owner.id,
    )
    .await?;
    
    // Set up the test server with our endpoint but authenticated as non-owner
    let app = Router::new()
        .route("/chats/:id/sharing", post(create_chat_sharing_rest_handler))
        .layer(Extension(AuthenticatedUser {
            id: non_owner.id, // This user doesn't have permission to share the chat
            email: non_owner.email.clone(),
            org_id: None,
        }));
    
    let client = TestClient::new(app);
    
    // Make the request
    let payload = json!([
        {
            "email": "test@example.com",
            "role": "Viewer"
        }
    ]);
    
    let response = client
        .post(&format!("/chats/{}/sharing", chat.id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is forbidden
    response.assert_status_forbidden()?;
    
    Ok(())
}

#[tokio::test]
async fn test_create_chat_sharing_not_found() -> Result<()> {
    // Set up test fixtures
    let mut fixture = FixtureBuilder::new().await?;
    
    // Create a test user
    let user = fixture.create_user().await?;
    
    // Generate a non-existent chat ID
    let non_existent_chat_id = Uuid::new_v4();
    
    // Set up the test server with our endpoint
    let app = Router::new()
        .route("/chats/:id/sharing", post(create_chat_sharing_rest_handler))
        .layer(Extension(AuthenticatedUser {
            id: user.id,
            email: user.email.clone(),
            org_id: None,
        }));
    
    let client = TestClient::new(app);
    
    // Make the request
    let payload = json!([
        {
            "email": "test@example.com",
            "role": "Viewer"
        }
    ]);
    
    let response = client
        .post(&format!("/chats/{}/sharing", non_existent_chat_id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is not found
    response.assert_status_not_found()?;
    
    Ok(())
}

#[tokio::test]
async fn test_create_chat_sharing_invalid_email() -> Result<()> {
    // Set up test fixtures
    let mut fixture = FixtureBuilder::new().await?;
    
    // Create a test user
    let user = fixture.create_user().await?;
    
    // Create a test chat owned by the user
    let chat = fixture.create_chat(&user.id).await?;
    
    // Create a manual permission so our test user has FullAccess to the chat
    create_share(
        chat.id,
        AssetType::Chat,
        user.id,
        IdentityType::User,
        AssetPermissionRole::Owner,
        user.id,
    )
    .await?;
    
    // Set up the test server with our endpoint
    let app = Router::new()
        .route("/chats/:id/sharing", post(create_chat_sharing_rest_handler))
        .layer(Extension(AuthenticatedUser {
            id: user.id,
            email: user.email.clone(),
            org_id: None,
        }));
    
    let client = TestClient::new(app);
    
    // Make the request with an invalid email format
    let payload = json!([
        {
            "email": "invalid-email", // Missing @ symbol
            "role": "Viewer"
        }
    ]);
    
    let response = client
        .post(&format!("/chats/{}/sharing", chat.id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is bad request
    response.assert_status_bad_request()?;
    
    Ok(())
}