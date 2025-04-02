use anyhow::{anyhow, Result};
use handlers::metrics::get_metric_handler;
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
pub struct GetMetricWsRequest {
    pub id: Uuid,
    #[serde(rename = "version_number")]
    pub version_number: Option<i32>,
}

pub async fn get_metric(user: &AuthenticatedUser, request: GetMetricWsRequest) -> Result<()> {
    tracing::info!(
        "Processing WebSocket GET request for metric with ID: {}, user_id: {}, version_number: {:?}",
        request.id,
        user.id,
        request.version_number
    );

    let metric = match get_metric_handler(&request.id, &user, request.version_number).await {
        Ok(metric) => metric,
        Err(e) => {
            tracing::error!("Error getting metric: {}", e);
            let error_message = e.to_string();
            // Use appropriate error code based on the error
            let error_code = if error_message.contains("Version") && error_message.contains("not found") {
                WsErrorCode::NotFound
            } else {
                WsErrorCode::InternalServerError
            };
            
            send_error_message(
                &user.id.to_string(),
                WsRoutes::Metrics(MetricRoute::Get),
                WsEvent::Metrics(MetricEvent::GetMetric),
                error_code,
                format!("Failed to get metric: {}", error_message),
                user,
            )
            .await?;
            return Err(anyhow!("Error getting metric: {}", e));
        }
    };

    let response_message = WsResponseMessage::new(
        WsRoutes::Metrics(MetricRoute::Get),
        WsEvent::Metrics(MetricEvent::GetMetric),
        metric,
        None,
        user,
        WsSendMethod::SenderOnly,
    );

    send_ws_message(&user.id.to_string(), &response_message).await?;

    Ok(())
}
