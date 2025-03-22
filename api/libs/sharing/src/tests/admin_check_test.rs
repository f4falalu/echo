use anyhow::Result;
use chrono::Utc;
use database::{
    enums::{
        AssetPermissionRole, AssetType, IdentityType, SharingSetting, UserOrganizationRole,
        UserOrganizationStatus, Verification,
    },
    models::{AssetPermission, MetricFile, Organization, User, UserToOrganization},
    schema::{asset_permissions, metric_files, organizations, users, users_to_organizations},
    types::{
        metric_yml::{BarAndLineAxis, BarLineChartConfig, BaseChartConfig, ChartConfig, MetricYml},
        VersionHistory,
    },
};
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use uuid::Uuid;

use crate::admin_check::{
    check_admin_access, get_asset_organization_id, get_chat_organization_id,
    get_collection_organization_id, get_dashboard_organization_id, get_metric_organization_id,
    has_permission_with_admin_check, is_user_org_admin,
};
use crate::check_asset_permission::check_permission_with_admin_override;
use crate::types::{AssetPermissionLevel, IdentityInfo};

// Helper function to create test organization
async fn create_test_organization(conn: &mut AsyncPgConnection) -> Result<Organization> {
    let org_id = Uuid::new_v4();
    let random_suffix = Uuid::new_v4()
        .to_string()
        .chars()
        .take(8)
        .collect::<String>();
    let org = Organization {
        id: org_id,
        name: format!(
            "Test Org {} {}",
            Utc::now().timestamp_millis(),
            random_suffix
        ),
        domain: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    diesel::insert_into(organizations::table)
        .values(&org)
        .execute(conn)
        .await?;

    Ok(org)
}

// Helper function to create test user
async fn create_test_user(conn: &mut AsyncPgConnection, name: &str) -> Result<User> {
    let user_id = Uuid::new_v4();
    let random_suffix = Uuid::new_v4()
        .to_string()
        .chars()
        .take(8)
        .collect::<String>();
    let user = User {
        id: user_id,
        email: format!(
            "{}_{}_{}@example.com",
            name,
            Utc::now().timestamp_millis(),
            random_suffix
        ),
        name: Some(name.to_string()),
        config: serde_json::json!({}),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes: serde_json::json!({}),
        avatar_url: None,
    };

    diesel::insert_into(users::table)
        .values(&user)
        .execute(conn)
        .await?;

    Ok(user)
}

// Helper function to create user-org association with specific role
async fn add_user_to_org(
    conn: &mut AsyncPgConnection,
    user_id: Uuid,
    org_id: Uuid,
    role: UserOrganizationRole,
) -> Result<UserToOrganization> {
    let user_org = UserToOrganization {
        user_id,
        organization_id: org_id,
        role,
        sharing_setting: SharingSetting::Organization,
        edit_sql: true,
        upload_csv: true,
        export_assets: true,
        email_slack_enabled: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: user_id, // Created by the same user
        updated_by: user_id,
        deleted_by: None,
        status: UserOrganizationStatus::Active,
    };

    diesel::insert_into(users_to_organizations::table)
        .values(&user_org)
        .execute(conn)
        .await?;

    Ok(user_org)
}

// Helper function to create a test metric
async fn create_test_metric(
    conn: &mut AsyncPgConnection,
    org_id: Uuid,
    user_id: Uuid,
) -> Result<MetricFile> {

    // Create a chart config for a bar chart
    let create_chart_config = || -> ChartConfig {
        ChartConfig::Bar(BarLineChartConfig {
            base: BaseChartConfig {
                column_label_formats: std::collections::HashMap::new(),
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
                x: vec!["column1".to_string()],
                y: vec!["column2".to_string()],
                category: None,
                tooltip: None,
            },
            bar_layout: None,
            bar_sort_by: None,
            bar_group_type: None,
            bar_show_total_at_top: None,
            line_group_type: None,
        })
    };

    let metric_id = Uuid::new_v4();
    let metric = MetricFile {
        id: metric_id,
        name: "Test Metric".to_string(),
        file_name: "test_metric.yml".to_string(),
        content: MetricYml {
            name: "Test Metric".to_string(),
            description: Some("Test Description".to_string()),
            sql: "SELECT * FROM test".to_string(),
            time_frame: "last 30 days".to_string(),
            dataset_ids: vec![],
            chart_config: create_chart_config(),
            data_metadata: None,
        },
        verification: Verification::Verified,
        evaluation_obj: None,
        evaluation_summary: None,
        evaluation_score: None,
        organization_id: org_id,
        created_by: user_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: VersionHistory::new(
            1,
            MetricYml {
                name: "Test Metric".to_string(),
                description: Some("Test Description".to_string()),
                sql: "SELECT * FROM test".to_string(),
                time_frame: "last 30 days".to_string(),
                dataset_ids: vec![],
                chart_config: create_chart_config(),
                data_metadata: None,
            },
        ),
    };

    diesel::insert_into(metric_files::table)
        .values(&metric)
        .execute(conn)
        .await?;

    Ok(metric)
}

// Helper function to create an asset permission
async fn create_asset_permission(
    conn: &mut AsyncPgConnection,
    asset_id: Uuid,
    asset_type: AssetType,
    user_id: Uuid,
    role: AssetPermissionRole,
    created_by: Uuid,
) -> Result<AssetPermission> {
    let permission = AssetPermission {
        asset_id,
        asset_type,
        identity_id: user_id,
        identity_type: IdentityType::User,
        role,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        created_by,
        updated_by: created_by,
        deleted_at: None,
    };

    diesel::insert_into(asset_permissions::table)
        .values(&permission)
        .execute(conn)
        .await?;

    Ok(permission)
}

// Helper to get database connection
async fn get_connection() -> Result<AsyncPgConnection> {
    let database_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set for integration tests");

    let conn = diesel_async::AsyncConnection::establish(&database_url).await?;
    Ok(conn)
}

#[tokio::test]
async fn test_is_user_org_admin() -> Result<()> {
    let mut conn = match get_connection().await {
        Ok(conn) => conn,
        Err(_) => {
            println!("Skipping test_is_user_org_admin as it requires database setup");
            return Ok(());
        }
    };

    // Create organization
    let org = create_test_organization(&mut conn).await?;

    // Create admin user
    let admin_user = create_test_user(&mut conn, "admin").await?;
    add_user_to_org(
        &mut conn,
        admin_user.id,
        org.id,
        UserOrganizationRole::WorkspaceAdmin,
    )
    .await?;

    // Create regular user
    let regular_user = create_test_user(&mut conn, "regular").await?;
    add_user_to_org(
        &mut conn,
        regular_user.id,
        org.id,
        UserOrganizationRole::Querier,
    )
    .await?;

    // Create data admin
    let data_admin = create_test_user(&mut conn, "data_admin").await?;
    add_user_to_org(
        &mut conn,
        data_admin.id,
        org.id,
        UserOrganizationRole::DataAdmin,
    )
    .await?;

    // Test admin detection
    assert!(is_user_org_admin(&mut conn, &admin_user.id, &org.id).await?);
    assert!(!is_user_org_admin(&mut conn, &regular_user.id, &org.id).await?);
    assert!(is_user_org_admin(&mut conn, &data_admin.id, &org.id).await?);

    Ok(())
}

#[tokio::test]
async fn test_check_admin_access() -> Result<()> {
    let mut conn = match get_connection().await {
        Ok(conn) => conn,
        Err(_) => {
            println!("Skipping test_check_admin_access as it requires database setup");
            return Ok(());
        }
    };

    // Create organization
    let org = create_test_organization(&mut conn).await?;

    // Create admin user
    let admin_user = create_test_user(&mut conn, "admin2").await?;
    add_user_to_org(
        &mut conn,
        admin_user.id,
        org.id,
        UserOrganizationRole::WorkspaceAdmin,
    )
    .await?;

    // Create regular user
    let regular_user = create_test_user(&mut conn, "regular2").await?;
    add_user_to_org(
        &mut conn,
        regular_user.id,
        org.id,
        UserOrganizationRole::Querier,
    )
    .await?;

    // Create metric with regular user as owner
    let metric = create_test_metric(&mut conn, org.id, regular_user.id).await?;

    // Test admin access
    let admin_access = check_admin_access(
        &mut conn,
        &admin_user.id,
        &metric.id,
        &AssetType::MetricFile,
        AssetPermissionLevel::FullAccess,
    )
    .await?;

    assert!(admin_access.is_some());
    assert_eq!(admin_access.unwrap(), AssetPermissionLevel::FullAccess);

    // Test regular user (no admin access)
    let regular_access = check_admin_access(
        &mut conn,
        &regular_user.id,
        &metric.id,
        &AssetType::MetricFile,
        AssetPermissionLevel::FullAccess,
    )
    .await?;

    assert!(regular_access.is_none());

    // Test owner permission
    let owner_access = check_admin_access(
        &mut conn,
        &admin_user.id,
        &metric.id,
        &AssetType::MetricFile,
        AssetPermissionLevel::Owner,
    )
    .await?;

    // Owner permission requires explicit assignment
    assert!(owner_access.is_none());

    Ok(())
}

#[tokio::test]
#[ignore = "Test requires database setup and pool initialization"]
async fn test_has_permission_with_admin_check() -> Result<()> {
    let mut conn = match get_connection().await {
        Ok(conn) => conn,
        Err(_) => {
            println!("Skipping test_has_permission_with_admin_check as it requires database setup");
            return Ok(());
        }
    };

    // Create organization
    let org = create_test_organization(&mut conn).await?;

    // Create admin user
    let admin_user = create_test_user(&mut conn, "admin3").await?;
    add_user_to_org(
        &mut conn,
        admin_user.id,
        org.id,
        UserOrganizationRole::WorkspaceAdmin,
    )
    .await?;

    // Create regular user with permission
    let user_with_permission = create_test_user(&mut conn, "perm_user").await?;
    add_user_to_org(
        &mut conn,
        user_with_permission.id,
        org.id,
        UserOrganizationRole::Querier,
    )
    .await?;

    // Create regular user without permission
    let user_without_permission = create_test_user(&mut conn, "no_perm_user").await?;
    add_user_to_org(
        &mut conn,
        user_without_permission.id,
        org.id,
        UserOrganizationRole::Querier,
    )
    .await?;

    // Create metric
    let metric = create_test_metric(&mut conn, org.id, user_with_permission.id).await?;

    // Create explicit permission for one user
    create_asset_permission(
        &mut conn,
        metric.id,
        AssetType::MetricFile,
        user_with_permission.id,
        AssetPermissionRole::CanView,
        user_with_permission.id,
    )
    .await?;

    // Test admin can access without explicit permission
    let admin_has_access = has_permission_with_admin_check(
        &mut conn,
        &metric.id,
        &AssetType::MetricFile,
        &admin_user.id,
        AssetPermissionLevel::CanView,
    )
    .await?;

    assert!(admin_has_access);

    // Test regular user with permission
    let perm_user_has_access = has_permission_with_admin_check(
        &mut conn,
        &metric.id,
        &AssetType::MetricFile,
        &user_with_permission.id,
        AssetPermissionLevel::CanView,
    )
    .await?;

    assert!(perm_user_has_access);

    // Test regular user without permission
    let no_perm_user_has_access = has_permission_with_admin_check(
        &mut conn,
        &metric.id,
        &AssetType::MetricFile,
        &user_without_permission.id,
        AssetPermissionLevel::CanView,
    )
    .await?;

    assert!(!no_perm_user_has_access);

    Ok(())
}

#[tokio::test]
async fn test_get_asset_organization_id() -> Result<()> {
    let mut conn = match get_connection().await {
        Ok(conn) => conn,
        Err(_) => {
            println!("Skipping test_get_asset_organization_id as it requires database setup");
            return Ok(());
        }
    };

    // Create organization
    let org = create_test_organization(&mut conn).await?;

    // Create user
    let user = create_test_user(&mut conn, "asset_org_user").await?;
    add_user_to_org(&mut conn, user.id, org.id, UserOrganizationRole::Querier).await?;

    // Create metric
    let metric = create_test_metric(&mut conn, org.id, user.id).await?;

    // Test getting organization ID from metric
    let org_id = get_asset_organization_id(&mut conn, &metric.id, &AssetType::MetricFile).await?;

    assert_eq!(org_id, org.id);

    // Test deprecated asset type
    // For a deprecated asset type, we expect an error
    let deprecated_result = get_asset_organization_id(
        &mut conn,
        &Uuid::new_v4(),
        &AssetType::Dashboard, // Deprecated asset type
    )
    .await;

    // Should be an error for deprecated asset types
    assert!(
        deprecated_result.is_err(),
        "Deprecated asset type should return an error"
    );

    Ok(())
}

#[tokio::test]
async fn test_specific_asset_organization_id_functions() -> Result<()> {
    let mut conn = match get_connection().await {
        Ok(conn) => conn,
        Err(_) => {
            println!("Skipping test_specific_asset_organization_id_functions as it requires database setup");
            return Ok(());
        }
    };

    // Create organization
    let org = create_test_organization(&mut conn).await?;

    // Create user
    let user = create_test_user(&mut conn, "asset_specific_user").await?;
    add_user_to_org(&mut conn, user.id, org.id, UserOrganizationRole::Querier).await?;

    // Create metric
    let metric = create_test_metric(&mut conn, org.id, user.id).await?;

    // Test specific asset getter functions
    let metric_org_id = get_metric_organization_id(&mut conn, &metric.id).await?;
    assert_eq!(metric_org_id, org.id);

    // These should return errors since no assets of these types exist in our test
    let random_id = Uuid::new_v4();

    let collection_result = get_collection_organization_id(&mut conn, &random_id).await;
    assert!(collection_result.is_err());

    let dashboard_result = get_dashboard_organization_id(&mut conn, &random_id).await;
    assert!(dashboard_result.is_err());

    let chat_result = get_chat_organization_id(&mut conn, &random_id).await;
    assert!(chat_result.is_err());

    Ok(())
}

#[tokio::test]
#[ignore = "Test requires database setup and pool initialization"]
async fn test_check_permission_with_admin_override() -> Result<()> {
    let mut conn = match get_connection().await {
        Ok(conn) => conn,
        Err(_) => {
            println!(
                "Skipping test_check_permission_with_admin_override as it requires database setup"
            );
            return Ok(());
        }
    };

    // Create organization
    let org = create_test_organization(&mut conn).await?;

    // Create admin user
    let admin_user = create_test_user(&mut conn, "admin_check").await?;
    add_user_to_org(
        &mut conn,
        admin_user.id,
        org.id,
        UserOrganizationRole::WorkspaceAdmin,
    )
    .await?;

    // Create regular user
    let regular_user = create_test_user(&mut conn, "regular_check").await?;
    add_user_to_org(
        &mut conn,
        regular_user.id,
        org.id,
        UserOrganizationRole::Querier,
    )
    .await?;

    // Create metric
    let metric = create_test_metric(&mut conn, org.id, regular_user.id).await?;

    // Create identity info objects
    let admin_identity = IdentityInfo {
        id: admin_user.id,
        identity_type: IdentityType::User,
    };

    let regular_identity = IdentityInfo {
        id: regular_user.id,
        identity_type: IdentityType::User,
    };

    // Test admin permission check (admin should get access)
    // First check has_permission_with_admin_check directly
    let admin_direct_check = has_permission_with_admin_check(
        &mut conn,
        &metric.id,
        &AssetType::MetricFile,
        &admin_user.id,
        AssetPermissionLevel::CanView,
    )
    .await?;

    assert!(
        admin_direct_check,
        "Admin should have access through direct admin check"
    );

    // Then test the wrapper function check_permission_with_admin_override
    let admin_access = check_permission_with_admin_override(
        &mut conn,
        &admin_identity,
        metric.id,
        AssetType::MetricFile,
        &[AssetPermissionLevel::CanView],
    )
    .await?;

    assert!(
        admin_access,
        "Admin should have access through admin override"
    );

    // Test regular user without permission
    let regular_access = check_permission_with_admin_override(
        &mut conn,
        &regular_identity,
        metric.id,
        AssetType::MetricFile,
        &[AssetPermissionLevel::CanView],
    )
    .await?;

    // Regular user should not have access
    assert!(
        !regular_access,
        "Regular user should not have access without permission"
    );

    // Create explicit permission for regular user
    create_asset_permission(
        &mut conn,
        metric.id,
        AssetType::MetricFile,
        regular_user.id,
        AssetPermissionRole::CanView,
        regular_user.id,
    )
    .await?;

    // Test regular user with permission
    let regular_access_with_perm = check_permission_with_admin_override(
        &mut conn,
        &regular_identity,
        metric.id,
        AssetType::MetricFile,
        &[AssetPermissionLevel::CanView],
    )
    .await?;

    // Now they should have access
    assert!(
        regular_access_with_perm,
        "Regular user should have access with explicit permission"
    );

    // Test admin with other organization's asset
    let other_org = create_test_organization(&mut conn).await?;
    let other_user = create_test_user(&mut conn, "other_org_user").await?;
    add_user_to_org(
        &mut conn,
        other_user.id,
        other_org.id,
        UserOrganizationRole::Querier,
    )
    .await?;
    let other_metric = create_test_metric(&mut conn, other_org.id, other_user.id).await?;

    // Test direct admin check function
    let admin_direct_other_check = has_permission_with_admin_check(
        &mut conn,
        &other_metric.id,
        &AssetType::MetricFile,
        &admin_user.id,
        AssetPermissionLevel::CanView,
    )
    .await?;

    assert!(
        !admin_direct_other_check,
        "Admin should not have access to other org's assets through direct check"
    );

    // Admin of org1 should not have access to org2's assets
    let admin_other_org_access = check_permission_with_admin_override(
        &mut conn,
        &admin_identity,
        other_metric.id,
        AssetType::MetricFile,
        &[AssetPermissionLevel::CanView],
    )
    .await?;

    // Should not have access to other org's assets
    assert!(!admin_other_org_access);

    Ok(())
}
