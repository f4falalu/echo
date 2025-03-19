// Export test modules
pub mod update_metric_test;
pub mod delete_metric_test;
pub mod post_metric_dashboard_test;

// Common test setup
use anyhow::{anyhow, Result};
use database::{
    enums::{AssetType, Verification},
    models::{MetricFile, DashboardFile},
    pool::{get_pg_pool, init_pools},
    types::{ChartConfig, DashboardYml, MetricYml, VersionHistory},
};
use chrono::Utc;
use diesel::ExpressionMethods;
use diesel_async::RunQueryDsl;
use dotenv::dotenv;
use std::sync::Once;
use uuid::Uuid;

// Common test setup initializer
static INIT: Once = Once::new();

/// Sets up the test environment by initializing the database pools
/// Call this at the beginning of each integration test
pub async fn setup_test_environment() -> Result<()> {
    // Load environment variables
    dotenv().ok();

    // Initialize database pools only once
    INIT.call_once(|| {
        init_pools();
    });

    Ok(())
}

/// Creates a test metric file in the database for testing
pub async fn create_test_metric(organization_id: Uuid, created_by: Uuid) -> Result<MetricFile> {
    // Create a test chart config
    let chart_config = ChartConfig::Bar(database::types::BarLineChartConfig {
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

    // Create a test metric YML structure
    let metric_yml = MetricYml {
        name: "Test Metric".to_string(),
        description: Some("Test metric description".to_string()),
        sql: "SELECT * FROM test_table".to_string(),
        time_frame: "daily".to_string(),
        chart_config,
        data_metadata: Some(vec![database::types::DataMetadata {
            name: "id".to_string(),
            data_type: "string".to_string(),
        }]),
        dataset_ids: vec![Uuid::new_v4()],
    };

    // Create version history
    let version_history = VersionHistory::new(1, metric_yml.clone());

    // Create the test metric
    let metric_id = Uuid::new_v4();
    let test_metric = MetricFile {
        id: metric_id,
        name: "Test Metric".to_string(),
        file_name: "test_metric.yml".to_string(),
        content: metric_yml,
        verification: Verification::NotRequested,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id,
        created_by,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history,
    };

    Ok(test_metric)
}

/// Creates a test dashboard file in the database for testing
pub async fn create_test_dashboard(organization_id: Uuid, created_by: Uuid) -> Result<DashboardFile> {
    // Create a test dashboard YML structure
    let dashboard_yml = DashboardYml {
        name: "Test Dashboard".to_string(),
        description: Some("Test dashboard description".to_string()),
        rows: vec![database::types::Row {
            items: vec![database::types::RowItem { id: Uuid::new_v4() }],
            row_height: Some(320),
            column_sizes: None,
        }],
    };

    // Create version history
    let version_history = VersionHistory::new(1, dashboard_yml.clone());

    // Create the test dashboard
    let dashboard_id = Uuid::new_v4();
    let test_dashboard = DashboardFile {
        id: dashboard_id,
        name: "Test Dashboard".to_string(),
        file_name: "test_dashboard.yml".to_string(),
        content: dashboard_yml,
        filter: None,
        organization_id,
        created_by,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history,
    };

    Ok(test_dashboard)
}

/// Function to clean up test data after tests
pub async fn cleanup_test_data(metric_id: Option<Uuid>, dashboard_id: Option<Uuid>) -> Result<()> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    // Clean up any test metrics
    if let Some(id) = metric_id {
        diesel::delete(database::schema::metric_files::table)
            .filter(database::schema::metric_files::id.eq(id))
            .execute(&mut conn)
            .await
            .map_err(|e| anyhow!("Failed to clean up test metric: {}", e))?;
    }

    // Clean up any test dashboards
    if let Some(id) = dashboard_id {
        diesel::delete(database::schema::dashboard_files::table)
            .filter(database::schema::dashboard_files::id.eq(id))
            .execute(&mut conn)
            .await
            .map_err(|e| anyhow!("Failed to clean up test dashboard: {}", e))?;
    }

    Ok(())
}

/// Insert a test metric to the database - only used by integration tests
pub async fn insert_test_metric(metric: &MetricFile) -> Result<()> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    diesel::insert_into(database::schema::metric_files::table)
        .values((
            database::schema::metric_files::id.eq(metric.id),
            database::schema::metric_files::name.eq(&metric.name),
            database::schema::metric_files::file_name.eq(&metric.file_name),
            database::schema::metric_files::content.eq(&metric.content),
            database::schema::metric_files::verification.eq(&metric.verification),
            database::schema::metric_files::evaluation_obj.eq(&metric.evaluation_obj),
            database::schema::metric_files::evaluation_summary.eq(&metric.evaluation_summary),
            database::schema::metric_files::evaluation_score.eq(&metric.evaluation_score),
            database::schema::metric_files::organization_id.eq(metric.organization_id),
            database::schema::metric_files::created_by.eq(metric.created_by),
            database::schema::metric_files::created_at.eq(metric.created_at),
            database::schema::metric_files::updated_at.eq(metric.updated_at),
            database::schema::metric_files::deleted_at.eq(metric.deleted_at),
            database::schema::metric_files::publicly_accessible.eq(metric.publicly_accessible),
            database::schema::metric_files::publicly_enabled_by.eq(metric.publicly_enabled_by),
            database::schema::metric_files::public_expiry_date.eq(metric.public_expiry_date),
            database::schema::metric_files::version_history.eq(&metric.version_history),
        ))
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to insert test metric: {}", e))?;

    Ok(())
}

/// Insert a test dashboard to the database - only used by integration tests
pub async fn insert_test_dashboard(dashboard: &DashboardFile) -> Result<()> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    diesel::insert_into(database::schema::dashboard_files::table)
        .values((
            database::schema::dashboard_files::id.eq(dashboard.id),
            database::schema::dashboard_files::name.eq(&dashboard.name),
            database::schema::dashboard_files::file_name.eq(&dashboard.file_name),
            database::schema::dashboard_files::content.eq(&dashboard.content),
            database::schema::dashboard_files::filter.eq(&dashboard.filter),
            database::schema::dashboard_files::organization_id.eq(dashboard.organization_id),
            database::schema::dashboard_files::created_by.eq(dashboard.created_by),
            database::schema::dashboard_files::created_at.eq(dashboard.created_at),
            database::schema::dashboard_files::updated_at.eq(dashboard.updated_at),
            database::schema::dashboard_files::deleted_at.eq(dashboard.deleted_at),
            database::schema::dashboard_files::publicly_accessible.eq(dashboard.publicly_accessible),
            database::schema::dashboard_files::publicly_enabled_by.eq(dashboard.publicly_enabled_by),
            database::schema::dashboard_files::public_expiry_date.eq(dashboard.public_expiry_date),
            database::schema::dashboard_files::version_history.eq(&dashboard.version_history),
        ))
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to insert test dashboard: {}", e))?;

    Ok(())
}

/// Associate a metric with a dashboard in the database - only used by integration tests
pub async fn associate_metric_with_dashboard(
    metric_id: Uuid,
    dashboard_id: Uuid,
    user_id: Uuid,
) -> Result<()> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    diesel::insert_into(database::schema::collections_to_assets::table)
        .values((
            database::schema::collections_to_assets::collection_id.eq(dashboard_id),
            database::schema::collections_to_assets::asset_id.eq(metric_id),
            database::schema::collections_to_assets::asset_type.eq(AssetType::MetricFile),
            database::schema::collections_to_assets::created_at.eq(Utc::now()),
            database::schema::collections_to_assets::updated_at.eq(Utc::now()),
            database::schema::collections_to_assets::created_by.eq(user_id),
            database::schema::collections_to_assets::updated_by.eq(user_id),
        ))
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to associate metric with dashboard: {}", e))?;

    Ok(())
}

/// Clean up any metric-dashboard associations - only used by integration tests
pub async fn cleanup_metric_dashboard_associations(
    metric_id: Uuid,
    dashboard_id: Uuid,
) -> Result<()> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    diesel::delete(database::schema::collections_to_assets::table)
        .filter(database::schema::collections_to_assets::collection_id.eq(dashboard_id))
        .filter(database::schema::collections_to_assets::asset_id.eq(metric_id))
        .filter(database::schema::collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to clean up metric-dashboard association: {}", e))?;

    Ok(())
}