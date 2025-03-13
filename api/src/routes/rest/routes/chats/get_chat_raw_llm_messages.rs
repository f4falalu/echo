use axum::{
    extract::{Path, State},
    Extension, Json,
    http::StatusCode,
    response::IntoResponse,
};
use handlers::chats::get_raw_llm_messages_handler;
use middleware::AuthenticatedUser;
use serde_json::Value;
use uuid::Uuid;
use crate::routes::rest::ApiResponse;

pub async fn get_chat_raw_llm_messages(
    Extension(user): Extension<AuthenticatedUser>, 
    Path(chat_id): Path<Uuid>,
) -> Result<ApiResponse<Value>, (StatusCode, &'static str)> {
    match get_raw_llm_messages_handler(chat_id).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to get raw LLM messages")),
    }
}
