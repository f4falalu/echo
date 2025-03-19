use axum::{
    extract::Path,
    http::StatusCode,
    Extension, Json,
};
use handlers::collections::sharing::{update_collection_sharing_handler, ShareRecipient};
use middleware::AuthenticatedUser;
use uuid::Uuid;

/// Update sharing permissions for a collection
///
/// This endpoint updates sharing permissions for a collection with the provided details.
/// Requires Owner or FullAccess permission.
pub async fn update_collection_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<Vec<ShareRecipient>>,
) -> Result<Json<String>, (StatusCode, String)> {
    tracing::info!("Processing PUT request for collection sharing with ID: {}, user_id: {}", id, user.id);

    match update_collection_sharing_handler(&id, &user.id, request).await {
        Ok(_) => Ok(Json("Sharing permissions updated successfully".to_string())),
        Err(e) => {
            tracing::error!("Error updating sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to update sharing permissions: {}", e)))
        }
    }
}