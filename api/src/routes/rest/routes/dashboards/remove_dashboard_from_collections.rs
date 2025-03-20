use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::dashboards::remove_dashboard_from_collections_handler;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct RemoveFromCollectionsRequest {
    pub collection_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct RemoveFromCollectionsResponse {
    pub message: String,
    pub removed_count: usize,
    pub failed_count: usize,
    pub failed_ids: Vec<Uuid>,
}

/// REST handler for removing a dashboard from multiple collections
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the dashboard
/// * `request` - The collection IDs to remove the dashboard from
///
/// # Returns
///
/// A success message on success, or an appropriate error response
pub async fn remove_dashboard_from_collections(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<RemoveFromCollectionsRequest>,
) -> Result<ApiResponse<RemoveFromCollectionsResponse>, (StatusCode, String)> {
    info!(
        dashboard_id = %id,
        user_id = %user.id,
        collection_count = request.collection_ids.len(),
        "Processing DELETE request to remove dashboard from collections"
    );

    match remove_dashboard_from_collections_handler(&id, request.collection_ids, &user.id).await {
        Ok(result) => {
            let response = RemoveFromCollectionsResponse {
                message: "Dashboard removed from collections successfully".to_string(),
                removed_count: result.removed_count,
                failed_count: result.failed_count,
                failed_ids: result.failed_ids,
            };
            Ok(ApiResponse::JsonData(response))
        }
        Err(e) => {
            tracing::error!("Error removing dashboard from collections: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("Dashboard not found") {
                return Err((StatusCode::NOT_FOUND, format!("Dashboard not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to remove dashboard from collections: {}", e)))
        }
    }
}