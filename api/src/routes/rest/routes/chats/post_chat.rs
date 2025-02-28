use anyhow::Result;
use axum::http::StatusCode;
use axum::Extension;
use axum::Json;
use handlers::chats::post_chat_handler;
use handlers::chats::post_chat_handler::ChatCreateNewChat;
use handlers::chats::types::ChatWithMessages;

use crate::database::models::User;
use crate::routes::rest::ApiResponse;

pub async fn post_chat_route(
    Extension(user): Extension<User>,
    Json(request): Json<ChatCreateNewChat>,
) -> Result<ApiResponse<ChatWithMessages>, (StatusCode, &'static str)> {
    match post_chat_handler(request, user).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error processing chat: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to process chat"))
        }
    }
}
