use anyhow::Result;
use database::{
    enums::Verification,
    models::MetricFile,
    pool::get_pg_pool,
    schema::metric_files,
    types::{MetricYml, VersionHistory},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::metrics::{update_metric_handler, UpdateMetricRequest};
use serde_json::Value;
use tokio;
use uuid::Uuid;

use crate::common::{
    db::TestDb,
    env::setup_test_env,
    fixtures::{create_test_metric_file, create_test_user, create_update_metric_request, create_restore_metric_request},
};

#[tokio::test]
async fn test_update_metric_handler() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test metric
    let test_metric = create_test_metric_file(&user_id, &org_id, Some("Test Metric".to_string()));
    let metric_id = test_metric.id;
    
    // Insert test metric into database
    diesel::insert_into(metric_files::table)
        .values(&test_metric)
        .execute(&mut conn)
        .await?;
    
    // Create update request
    let update_json = create_update_metric_request();
    let update_request: UpdateMetricRequest = serde_json::from_value(update_json)?;
    
    // Call the handler being tested
    let updated_metric = update_metric_handler(&metric_id, &user_id, update_request).await?;
    
    // Fetch the updated metric from the database
    let db_metric = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .first::<MetricFile>(&mut conn)
        .await?;
    
    // Verify the results
    assert_eq!(updated_metric.id, metric_id);
    assert_eq!(updated_metric.name, "Updated Test Metric");
    assert_eq!(db_metric.name, "Updated Test Metric");
    assert_eq!(db_metric.verification, Verification::Verified);
    
    // Verify content updates (time_frame and description)
    let content: Value = db_metric.content;
    assert_eq!(content["time_frame"].as_str().unwrap(), "weekly");
    assert_eq!(content["description"].as_str().unwrap(), "Updated test description");
    
    // Verify version history has been updated
    assert!(db_metric.version_history.versions.len() > 1);
    
    Ok(())
}

#[tokio::test]
async fn test_restore_metric_version() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test metric with initial version
    let test_metric = create_test_metric_file(&user_id, &org_id, Some("Original Metric".to_string()));
    let metric_id = test_metric.id;
    
    // Insert test metric into database
    diesel::insert_into(metric_files::table)
        .values(&test_metric)
        .execute(&mut conn)
        .await?;
    
    // Update the metric to create version 2
    let update_json = create_update_metric_request();
    let update_request: UpdateMetricRequest = serde_json::from_value(update_json)?;
    update_metric_handler(&metric_id, &user_id, update_request).await?;
    
    // Fetch the metric to verify we have 2 versions
    let db_metric = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .first::<MetricFile>(&mut conn)
        .await?;
    
    assert_eq!(db_metric.version_history.versions.len(), 2);
    assert_eq!(db_metric.name, "Updated Test Metric");
    
    // Create restore request to restore to version 1
    let restore_json = create_restore_metric_request(1);
    let restore_request: UpdateMetricRequest = serde_json::from_value(restore_json)?;
    
    // Restore to version 1
    let restored_metric = update_metric_handler(&metric_id, &user_id, restore_request).await?;
    
    // Fetch the restored metric from the database
    let db_metric_after_restore = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .first::<MetricFile>(&mut conn)
        .await?;
    
    // Verify we now have 3 versions
    assert_eq!(db_metric_after_restore.version_history.versions.len(), 3);
    
    // Verify the restored content matches the original version
    let content: Value = db_metric_after_restore.content;
    assert_eq!(content["name"].as_str().unwrap(), "Original Metric");
    assert_eq!(content["time_frame"].as_str().unwrap(), "daily");
    
    // Verify the restored metric in response matches as well
    assert_eq!(restored_metric.name, "Original Metric");
    assert_eq!(restored_metric.versions.len(), 3);
    
    Ok(())
}

#[tokio::test]
async fn test_restore_metric_nonexistent_version() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test metric
    let test_metric = create_test_metric_file(&user_id, &org_id, Some("Test Metric".to_string()));
    let metric_id = test_metric.id;
    
    // Insert test metric into database
    diesel::insert_into(metric_files::table)
        .values(&test_metric)
        .execute(&mut conn)
        .await?;
    
    // Create restore request with a non-existent version number
    let restore_json = create_restore_metric_request(999);
    let restore_request: UpdateMetricRequest = serde_json::from_value(restore_json)?;
    
    // Attempt to restore to non-existent version
    let result = update_metric_handler(&metric_id, &user_id, restore_request).await;
    
    // Verify the error
    assert!(result.is_err());
    let error = result.unwrap_err().to_string();
    assert!(error.contains("Version 999 not found"));
    
    Ok(())
}

#[tokio::test]
async fn test_update_metric_handler_not_found() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let _test_db = TestDb::new().await?;
    
    // Create test user
    let user_id = Uuid::new_v4();
    
    // Use a random UUID that doesn't exist
    let nonexistent_metric_id = Uuid::new_v4();
    
    // Create update request
    let update_json = create_update_metric_request();
    let update_request: UpdateMetricRequest = serde_json::from_value(update_json)?;
    
    // Call the handler being tested - should fail
    let result = update_metric_handler(&nonexistent_metric_id, &user_id, update_request).await;
    
    // Verify the error
    assert!(result.is_err());
    let error = result.unwrap_err().to_string();
    assert!(error.contains("not found") || error.contains("NotFound"));
    
    Ok(())
}