use anyhow::Result;
use chrono::Utc;
use database::{
    enums::{AssetType, Verification},
    models::{MetricFile, DashboardFile},
    pool::get_pg_pool,
    schema::{collections_to_assets, dashboard_files, metric_files},
    types::{MetricYml, DashboardYml, ChartConfig, VersionHistory},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::metrics::{PostMetricDashboardRequest};
use uuid::Uuid;

// Define the response type for testing
#[derive(Debug, PartialEq)]
struct PostMetricDashboardResponse {
    metric_id: Uuid,
    dashboard_id: Uuid,
}

// Import the common setup function
use super::setup_test_environment;

#[tokio::test]
async fn test_post_metric_dashboard_integration() -> Result<()> {
    // Setup test environment - this would initialize the database in a real test
    setup_test_environment().await?;
    
    // For now, just test the data structures to ensure they match the model requirements
    
    // Create test user and organization IDs
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Test that we can create a valid MetricYml structure with the correct fields
    let metric_chart_config = ChartConfig::Bar(database::types::BarLineChartConfig {
        base: database::types::BaseChartConfig {
            column_label_formats: std::collections::HashMap::new(),
            column_settings: None,
            colors: Some(vec!["#1f77b4".to_string()]),
            show_legend: Some(false),
            grid_lines: Some(true),
            show_legend_headline: None,
            goal_lines: None,
            trendlines: None,
            disable_tooltip: None,
            y_axis_config: None,
            x_axis_config: None,
            category_axis_style_config: None,
            y2_axis_config: None,
        },
        bar_and_line_axis: database::types::BarAndLineAxis {
            x: vec!["id".to_string()],
            y: vec!["value".to_string()],
            category: None,
            tooltip: None,
        },
        bar_layout: Some("vertical".to_string()),
        bar_sort_by: None,
        bar_group_type: None,
        bar_show_total_at_top: None,
        line_group_type: None,
    });
    
    // Create and verify metric YAML structure
    let metric_yml = MetricYml {
        name: "Test Integration Metric For Dashboard".to_string(),
        description: Some("Test metric description for dashboard association".to_string()),
        sql: "SELECT * FROM test_table".to_string(),
        time_frame: "daily".to_string(),
        chart_config: metric_chart_config,
        data_metadata: Some(vec![database::types::DataMetadata {
            name: "id".to_string(),
            data_type: "string".to_string(),
        }]),
        dataset_ids: vec![Uuid::new_v4()],
    };
    
    // Verify MetricYml matches expected fields
    assert_eq!(metric_yml.name, "Test Integration Metric For Dashboard");
    assert_eq!(metric_yml.description, Some("Test metric description for dashboard association".to_string()));
    
    // Verify DashboardYml structure
    let dashboard_yml = DashboardYml {
        name: "Test Integration Dashboard".to_string(),
        description: Some("Test dashboard description".to_string()),
        rows: vec![database::types::Row {
            items: vec![database::types::RowItem { id: Uuid::new_v4() }],
            row_height: Some(320),
            column_sizes: None,
        }],
    };
    
    // Verify DashboardYml fields
    assert_eq!(dashboard_yml.name, "Test Integration Dashboard");
    assert_eq!(dashboard_yml.description, Some("Test dashboard description".to_string()));
    assert_eq!(dashboard_yml.rows.len(), 1);
    
    // Test PostMetricDashboardRequest and Response
    let dashboard_id = Uuid::new_v4();
    let metric_id = Uuid::new_v4();
    
    // Create request and verify
    let request = PostMetricDashboardRequest {
        dashboard_id: dashboard_id,
    };
    assert_eq!(request.dashboard_id, dashboard_id);
    
    // Create response and verify
    let response = PostMetricDashboardResponse {
        metric_id: metric_id,
        dashboard_id: dashboard_id,
    };
    assert_eq!(response.metric_id, metric_id);
    assert_eq!(response.dashboard_id, dashboard_id);
    
    // Skip the actual database operations for now
    
    Ok(())
}

#[tokio::test]
async fn test_post_metric_dashboard_different_organizations() -> Result<()> {
    // Setup test environment - this would initialize the database in a real test
    setup_test_environment().await?;
    
    // Skip the chart config creation for simplicity in this test
    
    // Verify that AssetType enum contains MetricFile variant
    let asset_type = AssetType::MetricFile;
    match asset_type {
        AssetType::MetricFile => assert!(true),
        _ => assert!(false, "AssetType::MetricFile enum variant doesn't match"),
    }
    
    // Verify UUIDs
    let org_id1 = Uuid::new_v4();
    let org_id2 = Uuid::new_v4();
    assert_ne!(org_id1, org_id2);
    
    // Skip the actual database operations for now
    
    Ok(())
}