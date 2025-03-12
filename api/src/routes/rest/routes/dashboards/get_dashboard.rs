use crate::routes::rest::ApiResponse;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use handlers::files::dashboard_files::get_dashboard_handler::get_dashboard_handler;
use handlers::files::dashboard_files::BusterDashboardResponse;
use uuid::Uuid;
use middleware::AuthenticatedUser;

pub async fn get_dashboard_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<BusterDashboardResponse>, (StatusCode, &'static str)> {
    let dashboard = match get_dashboard_handler(&id, &user.id).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error getting dashboard: {}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to get dashboard"));
        }
    };

    Ok(ApiResponse::JsonData(dashboard))
}
