use anyhow::Result;
use chrono::Utc;
use database::{
    models::DashboardFile,
    pool::get_pg_pool,
    schema::dashboard_files,
    types::VersionHistory,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::dashboards::delete_dashboard_handler;
use serde_json::json;
use tokio;
use uuid::Uuid;

use crate::common::{
    db::TestDb,
    env::setup_test_env,
    fixtures,
};

#[tokio::test]
async fn test_delete_dashboard_handler() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test dashboard
    let test_dashboard = fixtures::dashboards::create_test_dashboard_file(&user_id, &org_id, Some("Test Dashboard For Deletion".to_string()));
    let dashboard_id = test_dashboard.id;
    
    // Insert test dashboard into database
    diesel::insert_into(dashboard_files::table)
        .values(&test_dashboard)
        .execute(&mut conn)
        .await?;
    
    // Call the handler being tested
    delete_dashboard_handler(dashboard_id, &user_id).await?;
    
    // Fetch the deleted dashboard from the database
    let db_dashboard = dashboard_files::table
        .filter(dashboard_files::id.eq(dashboard_id))
        .first::<DashboardFile>(&mut conn)
        .await?;
    
    // Verify it has been soft deleted (deleted_at is set)
    assert!(db_dashboard.deleted_at.is_some());
    
    // Trying to delete it again should return an error
    let result = delete_dashboard_handler(dashboard_id, &user_id).await;
    assert!(result.is_err());
    
    Ok(())
}

#[tokio::test]
async fn test_delete_dashboard_handler_not_found() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let _test_db = TestDb::new().await?;
    
    // Create test user
    let user_id = Uuid::new_v4();
    
    // Use a random UUID that doesn't exist
    let nonexistent_dashboard_id = Uuid::new_v4();
    
    // Call the handler being tested - should fail
    let result = delete_dashboard_handler(nonexistent_dashboard_id, &user_id).await;
    
    // Verify the error
    assert!(result.is_err());
    let error = result.unwrap_err().to_string();
    assert!(error.contains("not found"));
    
    Ok(())
}

#[tokio::test]
async fn test_delete_already_deleted_dashboard() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test dashboard with deleted_at already set
    let mut test_dashboard = fixtures::dashboards::create_test_dashboard_file(&user_id, &org_id, Some("Already Deleted Dashboard".to_string()));
    test_dashboard.deleted_at = Some(Utc::now());
    let dashboard_id = test_dashboard.id;
    
    // Insert test dashboard into database
    diesel::insert_into(dashboard_files::table)
        .values(&test_dashboard)
        .execute(&mut conn)
        .await?;
    
    // Call the handler being tested - should fail because it's already deleted
    let result = delete_dashboard_handler(dashboard_id, &user_id).await;
    
    // Verify the error
    assert!(result.is_err());
    let error = result.unwrap_err().to_string();
    assert!(error.contains("not found") || error.contains("already deleted"));
    
    Ok(())
}