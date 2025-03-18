use axum::{extract::State, http::StatusCode, Extension, Json};
use handlers::collections::{create_collection_handler, CollectionState, CreateCollectionRequest};
use middleware::AuthenticatedUser;
use uuid::Uuid;

/// Create a new collection
///
/// This endpoint creates a new collection with the provided details.
pub async fn create_collection(
    Extension(user): Extension<AuthenticatedUser>,
    Json(req): Json<CreateCollectionRequest>,
) -> Result<Json<CollectionState>, (StatusCode, String)> {
    // Get the user's organization ID
    let user_organization = match user.organizations.first() {
        Some(org) => org,
        None => return Err((StatusCode::NOT_FOUND, "User not found".to_string())),
    };

    // Call the handler
    match create_collection_handler(&user.id, &user_organization.id, req).await {
        Ok(collection) => Ok(Json(collection)),
        Err(e) => {
            tracing::error!("Error creating collection: {}", e);

            // Return appropriate error response based on the error
            if e.to_string().contains("permission") {
                Err((StatusCode::FORBIDDEN, format!("Permission denied: {}", e)))
            } else {
                Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Error creating collection: {}", e),
                ))
            }
        }
    }
}
