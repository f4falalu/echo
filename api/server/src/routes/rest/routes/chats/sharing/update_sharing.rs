use axum::{
    extract::Path,
    http::StatusCode,
    Extension, Json,
};
use handlers::chats::sharing::UpdateChatSharingRequest;
use middleware::AuthenticatedUser;
use uuid::Uuid;

/// Update sharing permissions for a chat
///
/// This endpoint updates sharing permissions for a chat with the provided details.
/// Requires Owner or FullAccess permission.
///
/// Request body format:
/// ```json
/// {
///     "users": [
///         {
///             "email": "user@example.com",
///             "role": "Viewer"
///         }
///     ],
///     "publicly_accessible": true,
///     "public_password": "password",
///     "public_expiration": "2023-12-31T23:59:59Z"
/// }
/// ```
/// All fields are optional. If a field is not provided, it won't be updated.
/// 



pub async fn update_chat_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateChatSharingRequest>,
) -> Result<Json<String>, (StatusCode, String)> {
    tracing::info!("Processing PUT request for chat sharing with ID: {}, user_id: {}", id, user.id);

    // Call the handler from the handlers crate with the updated request format
    match handlers::chats::sharing::update_chat_sharing_handler(&id, &user, request).await {
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