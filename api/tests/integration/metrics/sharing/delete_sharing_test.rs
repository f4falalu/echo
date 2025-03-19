use chrono::Utc;
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{AssetPermission, MetricFile, User},
    pool::get_pg_pool,
    schema::{asset_permissions, metric_files, users},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use http::StatusCode;
use serde_json::json;
use uuid::Uuid;

use crate::common::{
    http::client::test_client,
    fixtures::builder::{TestFixtureBuilder, TestUser},
};

#[tokio::test]
async fn test_delete_metric_sharing_success() -> anyhow::Result<()> {
    // Create a test fixture with a metric and users
    let mut builder = TestFixtureBuilder::new();
    let user = builder.create_user().await?;
    let other_user = builder.create_user().await?;
    
    // Create a test metric
    let metric_id = Uuid::new_v4();
    let metric = create_test_metric(&user, metric_id).await?;
    
    // Create a sharing permission
    create_test_permission(metric_id, other_user.id, AssetPermissionRole::CanView).await?;
    
    // Create a test client with the owner's session
    let client = test_client(&user.email).await?;
    
    // Make the request to delete sharing permissions
    let response = client
        .delete(&format!("/metrics/{}/sharing", metric_id))
        .json(&json!({
            "emails": [other_user.email]
        }))
        .send()
        .await?;
    
    // Assert the response status
    assert_eq!(response.status(), StatusCode::OK);
    
    // Verify the permission is soft-deleted in the database
    let mut conn = get_pg_pool().get().await?;
    let deleted_permissions = asset_permissions::table
        .filter(asset_permissions::asset_id.eq(metric_id))
        .filter(asset_permissions::asset_type.eq(AssetType::MetricFile))
        .filter(asset_permissions::identity_id.eq(other_user.id))
        .filter(asset_permissions::deleted_at.is_not_null())
        .load::<AssetPermission>(&mut conn)
        .await?;
        
    assert_eq!(deleted_permissions.len(), 1);
    
    Ok(())
}

#[tokio::test]
async fn test_delete_metric_sharing_not_found() -> anyhow::Result<()> {
    // Create a test fixture with a user
    let mut builder = TestFixtureBuilder::new();
    let user = builder.create_user().await?;
    
    // Create a test client with the user's session
    let client = test_client(&user.email).await?;
    
    // Make the request with a random non-existent metric ID
    let response = client
        .delete(&format!("/metrics/{}/sharing", Uuid::new_v4()))
        .json(&json!({
            "emails": ["test@example.com"]
        }))
        .send()
        .await?;
    
    // Assert the response status
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    
    Ok(())
}

#[tokio::test]
async fn test_delete_metric_sharing_forbidden() -> anyhow::Result<()> {
    // Create a test fixture with users
    let mut builder = TestFixtureBuilder::new();
    let owner = builder.create_user().await?;
    let other_user = builder.create_user().await?; // User without permission to modify sharing
    let third_user = builder.create_user().await?; // User with view permission
    
    // Create a test metric
    let metric_id = Uuid::new_v4();
    let metric = create_test_metric(&owner, metric_id).await?;
    
    // Create a sharing permission for the third user
    create_test_permission(metric_id, third_user.id, AssetPermissionRole::CanView).await?;
    
    // Create a test client with the unauthorized user's session
    let client = test_client(&other_user.email).await?;
    
    // Make the request with the metric ID
    let response = client
        .delete(&format!("/metrics/{}/sharing", metric_id))
        .json(&json!({
            "emails": [third_user.email]
        }))
        .send()
        .await?;
    
    // Assert the response status
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
    
    Ok(())
}

#[tokio::test]
async fn test_delete_metric_sharing_non_existent_permission() -> anyhow::Result<()> {
    // Create a test fixture with users
    let mut builder = TestFixtureBuilder::new();
    let user = builder.create_user().await?;
    let other_user = builder.create_user().await?; // User who doesn't have a share
    
    // Create a test metric
    let metric_id = Uuid::new_v4();
    let metric = create_test_metric(&user, metric_id).await?;
    
    // Create a test client with the owner's session
    let client = test_client(&user.email).await?;
    
    // Make the request to delete a non-existent sharing permission
    let response = client
        .delete(&format!("/metrics/{}/sharing", metric_id))
        .json(&json!({
            "emails": [other_user.email]
        }))
        .send()
        .await?;
    
    // The API should still return 200 OK even if the permission doesn't exist
    assert_eq!(response.status(), StatusCode::OK);
    
    Ok(())
}

// Helper function to create a test metric
async fn create_test_metric(user: &TestUser, id: Uuid) -> anyhow::Result<MetricFile> {
    let mut conn = get_pg_pool().get().await?;
    
    let metric = MetricFile {
        id,
        organization_id: user.organization_id,
        created_by: user.id,
        file_name: "test_metric.yml".to_string(),
        file_content: Some(json!({
            "title": "Test Metric",
            "description": "Test Description",
            "time_frame": "last 30 days",
            "dataset_ids": [],
            "chart_config": {}
        }).to_string()),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };
    
    diesel::insert_into(metric_files::table)
        .values(&metric)
        .execute(&mut conn)
        .await?;
        
    Ok(metric)
}

// Helper function to create a test permission
async fn create_test_permission(asset_id: Uuid, user_id: Uuid, role: AssetPermissionRole) -> anyhow::Result<()> {
    let mut conn = get_pg_pool().get().await?;
    
    // Ensure the user_id exists
    let user = users::table
        .filter(users::id.eq(user_id))
        .first::<User>(&mut conn)
        .await?;
    
    // Create the permission
    let permission_id = Uuid::new_v4();
    diesel::insert_into(asset_permissions::table)
        .values((
            asset_permissions::id.eq(permission_id),
            asset_permissions::asset_id.eq(asset_id),
            asset_permissions::asset_type.eq(AssetType::MetricFile),
            asset_permissions::identity_id.eq(user_id),
            asset_permissions::identity_type.eq(IdentityType::User),
            asset_permissions::role.eq(role),
            asset_permissions::created_at.eq(Utc::now()),
            asset_permissions::updated_at.eq(Utc::now()),
            asset_permissions::created_by.eq(user_id),
            asset_permissions::updated_by.eq(user_id),
        ))
        .execute(&mut conn)
        .await?;
        
    Ok(())
}