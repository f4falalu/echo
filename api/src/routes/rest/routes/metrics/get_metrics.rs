use crate::database_dep::models::User;
use crate::routes::rest::ApiResponse;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::Extension;
use handlers::files::metric_files::types::BusterMetric;
use handlers::files::metric_files::helpers::get_metric::get_metric;
use uuid::Uuid;

pub async fn get_metrics_rest_handler(
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> Result<ApiResponse<BusterMetric>, (StatusCode, &'static str)> {
    let metric = match get_metric(&id, &user.id).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error getting metric: {}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to get metric"));
        }
    };

    Ok(ApiResponse::JsonData(metric))
}
