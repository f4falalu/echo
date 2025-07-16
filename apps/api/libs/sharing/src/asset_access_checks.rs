use database::enums::{AssetPermissionRole, AssetType, IdentityType, UserOrganizationRole};
use database::pool::get_pg_pool;
use database::schema::{asset_permissions, dashboard_files, metric_files_to_dashboard_files};
use diesel::{BoolExpressionMethods, ExpressionMethods, JoinOnDsl, QueryDsl, OptionalExtension};
use diesel_async::RunQueryDsl;
use middleware::OrganizationMembership;
use uuid::Uuid;

/// Checks if a user has sufficient permissions based on organization roles and asset permissions.
///
/// # Arguments
/// * `current_permission_level` - Optional current permission level of the user for the asset
/// * `required_permission_level` - Required permission level to access the asset
/// * `organization_id` - UUID of the organization
/// * `organization_role_grants` - Array of tuples containing (UUID, UserOrganizationRole) for the user
///
/// # Returns
/// * `bool` - True if the user has sufficient permissions, false otherwise
pub fn check_permission_access(
    current_permission_level: Option<AssetPermissionRole>,
    required_permission_level: &[AssetPermissionRole],
    organization_id: Uuid,
    organization_role_grants: &[OrganizationMembership],
) -> bool {
    // First check if the user has WorkspaceAdmin or DataAdmin role for the organization
    for org in organization_role_grants {
        if org.id == organization_id
            && (org.role == UserOrganizationRole::WorkspaceAdmin
                || org.role == UserOrganizationRole::DataAdmin)
        {
            return true;
        }
    }

    // Then check if the user has the required permission level
    if let Some(permission) = current_permission_level {
        if required_permission_level.contains(&permission) {
            return true;
        }
    }

    // If none of the above conditions are met, return false
    false
}

/// Checks if a user has access to a metric through any associated dashboard.
///
/// This function is used to implement permission cascading from dashboards to metrics.
/// If a user has access to any dashboard containing the metric (either through direct permissions
/// or if the dashboard is public), they get at least CanView permission.
///
/// # Arguments
/// * `metric_id` - UUID of the metric to check
/// * `user_id` - UUID of the user to check permissions for
///
/// # Returns
/// * `Result<bool>` - True if the user has access to any dashboard containing the metric, false otherwise
pub async fn check_metric_dashboard_access(
    metric_id: &Uuid,
    user_id: &Uuid,
) -> Result<bool, diesel::result::Error> {
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        diesel::result::Error::DatabaseError(
            diesel::result::DatabaseErrorKind::UnableToSendCommand,
            Box::new(e.to_string()),
        )
    })?;

    // First check if user has direct access to any dashboard containing this metric
    let has_direct_access = metric_files_to_dashboard_files::table
        .inner_join(
            dashboard_files::table
                .on(dashboard_files::id.eq(metric_files_to_dashboard_files::dashboard_file_id)),
        )
        .inner_join(
            asset_permissions::table.on(
                asset_permissions::asset_id.eq(dashboard_files::id)
                    .and(asset_permissions::asset_type.eq(AssetType::DashboardFile))
                    .and(asset_permissions::identity_id.eq(user_id))
                    .and(asset_permissions::identity_type.eq(IdentityType::User))
                    .and(asset_permissions::deleted_at.is_null())
            ),
        )
        .filter(metric_files_to_dashboard_files::metric_file_id.eq(metric_id))
        .filter(dashboard_files::deleted_at.is_null())
        .filter(metric_files_to_dashboard_files::deleted_at.is_null())
        .select(dashboard_files::id)
        .first::<Uuid>(&mut conn)
        .await
        .optional()?;

    if has_direct_access.is_some() {
        return Ok(true);
    }

    // Now check if metric belongs to any PUBLIC dashboard (not expired)
    let now = chrono::Utc::now();
    let has_public_access = metric_files_to_dashboard_files::table
        .inner_join(
            dashboard_files::table
                .on(dashboard_files::id.eq(metric_files_to_dashboard_files::dashboard_file_id)),
        )
        .filter(metric_files_to_dashboard_files::metric_file_id.eq(metric_id))
        .filter(dashboard_files::deleted_at.is_null())
        .filter(metric_files_to_dashboard_files::deleted_at.is_null())
        .filter(dashboard_files::publicly_accessible.eq(true))
        .filter(
            dashboard_files::public_expiry_date
                .is_null()
                .or(dashboard_files::public_expiry_date.gt(now)),
        )
        .select(dashboard_files::id)
        .first::<Uuid>(&mut conn)
        .await
        .optional()?;

    Ok(has_public_access.is_some())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_workspace_admin_access() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::WorkspaceAdmin
        }];

        assert!(check_permission_access(
            None,
            &[AssetPermissionRole::Owner],
            org_id,
            &grants
        ));
    }

    #[test]
    fn test_data_admin_access() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::DataAdmin
        }];

        assert!(check_permission_access(
            None,
            &[AssetPermissionRole::Owner],
            org_id,
            &grants
        ));
    }

    #[test]
    fn test_matching_permission_level() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::Viewer
        }];

        assert!(check_permission_access(
            Some(AssetPermissionRole::CanEdit),
            &[AssetPermissionRole::CanEdit],
            org_id,
            &grants
        ));
    }

    #[test]
    fn test_insufficient_permissions() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::Viewer
        }];

        assert!(!check_permission_access(
            Some(AssetPermissionRole::CanView),
            &[AssetPermissionRole::CanEdit],
            org_id,
            &grants
        ));
    }

    #[test]
    fn test_no_permissions() {
        let org_id = Uuid::new_v4();
        let grants = vec![OrganizationMembership {
            id: org_id,
            role: UserOrganizationRole::Viewer
        }];

        assert!(!check_permission_access(
            None,
            &[AssetPermissionRole::CanView],
            org_id,
            &grants
        ));
    }
}
