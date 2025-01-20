use anyhow::Result;
use axum::http::StatusCode;
use axum::Extension;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use crate::database::lib::get_pg_pool;
use crate::database::models::{PermissionGroup, User};
use crate::database::schema::permission_groups;
use crate::routes::rest::ApiResponse;
use crate::utils::user::user_info::get_user_organization_id;

#[derive(Debug, Serialize)]
pub struct PermissionGroupInfo {
    pub id: Uuid,
    pub name: String,
    pub organization_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn list_permission_groups(
    Extension(user): Extension<User>,
) -> Result<ApiResponse<Vec<PermissionGroupInfo>>, (StatusCode, &'static str)> {
    let permission_groups = match list_permission_groups_handler(user).await {
        Ok(groups) => groups,
        Err(e) => {
            tracing::error!("Error listing permission groups: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error listing permission groups",
            ));
        }
    };

    Ok(ApiResponse::JsonData(permission_groups))
}

async fn list_permission_groups_handler(user: User) -> Result<Vec<PermissionGroupInfo>> {
    let mut conn = get_pg_pool().get().await?;
    let organization_id = get_user_organization_id(&user.id).await?;

    let groups: Vec<PermissionGroup> = permission_groups::table
        .filter(permission_groups::organization_id.eq(organization_id))
        .filter(permission_groups::deleted_at.is_null())
        .order_by(permission_groups::created_at.desc())
        .load(&mut *conn)
        .await?;

    Ok(groups
        .into_iter()
        .map(|group| PermissionGroupInfo {
            id: group.id,
            name: group.name,
            organization_id: group.organization_id,
            created_at: group.created_at,
            updated_at: group.updated_at,
        })
        .collect())
}
