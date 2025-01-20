use anyhow::Result;
use axum::http::StatusCode;
use axum::Extension;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use crate::database::lib::get_pg_pool;
use crate::database::models::{Dataset, User};
use crate::database::schema::datasets;
use crate::routes::rest::ApiResponse;
use crate::utils::user::user_info::get_user_organization_id;

#[derive(Debug, Serialize)]
pub struct DatasetInfo {
    pub id: Uuid,
    pub name: String,
    pub organization_id: Uuid,
    pub data_source_id: Uuid,
    pub enabled: bool,
    pub imported: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn list_datasets(
    Extension(user): Extension<User>,
) -> Result<ApiResponse<Vec<DatasetInfo>>, (StatusCode, &'static str)> {
    let datasets = match list_datasets_handler(user).await {
        Ok(datasets) => datasets,
        Err(e) => {
            tracing::error!("Error listing datasets: {:?}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Error listing datasets"));
        }
    };

    Ok(ApiResponse::JsonData(datasets))
}

async fn list_datasets_handler(user: User) -> Result<Vec<DatasetInfo>> {
    let mut conn = get_pg_pool().get().await?;
    let organization_id = get_user_organization_id(&user.id).await?;

    let datasets: Vec<Dataset> = datasets::table
        .filter(datasets::organization_id.eq(organization_id))
        .filter(datasets::deleted_at.is_null())
        .order_by(datasets::created_at.desc())
        .load(&mut *conn)
        .await?;

    Ok(datasets
        .into_iter()
        .map(|dataset| DatasetInfo {
            id: dataset.id,
            name: dataset.name,
            organization_id: dataset.organization_id,
            data_source_id: dataset.data_source_id,
            enabled: dataset.enabled,
            imported: dataset.imported,
            created_at: dataset.created_at,
            updated_at: dataset.updated_at,
        })
        .collect())
}
