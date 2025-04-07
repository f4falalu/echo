use chrono::{DateTime, Utc};
use database::{enums::{AssetPermissionRole, Verification}, types::{ChartConfig, DataMetadata}};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Dataset {
    pub name: String,
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Version {
    pub version_number: i32,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterShareIndividual {
    pub email: String,
    pub role: AssetPermissionRole,
    pub name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterMetric {
    pub id: Uuid,
    #[serde(rename = "type")]
    pub metric_type: String, // Always "metric"
    pub name: String,
    pub version_number: i32,
    pub description: Option<String>,
    pub file_name: String,
    pub time_frame: String,
    pub datasets: Vec<Dataset>,
    pub data_source_id: String,
    pub error: Option<String>,
    pub chart_config: Option<ChartConfig>, // BusterChartConfigProps
    pub data_metadata: Option<DataMetadata>,
    pub status: Verification,
    pub evaluation_score: Option<String>, // "Moderate" | "High" | "Low"
    pub evaluation_summary: String,
    pub file: String, // yaml file
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub sent_by_id: Uuid,
    pub sent_by_name: String,
    pub sent_by_avatar_url: Option<String>,
    pub code: Option<String>,
    pub dashboards: Vec<AssociatedDashboard>,
    pub collections: Vec<AssociatedCollection>,
    pub versions: Vec<Version>,
    pub permission: AssetPermissionRole,
    pub sql: String,
    // Sharing fields
    pub individual_permissions: Option<Vec<BusterShareIndividual>>,
    pub public_expiry_date: Option<DateTime<Utc>>,
    pub public_enabled_by: Option<String>,
    pub publicly_accessible: bool,
    pub public_password: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssociatedDashboard {
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssociatedCollection {
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Dashboard {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Collection {
    pub id: String,
    pub name: String,
}

// IDataResult equivalent
pub type DataResult = Option<Vec<HashMap<String, Option<DataValue>>>>;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum DataValue {
    String(String),
    Number(f64),
    Null,
}

/// Default batch size for bulk updates
fn default_batch_size() -> usize {
    50
}

/// Request type for bulk updating metric verification statuses
#[derive(Debug, Serialize, Deserialize)]
pub struct BulkUpdateMetricsRequest {
    /// List of metric status updates to process
    pub updates: Vec<MetricStatusUpdate>,
    /// Optional batch size for concurrent processing (defaults to 50)
    #[serde(default = "default_batch_size")]
    pub batch_size: usize,
}

/// Individual metric status update in a bulk update request
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MetricStatusUpdate {
    /// ID of the metric to update
    pub id: Uuid,
    /// New verification status to apply
    pub verification: Verification,
}

/// Response type for bulk metric updates
#[derive(Debug, Serialize, Deserialize)]
pub struct BulkUpdateMetricsResponse {
    /// Successfully updated metrics
    pub updated_metrics: Vec<BusterMetric>,
    /// Failed metric updates with error details
    pub failed_updates: Vec<FailedMetricUpdate>,
    /// Total number of metrics processed
    pub total_processed: usize,
    /// Number of successful updates
    pub success_count: usize,
    /// Number of failed updates
    pub failure_count: usize,
}

/// Details of a failed metric update
#[derive(Debug, Serialize, Deserialize)]
pub struct FailedMetricUpdate {
    /// ID of the metric that failed to update
    pub metric_id: Uuid,
    /// Error message describing the failure
    pub error: String,
    /// Error code for client handling
    pub error_code: String,
}
