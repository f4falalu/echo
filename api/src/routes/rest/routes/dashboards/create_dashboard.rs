use axum::extract::State;
use axum::Extension;
use handlers::dashboards::create_dashboard_handler;
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;
use crate::AppState;

pub async fn create_dashboard_rest_handler(
    State(_state): State<AppState>,
    Extension(user): Extension<AuthenticatedUser>,
) -> ApiResponse {
    match create_dashboard_handler(&user.id).await {
        Ok(response) => ApiResponse::JsonData(response),
        Err(e) => {
            tracing::error!("Failed to create dashboard: {}", e);
            ApiResponse::JsonError(e.to_string())
        }
    }
}