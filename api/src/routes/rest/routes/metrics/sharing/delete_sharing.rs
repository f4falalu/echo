use axum::{
    extract::{Json, Path},
    http::StatusCode,
    Extension,
};
use handlers::metrics::sharing::delete_metric_sharing_handler;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// Request structure for deleting sharing permissions
#[derive(Debug, Deserialize)]
pub struct DeleteSharingRequest {
    pub emails: Vec<String>,
}

/// REST handler for deleting sharing permissions for a metric
pub async fn delete_metric_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<DeleteSharingRequest>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    tracing::info!("Processing DELETE request for metric sharing with ID: {}, user_id: {}", id, user.id);

    match delete_metric_sharing_handler(&id, &user.id, request.emails).await {
        Ok(_) => Ok(ApiResponse::Success("Sharing permissions deleted successfully".to_string())),
        Err(e) => {
            tracing::error!("Error deleting sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            if e.to_string().contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Metric not found: {}", e)));
            } else if e.to_string().contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if e.to_string().contains("invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete sharing permissions: {}", e)))
        }
    }
}