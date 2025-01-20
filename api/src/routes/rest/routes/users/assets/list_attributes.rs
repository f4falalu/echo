use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use chrono::{DateTime, Utc};
use serde::Serialize;
use serde_json::Value;
use uuid::Uuid;

use crate::database::lib::get_pg_pool;
use crate::database::models::User;
use crate::routes::rest::ApiResponse;
use crate::utils::user::user_info::get_user_organization_id;

#[derive(Debug, Serialize)]
pub struct AttributeInfo {
    pub name: String,
    pub value: String,
    pub read_only: bool,
}

pub async fn list_attributes(
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<Vec<AttributeInfo>>, (StatusCode, &'static str)> {
    let attributes = match list_attributes_handler(user, id).await {
        Ok(attrs) => attrs,
        Err(e) => {
            tracing::error!("Error listing attributes: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error listing attributes",
            ));
        }
    };

    Ok(ApiResponse::JsonData(attributes))
}

async fn list_attributes_handler(user: User, user_id: Uuid) -> Result<Vec<AttributeInfo>> {
    let mut conn = get_pg_pool().get().await?;

    let user_orgnazation_id = match get_user_organization_id(&user_id).await {
        Ok(id) => id,
        Err(e) => {
            tracing::error!("Error getting user organization id: {:?}", e);
            return Err(anyhow::anyhow!("Error getting user organization id"));
        }
    };

    let auth_user_orgnazation_id = match user.attributes.get("organization_id") {
        Some(Value::String(id)) => id,
        Some(_) => return Err(anyhow::anyhow!("User organization id not found")),
        None => return Err(anyhow::anyhow!("User organization id not found")),
    };

    let auth_user_role = match user.attributes.get("role") {
        Some(Value::String(role)) => role,
        Some(_) => return Err(anyhow::anyhow!("User role not found")),
        None => return Err(anyhow::anyhow!("User role not found")),
    };

    let mut attributes = Vec::new();

    for (key, value) in user.attributes.as_object().unwrap() {
        if let Some(value_str) = value.as_str() {
            attributes.push(AttributeInfo {
                name: key.to_string(),
                value: value_str.to_string(),
                read_only: false,
            });
        }
    }

    Ok(attributes)
}
