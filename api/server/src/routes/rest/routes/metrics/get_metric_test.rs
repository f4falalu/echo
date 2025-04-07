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
    use diesel::prelude::*;
    use diesel::ExpressionMethods;

    use super::GetMetricQueryParams;
    use super::get_metric_rest_handler;

    #[tokio::test]
    async fn test_metric_not_found() -> Result<()> {
        // Setup test environment
        let setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
        
        // Test with a non-existent metric ID
        let non_existent_id = Uuid::new_v4();
        let params = GetMetricQueryParams { version_number: None };
        
        // Call the handler directly
        let result = get_metric_rest_handler(
            Extension(setup.user),
            Path(non_existent_id),
            Query(params)
        ).await;
        
        // Verify we get the correct 404 status code
        assert!(matches!(result, Err((StatusCode::NOT_FOUND, _))), 
            "Expected NOT_FOUND status code for non-existent metric");
        
        setup.db.cleanup().await?;
        Ok(())
    }

    #[tokio::test]
    async fn test_metric_permission_denied() -> Result<()> {
        // Setup test environment with two users
        let admin_setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
        let viewer_setup = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
        
        // Admin creates a metric
        let metric = AssetTestHelpers::create_test_metric(&admin_setup.db, "Test Metric").await?;
        
        // Set permission for the admin but not for the viewer
        PermissionTestHelpers::create_user_permission(
            &admin_setup.db,
            metric.id,
            AssetType::MetricFile,
            admin_setup.user.id,
            AssetPermissionRole::Owner
        ).await?;
        
        // Try to access with viewer (who doesn't have permission)
        let params = GetMetricQueryParams { version_number: None };
        
        // Call the handler directly with viewer
        let result = get_metric_rest_handler(
            Extension(viewer_setup.user),
            Path(metric.id),
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
    async fn test_metric_version_not_found() -> Result<()> {
        // Setup test environment
        let setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
        
        // Create a metric
        let metric = AssetTestHelpers::create_test_metric_with_permission(
            &setup.db,
            "Test Metric",
            setup.user.id,
            AssetPermissionRole::Owner
        ).await?;
        
        // Try to access with a non-existent version
        let params = GetMetricQueryParams { version_number: Some(999) };
        
        // Call the handler directly
        let result = get_metric_rest_handler(
            Extension(setup.user),
            Path(metric.id),
            Query(params)
        ).await;
        
        // Verify we get the correct 404 status code
        assert!(matches!(result, Err((StatusCode::NOT_FOUND, _))), 
            "Expected NOT_FOUND status code for non-existent version");
        
        setup.db.cleanup().await?;
        Ok(())
    }

    #[tokio::test]
    async fn test_metric_password_required() -> Result<()> {
        // Setup test environment
        let setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
        
        // Create a metric
        let mut metric = AssetTestHelpers::create_test_metric_with_permission(
            &setup.db,
            "Password Protected Metric",
            setup.user.id,
            AssetPermissionRole::Owner
        ).await?;
        
        // Create another user who won't have direct permission
        let other_setup = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
        
        // Make the metric public with password protection
        let mut conn = setup.db.pool.get().await?;
        diesel::update(database::schema::metric_files::table)
            .filter(database::schema::metric_files::id.eq(metric.id))
            .set((
                database::schema::metric_files::publicly_accessible.eq(true),
                database::schema::metric_files::publicly_enabled_by.eq(Some(setup.user.id)),
                database::schema::metric_files::public_password.eq(Some("secret123".to_string())),
            ))
            .execute(&mut conn)
            .await?;
        
        // Try to access without providing password
        let params = GetMetricQueryParams { 
            version_number: None,
            password: None
        };
        
        // Call the handler directly with the other user
        let result = get_metric_rest_handler(
            Extension(other_setup.user),
            Path(metric.id),
            Query(params)
        ).await;
        
        // Verify we get the correct 418 IM_A_TEAPOT status code
        assert!(matches!(result, Err((StatusCode::IM_A_TEAPOT, _))), 
            "Expected IM_A_TEAPOT status code for missing password");
        
        // Try with wrong password
        let params = GetMetricQueryParams { 
            version_number: None,
            password: Some("wrong".to_string())
        };
        
        let result = get_metric_rest_handler(
            Extension(other_setup.user.clone()),
            Path(metric.id),
            Query(params)
        ).await;
        
        // Should still get error
        assert!(result.is_err());
        
        // Now try with correct password
        let params = GetMetricQueryParams { 
            version_number: None,
            password: Some("secret123".to_string())
        };
        
        let result = get_metric_rest_handler(
            Extension(other_setup.user),
            Path(metric.id),
            Query(params)
        ).await;
        
        // Should succeed
        assert!(result.is_ok());
        
        setup.db.cleanup().await?;
        other_setup.db.cleanup().await?;
        Ok(())
    }
}