use axum::{
    extract::Path,
    Extension,
    Json,
};
use handlers::dashboards::delete_dashboard_handler;
use middleware::AuthenticatedUser;
use uuid::Uuid;
use axum::http::StatusCode;

use crate::routes::rest::ApiResponse;

pub async fn delete_dashboard_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    tracing::info!(
        "Processing DELETE request for dashboard with ID: {}, user_id: {}",
        id,
        user.id
    );
    
    match delete_dashboard_handler(id, &user.id).await {
        Ok(_) => Ok(Json(serde_json::json!({
            "success": true,
            "message": "Dashboard deleted successfully"
        }))),
        Err(e) => {
            tracing::error!("Failed to delete dashboard: {}", e);
            
            if e.to_string().contains("not found") {
                Err((StatusCode::NOT_FOUND, format!("Dashboard not found: {}", e)))
            } else {
                Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to delete dashboard: {}", e)))
            }
        }
    }
}