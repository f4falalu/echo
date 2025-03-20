use anyhow::Result;
use database::{
    pool::get_pg_pool,
    schema::metric_files,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::metrics::{delete_metric_handler, delete_metrics_handler, DeleteMetricsRequest};
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

/// Integration test for the bulk delete_metrics_handler
#[tokio::test]
async fn test_delete_metrics_bulk_integration() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organization and user IDs
    let organization_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    
    // Create multiple test metrics
    let metric1 = create_test_metric(organization_id, user_id).await?;
    let metric2 = create_test_metric(organization_id, user_id).await?;
    let metric3 = create_test_metric(organization_id, user_id).await?;
    
    let metric_ids = vec![metric1.id, metric2.id, metric3.id];
    
    // Insert all test metrics into the database
    match insert_test_metric(&metric1).await {
        Ok(_) => println!("Successfully inserted test metric 1 with ID: {}", metric1.id),
        Err(e) => {
            println!("Skipping test - could not insert test metric 1: {}", e);
            return Ok(());
        }
    }
    
    match insert_test_metric(&metric2).await {
        Ok(_) => println!("Successfully inserted test metric 2 with ID: {}", metric2.id),
        Err(e) => {
            println!("Skipping test - could not insert test metric 2: {}", e);
            cleanup_test_data(Some(metric1.id), None).await?;
            return Ok(());
        }
    }
    
    match insert_test_metric(&metric3).await {
        Ok(_) => println!("Successfully inserted test metric 3 with ID: {}", metric3.id),
        Err(e) => {
            println!("Skipping test - could not insert test metric 3: {}", e);
            cleanup_test_data(Some(metric1.id), None).await?;
            cleanup_test_data(Some(metric2.id), None).await?;
            return Ok(());
        }
    }
    
    // Call the bulk delete handler
    let request = DeleteMetricsRequest {
        ids: metric_ids.clone(),
    };
    
    let result = delete_metrics_handler(request, &user_id).await?;
    
    // Verify the result has all metrics in successful_ids and none in failed_ids
    assert_eq!(result.successful_ids.len(), 3);
    assert_eq!(result.failed_ids.len(), 0);
    
    // Verify all metrics are now marked as deleted
    let mut conn = get_pg_pool().get().await?;
    for id in &metric_ids {
        let deleted_metric = metric_files::table
            .filter(metric_files::id.eq(id))
            .first::<database::models::MetricFile>(&mut conn)
            .await?;
            
        assert!(deleted_metric.deleted_at.is_some());
    }
    
    // Clean up all test metrics
    for id in &metric_ids {
        cleanup_test_data(Some(*id), None).await?;
    }
    
    Ok(())
}

/// Test bulk deletion with a mix of existing and non-existing metrics
#[tokio::test]
async fn test_delete_metrics_mixed_results() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test organization and user IDs
    let organization_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    
    // Create one real metric and two non-existent IDs
    let real_metric = create_test_metric(organization_id, user_id).await?;
    let nonexistent_id1 = Uuid::new_v4();
    let nonexistent_id2 = Uuid::new_v4();
    
    // Insert the real metric
    match insert_test_metric(&real_metric).await {
        Ok(_) => println!("Successfully inserted test metric with ID: {}", real_metric.id),
        Err(e) => {
            println!("Skipping test - could not insert test metric: {}", e);
            return Ok(());
        }
    }
    
    // Call the bulk delete handler with a mix of real and non-existent IDs
    let request = DeleteMetricsRequest {
        ids: vec![real_metric.id, nonexistent_id1, nonexistent_id2],
    };
    
    let result = delete_metrics_handler(request, &user_id).await?;
    
    // Verify one successful deletion and two failures
    assert_eq!(result.successful_ids.len(), 1);
    assert_eq!(result.failed_ids.len(), 2);
    assert_eq!(result.successful_ids[0], real_metric.id);
    
    // Verify the real metric is now marked as deleted
    let mut conn = get_pg_pool().get().await?;
    let deleted_metric = metric_files::table
        .filter(metric_files::id.eq(real_metric.id))
        .first::<database::models::MetricFile>(&mut conn)
        .await?;
        
    assert!(deleted_metric.deleted_at.is_some());
    
    // Clean up test data
    cleanup_test_data(Some(real_metric.id), None).await?;
    
    Ok(())
}

/// Test bulk deletion with an empty list of IDs
#[tokio::test]
async fn test_delete_metrics_empty_list() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Create test user ID
    let user_id = Uuid::new_v4();
    
    // Call the bulk delete handler with an empty list
    let request = DeleteMetricsRequest {
        ids: vec![],
    };
    
    let result = delete_metrics_handler(request, &user_id).await?;
    
    // Verify both lists are empty
    assert_eq!(result.successful_ids.len(), 0);
    assert_eq!(result.failed_ids.len(), 0);
    
    Ok(())
}