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
use handlers::dashboards::{
    delete_dashboards_handler, 
    delete_dashboard_handler, 
    DeleteDashboardsRequest
};
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

#[tokio::test]
async fn test_delete_dashboards_handler_multiple_dashboards() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create multiple test dashboards
    let dashboard1 = fixtures::dashboards::create_test_dashboard_file(&user_id, &org_id, Some("Test Dashboard 1".to_string()));
    let dashboard2 = fixtures::dashboards::create_test_dashboard_file(&user_id, &org_id, Some("Test Dashboard 2".to_string()));
    let dashboard3 = fixtures::dashboards::create_test_dashboard_file(&user_id, &org_id, Some("Test Dashboard 3".to_string()));
    
    let dashboard_ids = vec![dashboard1.id, dashboard2.id, dashboard3.id];
    
    // Insert test dashboards into database
    for dashboard in [&dashboard1, &dashboard2, &dashboard3] {
        diesel::insert_into(dashboard_files::table)
            .values(dashboard)
            .execute(&mut conn)
            .await?;
    }
    
    // Create the request to delete all dashboards
    let request = DeleteDashboardsRequest {
        ids: dashboard_ids.clone(),
    };
    
    // Call the handler being tested
    let response = delete_dashboards_handler(request, &user_id).await?;
    
    // Verify all dashboards were deleted successfully
    assert_eq!(response.deleted_count, 3);
    assert!(response.failed_ids.is_empty());
    assert!(response.success);
    
    // Verify each dashboard has been soft deleted in the database
    for dashboard_id in dashboard_ids {
        let db_dashboard = dashboard_files::table
            .filter(dashboard_files::id.eq(dashboard_id))
            .first::<DashboardFile>(&mut conn)
            .await?;
        
        assert!(db_dashboard.deleted_at.is_some());
    }
    
    Ok(())
}

#[tokio::test]
async fn test_delete_dashboards_handler_mixed_results() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create one valid dashboard
    let dashboard = fixtures::dashboards::create_test_dashboard_file(&user_id, &org_id, Some("Test Dashboard".to_string()));
    let valid_id = dashboard.id;
    
    // Generate a non-existent ID
    let nonexistent_id = Uuid::new_v4();
    
    // Insert the valid dashboard into database
    diesel::insert_into(dashboard_files::table)
        .values(&dashboard)
        .execute(&mut conn)
        .await?;
    
    // Create the request with one valid and one invalid ID
    let request = DeleteDashboardsRequest {
        ids: vec![valid_id, nonexistent_id],
    };
    
    // Call the handler being tested
    let response = delete_dashboards_handler(request, &user_id).await?;
    
    // Verify partial success
    assert_eq!(response.deleted_count, 1);
    assert_eq!(response.failed_ids.len(), 1);
    assert_eq!(response.failed_ids[0], nonexistent_id);
    assert!(response.success); // Should still be true as at least one dashboard was deleted
    
    // Verify the valid dashboard has been soft deleted
    let db_dashboard = dashboard_files::table
        .filter(dashboard_files::id.eq(valid_id))
        .first::<DashboardFile>(&mut conn)
        .await?;
    
    assert!(db_dashboard.deleted_at.is_some());
    
    Ok(())
}

#[tokio::test]
async fn test_delete_dashboards_handler_all_invalid() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let _test_db = TestDb::new().await?;
    
    // Create test user
    let user_id = Uuid::new_v4();
    
    // Generate non-existent IDs
    let nonexistent_id1 = Uuid::new_v4();
    let nonexistent_id2 = Uuid::new_v4();
    
    // Create the request with all invalid IDs
    let request = DeleteDashboardsRequest {
        ids: vec![nonexistent_id1, nonexistent_id2],
    };
    
    // Call the handler being tested
    let response = delete_dashboards_handler(request, &user_id).await?;
    
    // Verify complete failure
    assert_eq!(response.deleted_count, 0);
    assert_eq!(response.failed_ids.len(), 2);
    assert!(response.failed_ids.contains(&nonexistent_id1));
    assert!(response.failed_ids.contains(&nonexistent_id2));
    assert!(!response.success); // Should be false as no dashboards were deleted
    
    Ok(())
}

#[tokio::test]
async fn test_delete_dashboards_handler_empty_ids() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let _test_db = TestDb::new().await?;
    
    // Create test user
    let user_id = Uuid::new_v4();
    
    // Create the request with no IDs
    let request = DeleteDashboardsRequest {
        ids: vec![],
    };
    
    // Call the handler being tested
    let response = delete_dashboards_handler(request, &user_id).await?;
    
    // Verify empty result
    assert_eq!(response.deleted_count, 0);
    assert_eq!(response.failed_ids.len(), 0);
    assert!(!response.success); // Should be false as no dashboards were deleted
    
    Ok(())
}