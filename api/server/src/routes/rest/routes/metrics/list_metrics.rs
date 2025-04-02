use crate::routes::rest::ApiResponse;
use axum::extract::Query;
use axum::http::StatusCode;
use axum::Extension;
use handlers::metrics::{list_metrics_handler, MetricsListRequest, BusterMetricListItem};
use middleware::AuthenticatedUser;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct ListMetricsQuery {
    page_token: Option<i64>,
    page_size: Option<i64>,
    shared_with_me: Option<bool>,
    only_my_metrics: Option<bool>,
}

pub async fn list_metrics_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListMetricsQuery>,
) -> Result<ApiResponse<Vec<BusterMetricListItem>>, (StatusCode, &'static str)> {
    let request = MetricsListRequest {
        page_token: query.page_token.unwrap_or(0),
        page_size: query.page_size.unwrap_or(25),
        shared_with_me: query.shared_with_me,
        only_my_metrics: query.only_my_metrics,
    };

    let metrics = match list_metrics_handler(&user, request).await {
        Ok(metrics) => metrics,
        Err(e) => {
            tracing::error!("Error listing metrics: {}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to list metrics"));
        }
    };

    Ok(ApiResponse::JsonData(metrics))
}
