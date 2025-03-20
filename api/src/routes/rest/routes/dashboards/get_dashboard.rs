use crate::routes::rest::ApiResponse;
use axum::extract::{Path, Query};
use axum::http::StatusCode;
use axum::Extension;
use handlers::dashboards::{get_dashboard_handler, BusterDashboardResponse};
use middleware::AuthenticatedUser;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct GetDashboardQueryParams {
    #[serde(rename = "version_number")]
    version_number: Option<i32>,
}

pub async fn get_dashboard_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Query(params): Query<GetDashboardQueryParams>,
) -> Result<ApiResponse<BusterDashboardResponse>, (StatusCode, &'static str)> {
    tracing::info!(
        "Processing GET request for dashboard with ID: {}, user_id: {}, version_number: {:?}",
        id,
        user.id,
        params.version_number
    );
    
    let dashboard = match get_dashboard_handler(&id, &user.id, params.version_number).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error getting dashboard: {}", e);
            let error_message = e.to_string();
            // Return 404 if version not found, or if dashboard not found
            if error_message.contains("Version") && error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Version not found"));
            }
            else if error_message.contains("not found") || error_message.contains("unauthorized") {
                return Err((StatusCode::NOT_FOUND, "Dashboard not found or unauthorized"));
            }
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to get dashboard"));
        }
    };

    Ok(ApiResponse::JsonData(dashboard))
}
