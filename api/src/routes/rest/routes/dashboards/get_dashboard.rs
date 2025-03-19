use crate::routes::rest::ApiResponse;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use handlers::dashboards::{get_dashboard_handler, BusterDashboardResponse};
use middleware::AuthenticatedUser;
use uuid::Uuid;

pub async fn get_dashboard_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<BusterDashboardResponse>, (StatusCode, &'static str)> {
    tracing::info!(
        "Processing GET request for dashboard with ID: {}, user_id: {}",
        id,
        user.id
    );
    
    let dashboard = match get_dashboard_handler(&id, &user.id).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error getting dashboard: {}", e);
            let error_message = e.to_string();
            // Return 404 if not found or unauthorized
            if error_message.contains("not found") || error_message.contains("unauthorized") {
                return Err((StatusCode::NOT_FOUND, "Dashboard not found or unauthorized"));
            }
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to get dashboard"));
        }
    };

    Ok(ApiResponse::JsonData(dashboard))
}
