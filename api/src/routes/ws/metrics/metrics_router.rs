use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use middleware::AuthenticatedUser;

use super::{
    get_metric::{get_metric, GetMetricWsRequest},
    get_metric_data::get_metric_data,
};

#[derive(Deserialize, Serialize, Debug, Clone)]
pub enum MetricRoute {
    #[serde(rename = "/metrics/get")]
    Get,
    #[serde(rename = "/metrics/data")]
    Data,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum MetricEvent {
    GetMetric,
    FetchingData,
}

pub async fn metrics_router(
    route: MetricRoute,
    data: Value,
    user: &AuthenticatedUser,
) -> Result<()> {
    match route {
        MetricRoute::Get => {
            let request = match serde_json::from_value::<GetMetricWsRequest>(data) {
                Ok(id) => id,
                Err(e) => return Err(anyhow!("Error parsing metric ID: {}", e)),
            };

            get_metric(user, request).await?;
        }
        MetricRoute::Data => {
            let req = match serde_json::from_value(data) {
                Ok(req) => req,
                Err(e) => return Err(anyhow!("Error parsing request: {}", e)),
            };

            get_metric_data(user, req).await?;
        }
    };

    Ok(())
}

impl MetricRoute {
    pub fn from_str(path: &str) -> Result<Self> {
        match path {
            "/metrics/get" => Ok(Self::Get),
            "/metrics/data" => Ok(Self::Data),
            _ => Err(anyhow!("Invalid path")),
        }
    }
}
