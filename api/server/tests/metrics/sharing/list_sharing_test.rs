use chrono::Utc;
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType, Verification},
    models::{MetricFile, User},
    pool::get_pg_pool,
    schema::{asset_permissions, metric_files, users},
    types::{MetricYml, VersionHistory},
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
async fn test_list_metric_sharing() -> anyhow::Result<()> {
    // Create a test fixture with a metric and users
    let mut builder = TestFixtureBuilder::new();
    let user = builder.create_user().await?;
    let other_user = builder.create_user().await?;
    
    // Create a test metric
    let metric_id = Uuid::new_v4();
    let metric = create_test_metric(&user, metric_id).await?;
    
    // Create a sharing permission
    create_test_permission(metric_id, other_user.id, AssetPermissionRole::CanView).await?;
    
    // Create a test client with the user's session
    let client = test_client(&user.email).await?;
    
    // Make the request to list sharing permissions
    let response = client
        .get(&format!("/metrics/{}/sharing", metric_id))
        .send()
        .await?;
    
    // Assert the response status
    assert_eq!(response.status(), StatusCode::OK);
    
    // Parse the response
    let response_json: serde_json::Value = response.json().await?;
    let permissions = response_json.get("data")
        .and_then(|d| d.get("permissions"))
        .and_then(|p| p.as_array())
        .unwrap_or(&vec![]);
    
    // Assert there's at least one permission entry
    assert!(!permissions.is_empty());
    
    // Assert the permission entry has the expected structure
    let permission = &permissions[0];
    assert!(permission.get("user_id").is_some());
    assert!(permission.get("email").is_some());
    assert!(permission.get("role").is_some());
    
    Ok(())
}

#[tokio::test]
async fn test_list_metric_sharing_not_found() -> anyhow::Result<()> {
    // Create a test fixture with a user
    let mut builder = TestFixtureBuilder::new();
    let user = builder.create_user().await?;
    
    // Create a test client with the user's session
    let client = test_client(&user.email).await?;
    
    // Make the request with a random non-existent metric ID
    let response = client
        .get(&format!("/metrics/{}/sharing", Uuid::new_v4()))
        .send()
        .await?;
    
    // Assert the response status
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    
    Ok(())
}

#[tokio::test]
async fn test_list_metric_sharing_forbidden() -> anyhow::Result<()> {
    // Create a test fixture with users
    let mut builder = TestFixtureBuilder::new();
    let owner = builder.create_user().await?;
    let other_user = builder.create_user().await?; // User without access
    
    // Create a test metric
    let metric_id = Uuid::new_v4();
    let metric = create_test_metric(&owner, metric_id).await?;
    
    // Create a test client with the unauthorized user's session
    let client = test_client(&other_user.email).await?;
    
    // Make the request with the metric ID
    let response = client
        .get(&format!("/metrics/{}/sharing", metric_id))
        .send()
        .await?;
    
    // Assert the response status
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
    
    Ok(())
}

// Helper function to create a test metric
async fn create_test_metric(user: &TestUser, id: Uuid) -> Result<MetricFile> {
    let mut conn = get_pg_pool().get().await?;
    
    let metric = MetricFile {
        id,
        name: "Test Metric".to_string(),
        file_name: "test_metric.yml".to_string(),
        content: MetricYml {
            title: "Test Metric".to_string(),
            description: Some("Test Description".to_string()),
            filter: None,
            time_frame: "last 30 days".to_string(),
            dataset_ids: vec![],
            chart_config: json!({}),
            data_metadata: None,
        },
        verification: Verification::Verified,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id: user.organization_id,
        created_by: user.id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: VersionHistory::default(),
    };
    
    diesel::insert_into(metric_files::table)
        .values(&metric)
        .execute(&mut conn)
        .await?;
        
    Ok(metric)
}

// Helper function to create a test permission
async fn create_test_permission(asset_id: Uuid, user_id: Uuid, role: AssetPermissionRole) -> Result<()> {
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