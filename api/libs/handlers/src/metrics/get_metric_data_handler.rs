use anyhow::{anyhow, Result};
use database::{
    pool::get_pg_pool,
    schema::metric_files,
    types::{MetricYml, data_metadata::DataMetadata},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use indexmap::IndexMap;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use query_engine::data_source_helpers;
use query_engine::data_types::DataType;

use crate::metrics::get_metric_handler;

/// Request structure for the get_metric_data handler
#[derive(Debug, Deserialize)]
pub struct GetMetricDataRequest {
    pub metric_id: Uuid,
    pub version_number: Option<i32>,
    pub limit: Option<i64>,
    pub password: Option<String>,
}

/// Structure for the metric data response
#[derive(Debug, Serialize)]
pub struct MetricDataResponse {
    pub metric_id: Uuid,
    pub data: Vec<IndexMap<String, DataType>>,
    pub data_metadata: DataMetadata,
}

/// Handler to retrieve both the metric definition and its associated data
pub async fn get_metric_data_handler(
    request: GetMetricDataRequest,
    user: AuthenticatedUser,
) -> Result<MetricDataResponse> {
    tracing::info!(
        "Getting metric data for metric_id: {}, user_id: {}",
        request.metric_id,
        user.id
    );

    // Retrieve the metric definition based on version, if none, use latest.
    let metric = get_metric_handler(
        &request.metric_id, 
        &user, 
        request.version_number, 
        request.password
    ).await?;

    // Parse the metric definition from YAML to get SQL and dataset IDs
    let metric_yml = serde_yaml::from_str::<MetricYml>(&metric.file)?;
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

    // Try to get cached metadata first
    let mut conn = get_pg_pool().get().await?;
    let cached_metadata = metric_files::table
        .filter(metric_files::id.eq(request.metric_id))
        .select(metric_files::data_metadata)
        .first::<Option<DataMetadata>>(&mut conn)
        .await
        .map_err(|e| anyhow!("Error retrieving metadata: {}", e))?;

    // Execute the query to get the metric data
    let query_result = match query_engine::data_source_query_routes::query_engine::query_engine(
        &data_source.data_source_id,
        &sql,
        request.limit,
    )
    .await
    {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Error executing metric query: {}", e);
            return Err(anyhow!("Error executing metric query: {}", e));
        }
    };

    // Determine which metadata to use
    let metadata = if let Some(metadata) = cached_metadata {
        // Use cached metadata but update row count if it differs
        if metadata.row_count != query_result.data.len() as i64 {
            let mut updated_metadata = metadata.clone();
            updated_metadata.row_count = query_result.data.len() as i64;
            updated_metadata
        } else {
            metadata
        }
    } else {
        // No cached metadata, use the one from query_result
        query_result.metadata.clone()
    };

    // Construct and return the response
    Ok(MetricDataResponse {
        metric_id: request.metric_id,
        data: query_result.data,
        data_metadata: metadata,
    })
}
