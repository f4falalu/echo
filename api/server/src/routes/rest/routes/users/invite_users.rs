use anyhow::Result;
use axum::{Extension, Json};

use crate::routes::rest::ApiResponse;
use axum::http::StatusCode;
use database::enums::UserOrganizationRole;
use middleware::AuthenticatedUser;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct InviteUsersRequest {
    pub emails: Vec<String>,
}

pub async fn invite_users(
    Extension(user): Extension<AuthenticatedUser>,
    Json(body): Json<InviteUsersRequest>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    Ok(ApiResponse::NoContent)
}
