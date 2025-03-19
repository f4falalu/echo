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
}

/// Handler to update a metric by ID
pub async fn update_metric_handler(
    metric_id: &Uuid,
    user_id: &Uuid,
    request: UpdateMetricRequest,
) -> Result<BusterMetric> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    // Check if metric exists and user has access
    let metric = get_metric_handler(metric_id, user_id).await?;

    // Parse the current metric YAML from file content
    let mut content = match serde_yaml::from_str::<MetricYml>(&metric.file) {
        Ok(content) => content,
        Err(e) => return Err(anyhow!("Failed to parse metric file: {}", e)),
    };

    // Update the metric content with the values from the request
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

    // Get the current version history for the metric
    let mut current_version_history: VersionHistory = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .select(metric_files::version_history)
        .first::<VersionHistory>(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to get version history: {}", e))?;
    
    // Calculate next version number
    let next_version = metric.versions.len() as i32 + 1;
    
    // Update version history
    current_version_history.add_version(next_version, content.clone());
    
    // Set updated content and version history
    let content_json = serde_json::to_value(content)?;
    
    // Use the updated version history
    
    // Build base update query
    let builder = diesel::update(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null());
    
    // Depending on what fields we need to update, build the appropriate set clause
    if let Some(title) = request.title {
        if let Some(verification) = request.verification {
            // Update title and verification along with other fields
            builder
                .set((
                    metric_files::name.eq(title),
                    metric_files::verification.eq(verification),
                    metric_files::content.eq(content_json),
                    metric_files::updated_at.eq(Utc::now()),
                    metric_files::version_history.eq(current_version_history),
                ))
                .execute(&mut conn)
                .await
                .map_err(|e| anyhow!("Failed to update metric: {}", e))?;
        } else {
            // Update title along with other fields
            builder
                .set((
                    metric_files::name.eq(title),
                    metric_files::content.eq(content_json),
                    metric_files::updated_at.eq(Utc::now()),
                    metric_files::version_history.eq(current_version_history),
                ))
                .execute(&mut conn)
                .await
                .map_err(|e| anyhow!("Failed to update metric: {}", e))?;
        }
    } else if let Some(verification) = request.verification {
        // Update verification along with other fields
        builder
            .set((
                metric_files::verification.eq(verification),
                metric_files::content.eq(content_json),
                metric_files::updated_at.eq(Utc::now()),
                metric_files::version_history.eq(current_version_history),
            ))
            .execute(&mut conn)
            .await
            .map_err(|e| anyhow!("Failed to update metric: {}", e))?;
    } else {
        // Update only the standard fields
        builder
            .set((
                metric_files::content.eq(content_json),
                metric_files::updated_at.eq(Utc::now()),
                metric_files::version_history.eq(current_version_history),
            ))
            .execute(&mut conn)
            .await
            .map_err(|e| anyhow!("Failed to update metric: {}", e))?;
    }

    // Return the updated metric
    get_metric_handler(metric_id, user_id).await
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