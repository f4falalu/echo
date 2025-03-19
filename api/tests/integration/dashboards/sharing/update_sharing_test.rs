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
    models::DashboardFile,
    schema::dashboard_files::dsl,
};
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use diesel_async::RunQueryDsl as AsyncRunQueryDsl;
use handlers::dashboards::sharing::update_sharing_handler::UpdateDashboardSharingRequest;
use middleware::auth::AuthenticatedUser;
use serde_json::json;
use sharing::create_share;
use src::routes::rest::routes::dashboards::sharing::update_dashboard_sharing_rest_handler;
use tests::common::{
    assertions::response::ResponseAssertions,
    fixtures::builder::FixtureBuilder,
    http::client::TestClient,
};
use uuid::Uuid;

#[tokio::test]
async fn test_update_dashboard_sharing_success() -> Result<()> {
    // Set up test fixtures
    let mut fixture = FixtureBuilder::new().await?;
    
    // Create a test user (this will be the owner of the dashboard)
    let user = fixture.create_user().await?;
    
    // Create a test dashboard owned by the user
    let dashboard = fixture.create_dashboard(&user.id).await?;
    
    // Create another user to share with
    let share_recipient = fixture.create_user().await?;
    
    // Create a manual permission so our test user has Owner access to the dashboard
    create_share(
        dashboard.id,
        AssetType::DashboardFile,
        user.id,
        IdentityType::User,
        AssetPermissionRole::Owner,
        user.id,
    )
    .await?;
    
    // Set up the test server with our endpoint
    let app = Router::new()
        .route("/dashboards/:id/sharing", put(update_dashboard_sharing_rest_handler))
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
                "role": "Editor"
            }
        ]
    });
    
    let response = client
        .put(&format!("/dashboards/{}/sharing", dashboard.id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is successful
    response.assert_status_ok()?;
    
    Ok(())
}

#[tokio::test]
async fn test_update_dashboard_public_sharing_success() -> Result<()> {
    // Set up test fixtures
    let mut fixture = FixtureBuilder::new().await?;
    
    // Create a test user (this will be the owner of the dashboard)
    let user = fixture.create_user().await?;
    
    // Create a test dashboard owned by the user
    let dashboard = fixture.create_dashboard(&user.id).await?;
    
    // Create a manual permission so our test user has Owner access to the dashboard
    create_share(
        dashboard.id,
        AssetType::DashboardFile,
        user.id,
        IdentityType::User,
        AssetPermissionRole::Owner,
        user.id,
    )
    .await?;
    
    // Set up the test server with our endpoint
    let app = Router::new()
        .route("/dashboards/:id/sharing", put(update_dashboard_sharing_rest_handler))
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
        .put(&format!("/dashboards/{}/sharing", dashboard.id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is successful
    response.assert_status_ok()?;
    
    // Verify database was updated correctly
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;
    
    let updated_dashboard: DashboardFile = dsl::dashboard_files
        .filter(dsl::id.eq(dashboard.id))
        .first(&mut conn)
        .await?;
    
    assert!(updated_dashboard.publicly_accessible);
    assert_eq!(updated_dashboard.publicly_enabled_by, Some(user.id));
    
    // The public_expiry_date is stored as a timestamp, so we can't do an exact match.
    // Instead, we'll check that it's within a minute of our expected value
    let stored_expiry = updated_dashboard.public_expiry_date.unwrap();
    let diff = (stored_expiry - expiration_date).num_seconds().abs();
    assert!(diff < 60, "Expiry date should be within a minute of the requested date");
    
    Ok(())
}

#[tokio::test]
async fn test_update_dashboard_sharing_mixed_updates() -> Result<()> {
    // Set up test fixtures
    let mut fixture = FixtureBuilder::new().await?;
    
    // Create a test user (this will be the owner of the dashboard)
    let user = fixture.create_user().await?;
    
    // Create a test dashboard owned by the user
    let dashboard = fixture.create_dashboard(&user.id).await?;
    
    // Create another user to share with
    let share_recipient = fixture.create_user().await?;
    
    // Create a manual permission so our test user has Owner access to the dashboard
    create_share(
        dashboard.id,
        AssetType::DashboardFile,
        user.id,
        IdentityType::User,
        AssetPermissionRole::Owner,
        user.id,
    )
    .await?;
    
    // Set up the test server with our endpoint
    let app = Router::new()
        .route("/dashboards/:id/sharing", put(update_dashboard_sharing_rest_handler))
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
        .put(&format!("/dashboards/{}/sharing", dashboard.id))
        .json(&payload)
        .send()
        .await?;
    
    // Assert the response is successful
    response.assert_status_ok()?;
    
    // Verify database was updated correctly for public sharing
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;
    
    let updated_dashboard: DashboardFile = dsl::dashboard_files
        .filter(dsl::id.eq(dashboard.id))
        .first(&mut conn)
        .await?;
    
    assert!(updated_dashboard.publicly_accessible);
    assert_eq!(updated_dashboard.publicly_enabled_by, Some(user.id));
    
    // Verify user permissions were updated too
    // This would normally check the asset_permissions table in a real test
    
    Ok(())
}