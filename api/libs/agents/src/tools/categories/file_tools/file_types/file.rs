use chrono::{DateTime, Utc};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use query_engine::data_types::DataType;

use super::dashboard_yml::DashboardYml;
use super::metric_yml::MetricYml;

#[derive(Debug, Serialize, Deserialize)]
pub struct File {
    pub name: String,
    pub file_type: String,
    pub yml_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileWithId {
    pub id: Uuid,
    pub name: String,
    pub file_type: String,
    pub yml_content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result_message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub results: Option<Vec<IndexMap<String, DataType>>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FileEnum {
    Metric(MetricYml),
    Dashboard(DashboardYml),
}

impl FileEnum {
    pub fn name(&self) -> anyhow::Result<String> {
        match self {
            Self::Metric(metric) => Ok(metric.name.clone()),
            Self::Dashboard(dashboard) => Ok(dashboard.name.clone()),
        }
    }
}
