use anyhow::Result;
use async_trait::async_trait;
use database::models::User;
use agents::AgentMessage;
use std::sync::Arc;
use agents::Agent;

pub mod chat_context;
pub mod metric_context;
pub mod dashboard_context;

pub use chat_context::ChatContextLoader;
pub use metric_context::MetricContextLoader;
pub use dashboard_context::DashboardContextLoader;

#[async_trait]
pub trait ContextLoader {
    async fn load_context(&self, user: &User, agent: &Arc<Agent>) -> Result<Vec<AgentMessage>>;
}

// Validate that only one context type is provided
pub fn validate_context_request(
    chat_id: Option<uuid::Uuid>,
    metric_id: Option<uuid::Uuid>,
    dashboard_id: Option<uuid::Uuid>,
) -> Result<()> {
    let context_count = [
        chat_id.is_some(),
        metric_id.is_some(),
        dashboard_id.is_some(),
    ]
    .iter()
    .filter(|&&b| b)
    .count();

    if context_count > 1 {
        return Err(anyhow::anyhow!(
            "Only one context type (chat, metric, or dashboard) can be provided"
        ));
    }

    Ok(())
} 