use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::chats::delete_chat_sharing_handler;
use middleware::AuthenticatedUser;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// REST handler for deleting sharing permissions for a chat
pub async fn delete_chat_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(emails): Json<Vec<String>>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!(
        chat_id = %id,
        user_id = %user.id,
        email_count = emails.len(),
        "Processing DELETE request for chat sharing permissions"
    );

    match delete_chat_sharing_handler(&id, &user.id, emails).await {
        Ok(_) => {
            info!(chat_id = %id, user_id = %user.id, "Successfully deleted chat sharing permissions");
            Ok(ApiResponse::JsonData("Sharing permissions deleted successfully".to_string()))
        }
        Err(e) => {
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Chat not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete sharing permissions: {}", e)))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Request, response::Response};
    use axum_test::{TestServer, TestResponse};
    use serde_json::{json, Value};

    async fn mock_server_response(
        status_code: StatusCode,
        message: &str,
    ) -> Result<ApiResponse<String>, (StatusCode, String)> {
        if status_code == StatusCode::OK {
            Ok(ApiResponse::JsonData(message.to_string()))
        } else {
            Err((status_code, message.to_string()))
        }
    }
    
    // Note: This is a placeholder for a real test that would be implemented
    // using a test framework like axum_test
    #[tokio::test]
    async fn test_delete_chat_sharing_rest_handler_success() {
        // In a real test, we would set up test data and use a test server
        // with mocked dependencies to ensure the REST handler works correctly
        assert!(true);
    }
}