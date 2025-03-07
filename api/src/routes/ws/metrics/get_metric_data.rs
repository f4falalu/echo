use anyhow::{anyhow, Result};
use handlers::metrics::get_metric_data_handler::{GetMetricDataRequest, MetricDataResponse};
use middleware::AuthenticatedUser;
use serde::Deserialize;
use uuid::Uuid;

use crate::routes::ws::{
    metrics::metrics_router::{MetricEvent, MetricRoute},
    ws::{WsErrorCode, WsEvent, WsResponseMessage, WsSendMethod},
    ws_router::WsRoutes,
    ws_utils::{send_error_message, send_ws_message},
};

#[derive(Deserialize)]
pub struct GetMetricDataWsRequest {
    pub id: Uuid,
    pub limit: Option<i64>,
}

pub async fn get_metric_data(user: &AuthenticatedUser, request: GetMetricDataWsRequest) -> Result<()> {
    tracing::info!(
        "Processing WebSocket GET request for metric data with ID: {}",
        request.id
    );

    let handler_request = GetMetricDataRequest {
        metric_id: request.id,
        limit: request.limit,
    };

    let response = match handlers::metrics::get_metric_data_handler(handler_request, user.clone()).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Error getting metric data: {}", e);
            send_error_message(
                &user.id.to_string(),
                WsRoutes::Metrics(MetricRoute::GetData),
                WsEvent::Metrics(MetricEvent::FetchingData),
                WsErrorCode::InternalServerError,
                "Failed to get metric data.".to_string(),
                user,
            )
            .await?;
            return Err(anyhow!("Error getting metric data: {}", e));
        }
    };

    let response_message = WsResponseMessage::new(
        WsRoutes::Metrics(MetricRoute::GetData),
        WsEvent::Metrics(MetricEvent::FetchingData),
        response,
        None,
        user,
        WsSendMethod::SenderOnly,
    );

    send_ws_message(&user.id.to_string(), &response_message).await?;

    Ok(())
} 