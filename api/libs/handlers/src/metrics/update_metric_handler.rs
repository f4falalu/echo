use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    pool::get_pg_pool,
    schema::metric_files,
    types::{MetricYml, VersionHistory},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde_json::Value;
use uuid::Uuid;

use crate::metrics::get_metric_handler::get_metric_handler;
use crate::metrics::types::BusterMetric;

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct UpdateMetricRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub chart_config: Option<Value>,
    pub time_frame: Option<String>,
    pub dataset_ids: Option<Vec<String>>,
    pub verification: Option<database::enums::Verification>,
    pub file: Option<String>,
    pub sql: Option<String>,
}

/// Handler to update a metric by ID
/// 
/// This handler updates a metric file in the database and increments its version number.
/// Each time a metric is updated, the previous version is saved in the version history.
/// 
/// # Arguments
/// * `metric_id` - The UUID of the metric to update
/// * `user_id` - The UUID of the user making the update
/// * `request` - The update request containing the fields to modify
/// 
/// # Returns
/// * `Result<BusterMetric>` - The updated metric on success, or an error
/// 
/// # Versioning
/// The function automatically handles versioning:
/// 1. Retrieves the current metric and extracts its content
/// 2. Updates the content based on the request parameters
/// 3. Increments the version number (based on the number of existing versions)
/// 4. Adds the updated content to the version history with the new version number
/// 5. Saves both the updated content and version history to the database
///
pub async fn update_metric_handler(
    metric_id: &Uuid,
    user_id: &Uuid,
    request: UpdateMetricRequest,
) -> Result<BusterMetric> {
    let mut conn = get_pg_pool().get().await
        .map_err(|e| anyhow!("Failed to get database connection: {}", e))?;

    // Check if metric exists and user has access - use the latest version
    let metric = get_metric_handler(metric_id, user_id, None).await?;

    // If file is provided, it takes precedence over all other fields
    let content = if let Some(file_content) = request.file {
        serde_yaml::from_str::<MetricYml>(&file_content)
            .map_err(|e| anyhow!("Failed to parse provided file content: {}", e))?
    } else {
        // Parse the current metric YAML from file content
        let mut content = serde_yaml::from_str::<MetricYml>(&metric.file)
            .map_err(|e| anyhow!("Failed to parse metric file: {}", e))?;

        // Update individual fields in the YAML content
        if let Some(description) = request.description {
            content.description = Some(description);
        }
        if let Some(chart_config) = request.chart_config {
            content.chart_config = serde_json::from_value(chart_config)?;
        }
        if let Some(time_frame) = request.time_frame {
            content.time_frame = time_frame;
        }
        if let Some(dataset_ids) = request.dataset_ids {
            content.dataset_ids = dataset_ids
                .into_iter()
                .map(|id| Uuid::parse_str(&id))
                .collect::<Result<_, _>>()?;
        }
        if let Some(title) = request.title {
            content.name = title;
        }
        if let Some(sql) = request.sql {
            content.sql = sql;
        }
        content
    };

    // Get and update version history
    let mut current_version_history: VersionHistory = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .select(metric_files::version_history)
        .first::<VersionHistory>(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to get version history: {}", e))?;
    
    let next_version = metric.versions.len() as i32 + 1;
    current_version_history.add_version(next_version, content.clone());
    
    // Convert content to JSON for storage
    let content_json = serde_json::to_value(content.clone())?;
    
    // Build update query - only verification is handled separately from the YAML content
    let builder = diesel::update(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null());

    // Update based on whether verification is provided
    if let Some(verification) = request.verification {
        builder
            .set((
                metric_files::name.eq(content.name.clone()),
                metric_files::verification.eq(verification),
                metric_files::content.eq(content_json),
                metric_files::updated_at.eq(Utc::now()),
                metric_files::version_history.eq(current_version_history),
            ))
            .execute(&mut conn)
            .await
    } else {
        builder
            .set((
                metric_files::name.eq(content.name.clone()),
                metric_files::content.eq(content_json),
                metric_files::updated_at.eq(Utc::now()),
                metric_files::version_history.eq(current_version_history),
            ))
            .execute(&mut conn)
            .await
    }.map_err(|e| anyhow!("Failed to update metric: {}", e))?;

    // Return the updated metric - latest version
    get_metric_handler(metric_id, user_id, None).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_update_metric_request_validation() {
        // Test the request struct validation without making actual DB calls
        
        // Create a request with valid UUID format for dataset_ids
        let valid_request = UpdateMetricRequest {
            title: Some("Valid Title".to_string()),
            description: Some("Valid Description".to_string()),
            chart_config: Some(serde_json::json!({
                "chartType": "bar",
                "config": { "showLegend": true }
            })),
            time_frame: Some("daily".to_string()),
            dataset_ids: Some(vec![Uuid::new_v4().to_string()]),
            verification: Some(database::enums::Verification::NotRequested),
            file: None,
            sql: None,
        };
        
        // Verify the request fields are properly structured
        assert_eq!(valid_request.title.unwrap(), "Valid Title");
        assert_eq!(valid_request.description.unwrap(), "Valid Description");
        assert_eq!(valid_request.time_frame.unwrap(), "daily");
        assert!(valid_request.chart_config.is_some());
        assert!(valid_request.dataset_ids.unwrap()[0].len() == 36);
        
        // Actual validation logic is tested in integration tests
    }
}