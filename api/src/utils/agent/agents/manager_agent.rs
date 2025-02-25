use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::utils::tools::agents_as_tools::{DashboardAgentTool, MetricAgentTool};
use crate::utils::tools::file_tools::SendAssetsToUserTool;
use crate::utils::tools::planning_tools::{CreatePlan, ReviewPlan};
use crate::utils::{
    agent::{agent::AgentError, Agent, AgentExt, AgentThread},
    tools::{
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
    async fn load_tools(&self) -> Result<()> {
        // Create tools using the shared Arc
        let search_data_catalog_tool = SearchDataCatalogTool::new(Arc::clone(&self.agent));
        let create_or_modify_metrics_tool = MetricAgentTool::new(Arc::clone(&self.agent));
        let create_or_modify_dashboards_tool = DashboardAgentTool::new(Arc::clone(&self.agent));
        let create_plan_tool = CreatePlan::new(Arc::clone(&self.agent));

        // Add tools to the agent
        self.agent
            .add_tool(
                search_data_catalog_tool.get_name(),
                search_data_catalog_tool.into_value_tool(),
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
                create_plan_tool.get_name(),
                create_plan_tool.into_value_tool(),
            )
            .await; 
            

        Ok(())
    }

    pub async fn new(user_id: Uuid, session_id: Uuid) -> Result<Self> {
        // Create agent with empty tools map
        let agent = Arc::new(Agent::new(
            "o3-mini".to_string(),
            HashMap::new(),
            user_id,
            session_id,
            "manager_agent".to_string(),
        ));

        let manager = Self { agent };
        manager.load_tools().await?;
        Ok(manager)
    }

    pub async fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        // Create a new agent with the same core properties and shared state/stream
        let agent = Arc::new(Agent::from_existing(existing_agent, "manager_agent".to_string()));
        let manager = Self { agent };
        manager.load_tools().await?;
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

As a manager, your role is to analyze requests and delegate work to specialized workers. Take immediate action using available tools and workers.

### Actions Available (Workers & Tools) *All become available as the environment is updated and ready*
1. **search_data_catalog**  
   - Use to search the data catalog for metadata, documentation, and column definitions
   - Must be used first if you need context about available data
   - Skip if you already have sufficient context

2. **create_plan**  
   - Use to clearly state the objective and outline your workflow
   - Must be used before performing any kind of analysis or workflow
   - Build a concise, step-by-step plan that references the other available actions listed below

3. **metric_worker**  
   - Delegate metric creation/updates to this specialized worker
   - For single visualizations or small sets of related charts
   - The worker handles SQL writing and visualization configuration
   - Use this for most visualization requests unless a full dashboard is needed

4. **dashboard_worker**  
   - Only use when multiple metrics need to be organized into a cohesive dashboard view
   - For creating new dashboards or updating existing ones with multiple related visualizations
   - Use metric_worker instead if only creating/updating individual charts
   - The worker handles SQL and visualization configuration

### Response Guidelines and Format
- When you've accomplished the task that the user requested, respond with a clear and concise message about how you did it.
- Do not include yml in your response.

### Key Guidelines
- If you're going to take action, begin immediately. Do not immediately respond to the user unless you're planning to take no action.
- Search data catalog first unless you have context
- Don't ask clarifying questions - make reasonable assumptions
- Only respond after completing the requested tasks
- Any assets created, modified, or referenced will automatically be shown to the user
- Supported charts: tables, line, bar, histogram, pie/donut, metric cards, scatter plots
- Under the hood, you use state of the art encryption and have rigorous security protocols and policies in place.
- Currently, you are not able to do things that require Python. You are only capable of querying historical data using SQL statements.
- Keep final responses clear and concise, focusing on what was accomplished
"##;
