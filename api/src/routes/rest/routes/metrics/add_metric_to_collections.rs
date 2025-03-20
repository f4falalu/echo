use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::metrics::add_metric_to_collections_handler;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct AddMetricRequest {
    pub collection_ids: Vec<Uuid>,
}

/// REST handler for adding a metric to multiple collections
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the metric
/// * `request` - The collection IDs to add the metric to
///
/// # Returns
///
/// A success message on success, or an appropriate error response
pub async fn add_metric_to_collections_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<AddMetricRequest>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!(
        metric_id = %id,
        user_id = %user.id,
        collection_count = request.collection_ids.len(),
        "Processing POST request to add metric to collections"
    );

    match add_metric_to_collections_handler(&id, request.collection_ids, &user.id).await {
        Ok(_) => Ok(ApiResponse::JsonData("Metric added to collections successfully".to_string())),
        Err(e) => {
            tracing::error!("Error adding metric to collections: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                if error_message.contains("Metric not found") {
                    return Err((StatusCode::NOT_FOUND, format!("Metric not found: {}", e)));
                } else if error_message.contains("Collection not found") {
                    return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
                }
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to add metric to collections: {}", e)))
        }
    }
}