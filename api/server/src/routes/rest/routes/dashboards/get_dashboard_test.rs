#[cfg(test)]
mod tests {
    use anyhow::Result;
    use axum::extract::{Extension, Path, Query};
    use axum::http::StatusCode;
    use uuid::Uuid;
    use database::enums::{AssetPermissionRole, AssetType, UserOrganizationRole};
    use database::tests::common::db::TestSetup;
    use database::tests::common::assets::AssetTestHelpers;
    use database::tests::common::permissions::PermissionTestHelpers;
    use middleware::AuthenticatedUser;

    use super::GetDashboardQueryParams;
    use super::get_dashboard_rest_handler;

    #[tokio::test]
    async fn test_dashboard_not_found() -> Result<()> {
        // Setup test environment
        let setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
        
        // Test with a non-existent dashboard ID
        let non_existent_id = Uuid::new_v4();
        let params = GetDashboardQueryParams { version_number: None };
        
        // Call the handler directly
        let result = get_dashboard_rest_handler(
            Extension(setup.user),
            Path(non_existent_id),
            Query(params)
        ).await;
        
        // Verify we get the correct 404 status code
        assert!(matches!(result, Err((StatusCode::NOT_FOUND, _))), 
            "Expected NOT_FOUND status code for non-existent dashboard");
        
        setup.db.cleanup().await?;
        Ok(())
    }

    #[tokio::test]
    async fn test_dashboard_permission_denied() -> Result<()> {
        // Setup test environment with two users
        let admin_setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
        let viewer_setup = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
        
        // Admin creates a dashboard
        let dashboard = AssetTestHelpers::create_test_dashboard(&admin_setup.db, "Test Dashboard").await?;
        
        // Set permission for the admin but not for the viewer
        PermissionTestHelpers::create_user_permission(
            &admin_setup.db,
            dashboard.id,
            AssetType::DashboardFile,
            admin_setup.user.id,
            AssetPermissionRole::Owner
        ).await?;
        
        // Try to access with viewer (who doesn't have permission)
        let params = GetDashboardQueryParams { version_number: None };
        
        // Call the handler directly with viewer
        let result = get_dashboard_rest_handler(
            Extension(viewer_setup.user),
            Path(dashboard.id),
            Query(params)
        ).await;
        
        // Verify we get the correct 403 status code
        assert!(matches!(result, Err((StatusCode::FORBIDDEN, _))), 
            "Expected FORBIDDEN status code for unauthorized access");
        
        admin_setup.db.cleanup().await?;
        viewer_setup.db.cleanup().await?;
        Ok(())
    }

    #[tokio::test]
    async fn test_dashboard_version_not_found() -> Result<()> {
        // Setup test environment
        let setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
        
        // Create a dashboard
        let dashboard = AssetTestHelpers::create_test_dashboard_with_permission(
            &setup.db,
            "Test Dashboard",
            setup.user.id,
            AssetPermissionRole::Owner
        ).await?;
        
        // Try to access with a non-existent version
        let params = GetDashboardQueryParams { version_number: Some(999) };
        
        // Call the handler directly
        let result = get_dashboard_rest_handler(
            Extension(setup.user),
            Path(dashboard.id),
            Query(params)
        ).await;
        
        // Verify we get the correct 404 status code
        assert!(matches!(result, Err((StatusCode::NOT_FOUND, _))), 
            "Expected NOT_FOUND status code for non-existent version");
        
        setup.db.cleanup().await?;
        Ok(())
    }

    // Note: We can't easily test the public_password required case
    // in unit tests since it requires configuring the dashboard with a public password,
    // which would need additional setup. This would be better tested at the API level.
}