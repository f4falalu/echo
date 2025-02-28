use crate::database_dep::models::User;
use crate::routes::rest::ApiResponse;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use handlers::chats::helpers::get_chat::get_chat;
use handlers::chats::types::ChatWithMessages;
use uuid::Uuid;

pub async fn get_chat_rest_handler(
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<ChatWithMessages>, (StatusCode, &'static str)> {
    let thread_with_messages = match get_chat(&id, &user.id).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error getting chat: {}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to get chat"));
        }
    };

    Ok(ApiResponse::JsonData(thread_with_messages))
}
