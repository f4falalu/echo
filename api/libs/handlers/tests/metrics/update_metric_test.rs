use anyhow::Result;
use chrono::Utc;
use database::enums::{AssetPermissionRole, AssetType, UserOrganizationRole, Verification};
use database::models::{MetricFile, Organization};
use database::pool::{get_pg_pool, init_pools};
use database::schema::metric_files;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use handlers::metrics::update_metric_handler::{update_metric_handler, UpdateMetricRequest};
use middleware::{AuthenticatedUser, OrganizationMembership};
use serde_json::json;
use std::sync::Once;
use uuid::Uuid;

// Used to initialize the database pool once for all tests
static INIT: Once = Once::new();

// Initialize database pool
async fn initialize() {
    INIT.call_once(|| {
        println!("Database pool initialization called");
        // Set environment variables for database connection
        std::env::set_var("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:54322/postgres");
        std::env::set_var("TEST_DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:54322/postgres");
    });

    // We only initialize the pools once but try to do it in each test to ensure they exist
    match init_pools().await {
        Ok(_) => println!("Database pool initialized successfully"),
        Err(e) => println!("Database pool initialization error: {}", e),
    }
}

// Create a simplified test setup for our test
struct TestSetup {
    pub user: AuthenticatedUser,
    pub organization: Organization,
    pub test_id: String,
}

// Integration test that tests metric status update functionality
#[tokio::test]
async fn test_update_metric_status() -> Result<()> {
    // Initialize the database pool
    initialize();
    
    // Create a test ID for unique naming
    let test_id = format!("test-{}", Uuid::new_v4());
    
    // Create organization and user IDs
    let organization_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    
    // Create mock user and organization
    let user = AuthenticatedUser {
        id: user_id,
        email: format!("test-{}@example.com", test_id),
        name: Some(format!("Test User {}", test_id)),
        config: json!({"preferences": {"theme": "light"}}),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes: json!({}),
        avatar_url: None,
        organizations: vec![OrganizationMembership {
            id: organization_id,
            role: UserOrganizationRole::WorkspaceAdmin,
        }],
        teams: vec![],
    };
    
    let organization = Organization {
        id: organization_id,
        name: format!("Test Organization {}", test_id),
        domain: Some(format!("test-{}.org", test_id)),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };
    
    // Create our simplified test setup
    let setup = TestSetup {
        user,
        organization,
        test_id,
    };
    
    // Insert the organization and user into the database
    let mut conn = get_pg_pool().get().await?;
    
    // Insert the organization
    diesel::insert_into(database::schema::organizations::table)
        .values(&setup.organization)
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
        
    // Insert the user
    let user_model = database::models::User {
        id: setup.user.id,
        email: setup.user.email.clone(),
        name: setup.user.name.clone(),
        config: setup.user.config.clone(),
        created_at: setup.user.created_at,
        updated_at: setup.user.updated_at,
        attributes: setup.user.attributes.clone(),
        avatar_url: setup.user.avatar_url.clone(),
    };
    
    diesel::insert_into(database::schema::users::table)
        .values(&user_model)
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
        
    // Create the relationship between user and organization
    let user_org = database::models::UserToOrganization {
        user_id: setup.user.id,
        organization_id: setup.organization.id,
        role: setup.user.organizations[0].role,
        sharing_setting: database::enums::SharingSetting::None,
        edit_sql: true,
        upload_csv: true,
        export_assets: true,
        email_slack_enabled: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: setup.user.id,
        updated_by: setup.user.id,
        deleted_by: None,
        status: database::enums::UserOrganizationStatus::Active,
    };
    
    diesel::insert_into(database::schema::users_to_organizations::table)
        .values(&user_org)
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
    
    // Create a test metric file
    let metric_id = Uuid::new_v4();
    let current_time = Utc::now();
    let mut conn = get_pg_pool().get().await?;
    
    // Create a simple metric with test content
    let content = database::types::MetricYml {
        name: format!("Test Metric {}", setup.test_id),
        description: Some(format!("Test metric description for {}", setup.test_id)),
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
        name: format!("{}-Test Metric", setup.test_id),
        file_name: format!("{}-test_metric.yml", setup.test_id),
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
        
    // Clean up user data - cascades to related tables
    diesel::delete(database::schema::users_to_organizations::table)
        .filter(database::schema::users_to_organizations::user_id.eq(setup.user.id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::users::table)
        .filter(database::schema::users::id.eq(setup.user.id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::organizations::table)
        .filter(database::schema::organizations::id.eq(setup.organization.id))
        .execute(&mut conn)
        .await?;
    
    // No TestDb cleanup in our simplified setup - we manually clean up
    // But in a real test, we would use a TestDb cleanup helper
    
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
    // Initialize the database pool
    initialize();
    
    // Create a test ID for unique naming
    let test_id = format!("test-{}", Uuid::new_v4());
    
    // Create organization and user IDs
    let organization_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    
    // Create mock user and organization - with VIEWER role
    let user = AuthenticatedUser {
        id: user_id,
        email: format!("test-{}@example.com", test_id),
        name: Some(format!("Test User {}", test_id)),
        config: json!({"preferences": {"theme": "light"}}),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes: json!({}),
        avatar_url: None,
        organizations: vec![OrganizationMembership {
            id: organization_id,
            role: UserOrganizationRole::Viewer,
        }],
        teams: vec![],
    };
    
    let organization = Organization {
        id: organization_id,
        name: format!("Test Organization {}", test_id),
        domain: Some(format!("test-{}.org", test_id)),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };
    
    // Create our simplified test setup
    let setup = TestSetup {
        user,
        organization,
        test_id,
    };
    
    // Insert the organization and user into the database
    let mut conn = get_pg_pool().get().await?;
    
    // Insert the organization
    diesel::insert_into(database::schema::organizations::table)
        .values(&setup.organization)
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
        
    // Insert the user
    let user_model = database::models::User {
        id: setup.user.id,
        email: setup.user.email.clone(),
        name: setup.user.name.clone(),
        config: setup.user.config.clone(),
        created_at: setup.user.created_at,
        updated_at: setup.user.updated_at,
        attributes: setup.user.attributes.clone(),
        avatar_url: setup.user.avatar_url.clone(),
    };
    
    diesel::insert_into(database::schema::users::table)
        .values(&user_model)
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
        
    // Create the relationship between user and organization
    let user_org = database::models::UserToOrganization {
        user_id: setup.user.id,
        organization_id: setup.organization.id,
        role: setup.user.organizations[0].role,
        sharing_setting: database::enums::SharingSetting::None,
        edit_sql: true,
        upload_csv: true,
        export_assets: true,
        email_slack_enabled: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: setup.user.id,
        updated_by: setup.user.id,
        deleted_by: None,
        status: database::enums::UserOrganizationStatus::Active,
    };
    
    diesel::insert_into(database::schema::users_to_organizations::table)
        .values(&user_org)
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
    
    // Create a test metric file
    let metric_id = Uuid::new_v4();
    let current_time = Utc::now();
    let mut conn = get_pg_pool().get().await?;
    
    // Create a simple metric with test content
    let content = database::types::MetricYml {
        name: format!("Test Metric {}", setup.test_id),
        description: Some(format!("Test metric description for {}", setup.test_id)),
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
        name: format!("{}-Test Metric", setup.test_id),
        file_name: format!("{}-test_metric.yml", setup.test_id),
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
        
    // Clean up user data - cascades to related tables
    diesel::delete(database::schema::users_to_organizations::table)
        .filter(database::schema::users_to_organizations::user_id.eq(setup.user.id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::users::table)
        .filter(database::schema::users::id.eq(setup.user.id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::organizations::table)
        .filter(database::schema::organizations::id.eq(setup.organization.id))
        .execute(&mut conn)
        .await?;
    
    // No TestDb cleanup in our simplified setup - we manually clean up
    // But in a real test, we would use a TestDb cleanup helper
    
    Ok(())
}

// Test edge cases for status updates
#[tokio::test]
async fn test_update_metric_status_null_value() -> Result<()> {
    // Initialize the database pool
    initialize();
    
    // Create a test ID for unique naming
    let test_id = format!("test-{}", Uuid::new_v4());
    
    // Create organization and user IDs
    let organization_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    
    // Create mock user and organization
    let user = AuthenticatedUser {
        id: user_id,
        email: format!("test-{}@example.com", test_id),
        name: Some(format!("Test User {}", test_id)),
        config: json!({"preferences": {"theme": "light"}}),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes: json!({}),
        avatar_url: None,
        organizations: vec![OrganizationMembership {
            id: organization_id,
            role: UserOrganizationRole::WorkspaceAdmin,
        }],
        teams: vec![],
    };
    
    let organization = Organization {
        id: organization_id,
        name: format!("Test Organization {}", test_id),
        domain: Some(format!("test-{}.org", test_id)),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };
    
    // Create our simplified test setup
    let setup = TestSetup {
        user,
        organization,
        test_id,
    };
    
    // Insert the organization and user into the database
    let mut conn = get_pg_pool().get().await?;
    
    // Insert the organization
    diesel::insert_into(database::schema::organizations::table)
        .values(&setup.organization)
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
        
    // Insert the user
    let user_model = database::models::User {
        id: setup.user.id,
        email: setup.user.email.clone(),
        name: setup.user.name.clone(),
        config: setup.user.config.clone(),
        created_at: setup.user.created_at,
        updated_at: setup.user.updated_at,
        attributes: setup.user.attributes.clone(),
        avatar_url: setup.user.avatar_url.clone(),
    };
    
    diesel::insert_into(database::schema::users::table)
        .values(&user_model)
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
        
    // Create the relationship between user and organization
    let user_org = database::models::UserToOrganization {
        user_id: setup.user.id,
        organization_id: setup.organization.id,
        role: setup.user.organizations[0].role,
        sharing_setting: database::enums::SharingSetting::None,
        edit_sql: true,
        upload_csv: true,
        export_assets: true,
        email_slack_enabled: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: setup.user.id,
        updated_by: setup.user.id,
        deleted_by: None,
        status: database::enums::UserOrganizationStatus::Active,
    };
    
    diesel::insert_into(database::schema::users_to_organizations::table)
        .values(&user_org)
        .on_conflict_do_nothing()
        .execute(&mut conn)
        .await?;
    
    // Create a test metric file
    let metric_id = Uuid::new_v4();
    let current_time = Utc::now();
    let mut conn = get_pg_pool().get().await?;
    
    // Create a simple metric with test content
    let content = database::types::MetricYml {
        name: format!("Test Metric {}", setup.test_id),
        description: Some(format!("Test metric description for {}", setup.test_id)),
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
        name: format!("{}-Test Metric", setup.test_id),
        file_name: format!("{}-test_metric.yml", setup.test_id),
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
        
    // Clean up user data - cascades to related tables
    diesel::delete(database::schema::users_to_organizations::table)
        .filter(database::schema::users_to_organizations::user_id.eq(setup.user.id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::users::table)
        .filter(database::schema::users::id.eq(setup.user.id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(database::schema::organizations::table)
        .filter(database::schema::organizations::id.eq(setup.organization.id))
        .execute(&mut conn)
        .await?;
    
    // No TestDb cleanup in our simplified setup - we manually clean up
    // But in a real test, we would use a TestDb cleanup helper
    
    Ok(())
}