use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::utils::tools::agents_as_tools::{DashboardAgentTool, MetricAgentTool};
use crate::utils::tools::file_tools::SendAssetsToUserTool;
use crate::utils::{
    agent::{agent::AgentError, Agent, AgentExt, AgentThread},
    tools::{
        agents_as_tools::ExploratoryAgentTool,
        file_tools::{SearchDataCatalogTool, SearchFilesTool},
        IntoValueTool, ToolExecutor,
    },
};

use litellm::Message as AgentMessage;

#[derive(Debug, Serialize, Deserialize)]
pub struct ManagerAgentOutput {
    pub message: String,
    pub duration: i64,
    pub thread_id: Uuid,
    pub messages: Vec<AgentMessage>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ManagerAgentInput {
    pub prompt: String,
    pub thread_id: Option<Uuid>,
    pub message_id: Option<Uuid>,
}

pub struct ManagerAgent {
    agent: Arc<Agent>,
}

impl AgentExt for ManagerAgent {
    fn get_agent(&self) -> &Arc<Agent> {
        &self.agent
    }
}

impl ManagerAgent {
    async fn load_tools(&self, include_send_assets: bool) -> Result<()> {
        // Create tools using the shared Arc
        let search_data_catalog_tool = SearchDataCatalogTool::new(Arc::clone(&self.agent));
        let search_files_tool = SearchFilesTool::new(Arc::clone(&self.agent));
        let create_or_modify_metrics_tool = MetricAgentTool::new(Arc::clone(&self.agent));
        let create_or_modify_dashboards_tool = DashboardAgentTool::new(Arc::clone(&self.agent));
        let exploratory_agent_tool = ExploratoryAgentTool::new(Arc::clone(&self.agent));

        // Add tools to the agent
        self.agent
            .add_tool(
                search_data_catalog_tool.get_name(),
                search_data_catalog_tool.into_value_tool(),
            )
            .await;
        self.agent
            .add_tool(
                search_files_tool.get_name(),
                search_files_tool.into_value_tool(),
            )
            .await;
        self.agent
            .add_tool(
                create_or_modify_metrics_tool.get_name(),
                create_or_modify_metrics_tool.into_value_tool(),
            )
            .await;
        self.agent
            .add_tool(
                create_or_modify_dashboards_tool.get_name(),
                create_or_modify_dashboards_tool.into_value_tool(),
            )
            .await;
        self.agent
            .add_tool(
                exploratory_agent_tool.get_name(),
                exploratory_agent_tool.into_value_tool(),
            )
            .await;

        if include_send_assets {
            let send_assets_to_user = SendAssetsToUserTool::new(Arc::clone(&self.agent));
            self.agent
                .add_tool(
                    send_assets_to_user.get_name(),
                    send_assets_to_user.into_value_tool(),
                )
                .await;
        }

        Ok(())
    }

    pub async fn new(user_id: Uuid, session_id: Uuid) -> Result<Self> {
        // Create agent with empty tools map
        let agent = Arc::new(Agent::new(
            "o3-mini".to_string(),
            HashMap::new(),
            user_id,
            session_id,
        ));

        let manager = Self { agent };
        manager.load_tools(false).await?;
        Ok(manager)
    }

    pub async fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        // Create a new agent with the same core properties and shared state/stream
        let agent = Arc::new(Agent::from_existing(existing_agent));
        let manager = Self { agent };
        manager.load_tools(true).await?;
        Ok(manager)
    }

    pub async fn run(
        &self,
        thread: &mut AgentThread,
    ) -> Result<broadcast::Receiver<Result<AgentMessage, AgentError>>> {
        thread.set_developer_message(MANAGER_AGENT_PROMPT.to_string());

        // Get shutdown receiver
        let rx = self.stream_process_thread(thread).await?;

        Ok(rx)
    }

    /// Shutdown the manager agent and all its tools
    pub async fn shutdown(&self) -> Result<()> {
        self.get_agent().shutdown().await
    }
}

const MANAGER_AGENT_PROMPT: &str = r##"
### Role & Task
You are an expert analytics and data engineer who helps non-technical users get fast, accurate answers to their analytics questions. Your name is Buster.
As a manager, your role is to analyze requests and delegate work to specialized workers. You can either use tools directly or assign tasks to worker agents who are experts in their domains.

### Actions Available (Workers & Tools) *All become available as the environment is updated and ready*
1. **search_data_catalog**  
   - Use to search the data catalog for metadata, documentation, and column definitions
   - Must be used first if you need context about available data
   - Skip if you already have sufficient context

2. **metric_worker**  
   - Delegate metric creation/updates to this specialized worker
   - For single visualizations or small sets of related charts
   - The worker handles SQL writing and visualization configuration
   - Let the worker handle the details while you manage the process

3. **dashboard_worker**  
   - Delegate dashboard creation/updates to this specialized worker
   - For full dashboards with multiple charts
   - The worker handles SQL and visualization configuration
   - Trust the worker to handle dashboard-specific details

4. **exploratory_worker**  
   - Delegate deep-dive investigations to this analysis expert
   - Worker can run multiple SQL queries and analyze results
   - Only use when broad exploration is needed
   - Skip for simple metric requests that can go directly to metric_worker

5. **search_files**  
   - Only use when user explicitly asks to search through files
   - For finding previously created content
   - Do not use unless specifically requested

6. **send_assets_to_user**  
   - Use after workers complete their metric/dashboard tasks
   - Specifies which assets to show the user
   - Skip if no assets were created/modified

### Key Guidelines
- You are a manager - delegate work to specialized workers when possible
- Search data catalog first unless you have context
- Don't ask clarifying questions - make reasonable assumptions
- Workers handle the SQL and visualization details
- Supported charts: tables, line, bar, histogram, pie/donut, metric cards, scatter plots
- Respond with clear, concise explanations of what was delegated and accomplished
"##;
