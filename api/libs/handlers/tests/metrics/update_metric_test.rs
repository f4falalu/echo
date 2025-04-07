use anyhow::Result;
use chrono::Utc;
use database::enums::{AssetPermissionRole, AssetType, UserOrganizationRole, Verification};
use database::models::MetricFile;
use database::schema::metric_files;
use database::tests::common::db::TestSetup;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use handlers::metrics::update_metric_handler::{update_metric_handler, UpdateMetricRequest};
use uuid::Uuid;

// Force the initialization of database pools
lazy_static::lazy_static! {
    static ref _INIT: () = {
        let rt = tokio::runtime::Runtime::new().unwrap();
        if let Err(e) = rt.block_on(database::pool::init_pools()) {
            panic!("Failed to initialize test pools: {}", e);
        }
    };
}

// Integration test that tests metric status update functionality
#[tokio::test]
async fn test_update_metric_status() -> Result<()> {
    // Initialize lazy static to ensure pools are initialized
    lazy_static::initialize(&_INIT);
    
    // Set up test environment with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
    
    // Create a test metric file
    let metric_id = Uuid::new_v4();
    let current_time = Utc::now();
    let mut conn = setup.db.diesel_conn().await?;
    
    // Create a simple metric with test content
    let content = database::types::MetricYml {
        name: format!("Test Metric {}", setup.db.test_id),
        description: Some(format!("Test metric description for {}", setup.db.test_id)),
        sql: "SELECT * FROM test".to_string(),
        time_frame: "last 30 days".to_string(),
        chart_config: create_default_chart_config(),
        dataset_ids: vec![],
    };
    
    // Initial verification status
    let initial_verification = Verification::NotRequested;
    
    // Create the test metric file
    let metric_file = MetricFile {
        id: metric_id,
        name: format!("{}-Test Metric", setup.db.test_id),
        file_name: format!("{}-test_metric.yml", setup.db.test_id),
        content: content.clone(),
        verification: initial_verification,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id: setup.organization.id,
        created_by: setup.user.id,
        created_at: current_time,
        updated_at: current_time,
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: database::types::VersionHistory(std::collections::HashMap::new()),
        data_metadata: None,
        public_password: None,
    };
    
    // Insert the test metric into the database
    diesel::insert_into(metric_files::table)
        .values(&metric_file)
        .execute(&mut conn)
        .await?;
    
    // Create permission for the user
    diesel::insert_into(database::schema::asset_permissions::table)
        .values((
            database::schema::asset_permissions::identity_id.eq(setup.user.id),
            database::schema::asset_permissions::identity_type.eq(database::enums::IdentityType::User),
            database::schema::asset_permissions::asset_id.eq(metric_id),
            database::schema::asset_permissions::asset_type.eq(AssetType::MetricFile),
            database::schema::asset_permissions::role.eq(AssetPermissionRole::Owner),
            database::schema::asset_permissions::created_at.eq(current_time),
            database::schema::asset_permissions::updated_at.eq(current_time),
            database::schema::asset_permissions::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
            database::schema::asset_permissions::created_by.eq(setup.user.id),
            database::schema::asset_permissions::updated_by.eq(setup.user.id),
        ))
        .execute(&mut conn)
        .await?;
    
    // Create update request with new verification status
    let request = UpdateMetricRequest {
        verification: Some(Verification::Verified),
        ..Default::default()
    };
    
    // Call the update_metric_handler
    let updated_metric = update_metric_handler(
        &metric_id,
        &setup.user,
        request
    ).await?;
    
    // Verify response has the updated status
    assert_eq!(updated_metric.status, Verification::Verified);
    
    // Verify database was updated
    let db_metric = metric_files::table
        .find(metric_id)
        .first::<MetricFile>(&mut conn)
        .await?;
    
    assert_eq!(db_metric.verification, Verification::Verified);
    
    // Clean up test data
    diesel::delete(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    diesel::delete(database::schema::asset_permissions::table)
        .filter(database::schema::asset_permissions::asset_id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    // Use TestDb cleanup for thorough cleanup
    setup.db.cleanup().await?;
    
    Ok(())
}

// Helper function to create default chart config for testing
fn create_default_chart_config() -> database::types::metric_yml::ChartConfig {
    use database::types::metric_yml::{BarAndLineAxis, BarLineChartConfig, BaseChartConfig, ChartConfig};
    use indexmap::IndexMap;
    
    ChartConfig::Bar(BarLineChartConfig {
        base: BaseChartConfig {
            column_label_formats: IndexMap::new(),
            column_settings: None,
            colors: None,
            show_legend: None,
            grid_lines: None,
            show_legend_headline: None,
            goal_lines: None,
            trendlines: None,
            disable_tooltip: None,
            y_axis_config: None,
            x_axis_config: None,
            category_axis_style_config: None,
            y2_axis_config: None,
        },
        bar_and_line_axis: BarAndLineAxis {
            x: vec!["x".to_string()],
            y: vec!["y".to_string()],
            category: None,
            tooltip: None,
        },
        bar_layout: None,
        bar_sort_by: None,
        bar_group_type: None,
        bar_show_total_at_top: None,
        line_group_type: None,
    })
}

// Test unauthorized access
#[tokio::test]
async fn test_update_metric_status_unauthorized() -> Result<()> {
    // Initialize lazy static to ensure pools are initialized
    lazy_static::initialize(&_INIT);
    
    // Set up test environment with viewer user (limited permissions)
    let setup = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
    
    // Create a test metric file
    let metric_id = Uuid::new_v4();
    let current_time = Utc::now();
    let mut conn = setup.db.diesel_conn().await?;
    
    // Create a simple metric with test content
    let content = database::types::MetricYml {
        name: format!("Test Metric {}", setup.db.test_id),
        description: Some(format!("Test metric description for {}", setup.db.test_id)),
        sql: "SELECT * FROM test".to_string(),
        time_frame: "last 30 days".to_string(),
        chart_config: create_default_chart_config(),
        dataset_ids: vec![],
    };
    
    // Initial verification status
    let initial_verification = Verification::NotRequested;
    
    // Create the test metric file
    let metric_file = MetricFile {
        id: metric_id,
        name: format!("{}-Test Metric", setup.db.test_id),
        file_name: format!("{}-test_metric.yml", setup.db.test_id),
        content: content.clone(),
        verification: initial_verification,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id: setup.organization.id,
        created_by: setup.user.id,
        created_at: current_time,
        updated_at: current_time,
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: database::types::VersionHistory(std::collections::HashMap::new()),
        data_metadata: None,
        public_password: None,
    };
    
    // Insert the test metric into the database
    diesel::insert_into(metric_files::table)
        .values(&metric_file)
        .execute(&mut conn)
        .await?;
    
    // Create view-only permission
    diesel::insert_into(database::schema::asset_permissions::table)
        .values((
            database::schema::asset_permissions::identity_id.eq(setup.user.id),
            database::schema::asset_permissions::identity_type.eq(database::enums::IdentityType::User),
            database::schema::asset_permissions::asset_id.eq(metric_id),
            database::schema::asset_permissions::asset_type.eq(AssetType::MetricFile),
            database::schema::asset_permissions::role.eq(AssetPermissionRole::CanView),
            database::schema::asset_permissions::created_at.eq(current_time),
            database::schema::asset_permissions::updated_at.eq(current_time),
            database::schema::asset_permissions::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
            database::schema::asset_permissions::created_by.eq(setup.user.id),
            database::schema::asset_permissions::updated_by.eq(setup.user.id),
        ))
        .execute(&mut conn)
        .await?;
    
    // Create update request with new verification status
    let request = UpdateMetricRequest {
        verification: Some(Verification::Verified),
        ..Default::default()
    };
    
    // Call the update_metric_handler - should fail
    let result = update_metric_handler(
        &metric_id,
        &setup.user,
        request
    ).await;
    
    // Verify the operation failed
    assert!(result.is_err());
    
    // Verify database was not updated
    let db_metric = metric_files::table
        .find(metric_id)
        .first::<MetricFile>(&mut conn)
        .await?;
    
    assert_eq!(db_metric.verification, initial_verification);
    
    // Clean up test data
    diesel::delete(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    diesel::delete(database::schema::asset_permissions::table)
        .filter(database::schema::asset_permissions::asset_id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    // Use TestDb cleanup for thorough cleanup
    setup.db.cleanup().await?;
    
    Ok(())
}

// Test edge cases for status updates
#[tokio::test]
async fn test_update_metric_status_null_value() -> Result<()> {
    // Initialize lazy static to ensure pools are initialized
    lazy_static::initialize(&_INIT);
    
    // Set up test environment with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
    
    // Create a test metric file
    let metric_id = Uuid::new_v4();
    let current_time = Utc::now();
    let mut conn = setup.db.diesel_conn().await?;
    
    // Create a simple metric with test content
    let content = database::types::MetricYml {
        name: format!("Test Metric {}", setup.db.test_id),
        description: Some(format!("Test metric description for {}", setup.db.test_id)),
        sql: "SELECT * FROM test".to_string(),
        time_frame: "last 30 days".to_string(),
        chart_config: create_default_chart_config(),
        dataset_ids: vec![],
    };
    
    // Initial verification status
    let initial_verification = Verification::Verified;
    
    // Create the test metric file
    let metric_file = MetricFile {
        id: metric_id,
        name: format!("{}-Test Metric", setup.db.test_id),
        file_name: format!("{}-test_metric.yml", setup.db.test_id),
        content: content.clone(),
        verification: initial_verification,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id: setup.organization.id,
        created_by: setup.user.id,
        created_at: current_time,
        updated_at: current_time,
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: database::types::VersionHistory(std::collections::HashMap::new()),
        data_metadata: None,
        public_password: None,
    };
    
    // Insert the test metric into the database
    diesel::insert_into(metric_files::table)
        .values(&metric_file)
        .execute(&mut conn)
        .await?;
    
    // Create permission for the user
    diesel::insert_into(database::schema::asset_permissions::table)
        .values((
            database::schema::asset_permissions::identity_id.eq(setup.user.id),
            database::schema::asset_permissions::identity_type.eq(database::enums::IdentityType::User),
            database::schema::asset_permissions::asset_id.eq(metric_id),
            database::schema::asset_permissions::asset_type.eq(AssetType::MetricFile),
            database::schema::asset_permissions::role.eq(AssetPermissionRole::Owner),
            database::schema::asset_permissions::created_at.eq(current_time),
            database::schema::asset_permissions::updated_at.eq(current_time),
            database::schema::asset_permissions::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
            database::schema::asset_permissions::created_by.eq(setup.user.id),
            database::schema::asset_permissions::updated_by.eq(setup.user.id),
        ))
        .execute(&mut conn)
        .await?;
    
    // Create update request with null verification value
    let request = UpdateMetricRequest {
        verification: None,
        ..Default::default()
    };
    
    // Call the update_metric_handler
    let updated_metric = update_metric_handler(
        &metric_id,
        &setup.user,
        request
    ).await?;
    
    // Verify original status is preserved
    assert_eq!(updated_metric.status, initial_verification);
    
    // Verify database status was not changed
    let db_metric = metric_files::table
        .find(metric_id)
        .first::<MetricFile>(&mut conn)
        .await?;
    
    assert_eq!(db_metric.verification, initial_verification);
    
    // Clean up test data
    diesel::delete(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    diesel::delete(database::schema::asset_permissions::table)
        .filter(database::schema::asset_permissions::asset_id.eq(metric_id))
        .execute(&mut conn)
        .await?;
    
    // Use TestDb cleanup for thorough cleanup
    setup.db.cleanup().await?;
    
    Ok(())
}