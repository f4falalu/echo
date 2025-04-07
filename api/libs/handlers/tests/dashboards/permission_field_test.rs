use anyhow::Result;
use database::enums::{AssetPermissionRole, AssetType, IdentityType};
use database::models::{AssetPermission, DashboardFile};
use database::pool::get_pg_pool;
use database::schema::{asset_permissions, dashboard_files};
use database::models::UserToOrganization;
use database::types::{DashboardYml, VersionHistory};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use handlers::dashboards::get_dashboard_handler;
use std::collections::HashMap;
use uuid::Uuid;

/// Helper function to create a test dashboard file
async fn create_test_dashboard(
    organization_id: Uuid,
    user_id: Uuid,
    name: &str,
) -> Result<DashboardFile> {
    let mut conn = get_pg_pool().get().await?;
    let dashboard_id = Uuid::new_v4();
    
    // Create a simple dashboard content
    let content = DashboardYml {
        name: name.to_string(),
        description: Some(format!("Test dashboard description for {}", name)),
        rows: Vec::new(),
    };
    
    let dashboard_file = DashboardFile {
        id: dashboard_id,
        name: name.to_string(),
        file_name: format!("{}.yml", name.to_lowercase().replace(" ", "_")),
        content,
        filter: None,
        organization_id,
        created_by: user_id,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        version_history: VersionHistory(HashMap::new()),
        public_password: None,
    };
    
    diesel::insert_into(dashboard_files::table)
        .values(&dashboard_file)
        .execute(&mut conn)
        .await?;
        
    Ok(dashboard_file)
}

/// Helper function to add permission for a dashboard
async fn add_permission(
    asset_id: Uuid,
    user_id: Uuid,
    role: AssetPermissionRole,
    created_by: Uuid,
) -> Result<()> {
    let mut conn = get_pg_pool().get().await?;
    
    let permission = AssetPermission {
        identity_id: user_id,
        identity_type: IdentityType::User,
        asset_id,
        asset_type: AssetType::DashboardFile,
        role,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by,
        updated_by: created_by,
    };
    
    diesel::insert_into(asset_permissions::table)
        .values(&permission)
        .execute(&mut conn)
        .await?;
        
    Ok(())
}

/// Test to ensure permission fields in dashboard response match the permission used for access control
#[tokio::test]
async fn test_dashboard_permission_field_consistency() -> Result<()> {
    // Create user and organization for testing
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test dashboard
    let dashboard = create_test_dashboard(
        org_id, 
        user_id, 
        "Test Permission Dashboard"
    ).await?;
    
    // Add permission for asset
    add_permission(
        dashboard.id, 
        user_id, 
        AssetPermissionRole::Owner,
        user_id
    ).await?;
    
    // Create middleware user
    let middleware_user = middleware::AuthenticatedUser {
        id: user_id,
        email: "test@example.com".to_string(),
        name: Some("Test User".to_string()),
        config: serde_json::json!({}),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        attributes: serde_json::json!({}),
        avatar_url: None,
        organizations: vec![
            middleware::OrganizationMembership {
                id: org_id,
                role: database::enums::UserOrganizationRole::WorkspaceAdmin,
            },
        ],
        teams: vec![],
    };
    
    // Get dashboard with the user who has owner permission
    let dashboard_response = get_dashboard_handler(&dashboard.id, &middleware_user, None).await?;
    
    // Check if permission fields are consistent
    assert_eq!(dashboard_response.permission, AssetPermissionRole::Owner);
    assert_eq!(dashboard_response.access, AssetPermissionRole::Owner);
    
    Ok(())
}

/// Test to ensure public dashboards grant CanView permission to users without direct permissions
#[tokio::test]
async fn test_public_dashboard_permission_field() -> Result<()> {
    // Create user and organization for testing
    let owner_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create test dashboard
    let dashboard = create_test_dashboard(
        org_id, 
        owner_id, 
        "Public Dashboard"
    ).await?;
    
    // Make dashboard public
    let mut conn = get_pg_pool().get().await?;
    diesel::update(dashboard_files::table)
        .filter(dashboard_files::id.eq(dashboard.id))
        .set((
            dashboard_files::publicly_accessible.eq(true),
            dashboard_files::publicly_enabled_by.eq(Some(owner_id)),
            dashboard_files::public_expiry_date.eq(Some(chrono::Utc::now() + chrono::Duration::days(7))),
        ))
        .execute(&mut conn)
        .await?;
    
    // Create another user
    let other_user_id = Uuid::new_v4();
    
    // Add user to organization with viewer role
    let user_org = UserToOrganization {
        user_id: other_user_id,
        organization_id: org_id,
        role: database::enums::UserOrganizationRole::Viewer,
        sharing_setting: database::enums::SharingSetting::None,
        edit_sql: true,
        upload_csv: true,
        export_assets: true,
        email_slack_enabled: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by: owner_id,
        updated_by: owner_id,
        deleted_by: None,
        status: database::enums::UserOrganizationStatus::Active,
    };
    
    diesel::insert_into(database::schema::users_to_organizations::table)
        .values(&user_org)
        .execute(&mut conn)
        .await?;
    
    // Create middleware user for other user
    let other_middleware_user = middleware::AuthenticatedUser {
        id: other_user_id,
        email: "other@example.com".to_string(),
        name: Some("Other User".to_string()),
        config: serde_json::json!({}),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        attributes: serde_json::json!({}),
        avatar_url: None,
        organizations: vec![
            middleware::OrganizationMembership {
                id: org_id,
                role: database::enums::UserOrganizationRole::Viewer,
            },
        ],
        teams: vec![],
    };
    
    // Get dashboard with the other user who doesn't have direct permission
    let dashboard_response = get_dashboard_handler(&dashboard.id, &other_middleware_user, None).await?;
    
    // Public assets should have CanView permission by default
    assert_eq!(dashboard_response.permission, AssetPermissionRole::CanView);
    assert_eq!(dashboard_response.access, AssetPermissionRole::CanView);
    
    Ok(())
}

/// Test to ensure access is denied for users without permissions and non-public dashboards
#[tokio::test]
async fn test_dashboard_permission_denied() -> Result<()> {
    // Create user and organization for testing
    let owner_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    
    // Create a private test dashboard
    let dashboard = create_test_dashboard(
        org_id, 
        owner_id, 
        "Private Dashboard"
    ).await?;
    
    // Create another user in a different organization
    let other_user_id = Uuid::new_v4();
    let other_org_id = Uuid::new_v4();
    
    // Create middleware user for other user
    let other_middleware_user = middleware::AuthenticatedUser {
        id: other_user_id,
        email: "other@example.com".to_string(),
        name: Some("Other User".to_string()),
        config: serde_json::json!({}),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        attributes: serde_json::json!({}),
        avatar_url: None,
        organizations: vec![
            middleware::OrganizationMembership {
                id: other_org_id,
                role: database::enums::UserOrganizationRole::Viewer,
            },
        ],
        teams: vec![],
    };
    
    // Try to get dashboard with a user who has no permissions
    let result = get_dashboard_handler(&dashboard.id, &other_middleware_user, None).await;
    
    // Should be denied access
    assert!(result.is_err());
    let error = result.unwrap_err();
    assert!(error.to_string().contains("You don't have permission"));
    
    Ok(())
}