use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::dashboard_yml::DashboardYml;
use super::metric_yml::MetricYml;
#[derive(Debug, Serialize, Deserialize)]
pub struct File {
    pub name: String,
    pub file_type: String,
    pub yml_content: String,
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
            Self::Metric(metric) => Ok(metric.title.clone()),
            Self::Dashboard(dashboard) => match &dashboard.name {
                Some(name) => Ok(name.clone()),
                None => Err(anyhow::anyhow!("Dashboard name is required but not found")),
            },
        }
    }

    pub fn id(&self) -> anyhow::Result<Uuid> {
        match self {
            Self::Metric(metric) => match metric.id {
                Some(id) => Ok(id),
                None => Err(anyhow::anyhow!("Metric id is required but not found")),
            },
            Self::Dashboard(dashboard) => match dashboard.id {
                Some(id) => Ok(id),
                None => Err(anyhow::anyhow!("Dashboard id is required but not found")),
            },
        }
    }

    pub fn updated_at(&self) -> anyhow::Result<DateTime<Utc>> {
        match self {
            Self::Metric(metric) => match metric.updated_at {
                Some(dt) => Ok(dt),
                None => Err(anyhow::anyhow!(
                    "Metric updated_at is required but not found"
                )),
            },
            Self::Dashboard(dashboard) => match dashboard.updated_at {
                Some(dt) => Ok(dt),
                None => Err(anyhow::anyhow!(
                    "Dashboard updated_at is required but not found"
                )),
            },
        }
    }
}
