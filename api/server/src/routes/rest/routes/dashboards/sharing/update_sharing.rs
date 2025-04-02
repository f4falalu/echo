use axum::{
    extract::{Json, Path},
    http::StatusCode,
    Extension,
};
use handlers::dashboards::sharing::UpdateDashboardSharingRequest;
use middleware::AuthenticatedUser;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

/// REST handler for updating sharing permissions for a dashboard
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the dashboard
/// * `request` - An UpdateDashboardSharingRequest object with optional fields:
///   - users: List of users to share with (email and role)
///   - publicly_accessible: Whether the dashboard should be publicly accessible
///   - public_password: Password for public access (null to remove)
///   - public_expiration: Expiration date for public access (null to remove)
///
/// # Returns
///
/// A success message or appropriate error response
pub async fn update_dashboard_sharing_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<UpdateDashboardSharingRequest>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!(
        dashboard_id = %id,
        user_id = %user.id,
        "Processing PUT request for dashboard sharing permissions"
    );

    match handlers::dashboards::sharing::update_dashboard_sharing_handler(&id, &user, request).await {
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