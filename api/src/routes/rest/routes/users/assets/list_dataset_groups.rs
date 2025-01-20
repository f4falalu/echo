use anyhow::Result;
use axum::http::StatusCode;
use axum::Extension;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use crate::database::lib::get_pg_pool;
use crate::database::models::{DatasetGroup, User};
use crate::database::schema::dataset_groups;
use crate::routes::rest::ApiResponse;
use crate::utils::user::user_info::get_user_organization_id;

#[derive(Debug, Serialize)]
pub struct DatasetGroupInfo {
    pub id: Uuid,
    pub name: String,
    pub organization_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
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

    let groups: Vec<DatasetGroup> = dataset_groups::table
        .filter(dataset_groups::organization_id.eq(organization_id))
        .filter(dataset_groups::deleted_at.is_null())
        .order_by(dataset_groups::created_at.desc())
        .load(&mut *conn)
        .await?;

    Ok(groups
        .into_iter()
        .map(|group| DatasetGroupInfo {
            id: group.id,
            name: group.name,
            organization_id: group.organization_id,
            created_at: group.created_at,
            updated_at: group.updated_at,
        })
        .collect())
}
