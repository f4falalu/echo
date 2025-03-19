use axum::{
    extract::Path,
    http::StatusCode,
    Extension, Json,
};
use database::enums::AssetPermissionRole;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use uuid::Uuid;

/// Recipient for sharing a chat
#[derive(Debug, Deserialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}

/// Update sharing permissions for a chat
///
/// This endpoint updates sharing permissions for a chat with the provided details.
/// Requires Owner or FullAccess permission.
pub async fn update_chat_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<Vec<ShareRecipient>>,
) -> Result<Json<String>, (StatusCode, String)> {
    tracing::info!("Processing PUT request for chat sharing with ID: {}, user_id: {}", id, user.id);

    // Convert request to a list of (email, role) pairs
    let emails_and_roles: Vec<(String, AssetPermissionRole)> = request
        .into_iter()
        .map(|recipient| (recipient.email, recipient.role))
        .collect();

    // Call the handler from the handlers crate
    match handlers::chats::sharing::update_chat_sharing_handler(&id, &user.id, emails_and_roles).await {
        Ok(_) => Ok(Json("Sharing permissions updated successfully".to_string())),
        Err(e) => {
            tracing::error!("Error updating sharing permissions: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Chat not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to update sharing permissions: {}", e)))
        }
    }
}