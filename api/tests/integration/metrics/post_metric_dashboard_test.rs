use anyhow::Result;
use database::{
    enums::AssetType,
    models::{MetricFile, DashboardFile},
    pool::get_pg_pool,
    schema::{collections_to_assets, dashboard_files, metric_files},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::metrics::{post_metric_dashboard_handler, PostMetricDashboardRequest};
use tokio;
use uuid::Uuid;

use crate::common::{
    db::TestDb,
    env::setup_test_env,
    fixtures::{create_test_metric_file, create_test_dashboard_file},
};

#[tokio::test]
async fn test_post_metric_dashboard_handler() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user and organization
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test metric and dashboard
    let test_metric = create_test_metric_file(&user_id, &org_id, Some("Test Metric".to_string()));
    let metric_id = test_metric.id;
    
    let test_dashboard = create_test_dashboard_file(&user_id, &org_id, Some("Test Dashboard".to_string()));
    let dashboard_id = test_dashboard.id;
    
    // Insert test metric and dashboard into database
    diesel::insert_into(metric_files::table)
        .values(&test_metric)
        .execute(&mut conn)
        .await?;
        
    diesel::insert_into(dashboard_files::table)
        .values(&test_dashboard)
        .execute(&mut conn)
        .await?;
    
    // Create the request
    let request = PostMetricDashboardRequest {
        dashboard_id,
    };
    
    // Call the handler being tested
    let response = post_metric_dashboard_handler(&metric_id, &user_id, request).await?;
    
    // Verify the response
    assert_eq!(response.metric_id, metric_id);
    assert_eq!(response.dashboard_id, dashboard_id);
    
    // Check the database to ensure the association was created
    let association_exists = collections_to_assets::table
        .filter(collections_to_assets::asset_id.eq(metric_id))
        .filter(collections_to_assets::collection_id.eq(dashboard_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .filter(collections_to_assets::deleted_at.is_null())
        .count()
        .first::<i64>(&mut conn)
        .await?;
        
    assert_eq!(association_exists, 1);
    
    // Test idempotency - calling it again should not create a duplicate
    let request2 = PostMetricDashboardRequest {
        dashboard_id,
    };
    
    let _ = post_metric_dashboard_handler(&metric_id, &user_id, request2).await?;
    
    let association_count = collections_to_assets::table
        .filter(collections_to_assets::asset_id.eq(metric_id))
        .filter(collections_to_assets::collection_id.eq(dashboard_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .filter(collections_to_assets::deleted_at.is_null())
        .count()
        .first::<i64>(&mut conn)
        .await?;
        
    // Should still be only 1 association
    assert_eq!(association_count, 1);
    
    Ok(())
}

#[tokio::test]
async fn test_post_metric_dashboard_handler_different_orgs() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let test_db = TestDb::new().await?;
    let mut conn = test_db.get_conn().await?;
    
    // Create test user 
    let user_id = Uuid::new_v4();
    
    // Create two different organization IDs
    let org_id1 = Uuid::new_v4();
    let org_id2 = Uuid::new_v4();
    
    // Create test metric in org1
    let test_metric = create_test_metric_file(&user_id, &org_id1, Some("Org1 Metric".to_string()));
    let metric_id = test_metric.id;
    
    // Create test dashboard in org2
    let test_dashboard = create_test_dashboard_file(&user_id, &org_id2, Some("Org2 Dashboard".to_string()));
    let dashboard_id = test_dashboard.id;
    
    // Insert test metric and dashboard into database
    diesel::insert_into(metric_files::table)
        .values(&test_metric)
        .execute(&mut conn)
        .await?;
        
    diesel::insert_into(dashboard_files::table)
        .values(&test_dashboard)
        .execute(&mut conn)
        .await?;
    
    // Create the request
    let request = PostMetricDashboardRequest {
        dashboard_id,
    };
    
    // Call the handler being tested - should fail because they're in different orgs
    let result = post_metric_dashboard_handler(&metric_id, &user_id, request).await;
    
    // Verify the error
    assert!(result.is_err());
    let error = result.unwrap_err().to_string();
    assert!(error.contains("same organization"));
    
    Ok(())
}

#[tokio::test]
async fn test_post_metric_dashboard_handler_not_found() -> Result<()> {
    // Setup test environment
    setup_test_env();
    
    // Initialize test database
    let _test_db = TestDb::new().await?;
    
    // Create test user
    let user_id = Uuid::new_v4();
    
    // Use random UUIDs that don't exist
    let nonexistent_metric_id = Uuid::new_v4();
    let nonexistent_dashboard_id = Uuid::new_v4();
    
    // Create the request
    let request = PostMetricDashboardRequest {
        dashboard_id: nonexistent_dashboard_id,
    };
    
    // Call the handler being tested - should fail
    let result = post_metric_dashboard_handler(&nonexistent_metric_id, &user_id, request).await;
    
    // Verify the error
    assert!(result.is_err());
    let error = result.unwrap_err().to_string();
    assert!(error.contains("not found") || error.contains("unauthorized"));
    
    Ok(())
}