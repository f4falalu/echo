use chrono::Utc;
use database::{
    enums::Verification, 
    models::DashboardFile, 
    types::{DashboardYml, VersionHistory}
};
use serde_json::Value;
use uuid::Uuid;

/// Creates a test dashboard file model
pub fn create_test_dashboard_file(
    user_id: &Uuid,
    org_id: &Uuid,
    name: Option<String>,
) -> DashboardFile {
    let dashboard_name = name.unwrap_or_else(|| format!("Test Dashboard {}", Uuid::new_v4()));
    
    // Create basic dashboard yaml content
    let dashboard_yml = DashboardYml {
        description: Some("Test dashboard description".to_string()),
        layout: serde_json::json!({
            "rows": [],
            "cols": []
        }),
    };
    
    // Create version history
    let mut version_history = VersionHistory::default();
    version_history.add_version(1, dashboard_yml.clone());
    
    // Convert to JSON for storage
    let content = serde_json::to_value(dashboard_yml).unwrap();
    
    DashboardFile {
        id: Uuid::new_v4(),
        name: dashboard_name,
        content,
        verification: Verification::Unverified,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: *user_id,
        updated_by: *user_id,
        organization_id: *org_id,
        version_history,
    }
}