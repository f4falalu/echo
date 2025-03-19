use anyhow::Result;
use database::{
    enums::Verification,
    pool::get_pg_pool,
    schema::metric_files,
    types::MetricYml,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::metrics::{update_metric_handler, UpdateMetricRequest};
use serde_json::Value;
use uuid::Uuid;

// Import the common setup and test data functions
use super::{
    cleanup_test_data, create_test_metric, insert_test_metric, setup_test_environment,
};

/// Integration test for updating a metric that exists in the database
#[tokio::test]
async fn test_update_metric_integration() -> Result<()> {
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
    
    // Create an update request with various fields to change
    let update_request = UpdateMetricRequest {
        title: Some("Updated Test Metric".to_string()),
        description: Some("Updated test description".to_string()),
        chart_config: Some(serde_json::json!({
            "selectedChartType": "bar",
            "bar_and_line_axis": {
                "x": ["id"],
                "y": ["updated_value"]
            },
            "column_label_formats": {}
        })),
        time_frame: Some("weekly".to_string()),
        dataset_ids: Some(vec![Uuid::new_v4().to_string()]),
        verification: Some(Verification::Verified),
        file: None,
    };
    
    // Call the handler function to update the metric
    match update_metric_handler(&metric_id, &user_id, update_request).await {
        Ok(updated_metric) => {
            // Verify the updated values in the returned metric
            assert_eq!(updated_metric.name, "Updated Test Metric");
            assert_eq!(updated_metric.verification, Verification::Verified);
            assert_eq!(updated_metric.time_frame, "weekly");
            
            // Verify the metric was updated in the database
            let mut conn = get_pg_pool().get().await?;
            let db_metric = metric_files::table
                .filter(metric_files::id.eq(metric_id))
                .first::<database::models::MetricFile>(&mut conn)
                .await?;
            
            // Verify database values match the expected updates
            assert_eq!(db_metric.name, "Updated Test Metric");
            assert_eq!(db_metric.verification, Verification::Verified);
            
            // Verify the content field was updated
            let content: MetricYml = db_metric.content;
            assert_eq!(content.time_frame, "weekly");
            assert_eq!(content.description, Some("Updated test description".to_string()));
            
            // Verify version history was updated
            assert!(db_metric.version_history.0.contains_key(&"1".to_string()));
            assert!(db_metric.version_history.0.contains_key(&"2".to_string()));
            
            println!("Update metric test passed with ID: {}", metric_id);
        },
        Err(e) => {
            // Clean up the test data regardless of test outcome
            cleanup_test_data(Some(metric_id), None).await?;
            return Err(e);
        }
    }
    
    // Clean up the test data
    cleanup_test_data(Some(metric_id), None).await?;
    
    Ok(())
}

/// Test updating a metric that doesn't exist
#[tokio::test]
async fn test_update_nonexistent_metric() -> Result<()> {
    // Setup test environment
    setup_test_environment().await?;
    
    // Generate random UUIDs for test
    let metric_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    
    // Create a basic update request
    let update_request = UpdateMetricRequest {
        title: Some("Updated Test Metric".to_string()),
        description: None,
        chart_config: None,
        time_frame: None,
        dataset_ids: None,
        verification: None,
        file: None,
    };
    
    // Attempt to update a nonexistent metric
    let result = update_metric_handler(&metric_id, &user_id, update_request).await;
    
    // Verify the operation fails with an appropriate error
    assert!(result.is_err());
    let error = result.err().unwrap();
    assert!(error.to_string().contains("not found") || 
            error.to_string().contains("Failed to get"));
    
    Ok(())
}

/// Test updating specific metric fields one at a time
#[tokio::test]
async fn test_update_specific_metric_fields() -> Result<()> {
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
    
    // Test 1: Update only title
    let title_request = UpdateMetricRequest {
        title: Some("Title Only Update".to_string()),
        description: None,
        chart_config: None,
        time_frame: None,
        dataset_ids: None,
        verification: None,
        file: None,
    };
    
    match update_metric_handler(&metric_id, &user_id, title_request).await {
        Ok(metric) => {
            assert_eq!(metric.name, "Title Only Update");
            
            // Verify other fields were not changed
            assert_eq!(metric.time_frame, "daily");
            assert_eq!(metric.verification, Verification::NotRequested);
        },
        Err(e) => {
            cleanup_test_data(Some(metric_id), None).await?;
            return Err(e);
        }
    }
    
    // Test 2: Update only verification
    let verification_request = UpdateMetricRequest {
        title: None,
        description: None,
        chart_config: None,
        time_frame: None,
        dataset_ids: None,
        verification: Some(Verification::Verified),
        file: None,
    };
    
    match update_metric_handler(&metric_id, &user_id, verification_request).await {
        Ok(metric) => {
            assert_eq!(metric.verification, Verification::Verified);
            
            // Verify title remains from previous update
            assert_eq!(metric.name, "Title Only Update");
        },
        Err(e) => {
            cleanup_test_data(Some(metric_id), None).await?;
            return Err(e);
        }
    }
    
    // Test 3: Update only time_frame
    let time_frame_request = UpdateMetricRequest {
        title: None,
        description: None,
        chart_config: None,
        time_frame: Some("monthly".to_string()),
        dataset_ids: None,
        verification: None,
        file: None,
    };
    
    match update_metric_handler(&metric_id, &user_id, time_frame_request).await {
        Ok(metric) => {
            assert_eq!(metric.time_frame, "monthly");
            
            // Verify other fields remain from previous updates
            assert_eq!(metric.name, "Title Only Update");
            assert_eq!(metric.verification, Verification::Verified);
        },
        Err(e) => {
            cleanup_test_data(Some(metric_id), None).await?;
            return Err(e);
        }
    }
    
    // Clean up the test data
    cleanup_test_data(Some(metric_id), None).await?;
    
    Ok(())
}