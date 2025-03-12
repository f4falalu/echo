use agents::{Agent, LiteLlmMessage};
use anyhow::{anyhow, Result};
use async_trait::async_trait;
use database::{
    models::{Dataset, User},
    pool::get_pg_pool,
    schema::{datasets, metric_files},
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use serde_json::Value;
use std::sync::Arc;
use uuid::Uuid;

use super::ContextLoader;

pub struct MetricContextLoader {
    pub metric_id: Uuid,
}

impl MetricContextLoader {
    pub fn new(metric_id: Uuid) -> Self {
        Self { metric_id }
    }
}

#[async_trait]
impl ContextLoader for MetricContextLoader {
    async fn load_context(&self, user: &AuthenticatedUser, agent: &Arc<Agent>) -> Result<Vec<LiteLlmMessage>> {
        let mut conn = get_pg_pool().get().await.map_err(|e| {
            anyhow!(
                "Failed to get database connection for metric context loading: {}",
                e
            )
        })?;

        // First verify the metric exists and user has access
        let metric = metric_files::table
            .filter(metric_files::id.eq(self.metric_id))
            // .filter(metric_files::created_by.eq(&user.id))
            .first::<database::models::MetricFile>(&mut conn)
            .await
            .map_err(|e| {
                anyhow!("Failed to load metric (id: {}). Either it doesn't exist or user {} doesn't have access: {}", 
                    self.metric_id, user.id, e)
            })?;

        // Get the metric content as MetricYml
        let metric_yml = metric.content;
        // Load all referenced datasets
        let dataset_ids = &metric_yml.dataset_ids;
        let mut datasets_vec = Vec::new();
        let mut failed_dataset_loads = Vec::new();

        for dataset_id in dataset_ids {
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
                "Failed to load some datasets for metric {}: {:?}",
                metric.name,
                failed_dataset_loads
            );
        }

        // Set agent state based on loaded assets
        agent
            .set_state_value(String::from("metrics_available"), Value::Bool(true))
            .await;

        agent
            .set_state_value(String::from("files_available"), Value::Bool(true))
            .await;

        if !datasets_vec.is_empty() {
            agent
                .set_state_value(String::from("data_context"), Value::Bool(true))
                .await;
        };

        // Format the context message with metric and dataset information
        let metric_yaml = serde_yaml::to_string(&metric_yml)
            .map_err(|e| anyhow!("Failed to serialize metric {} to YAML: {}", metric.name, e))?;

        let mut context_message = format!(
            "This conversation is continuing with context from the metric. Here is the relevant information:\n\nMetric Definition:\n{}\n\n",
            metric_yaml
        );

        if !datasets_vec.is_empty() {
            context_message.push_str("Referenced Datasets:\n");
            for dataset in datasets_vec {
                if let Some(yml_content) = dataset.yml_file {
                    context_message.push_str(&format!("\n{}\n", yml_content));
                } else {
                    tracing::warn!("Dataset {} has no YML content", dataset.id);
                }
            }
        }

        Ok(vec![LiteLlmMessage::Assistant {
            id: None,
            content: Some(context_message),
            name: None,
            tool_calls: None,
            progress: litellm::MessageProgress::Complete,
            initial: true,
        }])
    }
}
