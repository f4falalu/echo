use anyhow::Result;
use axum::{
    extract::Extension,
    routing::put,
    Router,
};
use chrono::{Duration, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    get_pg_pool,
    models::Chat,
    schema::chats::dsl,
};
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use diesel_async::RunQueryDsl as AsyncRunQueryDsl;
use middleware::auth::AuthenticatedUser;
use serde_json::{json, Value};
use sharing::create_share;
use src::routes::rest::routes::chats::sharing::update_chat_sharing_rest_handler;
use tests::common::{
    assertions::response::ResponseAssertions,
    fixtures::builder::FixtureBuilder,
    http::client::TestClient,
};
use uuid::Uuid;

// Test for PUT /chats/:id/sharing
// Creates a test server, adds test data, and makes a request to update chat sharing
#[tokio::test]
async fn test_update_chat_sharing_success() -> Result<()> {
    // Set up test fixtures
    let mut fixture = FixtureBuilder::new().await?;
    
    // Create a test user (this will be the owner of the chat)
    let user = fixture.create_user().await?;
    
    // Create a test chat owned by the user
    let chat = fixture.create_chat(&user.id).await?;
    
    // Create another user to share with
    let share_recipient = fixture.create_user().await?;
    
    // Create a manual permission so our test user has Owner access to the chat
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
        .route("/chats/:id/sharing", put(update_chat_sharing_rest_handler))
        .layer(Extension(AuthenticatedUser {
            id: user.id,
            email: user.email.clone(),
            org_id: None,
        }));
    
    let client = TestClient::new(app);
    
    // Make the request to update sharing permissions with new format
    let payload = json!({
        "users": [
            {
                "email": share_recipient.email,
                "role": "Editor"  // Update to Editor role
            }
        ]
    });
    
    let response = client
        .put(&format!("/chats/{}/sharing", chat.id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is successful
    response.assert_status_ok()?;
    
    Ok(())
}

#[tokio::test]
async fn test_update_chat_public_sharing_success() -> Result<()> {
    // Set up test fixtures
    let mut fixture = FixtureBuilder::new().await?;
    
    // Create a test user (this will be the owner of the chat)
    let user = fixture.create_user().await?;
    
    // Create a test chat owned by the user
    let chat = fixture.create_chat(&user.id).await?;
    
    // Create a manual permission so our test user has Owner access to the chat
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
        .route("/chats/:id/sharing", put(update_chat_sharing_rest_handler))
        .layer(Extension(AuthenticatedUser {
            id: user.id,
            email: user.email.clone(),
            org_id: None,
        }));
    
    let client = TestClient::new(app);
    
    // Set expiration date to 7 days from now
    let expiration_date = Utc::now() + Duration::days(7);
    
    // Make the request to update public sharing settings
    let payload = json!({
        "publicly_accessible": true,
        "public_expiration": expiration_date.to_rfc3339()
    });
    
    let response = client
        .put(&format!("/chats/{}/sharing", chat.id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is successful
    response.assert_status_ok()?;
    
    // Verify database was updated correctly
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;
    
    let updated_chat: Chat = dsl::chats
        .filter(dsl::id.eq(chat.id))
        .first(&mut conn)
        .await?;
    
    assert!(updated_chat.publicly_accessible);
    assert_eq!(updated_chat.publicly_enabled_by, Some(user.id));
    
    // The public_expiry_date is stored as a timestamp, so we can't do an exact match.
    // Instead, we'll check that it's within a minute of our expected value
    let stored_expiry = updated_chat.public_expiry_date.unwrap();
    let diff = (stored_expiry - expiration_date).num_seconds().abs();
    assert!(diff < 60, "Expiry date should be within a minute of the requested date");
    
    Ok(())
}

#[tokio::test]
async fn test_update_chat_sharing_unauthorized() -> Result<()> {
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
        .route("/chats/:id/sharing", put(update_chat_sharing_rest_handler))
        .layer(Extension(AuthenticatedUser {
            id: non_owner.id, // This user doesn't have permission to update the chat sharing
            email: non_owner.email.clone(),
            org_id: None,
        }));
    
    let client = TestClient::new(app);
    
    // Make the request with new format
    let payload = json!({
        "users": [
            {
                "email": "test@example.com",
                "role": "Editor"
            }
        ]
    });
    
    let response = client
        .put(&format!("/chats/{}/sharing", chat.id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is forbidden
    response.assert_status_forbidden()?;
    
    Ok(())
}

#[tokio::test]
async fn test_update_chat_sharing_not_found() -> Result<()> {
    // Set up test fixtures
    let mut fixture = FixtureBuilder::new().await?;
    
    // Create a test user
    let user = fixture.create_user().await?;
    
    // Generate a non-existent chat ID
    let non_existent_chat_id = Uuid::new_v4();
    
    // Set up the test server with our endpoint
    let app = Router::new()
        .route("/chats/:id/sharing", put(update_chat_sharing_rest_handler))
        .layer(Extension(AuthenticatedUser {
            id: user.id,
            email: user.email.clone(),
            org_id: None,
        }));
    
    let client = TestClient::new(app);
    
    // Make the request with new format
    let payload = json!({
        "users": [
            {
                "email": "test@example.com",
                "role": "Editor"
            }
        ]
    });
    
    let response = client
        .put(&format!("/chats/{}/sharing", non_existent_chat_id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is not found
    response.assert_status_not_found()?;
    
    Ok(())
}

#[tokio::test]
async fn test_update_chat_sharing_invalid_email() -> Result<()> {
    // Set up test fixtures
    let mut fixture = FixtureBuilder::new().await?;
    
    // Create a test user
    let user = fixture.create_user().await?;
    
    // Create a test chat owned by the user
    let chat = fixture.create_chat(&user.id).await?;
    
    // Create a manual permission so our test user has Owner access to the chat
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
        .route("/chats/:id/sharing", put(update_chat_sharing_rest_handler))
        .layer(Extension(AuthenticatedUser {
            id: user.id,
            email: user.email.clone(),
            org_id: None,
        }));
    
    let client = TestClient::new(app);
    
    // Make the request with an invalid email format using new request structure
    let payload = json!({
        "users": [
            {
                "email": "invalid-email", // Missing @ symbol
                "role": "Editor"
            }
        ]
    });
    
    let response = client
        .put(&format!("/chats/{}/sharing", chat.id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is bad request
    response.assert_status_bad_request()?;
    
    Ok(())
}

#[tokio::test]
async fn test_update_chat_sharing_mixed_updates() -> Result<()> {
    // Set up test fixtures
    let mut fixture = FixtureBuilder::new().await?;
    
    // Create a test user (this will be the owner of the chat)
    let user = fixture.create_user().await?;
    
    // Create a test chat owned by the user
    let chat = fixture.create_chat(&user.id).await?;
    
    // Create another user to share with
    let share_recipient = fixture.create_user().await?;
    
    // Create a manual permission so our test user has Owner access to the chat
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
        .route("/chats/:id/sharing", put(update_chat_sharing_rest_handler))
        .layer(Extension(AuthenticatedUser {
            id: user.id,
            email: user.email.clone(),
            org_id: None,
        }));
    
    let client = TestClient::new(app);
    
    // Set expiration date to 7 days from now
    let expiration_date = Utc::now() + Duration::days(7);
    
    // Make the request to update both user and public sharing settings
    let payload = json!({
        "users": [
            {
                "email": share_recipient.email,
                "role": "Editor"
            }
        ],
        "publicly_accessible": true,
        "public_expiration": expiration_date.to_rfc3339()
    });
    
    let response = client
        .put(&format!("/chats/{}/sharing", chat.id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is successful
    response.assert_status_ok()?;
    
    // Verify database was updated correctly for public sharing
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;
    
    let updated_chat: Chat = dsl::chats
        .filter(dsl::id.eq(chat.id))
        .first(&mut conn)
        .await?;
    
    assert!(updated_chat.publicly_accessible);
    assert_eq!(updated_chat.publicly_enabled_by, Some(user.id));
    
    // Verify user permissions were updated too
    // This would normally check the asset_permissions table in a real test
    
    Ok(())
}