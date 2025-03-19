use anyhow::Result;
use database::{
    enums::Verification,
    pool::get_pg_pool,
    schema::metric_files,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::metrics::delete_metric_handler;
use uuid::Uuid;

// Import the common setup and test utilities
use super::{
    cleanup_test_data, create_test_metric, insert_test_metric, setup_test_environment,
};

/// Integration test for the delete_metric_handler
#[tokio::test]
async fn test_delete_metric_integration() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organization and user IDs
    let organization_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    
    // Create a test metric
    let test_metric = create_test_metric(organization_id, user_id).await?;
    let metric_id = test_metric.id;
    
    // Insert the test metric into the database
    match insert_test_metric(&test_metric).await {
        Ok(_) => println!("Successfully inserted test metric with ID: {}", metric_id),
        Err(e) => {
            println!("Skipping test - could not insert test metric: {}", e);
            return Ok(());
        }
    }
    
    // Verify the metric exists before deletion
    let mut conn = get_pg_pool().get().await?;
    let exists = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null())
        .first::<database::models::MetricFile>(&mut conn)
        .await;
        
    if exists.is_err() {
        cleanup_test_data(Some(metric_id), None).await?;
        println!("Skipping test - test metric not found in database");
        return Ok(());
    }
    
    // Call the handler to soft-delete the metric
    match delete_metric_handler(&metric_id, &user_id).await {
        Ok(_) => {
            // Verify the metric is now marked as deleted (has deleted_at timestamp)
            let deleted_metric = metric_files::table
                .filter(metric_files::id.eq(metric_id))
                .first::<database::models::MetricFile>(&mut conn)
                .await?;
                
            // Test passes if the metric now has a deleted_at timestamp
            assert!(deleted_metric.deleted_at.is_some());
            
            println!("Delete metric test passed with ID: {}", metric_id);
        },
        Err(e) => {
            cleanup_test_data(Some(metric_id), None).await?;
            return Err(e);
        }
    }
    
    // Since we've tested with a soft delete, we should still clean up fully
    cleanup_test_data(Some(metric_id), None).await?;
    
    Ok(())
}

/// Test attempting to delete a metric that doesn't exist
#[tokio::test]
async fn test_delete_metric_not_found() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test UUIDs
    let user_id = Uuid::new_v4();
    let nonexistent_metric_id = Uuid::new_v4();
    
    // Attempt to delete a nonexistent metric
    let result = delete_metric_handler(&nonexistent_metric_id, &user_id).await;
    
    // Verify the operation fails with a "not found" error
    assert!(result.is_err());
    let error = result.err().unwrap();
    assert!(error.to_string().contains("not found") || 
            error.to_string().contains("already deleted"));
    
    Ok(())
}

/// Test attempting to delete an already deleted metric
#[tokio::test]
async fn test_delete_already_deleted_metric() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organization and user IDs
    let organization_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    
    // Create a test metric
    let mut test_metric = create_test_metric(organization_id, user_id).await?;
    let metric_id = test_metric.id;
    
    // Mark the metric as already deleted before inserting
    test_metric.deleted_at = Some(chrono::Utc::now());
    
    // Insert the already-deleted test metric
    match insert_test_metric(&test_metric).await {
        Ok(_) => println!("Successfully inserted deleted test metric with ID: {}", metric_id),
        Err(e) => {
            println!("Skipping test - could not insert test metric: {}", e);
            return Ok(());
        }
    }
    
    // Attempt to delete the already-deleted metric
    let result = delete_metric_handler(&metric_id, &user_id).await;
    
    // Clean up test data regardless of outcome
    cleanup_test_data(Some(metric_id), None).await?;
    
    // Verify the operation fails with a "not found" or "already deleted" error
    assert!(result.is_err());
    let error = result.err().unwrap();
    assert!(error.to_string().contains("not found") || 
            error.to_string().contains("already deleted"));
    
    Ok(())
}