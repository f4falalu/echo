use axum::{
    extract::Path,
    http::StatusCode,
    Extension, Json,
};
use handlers::metrics::{post_metric_dashboard_handler, PostMetricDashboardRequest, PostMetricDashboardResponse};
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

pub async fn post_metric_dashboard_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<PostMetricDashboardRequest>,
) -> Result<ApiResponse<PostMetricDashboardResponse>, (StatusCode, &'static str)> {
    tracing::info!(
        "Processing POST request to associate metric {} with dashboard {}, user_id: {}",
        id,
        request.dashboard_id,
        user.id
    );

    let result = match post_metric_dashboard_handler(&id, &user.id, request).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error associating metric with dashboard: {}", e);
            let error_message = e.to_string();
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Metric or dashboard not found"));
            } else if error_message.contains("same organization") {
                return Err((StatusCode::BAD_REQUEST, "Resources must be in the same organization"));
            }
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to process request"));
        }
    };

    Ok(ApiResponse::JsonData(result))
}