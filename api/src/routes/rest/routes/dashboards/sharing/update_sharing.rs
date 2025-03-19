use axum::{
    extract::{Json, Path},
    http::StatusCode,
    Extension,
};
use database::enums::AssetPermissionRole;
use handlers::dashboards::sharing::update_dashboard_sharing_handler;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// Structure for a single share recipient with their role
#[derive(Debug, Deserialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}

/// REST handler for updating sharing permissions for a dashboard
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the dashboard
/// * `request` - A list of ShareRecipient objects containing email and role
///
/// # Returns
///
/// A success message or appropriate error response
pub async fn update_dashboard_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<Vec<ShareRecipient>>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!(
        dashboard_id = %id,
        user_id = %user.id,
        recipients_count = request.len(),
        "Processing PUT request for dashboard sharing permissions"
    );

    let emails_and_roles: Vec<(String, AssetPermissionRole)> = request
        .into_iter()
        .map(|recipient| (recipient.email, recipient.role))
        .collect();

    match update_dashboard_sharing_handler(&id, &user.id, emails_and_roles).await {
        Ok(_) => Ok(ApiResponse::JsonData(
            "Sharing permissions updated successfully".to_string(),
        )),
        Err(e) => {
            tracing::error!("Error updating sharing permissions: {}", e);

            // Map specific errors to appropriate status codes
            let error_message = e.to_string();

            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, format!("Dashboard not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((
                    StatusCode::FORBIDDEN,
                    format!("Insufficient permissions: {}", e),
                ));
            } else if error_message.contains("Invalid email") {
                return Err((StatusCode::BAD_REQUEST, format!("Invalid email: {}", e)));
            }

            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to update sharing permissions: {}", e),
            ))
        }
    }
}