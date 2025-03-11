use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use handlers::collections::{get_collection_handler, CollectionState};
use middleware::AuthenticatedUser;
use uuid::Uuid;
use axum::extract::Extension;

/// Get a collection by ID
///
/// This endpoint returns a collection by its ID.
pub async fn get_collection(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<Json<CollectionState>, (StatusCode, String)> {
    // Call the handler
    match get_collection_handler(&user.id, &id).await {
        Ok(collection) => Ok(Json(collection)),
        Err(e) => {
            tracing::error!("Error getting collection: {}", e);
            
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
                    format!("Error getting collection: {}", e),
                ))
            }
        }
    }
}
