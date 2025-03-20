use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::collections::remove_metrics_from_collection_handler;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct RemoveMetricsRequest {
    pub metric_ids: Vec<Uuid>,
}

/// REST handler for removing metrics from a collection
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the collection
/// * `request` - The metric IDs to remove from the collection
///
/// # Returns
///
/// A success message on success, or an appropriate error response
pub async fn remove_metrics_from_collection(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<RemoveMetricsRequest>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!(
        collection_id = %id,
        user_id = %user.id,
        metric_count = request.metric_ids.len(),
        "Processing DELETE request to remove metrics from collection"
    );

    match remove_metrics_from_collection_handler(&id, request.metric_ids, &user.id).await {
        Ok(_) => Ok(ApiResponse::JsonData("Metrics removed from collection successfully".to_string())),
        Err(e) => {
            tracing::error!("Error removing metrics from collection: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("Collection not found") {
                return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to remove metrics from collection: {}", e)))
        }
    }
}