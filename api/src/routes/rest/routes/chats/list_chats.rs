use axum::{extract::Query, http::StatusCode, Extension};
use database::models::User;
use handlers::chats::list_chats_handler::{
    list_chats_handler, ListChatsRequest, ListChatsResponse,
};
use serde::Deserialize;
use middleware::AuthenticatedUser;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct ListChatsQuery {
    pub page_token: Option<String>,
    #[serde(default = "default_page_size")]
    pub page_size: i32,
    #[serde(default)]
    pub admin_view: bool,
}

fn default_page_size() -> i32 {
    20 // Default to 20 items per page
}

pub async fn list_chats_route(
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListChatsQuery>,
) -> Result<ApiResponse<ListChatsResponse>, (StatusCode, &'static str)> {
    let request = ListChatsRequest {
        page_token: query.page_token,
        page_size: query.page_size,
        admin_view: query.admin_view,
    };

    match list_chats_handler(request, &user.id).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error listing chats: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to list chats"))
        }
    }
}
