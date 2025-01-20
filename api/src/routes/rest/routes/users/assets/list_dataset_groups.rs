use anyhow::Result;
use axum::http::StatusCode;
use axum::Extension;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use crate::database::lib::get_pg_pool;
use crate::database::models::User;
use crate::database::schema::{dataset_groups, dataset_permissions};
use crate::routes::rest::ApiResponse;
use crate::utils::user::user_info::get_user_organization_id;

#[derive(Debug, Serialize)]
pub struct DatasetGroupInfo {
    pub id: Uuid,
    pub name: String,
    pub permission_id: i32,
    pub assigned: bool,
}

pub async fn list_dataset_groups(
    Extension(user): Extension<User>,
) -> Result<ApiResponse<Vec<DatasetGroupInfo>>, (StatusCode, &'static str)> {
    let dataset_groups = match list_dataset_groups_handler(user).await {
        Ok(groups) => groups,
        Err(e) => {
            tracing::error!("Error listing dataset groups: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error listing dataset groups",
            ));
        }
    };

    Ok(ApiResponse::JsonData(dataset_groups))
}

async fn list_dataset_groups_handler(user: User) -> Result<Vec<DatasetGroupInfo>> {
    let mut conn = get_pg_pool().get().await?;
    let organization_id = get_user_organization_id(&user.id).await?;

    let groups = dataset_groups::table
        .left_join(
            dataset_permissions::table.on(dataset_permissions::permission_id
                .eq(dataset_groups::id)
                .and(dataset_permissions::permission_type.eq("dataset_group"))
                .and(dataset_permissions::deleted_at.is_null())
                .and(dataset_permissions::organization_id.eq(organization_id))),
        )
        .select((
            dataset_groups::id,
            dataset_groups::name,
            diesel::dsl::sql::<diesel::sql_types::Integer>(
                "COALESCE(count(dataset_permissions.id), 0)",
            ),
            diesel::dsl::sql::<diesel::sql_types::Bool>("dataset_permissions.id IS NOT NULL"),
        ))
        .group_by((
            dataset_groups::id,
            dataset_groups::name,
            dataset_permissions::id,
        ))
        .filter(dataset_groups::organization_id.eq(organization_id))
        .filter(dataset_groups::deleted_at.is_null())
        .order_by(dataset_groups::created_at.desc())
        .load::<(Uuid, String, i32, bool)>(&mut *conn)
        .await?;

    Ok(groups
        .into_iter()
        .map(|(id, name, permission_id, assigned)| DatasetGroupInfo {
            id,
            name,
            permission_id,
            assigned,
        })
        .collect())
}
