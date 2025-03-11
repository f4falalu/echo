use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use handlers::collections::{create_collection_handler, CreateCollectionRequest, CollectionState};
use middleware::AuthenticatedUser;
use uuid::Uuid;
use database::utils::user::get_user_organization_id;

/// Create a new collection
///
/// This endpoint creates a new collection with the provided details.
pub async fn create_collection(
    user: AuthenticatedUser,
    Json(req): Json<CreateCollectionRequest>,
) -> Result<Json<CollectionState>, (StatusCode, String)> {
    // Get the user's organization ID
    let org_id = match get_user_organization_id(&user.id).await {
        Ok(id) => id,
        Err(e) => {
            tracing::error!("Error getting user organization ID: {}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error getting user organization: {}", e),
            ));
        }
    };

    // Call the handler
    match create_collection_handler(&user.id, &org_id, req).await {
        Ok(collection) => Ok(Json(collection)),
        Err(e) => {
            tracing::error!("Error creating collection: {}", e);
            
            // Return appropriate error response based on the error
            if e.to_string().contains("permission") {
                Err((
                    StatusCode::FORBIDDEN,
                    format!("Permission denied: {}", e),
                ))
            } else {
                Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Error creating collection: {}", e),
                ))
            }
        }
    }
}
