use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    enums::AssetPermissionRole,
    helpers::metric_files::fetch_metric_file_with_permissions,
    pool::get_pg_pool,
    schema::{datasets, metric_files},
    types::{ColumnLabelFormat, MetricYml, VersionContent, VersionHistory},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use query_engine::data_source_query_routes::query_engine::query_engine;
use serde_json::Value;
use sharing::check_permission_access;
use uuid::Uuid;

/// Recursively merges two JSON objects.
/// The second object (update) takes precedence over the first (base) where there are conflicts.
///
/// # Arguments
/// * `base` - The base JSON value, typically the existing configuration
/// * `update` - The update JSON value containing fields to update
///
/// # Returns
/// * `Result<Value>` - The merged JSON value or an error
fn merge_json_objects(base: Value, update: Value) -> Result<Value> {
    match (base, update) {
        // If both are objects, merge them recursively
        (Value::Object(mut base_map), Value::Object(update_map)) => {
            for (key, value) in update_map {
                match base_map.get_mut(&key) {
                    // If key exists in both, recursively merge the values
                    Some(base_value) => {
                        *base_value = merge_json_objects(base_value.clone(), value)?;
                    }
                    // If key only exists in update, just insert it
                    None => {
                        base_map.insert(key, value);
                    }
                }
            }
            Ok(Value::Object(base_map))
        }
        // For arrays, replace the entire array
        (_, update @ Value::Array(_)) => Ok(update),
        // For any other type, just replace the value
        (_, update) => Ok(update),
    }
}

use crate::metrics::get_metric_handler::get_metric_handler;
use crate::metrics::types::BusterMetric;

#[derive(Debug, serde::Deserialize, serde::Serialize, Default)]
pub struct UpdateMetricRequest {
    #[serde(alias = "title")]
    pub name: Option<String>,
    pub description: Option<String>,
    pub chart_config: Option<Value>,
    pub time_frame: Option<String>,
    pub dataset_ids: Option<Vec<String>>,
    pub verification: Option<database::enums::Verification>,
    pub file: Option<String>,
    pub sql: Option<String>,
    pub update_version: Option<bool>,
    pub restore_to_version: Option<i32>,
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
    user: &AuthenticatedUser,
    request: UpdateMetricRequest,
) -> Result<BusterMetric> {
    let mut conn = get_pg_pool()
        .get()
        .await
        .map_err(|e| anyhow!("Failed to get database connection: {}", e))?;

    // First, check if the user has access to the metric with the right permission level
    let metric_file_with_permissions = fetch_metric_file_with_permissions(metric_id, &user.id)
        .await
        .map_err(|e| anyhow!("Failed to fetch metric file with permissions: {}", e))?;

    let (permission, organization_id) =
        if let Some(file_with_permission) = metric_file_with_permissions {
            (
                file_with_permission.permission,
                file_with_permission.metric_file.organization_id,
            )
        } else {
            return Err(anyhow!("Metric file not found"));
        };

    // Verify the user has at least Editor, FullAccess, or Owner permission
    if !check_permission_access(
        permission,
        &[
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        organization_id,
        &user.organizations,
    ) {
        return Err(anyhow!(
            "You don't have permission to update this metric. Editor or higher role required."
        ));
    }

    // Now get the full metric with all its data needed for the update
    let metric = get_metric_handler(metric_id, user, None).await?;

    // Get version history
    let mut current_version_history: VersionHistory = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .select(metric_files::version_history)
        .first::<VersionHistory>(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to get version history: {}", e))?;

    // Version restoration takes highest precedence
    let mut content = if let Some(version_number) = request.restore_to_version {
        // Fetch the requested version
        let version = current_version_history
            .get_version(version_number)
            .ok_or_else(|| anyhow!("Version {} not found", version_number))?;

        // Parse the YAML content from the version
        match &version.content {
            VersionContent::MetricYml(metric_yml) => {
                tracing::info!(
                    "Restoring metric {} to version {}",
                    metric_id,
                    version_number
                );
                (**metric_yml).clone()
            }
            _ => return Err(anyhow!("Invalid version content type")),
        }
    // If file is provided, it takes precedence over individual fields
    } else if let Some(ref file_content) = request.file {
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
            // Instead of trying to deserialize directly, we'll merge the JSON objects first
            // and then deserialize the combined result

            // Convert existing chart_config to Value for merging
            let existing_config = serde_json::to_value(&content.chart_config)?;

            // Merge the incoming chart_config with the existing one
            let merged_config = merge_json_objects(existing_config, chart_config)?;

            // Convert merged JSON back to ChartConfig
            content.chart_config = serde_json::from_value(merged_config)?;
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
        if let Some(title) = request.name {
            content.name = title;
        }
        if let Some(ref sql) = request.sql {
            content.sql = sql.clone();
        }
        content
    };

    // Calculate the next version number
    let next_version = metric.versions.len() as i32 + 1;

    // Only add a new version if update_version is true (defaults to true)
    let should_update_version = request.update_version.unwrap_or(true);

    // Add the new version to the version history or update the latest version
    if should_update_version {
        current_version_history.add_version(next_version, content.clone());
    } else {
        // Overwrite the current version instead of creating a new one
        current_version_history.update_latest_version(content.clone());
    }

    // Calculate data_metadata if SQL changed
    let data_metadata = if request.sql.is_some()
        || request.file.is_some()
        || request.restore_to_version.is_some()
    {
        // Get data source for dataset
        let dataset_id = content
            .dataset_ids
            .get(0)
            .ok_or_else(|| anyhow!("No dataset ID found"))?;

        let data_source_id = datasets::table
            .filter(datasets::id.eq(dataset_id))
            .select(datasets::data_source_id)
            .first::<Uuid>(&mut conn)
            .await
            .map_err(|e| anyhow!("Failed to get data source ID: {}", e))?;

        // Execute query and get results with metadata
        let query_result = query_engine(&data_source_id, &content.sql, Some(100))
            .await
            .map_err(|e| anyhow!("Failed to execute SQL for metadata calculation: {}", e))?;

        // Generate default column formats based on metadata using the new method
        let default_formats =
            ColumnLabelFormat::generate_formats_from_metadata(&query_result.metadata);

        // Get existing chart config
        let existing_config = serde_json::to_value(&content.chart_config)?;

        // Create a new JSON object with column_label_formats
        let column_formats_json = serde_json::to_value(&default_formats)?;
        let format_update = serde_json::json!({
            "columnLabelFormats": column_formats_json
        });

        // Merge the formats with existing config
        let merged_config = merge_json_objects(existing_config, format_update)?;

        // Update the content's chart_config
        content.chart_config = serde_json::from_value(merged_config)?;

        // Return metadata
        Some(query_result.metadata)
    } else {
        None
    };

    // Convert content to JSON for storage
    let content_json = serde_json::to_value(content.clone())?;

    // Build update query - only verification is handled separately from the YAML content
    let builder = diesel::update(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null());

    // Update based on whether verification and metadata are provided
    if let Some(verification) = request.verification {
        if let Some(metadata) = data_metadata {
            builder
                .set((
                    metric_files::name.eq(content.name.clone()),
                    metric_files::verification.eq(verification),
                    metric_files::content.eq(content_json),
                    metric_files::updated_at.eq(Utc::now()),
                    metric_files::version_history.eq(current_version_history),
                    metric_files::data_metadata.eq(metadata),
                ))
                .execute(&mut conn)
                .await
        } else {
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
        }
    } else {
        if let Some(metadata) = data_metadata {
            builder
                .set((
                    metric_files::name.eq(content.name.clone()),
                    metric_files::content.eq(content_json),
                    metric_files::updated_at.eq(Utc::now()),
                    metric_files::version_history.eq(current_version_history),
                    metric_files::data_metadata.eq(metadata),
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
        }
    }
    .map_err(|e| anyhow!("Failed to update metric: {}", e))?;

    // Return the updated metric - latest version
    get_metric_handler(metric_id, user, None).await
}

#[cfg(test)]
mod tests {
    use database::types::{ColumnMetaData, ColumnType, DataMetadata, SimpleType};
    use serde_json::json;

    use super::*;

    #[test]
    fn test_update_metric_request_validation() {
        // Test the request struct validation without making actual DB calls

        // Create a request with valid UUID format for dataset_ids
        let valid_request = UpdateMetricRequest {
            name: Some("Valid Title".to_string()),
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
            update_version: None,
            restore_to_version: None,
        };

        // Verify the request fields are properly structured
        assert_eq!(valid_request.name.unwrap(), "Valid Title");
        assert_eq!(valid_request.description.unwrap(), "Valid Description");
        assert_eq!(valid_request.time_frame.unwrap(), "daily");
        assert!(valid_request.chart_config.is_some());
        assert!(valid_request.dataset_ids.unwrap()[0].len() == 36);

        // Actual validation logic is tested in integration tests
    }

    #[test]
    fn test_restore_version_request() {
        // Test restoration request validation
        let restore_request = UpdateMetricRequest {
            restore_to_version: Some(1),
            name: Some("This should be ignored".to_string()),
            description: Some("This should be ignored".to_string()),
            chart_config: None,
            time_frame: None,
            dataset_ids: None,
            verification: None,
            file: None,
            sql: None,
            update_version: None,
        };

        // Verify the request fields are properly structured
        assert_eq!(restore_request.restore_to_version.unwrap(), 1);
        assert_eq!(restore_request.name.unwrap(), "This should be ignored");
    }

    #[test]
    fn test_chart_config_partial_update() {
        // This test verifies that partial chart_config updates only change specified fields

        // Create a mock existing chart_config
        let existing_config = serde_json::json!({
            "selectedChartType": "bar",
            "colors": ["#1f77b4", "#ff7f0e"],
            "show_legend": true,
            "grid_lines": true,
            "bar_and_line_axis": {
                "x": ["date"],
                "y": ["value"]
            },
            "columnLabelFormats": {
                "date": {
                    "columnType": "date",
                    "style": "date"
                },
                "value": {
                    "columnType": "number",
                    "style": "number"
                }
            }
        });

        // Create a partial chart_config update that only changes specific fields
        let partial_config = serde_json::json!({
            "selectedChartType": "bar",  // Same as before
            "colors": ["#ff0000", "#00ff00"],  // Changed
            "show_legend": false,  // Changed
            "columnLabelFormats": {
                // Update just one entry
                "value": {
                    "style": "currency"  // Only changing style, columnType should be preserved
                }
            }
        });

        // Apply the deep merge
        let updated_config =
            merge_json_objects(existing_config.clone(), partial_config.clone()).unwrap();

        // Verify the updated config has the expected changes

        // Changed fields should have new values
        assert_eq!(updated_config["colors"][0], "#ff0000");
        assert_eq!(updated_config["colors"][1], "#00ff00");
        assert_eq!(updated_config["show_legend"], false);

        // Unchanged fields should retain original values
        assert_eq!(updated_config["grid_lines"], true);
        assert_eq!(updated_config["bar_and_line_axis"]["x"][0], "date");
        assert_eq!(updated_config["bar_and_line_axis"]["y"][0], "value");

        // Verify nested column formats are correctly merged
        assert_eq!(
            updated_config["columnLabelFormats"]["date"]["columnType"],
            "date"
        );
        assert_eq!(
            updated_config["columnLabelFormats"]["date"]["style"],
            "date"
        );

        // This entry should be partially updated - style changed but columnType preserved
        assert_eq!(
            updated_config["columnLabelFormats"]["value"]["columnType"],
            "number"
        );
        assert_eq!(
            updated_config["columnLabelFormats"]["value"]["style"],
            "currency"
        );
    }

    #[test]
    fn test_merge_json_objects() {
        // Test basic object merging
        let base = serde_json::json!({
            "a": 1,
            "b": 2
        });
        let update = serde_json::json!({
            "b": 3,
            "c": 4
        });

        let result = merge_json_objects(base, update).unwrap();
        assert_eq!(result["a"], 1);
        assert_eq!(result["b"], 3);
        assert_eq!(result["c"], 4);

        // Test nested object merging
        let base = serde_json::json!({
            "nested": {
                "x": 1,
                "y": 2
            },
            "other": "value"
        });
        let update = serde_json::json!({
            "nested": {
                "y": 3,
                "z": 4
            }
        });

        let result = merge_json_objects(base, update).unwrap();
        assert_eq!(result["nested"]["x"], 1); // Preserved from base
        assert_eq!(result["nested"]["y"], 3); // Updated
        assert_eq!(result["nested"]["z"], 4); // Added from update
        assert_eq!(result["other"], "value"); // Preserved from base

        // Test array replacement
        let base = serde_json::json!({
            "arr": [1, 2, 3]
        });
        let update = serde_json::json!({
            "arr": [4, 5]
        });

        let result = merge_json_objects(base, update).unwrap();
        assert_eq!(result["arr"], serde_json::json!([4, 5])); // Array is replaced, not merged
    }

    #[test]
    fn test_update_column_formats_from_metadata() {
        // Create a mock existing chart_config with some existing column formats
        let existing_config = serde_json::json!({
            "selectedChartType": "bar",
            "columnLabelFormats": {
                "existing_column": {
                    "columnType": "number",
                    "style": "currency",
                    "currency": "USD"
                }
            }
        });

        // Create a test DataMetadata with two columns - one existing and one new
        let metadata = DataMetadata {
            column_count: 2,
            row_count: 10,
            column_metadata: vec![
                ColumnMetaData {
                    name: "existing_column".to_string(),
                    min_value: json!(0),
                    max_value: json!(100),
                    unique_values: 10,
                    simple_type: SimpleType::Number,
                    column_type: ColumnType::Float8,
                },
                ColumnMetaData {
                    name: "new_column".to_string(),
                    min_value: json!("2023-01-01"),
                    max_value: json!("2023-12-31"),
                    unique_values: 12,
                    simple_type: SimpleType::Date,
                    column_type: ColumnType::Date,
                },
            ],
        };

        // Generate default column formats
        let default_formats = ColumnLabelFormat::generate_formats_from_metadata(&metadata);

        // Convert to JSON for merging
        let column_formats_json = serde_json::to_value(&default_formats).unwrap();
        let format_update = serde_json::json!({
            "columnLabelFormats": column_formats_json
        });

        // Merge with existing config
        let merged_config = merge_json_objects(existing_config, format_update).unwrap();

        // Verify the merged config

        // Check that existing column kept its custom currency format
        assert_eq!(
            merged_config["columnLabelFormats"]["existing_column"]["style"],
            "currency"
        );
        assert_eq!(
            merged_config["columnLabelFormats"]["existing_column"]["currency"],
            "USD"
        );

        // Check that new column has the default date format
        assert_eq!(
            merged_config["columnLabelFormats"]["new_column"]["columnType"],
            "date"
        );
        assert_eq!(
            merged_config["columnLabelFormats"]["new_column"]["style"],
            "date"
        );
        assert_eq!(
            merged_config["columnLabelFormats"]["new_column"]["dateFormat"],
            "auto"
        );
    }
}
