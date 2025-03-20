use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::collections::add_dashboards_to_collection_handler;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct AddDashboardsRequest {
    pub dashboard_ids: Vec<Uuid>,
}

/// REST handler for adding dashboards to a collection
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the collection
/// * `request` - The dashboard IDs to add to the collection
///
/// # Returns
///
/// A success message on success, or an appropriate error response
pub async fn add_dashboards_to_collection(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<AddDashboardsRequest>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!(
        collection_id = %id,
        user_id = %user.id,
        dashboard_count = request.dashboard_ids.len(),
        "Processing POST request to add dashboards to collection"
    );

    match add_dashboards_to_collection_handler(&id, request.dashboard_ids, &user.id).await {
        Ok(_) => Ok(ApiResponse::JsonData("Dashboards added to collection successfully".to_string())),
        Err(e) => {
            tracing::error!("Error adding dashboards to collection: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                if error_message.contains("Collection not found") {
                    return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
                } else if error_message.contains("Dashboard not found") {
                    return Err((StatusCode::NOT_FOUND, format!("Dashboard not found: {}", e)));
                }
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to add dashboards to collection: {}", e)))
        }
    }
}