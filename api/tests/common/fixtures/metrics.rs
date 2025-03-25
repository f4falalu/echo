use chrono::Utc;
use database::{
    enums::Verification, 
    models::MetricFile, 
    types::{MetricYml, ChartConfig, VersionHistory}
};
use serde_json::Value;
use uuid::Uuid;

/// Creates a test metric file model
pub async fn create_test_metric_file(
    conn: &mut diesel_async::AsyncPgConnection,
    user_id: Uuid,
    org_id: Option<Uuid>,
    name: Option<String>,
) -> anyhow::Result<MetricFile> {
    use database::schema::metric_files;
    use diesel::ExpressionMethods;
    use diesel_async::RunQueryDsl;
    
    let org_id = org_id.unwrap_or_else(Uuid::new_v4);
    let metric_name = name.unwrap_or_else(|| format!("Test Metric {}", Uuid::new_v4()));
    
    // Create basic metric yaml content
    let metric_yml = MetricYml {
        description: Some("Test metric description".to_string()),
        query: "SELECT * FROM test_table".to_string(),
        chart_type: "bar".to_string(),
        chart_config: ChartConfig::default(),
        time_frame: "daily".to_string(),
        dataset_ids: vec![Uuid::new_v4()],
    };
    
    // Create version history
    let mut version_history = VersionHistory::default();
    version_history.add_version(1, metric_yml.clone());
    
    // Convert to JSON for storage
    let content = serde_json::to_value(metric_yml).unwrap();
    
    let metric = MetricFile {
        id: Uuid::new_v4(),
        name: metric_name,
        content,
        verification: Verification::Unverified,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: user_id,
        updated_by: user_id,
        organization_id: org_id,
        version_history,
    };
    
    // Insert the metric into the database
    diesel::insert_into(metric_files::table)
        .values(&metric)
        .execute(conn)
        .await?;
    
    Ok(metric)
}

/// Creates update metric request data
pub fn create_update_metric_request() -> Value {
    serde_json::json!({
        "title": "Updated Test Metric",
        "description": "Updated test description",
        "chart_config": {
            "xAxis": {
                "title": "Updated X Axis"
            },
            "yAxis": {
                "title": "Updated Y Axis"
            }
        },
        "time_frame": "weekly",
        "dataset_ids": [Uuid::new_v4().to_string()],
        "verification": "verified"
    })
}

/// Creates a request to restore a metric to a specific version
pub fn create_restore_metric_request(version_number: i32) -> Value {
    serde_json::json!({
        "restore_to_version": version_number
    })
}

/// Creates dashboard association request data
pub fn create_metric_dashboard_association_request(dashboard_id: &Uuid) -> Value {
    serde_json::json!({
        "dashboard_id": dashboard_id
    })
}