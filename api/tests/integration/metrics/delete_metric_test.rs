use anyhow::Result;
use chrono::Utc;
use database::{
    models::MetricFile,
    pool::get_pg_pool,
    schema::metric_files,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::metrics::delete_metric_handler;
use tokio;
use uuid::Uuid;

use crate::common::{
    db::TestDb,
    env::setup_test_env,
    fixtures::create_test_metric_file,
};

#[tokio::test]
async fn test_delete_metric_handler() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test metric
    let test_metric = create_test_metric_file(&user_id, &org_id, Some("Test Metric For Deletion".to_string()));
    let metric_id = test_metric.id;
    
    // Insert test metric into database
    diesel::insert_into(metric_files::table)
        .values(&test_metric)
        .execute(&mut conn)
        .await?;
    
    // Call the handler being tested
    delete_metric_handler(&metric_id, &user_id).await?;
    
    // Fetch the deleted metric from the database
    let db_metric = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .first::<MetricFile>(&mut conn)
        .await?;
    
    // Verify it has been soft deleted (deleted_at is set)
    assert!(db_metric.deleted_at.is_some());
    
    // Trying to delete it again should return an error
    let result = delete_metric_handler(&metric_id, &user_id).await;
    assert!(result.is_err());
    
    Ok(())
}

#[tokio::test]
async fn test_delete_metric_handler_not_found() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let _test_db = TestDb::new().await?;
    
    // Create test user
    let user_id = Uuid::new_v4();
    
    // Use a random UUID that doesn't exist
    let nonexistent_metric_id = Uuid::new_v4();
    
    // Call the handler being tested - should fail
    let result = delete_metric_handler(&nonexistent_metric_id, &user_id).await;
    
    // Verify the error
    assert!(result.is_err());
    let error = result.unwrap_err().to_string();
    assert!(error.contains("not found"));
    
    Ok(())
}

#[tokio::test]
async fn test_delete_already_deleted_metric() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test metric with deleted_at already set
    let mut test_metric = create_test_metric_file(&user_id, &org_id, Some("Already Deleted Metric".to_string()));
    test_metric.deleted_at = Some(Utc::now());
    let metric_id = test_metric.id;
    
    // Insert test metric into database
    diesel::insert_into(metric_files::table)
        .values(&test_metric)
        .execute(&mut conn)
        .await?;
    
    // Call the handler being tested - should fail because it's already deleted
    let result = delete_metric_handler(&metric_id, &user_id).await;
    
    // Verify the error
    assert!(result.is_err());
    let error = result.unwrap_err().to_string();
    assert!(error.contains("not found") || error.contains("already deleted"));
    
    Ok(())
}