use axum::{
    http::StatusCode,
    Json,
};
use handlers::collections::{delete_collection_handler, DeleteCollectionRequest, DeleteCollectionResponse};
use middleware::AuthenticatedUser;
use uuid::Uuid;
use database::utils::user::get_user_organization_id;

/// Delete a collection
///
/// This endpoint deletes one or more collections by their IDs.
pub async fn delete_collection(
    Extension(user): Extension<AuthenticatedUser>,
    Json(req): Json<DeleteCollectionRequest>,
) -> Result<Json<DeleteCollectionResponse>, (StatusCode, String)> {
    // Call the handler
    match delete_collection_handler(&user.id, &user.organization_id, req.ids).await {
        Ok(response) => Ok(Json(response)),
        Err(e) => {
            tracing::error!("Error deleting collection: {}", e);
            
            // Return appropriate error response based on the error
            if e.to_string().contains("not found") {
                Err((
                    StatusCode::NOT_FOUND,
                    format!("Collection not found: {}", e),
                ))
            } else if e.to_string().contains("permission") {
                Err((
                    StatusCode::FORBIDDEN,
                    format!("Permission denied: {}", e),
                ))
            } else {
                Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Error deleting collection: {}", e),
                ))
            }
        }
    }
}
