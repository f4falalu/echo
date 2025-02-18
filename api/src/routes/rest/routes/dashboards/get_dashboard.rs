use crate::database_dep::models::User;
use crate::routes::rest::ApiResponse;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use handlers::files::dashboard_files::get_dashboard::get_dashboard;
use handlers::files::dashboard_files::BusterDashboardResponse;
use uuid::Uuid;

pub async fn get_dashboard_rest_handler(
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<BusterDashboardResponse>, (StatusCode, &'static str)> {
    let dashboard = match get_dashboard(&id, &user.id).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error getting dashboard: {}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to get dashboard"));
        }
    };

    Ok(ApiResponse::JsonData(dashboard))
}
