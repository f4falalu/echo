use axum::{
    extract::{Path, Query},
    http::StatusCode,
    Extension,
};
use handlers::metrics::{get_metric_handler, BusterMetric};
use serde::Deserialize;
use uuid::Uuid;
use middleware::AuthenticatedUser;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct GetMetricQueryParams {
    #[serde(rename = "version_number")]
    version_number: Option<i32>,
}

pub async fn get_metric_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Query(params): Query<GetMetricQueryParams>,
) -> Result<ApiResponse<BusterMetric>, (StatusCode, &'static str)> {
    tracing::info!(
        "Processing GET request for metric with ID: {}, user_id: {}, version_number: {:?}",
        id,
        user.id,
        params.version_number
    );

    let metric = match get_metric_handler(&id, &user, params.version_number).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error getting metric: {}", e);
            let error_message = e.to_string();
            // Return 404 if version not found, otherwise 500
            if error_message.contains("Version") && error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Version not found"));
            }
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to get metric"));
        }
    };

    Ok(ApiResponse::JsonData(metric))
}
