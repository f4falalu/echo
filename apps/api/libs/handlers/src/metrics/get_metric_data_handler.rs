use anyhow::{anyhow, Result};
use database::{
    pool::get_pg_pool,
    schema::metric_files,
    types::{data_metadata::DataMetadata, MetricYml},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use indexmap::IndexMap;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use sharing::asset_access_checks::check_metric_collection_access;
use uuid::Uuid;

use query_engine::data_types::DataType;

use crate::metrics::{get_metric_for_dashboard_handler, get_metric_handler, BusterMetric};

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
    pub has_more_records: bool,
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

    // --- Step 1: Try retrieving metric with standard permission checks ---
    let metric_result = get_metric_handler(
        &request.metric_id,
        &user,
        request.version_number,
        request.password.clone(), // Clone password for potential reuse/logging
    )
    .await;

    let metric: BusterMetric = match metric_result {
        Ok(metric) => {
            tracing::debug!("Successfully retrieved metric via standard permissions.");
            metric
        }
        Err(e) => {
            // --- Step 2: Handle potential permission error ---
            let error_string = e.to_string().to_lowercase();
            let is_permission_error = error_string.contains("permission")
                || error_string.contains("expired")
                || error_string.contains("password");

            if is_permission_error {
                tracing::warn!(
                    "Initial metric access failed due to potential permission issue: {}. Checking dashboard access.",
                    e
                );

                // Check if user has access to ANY dashboard containing this metric (including public dashboards)
                let has_dashboard_access = sharing::check_metric_dashboard_access(&request.metric_id, &user.id, &user.organizations)
                    .await
                    .unwrap_or(false);

                if has_dashboard_access {
                    // User has access to a dashboard containing this metric
                    tracing::info!("Found associated dashboard with user access. Fetching metric with dashboard context.");
                    match get_metric_for_dashboard_handler(
                        &request.metric_id,
                        &user,
                        request.version_number,
                        request.password.clone(),
                    )
                    .await
                    {
                        Ok(metric_via_dashboard) => {
                            tracing::debug!(
                                "Successfully retrieved metric via dashboard association."
                            );
                            metric_via_dashboard // Use this metric definition
                        }
                        Err(fetch_err) => {
                            // If fetching via dashboard fails unexpectedly, return that error
                            tracing::error!("Failed to fetch metric via dashboard context: {}", fetch_err);
                            return Err(fetch_err);
                        }
                    }
                } else {
                    // No dashboard access, check if user has access via a chat
                    tracing::info!("No dashboard association found. Checking chat access.");
                    let has_chat_access = sharing::check_metric_chat_access(&request.metric_id, &user.id, &user.organizations)
                        .await
                        .unwrap_or(false);

                    if has_chat_access {
                        // User has access to a chat containing this metric
                        tracing::info!("Found associated chat with user access. Fetching metric with chat context.");
                        match get_metric_for_dashboard_handler(
                            &request.metric_id,
                            &user,
                            request.version_number,
                            request.password.clone(),
                        )
                        .await
                        {
                            Ok(metric_via_chat) => {
                                tracing::debug!(
                                    "Successfully retrieved metric via chat association."
                                );
                                metric_via_chat // Use this metric definition
                            }
                            Err(fetch_err) => {
                                // If fetching via chat fails unexpectedly, return that error
                                tracing::error!("Failed to fetch metric via chat context: {}", fetch_err);
                                return Err(fetch_err);
                            }
                        }
                    } else {
                        // No chat access, check if user has access via a collection
                        tracing::info!("No chat association found. Checking collection access.");
                        let has_collection_access = check_metric_collection_access(&request.metric_id, &user.id, &user.organizations)
                            .await
                            .unwrap_or(false);

                        if has_collection_access {
                            // User has access to a collection containing this metric
                            tracing::info!("Found associated collection with user access. Fetching metric with collection context.");
                            match get_metric_for_dashboard_handler(
                                &request.metric_id,
                                &user,
                                request.version_number,
                                request.password.clone(),
                            )
                            .await
                            {
                                Ok(metric_via_collection) => {
                                    tracing::debug!(
                                        "Successfully retrieved metric via collection association."
                                    );
                                    metric_via_collection // Use this metric definition
                                }
                                Err(fetch_err) => {
                                    // If fetching via collection fails unexpectedly, return that error
                                    tracing::error!("Failed to fetch metric via collection context: {}", fetch_err);
                                    return Err(fetch_err);
                                }
                            }
                        } else {
                            // No dashboard, chat, or collection access, return the original permission error
                            tracing::warn!("No dashboard, chat, or collection association found for metric. Returning original error.");
                            return Err(e);
                        }
                    }
                }
            } else {
                // Error was not permission-related, return original error
                tracing::error!("Metric retrieval failed for non-permission reason: {}", e);
                return Err(e);
            }
        }
    };

    // --- Step 5: Proceed with data fetching using the obtained metric definition ---
    tracing::debug!("Parsing metric definition from YAML to get SQL.");
    // Parse the metric definition from YAML to get SQL
    let metric_yml: MetricYml = match serde_yaml::from_str(&metric.file) {
        Ok(yml) => yml,
        Err(parse_err) => {
            tracing::error!("Failed to parse metric YAML: {}", parse_err);
            return Err(anyhow!("Failed to parse metric definition: {}", parse_err));
        }
    };
    let sql = metric_yml.sql;

    // --- USE DIRECT DATA SOURCE ID ---
    let data_source_id = metric.data_source_id; // Already a Uuid
    tracing::debug!(metric_id = %request.metric_id, data_source_id = %data_source_id, "Using direct data source ID from metric");

    tracing::info!(
        "Querying data for metric {}. Data source: {}, Limit: {:?}", // Removed dataset name as we don't fetch it anymore
        request.metric_id,
        data_source_id, // Use the direct ID
        request.limit
    );

    // Determine the actual query limit - we query for 5001 to check if there are more records
    let query_limit = match request.limit {
        Some(limit) => std::cmp::min(limit, 5001),
        None => 5001,
    };

    // Try to get cached metadata first
    let mut conn_meta = get_pg_pool().get().await?;
    let cached_metadata = metric_files::table
        .filter(metric_files::id.eq(request.metric_id))
        .select(metric_files::data_metadata)
        .first::<Option<DataMetadata>>(&mut conn_meta)
        .await
        .map_err(|e| anyhow!("Error retrieving cached metadata: {}", e))?;
    tracing::debug!("Cached metadata found: {}", cached_metadata.is_some());

    // Execute the query to get the metric data
    let query_result = match query_engine::data_source_query_routes::query_engine::query_engine(
        &data_source_id, // Use the direct ID
        &sql,
        Some(query_limit),
    )
    .await
    {
        Ok(result) => {
            tracing::info!(
                "Successfully executed metric query. Rows returned: {}",
                result.data.len()
            );
            result
        }
        Err(e) => {
            tracing::error!(
                "Error executing metric query for metric {}: {}",
                request.metric_id,
                e
            );
            return Err(anyhow!("Error executing metric query: {}", e));
        }
    };

    // Check if we have more than 5000 records
    let has_more_records = query_result.data.len() > 5000;
    
    // Truncate to 5000 records if we got more
    let mut data = query_result.data;
    if has_more_records {
        data.truncate(5000);
    }

    // Determine which metadata to use
    let final_metadata = if let Some(metadata) = cached_metadata {
        tracing::debug!(
            "Using cached metadata. Cached rows: {}, Query rows: {}",
            metadata.row_count,
            data.len()
        );
        // Use cached metadata but update row count if it differs significantly or if cached count is 0
        // (We update if different because the cache might be stale regarding row count)
        if metadata.row_count != data.len() as i64 {
            tracing::debug!("Row count changed. Updating metadata row count.");
            let mut updated_metadata = metadata.clone();
            updated_metadata.row_count = data.len() as i64;
            // Potentially update updated_at? For now, just row count.
            updated_metadata
        } else {
            metadata
        }
    } else {
        tracing::debug!("No cached metadata found. Using metadata from query result.");
        // No cached metadata, use the one from query_result
        let mut metadata = query_result.metadata.clone();
        // Update row count to match the actual data we're returning
        metadata.row_count = data.len() as i64;
        metadata
    };

    // Construct and return the response
    tracing::info!(
        "Successfully retrieved data for metric {}. Returning response with has_more_records: {}",
        request.metric_id,
        has_more_records
    );
    Ok(MetricDataResponse {
        metric_id: request.metric_id,
        data,
        data_metadata: final_metadata,
        has_more_records,
    })
}
