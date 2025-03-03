use agents::tools::file_tools::file_types::metric_yml::MetricYml;
use anyhow::{anyhow, Result};
use database::models::User;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::files::metric_files::get_metric;
use query_engine::data_source_helpers;
use query_engine::data_types::DataType;

/// Request structure for the get_metric_data handler
#[derive(Debug, Deserialize)]
pub struct GetMetricDataRequest {
    pub metric_id: Uuid,
    pub limit: Option<i64>,
}

/// Structure for the metric data response
#[derive(Debug, Serialize)]
pub struct MetricDataResponse {
    pub data: Vec<IndexMap<String, DataType>>,
}

/// Handler to retrieve both the metric definition and its associated data
pub async fn get_metric_data_handler(
    request: GetMetricDataRequest,
    user: User,
) -> Result<MetricDataResponse> {
    tracing::info!(
        "Getting metric data for metric_id: {}, user_id: {}",
        request.metric_id,
        user.id
    );

    let user_id = user.id;

    // Retrieve the metric definition
    let metric = get_metric(&request.metric_id, &user_id).await?;

    // Parse the metric definition from YAML to get SQL and dataset IDs
    let metric_yml = serde_json::from_str::<MetricYml>(&metric.file)?;
    let sql = metric_yml.sql;
    let dataset_ids = metric_yml.dataset_ids;

    if dataset_ids.is_empty() {
        return Err(anyhow!("No dataset IDs found in metric"));
    }

    // Get the first dataset ID to use for querying
    let primary_dataset_id = dataset_ids[0];

    // Get the data source ID for the dataset
    let dataset_sources = data_source_helpers::get_data_sources_for_datasets(&dataset_ids).await?;

    if dataset_sources.is_empty() {
        return Err(anyhow!(
            "Could not find data sources for the specified datasets"
        ));
    }

    // Find the data source for the primary dataset
    let data_source = dataset_sources
        .iter()
        .find(|ds| ds.dataset_id == primary_dataset_id)
        .ok_or_else(|| anyhow!("Primary dataset not found"))?;

    tracing::info!(
        "Querying data for metric. Dataset: {}, Data source: {}",
        data_source.name,
        data_source.data_source_id
    );

    // Execute the query to get the metric data
    let result = match query_engine::data_source_query_routes::query_engine::query_engine(
        &data_source.data_source_id,
        &sql,
        request.limit,
    )
    .await
    {
        Ok(data) => data,
        Err(e) => {
            tracing::error!("Error executing metric query: {}", e);
            return Err(anyhow!("Error executing metric query: {}", e));
        }
    };

    // Construct and return the response
    Ok(MetricDataResponse { data: result })
}
