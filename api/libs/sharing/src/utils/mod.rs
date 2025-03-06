use anyhow::Result;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::{
    models::Share,
    ShareableResource,
    SharePermission,
    Error,
};

/// Creates a new sharing record
pub async fn create_share(
    conn: &mut diesel_async::AsyncPgConnection,
    resource: ShareableResource,
    shared_by: Uuid,
    shared_with: Uuid,
    permission: SharePermission,
) -> Result<Share> {
    use crate::models::sharing::dsl::*;

    // Check if sharing already exists
    let existing = sharing
        .filter(resource_id.eq(match &resource {
            ShareableResource::Metric(id) |
            ShareableResource::Dashboard(id) |
            ShareableResource::Collection(id) |
            ShareableResource::Chat(id) => id,
        }))
        .filter(shared_with.eq(shared_with))
        .first::<Share>(conn)
        .await
        .optional()?;

    if existing.is_some() {
        return Err(Error::AlreadyShared("Resource already shared with this user".to_string()).into());
    }

    let share = Share::new(resource, shared_by, shared_with, permission, None);
    diesel::insert_into(sharing)
        .values(&share)
        .get_result(conn)
        .await
        .map_err(Into::into)
}

/// Checks if a user has access to a resource
pub async fn check_access(
    conn: &mut diesel_async::AsyncPgConnection,
    resource: &ShareableResource,
    user_id: Uuid,
    required_permission: SharePermission,
) -> Result<bool> {
    use crate::models::sharing::dsl::*;

    let resource_id_val = match resource {
        ShareableResource::Metric(id) |
        ShareableResource::Dashboard(id) |
        ShareableResource::Collection(id) |
        ShareableResource::Chat(id) => *id,
    };

    let share = sharing
        .filter(resource_id.eq(resource_id_val))
        .filter(shared_with.eq(user_id))
        .first::<Share>(conn)
        .await
        .optional()?;

    Ok(match share {
        Some(share) => {
            match (share.permission.as_str(), required_permission) {
                (_, SharePermission::View) => true,
                ("admin", _) => true,
                ("edit", SharePermission::Edit) => true,
                _ => false,
            }
        }
        None => false,
    })
}

/// Removes a sharing record
pub async fn remove_share(
    conn: &mut diesel_async::AsyncPgConnection,
    resource: &ShareableResource,
    shared_with: Uuid,
) -> Result<bool> {
    use crate::models::sharing::dsl::*;

    let resource_id_val = match resource {
        ShareableResource::Metric(id) |
        ShareableResource::Dashboard(id) |
        ShareableResource::Collection(id) |
        ShareableResource::Chat(id) => *id,
    };

    let deleted = diesel::delete(sharing)
        .filter(resource_id.eq(resource_id_val))
        .filter(shared_with.eq(shared_with))
        .execute(conn)
        .await?;

    Ok(deleted > 0)
}

/// Lists all shares for a resource
pub async fn list_shares(
    conn: &mut diesel_async::AsyncPgConnection,
    resource: &ShareableResource,
) -> Result<Vec<Share>> {
    use crate::models::sharing::dsl::*;

    let resource_id_val = match resource {
        ShareableResource::Metric(id) |
        ShareableResource::Dashboard(id) |
        ShareableResource::Collection(id) |
        ShareableResource::Chat(id) => *id,
    };

    sharing
        .filter(resource_id.eq(resource_id_val))
        .load::<Share>(conn)
        .await
        .map_err(Into::into)
} 