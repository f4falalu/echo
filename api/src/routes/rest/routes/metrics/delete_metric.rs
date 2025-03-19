use axum::{
    extract::Path,
    http::StatusCode,
    Extension,
};
use handlers::metrics::delete_metric_handler;
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

pub async fn delete_metric_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    tracing::info!(
        "Processing DELETE request for metric with ID: {}, user_id: {}",
        id,
        user.id
    );

    match delete_metric_handler(&id, &user.id).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error deleting metric: {}", e);
            if e.to_string().contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Metric not found"));
            }
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to delete metric"))
        }
    }
}