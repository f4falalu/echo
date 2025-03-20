use anyhow::Result;
use chrono::Utc;
use database::{
    models::MetricFile,
    pool::get_pg_pool,
    schema::metric_files,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::metrics::{delete_metric_handler, delete_metrics_handler, DeleteMetricsRequest};
use std::collections::HashSet;
use tokio;
use uuid::Uuid;

use crate::common::{
    db::TestDb,
    env::setup_test_env,
    fixtures::metrics::create_test_metric_file,
    http::{client::TestClient, test_app::create_test_app}, 
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
    let test_metric = create_test_metric_file(&mut conn, user_id, Some(org_id), Some("Test Metric For Deletion".to_string())).await?;
    let metric_id = test_metric.id;
    
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
    
    // Create test metric
    let mut test_metric = create_test_metric_file(&mut conn, user_id, Some(org_id), Some("Already Deleted Metric".to_string())).await?;
    
    // Mark as deleted
    test_metric.deleted_at = Some(Utc::now());
    
    // Update the metric in the database
    diesel::update(metric_files::table)
        .filter(metric_files::id.eq(test_metric.id))
        .set(metric_files::deleted_at.eq(test_metric.deleted_at))
        .execute(&mut conn)
        .await?;
    
    // Call the handler being tested - should fail because it's already deleted
    let result = delete_metric_handler(&test_metric.id, &user_id).await;
    
    // Verify the error
    assert!(result.is_err());
    let error = result.unwrap_err().to_string();
    assert!(error.contains("not found") || error.contains("already deleted"));
    
    Ok(())
}

#[tokio::test]
async fn test_delete_metrics_bulk_handler() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create and insert multiple test metrics
    let test_metric1 = create_test_metric_file(&mut conn, user_id, Some(org_id), Some("Test Metric 1".to_string())).await?;
    let test_metric2 = create_test_metric_file(&mut conn, user_id, Some(org_id), Some("Test Metric 2".to_string())).await?;
    let test_metric3 = create_test_metric_file(&mut conn, user_id, Some(org_id), Some("Test Metric 3".to_string())).await?;
    
    let metric_ids = vec![test_metric1.id, test_metric2.id, test_metric3.id];
    
    // Create the bulk delete request
    let request = DeleteMetricsRequest {
        ids: metric_ids.clone(),
    };
    
    // Call the bulk delete handler
    let result = delete_metrics_handler(request, &user_id).await?;
    
    // Verify all metrics were successfully deleted
    assert_eq!(result.successful_ids.len(), 3);
    assert_eq!(result.failed_ids.len(), 0);
    
    // Convert to a set for easier lookup
    let successful_ids: HashSet<_> = result.successful_ids.into_iter().collect();
    
    // Verify all expected IDs are in the successful list
    assert!(successful_ids.contains(&test_metric1.id));
    assert!(successful_ids.contains(&test_metric2.id));
    assert!(successful_ids.contains(&test_metric3.id));
    
    // Verify each metric has been soft deleted in the database
    for id in &metric_ids {
        let db_metric = metric_files::table
            .filter(metric_files::id.eq(id))
            .first::<MetricFile>(&mut conn)
            .await?;
        
        assert!(db_metric.deleted_at.is_some());
    }
    
    Ok(())
}

#[tokio::test]
async fn test_delete_metrics_bulk_partial_success() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create and insert a test metric
    let test_metric = create_test_metric_file(&mut conn, user_id, Some(org_id), Some("Test Metric".to_string())).await?;
    
    // Generate two non-existent metric IDs
    let nonexistent_id1 = Uuid::new_v4();
    let nonexistent_id2 = Uuid::new_v4();
    
    // Create the bulk delete request with mix of real and non-existent IDs
    let request = DeleteMetricsRequest {
        ids: vec![test_metric.id, nonexistent_id1, nonexistent_id2],
    };
    
    // Call the bulk delete handler
    let result = delete_metrics_handler(request, &user_id).await?;
    
    // Verify partial success (1 success, 2 failures)
    assert_eq!(result.successful_ids.len(), 1);
    assert_eq!(result.failed_ids.len(), 2);
    
    // Verify the successful ID matches our real metric
    assert_eq!(result.successful_ids[0], test_metric.id);
    
    // Create a set of failed IDs for easier lookup
    let failed_ids: HashSet<_> = result.failed_ids.iter().map(|f| f.id).collect();
    
    // Verify the failed IDs match our non-existent IDs
    assert!(failed_ids.contains(&nonexistent_id1));
    assert!(failed_ids.contains(&nonexistent_id2));
    
    // Verify the real metric has been soft deleted in the database
    let db_metric = metric_files::table
        .filter(metric_files::id.eq(test_metric.id))
        .first::<MetricFile>(&mut conn)
        .await?;
    
    assert!(db_metric.deleted_at.is_some());
    
    Ok(())
}

#[tokio::test]
async fn test_delete_metrics_bulk_empty_list() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    
    // Create test user ID
    let user_id = Uuid::new_v4();
    
    // Create a bulk delete request with empty IDs list
    let request = DeleteMetricsRequest {
        ids: vec![],
    };
    
    // Call the bulk delete handler
    let result = delete_metrics_handler(request, &user_id).await?;
    
    // Verify empty results
    assert_eq!(result.successful_ids.len(), 0);
    assert_eq!(result.failed_ids.len(), 0);
    
    Ok(())
}

#[tokio::test]
async fn test_delete_metrics_rest_bulk_endpoint() -> Result<()> {
    // Create test app
    let app = create_test_app().await?;
    let client = TestClient::new()?
        .with_auth("test-token"); // Use test auth token
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create and insert multiple test metrics
    let test_metric1 = create_test_metric_file(&mut conn, user_id, Some(org_id), Some("Test Metric 1".to_string())).await?;
    let test_metric2 = create_test_metric_file(&mut conn, user_id, Some(org_id), Some("Test Metric 2".to_string())).await?;
    let test_metric3 = create_test_metric_file(&mut conn, user_id, Some(org_id), Some("Test Metric 3".to_string())).await?;
    
    // Create request payload
    let request_body = serde_json::json!({
        "ids": [test_metric1.id, test_metric2.id, test_metric3.id]
    });
    
    // Send bulk delete request
    let builder = client.delete("/api/v1/metrics")
        .json(&request_body)
        .send()
        .await?;
    
    // Verify response status
    assert_eq!(builder.status().as_u16(), 204); // No Content for successful deletion
    
    // Verify metrics are deleted in database
    for id in [test_metric1.id, test_metric2.id, test_metric3.id] {
        let db_metric = metric_files::table
            .filter(metric_files::id.eq(id))
            .first::<MetricFile>(&mut conn)
            .await?;
        
        assert!(db_metric.deleted_at.is_some(), "Metric with ID {} should be marked as deleted", id);
    }
    
    Ok(())
}

#[tokio::test]
async fn test_delete_metrics_rest_bulk_partial_success() -> Result<()> {
    // Create test app
    let app = create_test_app().await?;
    let client = TestClient::new()?
        .with_auth("test-token"); // Use test auth token
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create and insert one test metric
    let test_metric = create_test_metric_file(&mut conn, user_id, Some(org_id), Some("Test Metric".to_string())).await?;
    
    // Generate non-existent IDs
    let nonexistent_id1 = Uuid::new_v4();
    let nonexistent_id2 = Uuid::new_v4();
    
    // Create request payload
    let request_body = serde_json::json!({
        "ids": [test_metric.id, nonexistent_id1, nonexistent_id2]
    });
    
    // Send bulk delete request
    let builder = client.delete("/api/v1/metrics")
        .json(&request_body)
        .send()
        .await?;
    
    // Verify response status - should be 207 Multi-Status
    assert_eq!(builder.status().as_u16(), 207);
    
    // Parse response
    let response: serde_json::Value = builder.json().await?;
    
    // Check response structure
    assert!(response["successful_ids"].is_array());
    assert!(response["failed_ids"].is_array());
    
    // Check counts
    let successful_ids = response["successful_ids"].as_array().unwrap();
    let failed_ids = response["failed_ids"].as_array().unwrap();
    
    assert_eq!(successful_ids.len(), 1);
    assert_eq!(failed_ids.len(), 2);
    
    // Verify existing metric was deleted
    let db_metric = metric_files::table
        .filter(metric_files::id.eq(test_metric.id))
        .first::<MetricFile>(&mut conn)
        .await?;
    
    assert!(db_metric.deleted_at.is_some(), "Existing metric should be marked as deleted");
    
    Ok(())
}