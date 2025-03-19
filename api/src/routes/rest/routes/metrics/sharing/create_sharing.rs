use axum::{
    extract::{Path, Json},
    http::StatusCode,
    Extension,
};
use database::enums::AssetPermissionRole;
use handlers::metrics::sharing::create_metric_sharing_handler;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// Request structure for sharing a metric with users
#[derive(Debug, Deserialize)]
pub struct SharingRequest {
    pub emails: Vec<String>,
    pub role: AssetPermissionRole,
}

/// REST handler for creating sharing permissions for a metric
pub async fn create_metric_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<SharingRequest>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    tracing::info!("Processing POST request for metric sharing with ID: {}, user_id: {}", id, user.id);

    match create_metric_sharing_handler(&id, &user.id, request.emails, request.role).await {
        Ok(_) => Ok(ApiResponse::Success("Sharing permissions created successfully".to_string())),
        Err(e) => {
            tracing::error!("Error creating sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Metric not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create sharing permissions: {}", e)))
        }
    }
}