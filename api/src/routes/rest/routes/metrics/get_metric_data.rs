use crate::routes::rest::ApiResponse;
use axum::extract::{Path, Query};
use axum::http::StatusCode;
use axum::Extension;
use handlers::metrics::get_metric_data_handler::{GetMetricDataRequest, MetricDataResponse};
use serde::Deserialize;
use middleware::AuthenticatedUser;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct GetMetricDataParams {
    pub limit: Option<i64>,
}

pub async fn get_metric_data_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(metric_id): Path<Uuid>,
    Query(params): Query<GetMetricDataParams>,
) -> Result<ApiResponse<MetricDataResponse>, (StatusCode, &'static str)> {
    tracing::info!(
        "Processing GET request for metric data with ID: {}",
        metric_id
    );

    let request = GetMetricDataRequest {
        metric_id,
        limit: params.limit,
    };

    match handlers::metrics::get_metric_data_handler(request, user).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error getting metric data: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to get metric data",
            ))
        }
    }
}
