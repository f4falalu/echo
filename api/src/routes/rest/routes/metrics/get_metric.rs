use axum::{
    extract::Path,
    http::StatusCode,
    Extension,
};
use database::models::User;
use handlers::metrics::{get_metric_handler, BusterMetric};
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

pub async fn get_metric_rest_handler(
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<BusterMetric>, (StatusCode, &'static str)> {
    tracing::info!(
        "Processing GET request for metric with ID: {}, user_id: {}",
        id,
        user.id
    );

    let metric = match get_metric_handler(&id, &user.id).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error getting metric: {}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to get metric"));
        }
    };

    Ok(ApiResponse::JsonData(metric))
}
