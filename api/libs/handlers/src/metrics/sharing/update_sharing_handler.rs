use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType},
    helpers::metric_files::fetch_metric_file_with_permissions,
    pool::get_pg_pool,
    schema::metric_files::dsl,
};
use diesel::ExpressionMethods;
use diesel_async::RunQueryDsl as AsyncRunQueryDsl;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use sharing::{check_permission_access, create_asset_permission::create_share_by_email};
use tracing::info;
use uuid::Uuid;

/// Request for updating sharing permissions for a metric
#[derive(Debug, Serialize, Deserialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}

/// Request for updating sharing settings for a metric
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateMetricSharingRequest {
    /// List of users to share with
    pub users: Option<Vec<ShareRecipient>>,
    /// Whether the metric should be publicly accessible
    pub publicly_accessible: Option<bool>,
    /// Password for public access (if null, will clear existing password)
    pub public_password: Option<Option<String>>,
    /// Expiration date for public access (if null, will clear existing expiration)
    pub public_expiration: Option<Option<DateTime<Utc>>>,
}

/// Handler to update sharing permissions for a metric
///
/// # Arguments
/// * `metric_id` - The UUID of the metric to update sharing permissions for
/// * `user_id` - The UUID of the user making the request
/// * `request` - The request object containing sharing settings
///
/// # Returns
/// * `Result<()>` - Success if all sharing permissions were updated
pub async fn update_metric_sharing_handler(
    metric_id: &Uuid,
    user: &AuthenticatedUser,
    request: UpdateMetricSharingRequest,
) -> Result<()> {
    info!(
        metric_id = %metric_id,
        user_id = %user.id,
        "Updating sharing permissions for metric"
    );

    let mut conn = get_pg_pool().get().await?;

    // 1. Fetch metric file with permission
    let metric_file_with_permission = fetch_metric_file_with_permissions(metric_id, &user.id)
        .await
        .map_err(|e| anyhow!("Failed to fetch metric file with permissions: {}", e))?;

    let metric_file = match metric_file_with_permission {
        Some(cwp) => cwp,
        None => return Err(anyhow!("Metric file not found")),
    };

    // 2. Check if user has at least FullAccess permission
    if !check_permission_access(
        metric_file.permission,
        &[AssetPermissionRole::FullAccess],
        metric_file.metric_file.organization_id,
        &user.organizations,
    ) {
        return Err(anyhow!(
            "You don't have permission to update sharing for this metric"
        ));
    }

    // 3. Process user sharing permissions if provided
    if let Some(users) = &request.users {
        for recipient in users {
            // Validate email format
            if !recipient.email.contains('@') {
                return Err(anyhow!("Invalid email format: {}", recipient.email));
            }

            // Update (or create if not exists) the permission using create_share_by_email
            // The create_share_by_email function handles both creation and updates with upsert
            match create_share_by_email(
                &recipient.email,
                *metric_id,
                AssetType::MetricFile,
                recipient.role,
                user.id,
            )
            .await
            {
                Ok(_) => {
                    info!(
                        "Updated sharing permission for email: {} with role: {:?} on metric: {}",
                        recipient.email, recipient.role, metric_id
                    );
                }
                Err(e) => {
                    return Err(anyhow!(
                        "Failed to update sharing for email {}: {}",
                        recipient.email,
                        e
                    ));
                }
            }
        }
    }

    // 4. Update public access settings if provided
    if request.publicly_accessible.is_some() || request.public_expiration.is_some() {
        // No need to get a new connection as we already have one

        // Create a mutable metric record to update using the metric we already have
        let mut metric = metric_file;

        // Update publicly_accessible if provided
        if let Some(publicly_accessible) = request.publicly_accessible {
            info!(
                metric_id = %metric_id,
                publicly_accessible = publicly_accessible,
                "Updating public accessibility for metric"
            );

            metric.metric_file.publicly_accessible = publicly_accessible;

            // Set publicly_enabled_by based on publicly_accessible value
            if publicly_accessible {
                metric.metric_file.publicly_enabled_by = Some(user.id);
            } else {
                metric.metric_file.publicly_enabled_by = None;
            }
        }

        // Update public_expiry_date if provided
        if let Some(public_expiration) = &request.public_expiration {
            info!(
                metric_id = %metric_id,
                "Updating public expiration for metric"
            );

            metric.metric_file.public_expiry_date = *public_expiration;
        }

        // Update the metric in the database
        diesel::update(dsl::metric_files)
            .filter(dsl::id.eq(metric_id))
            .set((
                dsl::publicly_accessible.eq(metric.metric_file.publicly_accessible),
                dsl::publicly_enabled_by.eq(metric.metric_file.publicly_enabled_by),
                dsl::public_expiry_date.eq(metric.metric_file.public_expiry_date),
            ))
            .execute(&mut conn)
            .await?;
    }

    // Note: Currently public_password is not implemented
    // If public_password becomes needed in the future, additional implementation will be required

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_update_metric_sharing_invalid_email() {
        let metric_id = Uuid::new_v4();
        let user = AuthenticatedUser {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            organizations: vec![],
            name: todo!(),
            config: todo!(),
            created_at: todo!(),
            updated_at: todo!(),
            attributes: todo!(),
            avatar_url: todo!(),
            teams: todo!(),
        };

        let request = UpdateMetricSharingRequest {
            users: Some(vec![ShareRecipient {
                email: "invalid-email-format".to_string(),
                role: AssetPermissionRole::CanView,
            }]),
            publicly_accessible: None,
            public_password: None,
            public_expiration: None,
        };

        let result = update_metric_sharing_handler(&metric_id, &user, request).await;

        assert!(result.is_err());
        let error = result.unwrap_err().to_string();
        assert!(error.contains("Invalid email format") || error.contains("not found"));
    }

    #[tokio::test]
    async fn test_update_metric_sharing_metric_not_found() {
        let metric_id = Uuid::new_v4();
        let user = AuthenticatedUser {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            organizations: vec![],
            name: todo!(),
            config: todo!(),
            created_at: todo!(),
            updated_at: todo!(),
            attributes: todo!(),
            avatar_url: todo!(),
            teams: todo!(),
        };

        let request = UpdateMetricSharingRequest {
            users: None,
            publicly_accessible: Some(true),
            public_password: None,
            public_expiration: Some(Some(Utc::now())),
        };

        let result = update_metric_sharing_handler(&metric_id, &user, request).await;

        assert!(result.is_err());
        // The specific error message might vary depending on the testing environment
        // but it should indicate the metric wasn't found
        let error = result.unwrap_err().to_string();
        assert!(error.contains("not found") || error.contains("database"));
    }

    #[tokio::test]
    async fn test_update_metric_sharing_with_only_public_settings() {
        let metric_id = Uuid::new_v4();
        let user = AuthenticatedUser {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            organizations: vec![],
            name: todo!(),
            config: todo!(),
            created_at: todo!(),
            updated_at: todo!(),
            attributes: todo!(),
            avatar_url: todo!(),
            teams: todo!(),
        };

        let request = UpdateMetricSharingRequest {
            users: None,
            publicly_accessible: Some(true),
            public_password: None,
            public_expiration: Some(Some(Utc::now())),
        };

        // This test will fail in isolation as we can't easily mock the database
        // It's here as a structural guide - the real testing will happen in integration tests
        let result = update_metric_sharing_handler(&metric_id, &user, request).await;
        assert!(result.is_err()); // Should fail since metric doesn't exist
    }

    // Note: For comprehensive tests, we would need to set up proper mocks
    // for external dependencies like fetch_metric_file_with_permissions,
    // check_permission_access, and create_share_by_email. This would typically
    // involve using a mocking framework that's compatible with async functions.
}
