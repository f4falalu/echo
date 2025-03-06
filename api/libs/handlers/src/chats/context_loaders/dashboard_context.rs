use anyhow::{Result, anyhow};
use async_trait::async_trait;
use database::{
    models::{User, Dataset, MetricFile},
    pool::get_pg_pool,
    schema::{dashboard_files, metric_files, datasets},
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use agents::{AgentMessage, Agent};
use litellm::MessageProgress;
use middleware::AuthenticatedUser;
use serde_json::Value;
use std::sync::Arc;
use uuid::Uuid;
use std::collections::HashSet;

use super::ContextLoader;

pub struct DashboardContextLoader {
    pub dashboard_id: Uuid,
}

impl DashboardContextLoader {
    pub fn new(dashboard_id: Uuid) -> Self {
        Self { dashboard_id }
    }
}

#[async_trait]
impl ContextLoader for DashboardContextLoader {
    async fn load_context(&self, user: &AuthenticatedUser, agent: &Arc<Agent>) -> Result<Vec<AgentMessage>> {
        let mut conn = get_pg_pool().get().await.map_err(|e| {
            anyhow!("Failed to get database connection for dashboard context loading: {}", e)
        })?;

        // First verify the dashboard exists and user has access
        let dashboard = dashboard_files::table
            .filter(dashboard_files::id.eq(self.dashboard_id))
            // .filter(dashboard_files::created_by.eq(&user.id))
            .first::<database::models::DashboardFile>(&mut conn)
            .await
            .map_err(|e| {
                anyhow!("Failed to load dashboard (id: {}). Either it doesn't exist or user {} doesn't have access: {}", 
                    self.dashboard_id, user.id, e)
            })?;

        // Parse dashboard content to DashboardYml
        let dashboard_yml: agents::tools::categories::file_tools::file_types::dashboard_yml::DashboardYml = 
            serde_json::from_value(dashboard.content.clone())
            .map_err(|e| anyhow!("Failed to parse dashboard content as YAML for dashboard {}: {}", dashboard.name, e))?;

        // Collect all metric IDs from the dashboard
        let mut metric_ids = HashSet::new();
        for row in &dashboard_yml.rows {
            for item in &row.items {
                metric_ids.insert(item.id);
            }
        }

        // Load all referenced metrics
        let mut metrics_vec = Vec::new();
        let mut all_dataset_ids = HashSet::new();
        let mut failed_metric_loads = Vec::new();

        for metric_id in metric_ids {
            match metric_files::table
                .filter(metric_files::id.eq(metric_id))
                .first::<MetricFile>(&mut conn)
                .await 
            {
                Ok(metric) => {
                    // Parse metric content
                    match serde_json::from_value::<agents::tools::categories::file_tools::file_types::metric_yml::MetricYml>(metric.content.clone()) {
                        Ok(metric_yml) => {
                            all_dataset_ids.extend(metric_yml.dataset_ids);
                            metrics_vec.push(metric);
                        }
                        Err(e) => {
                            failed_metric_loads.push((metric_id, format!("Failed to parse metric content: {}", e)));
                        }
                    }
                }
                Err(e) => {
                    failed_metric_loads.push((metric_id, format!("Failed to load metric: {}", e)));
                }
            }
        }

        if !failed_metric_loads.is_empty() {
            tracing::warn!(
                "Failed to load some metrics for dashboard {}: {:?}",
                dashboard.name,
                failed_metric_loads
            );
        }

        // Load all unique datasets
        let mut datasets_vec = Vec::new();
        let mut failed_dataset_loads = Vec::new();

        for dataset_id in all_dataset_ids {
            match datasets::table
                .filter(datasets::id.eq(dataset_id))
                .first::<Dataset>(&mut conn)
                .await 
            {
                Ok(dataset) => datasets_vec.push(dataset),
                Err(e) => failed_dataset_loads.push((dataset_id, e.to_string())),
            }
        }

        if !failed_dataset_loads.is_empty() {
            tracing::warn!(
                "Failed to load some datasets for dashboard {}: {:?}",
                dashboard.name,
                failed_dataset_loads
            );
        }

        // Set agent state based on loaded assets
        agent.set_state_value(String::from("dashboards_available"), Value::Bool(true))
            .await;
            
        agent.set_state_value(String::from("files_available"), Value::Bool(true))
            .await;
        
        if !metrics_vec.is_empty() {
            agent.set_state_value(String::from("metrics_available"), Value::Bool(true))
                .await;
        };
        
        if !datasets_vec.is_empty() {
            agent.set_state_value(String::from("data_context"), Value::Bool(true))
                .await;
        };

        // Format the context message with dashboard, metrics, and dataset information
        let dashboard_yaml = serde_yaml::to_string(&dashboard_yml)
            .map_err(|e| anyhow!("Failed to serialize dashboard {} to YAML: {}", dashboard.name, e))?;

        let mut context_message = format!(
            "This conversation is continuing with context from the dashboard. Here is the relevant information:\n\nDashboard Definition:\n{}\n\n",
            dashboard_yaml
        );

        if !metrics_vec.is_empty() {
            context_message.push_str("Referenced Metrics:\n");
            for metric in metrics_vec {
                match serde_json::from_value::<agents::tools::categories::file_tools::file_types::metric_yml::MetricYml>(metric.content) {
                    Ok(metric_yml) => {
                        match serde_yaml::to_string(&metric_yml) {
                            Ok(yaml) => context_message.push_str(&format!("\n{}\n", yaml)),
                            Err(e) => tracing::warn!("Failed to serialize metric {} to YAML: {}", metric.id, e),
                        }
                    }
                    Err(e) => tracing::warn!("Failed to parse metric {} content: {}", metric.id, e),
                }
            }
        }

        if !datasets_vec.is_empty() {
            context_message.push_str("\nReferenced Datasets:\n");
            for dataset in datasets_vec {
                if let Some(yml_content) = dataset.yml_file {
                    context_message.push_str(&format!("\n{}\n", yml_content));
                } else {
                    tracing::warn!("Dataset {} has no YML content", dataset.id);
                }
            }
        }

        Ok(vec![AgentMessage::Assistant {
            id: None,
            content: Some(context_message),
            name: None,
            tool_calls: None,
            progress: MessageProgress::Complete,
            initial: true,
        }])
    }
} 