use anyhow::Result;
use axum::http::StatusCode;
use axum::Extension;
use axum::Json;
use database::models::User;
use handlers::chats::update_chats_handler::{ChatUpdate, ChatUpdateResult};
use handlers::chats::update_chats_handler;

use crate::routes::rest::ApiResponse;

pub async fn update_chats_route(
    Extension(user): Extension<User>,
    Json(updates): Json<Vec<ChatUpdate>>,
) -> Result<ApiResponse<Vec<ChatUpdateResult>>, (StatusCode, &'static str)> {
    match update_chats_handler(updates, &user.id).await {
        Ok(results) => Ok(ApiResponse::JsonData(results)),
        Err(e) => {
            tracing::error!("Error updating chats: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to update chats"))
        }
    }
} 