use anyhow::Result;
use axum::{extract::Path, http::StatusCode, Extension, Json};
use middleware::AuthenticatedUser;
use serde::{Deserialize};
use uuid::Uuid;

use crate::routes::rest::ApiResponse;
use handlers::data_sources::{update_data_source_handler, UpdateDataSourceRequest, DataSourceResponse};

pub async fn update_data_source(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateDataSourceRequest>,
) -> Result<ApiResponse<DataSourceResponse>, (StatusCode, &'static str)> {
    match update_data_source_handler(&user.id, &id, payload).await {
        Ok(data_source) => Ok(ApiResponse::JsonData(data_source)),
        Err(e) => {
            tracing::error!("Error updating data source: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to update data source",
            ))
        }
    }
}