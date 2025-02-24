use std::sync::Arc;

use anyhow::Result;
use std::collections::HashMap;
use uuid::Uuid;

use crate::utils::{
    agent::{agent::AgentError, Agent, AgentExt, AgentThread},
    tools::{
        agents_as_tools::dashboard_agent_tool::DashboardAgentOutput, file_tools::{
            CreateDashboardFilesTool, CreateMetricFilesTool, ModifyDashboardFilesTool,
            ModifyMetricFilesTool,
        }, IntoValueTool, ToolExecutor
    },
};

use litellm::Message as AgentMessage;
use tokio::sync::broadcast;

pub struct DashboardAgent {
    agent: Arc<Agent>,
}

impl DashboardAgent {
    async fn load_tools(&self) -> Result<()> {
        // Add dashboard and metric tools
        let create_dashboard_tool = CreateDashboardFilesTool::new(Arc::clone(&self.agent));
        let modify_dashboard_tool = ModifyDashboardFilesTool::new(Arc::clone(&self.agent));
        let create_metric_tool = CreateMetricFilesTool::new(Arc::clone(&self.agent));
        let modify_metric_tool = ModifyMetricFilesTool::new(Arc::clone(&self.agent));

        // Add tools to the agent
        self.agent
            .add_tool(
                create_dashboard_tool.get_name(),
                create_dashboard_tool.into_value_tool(),
            )
            .await;
        self.agent
            .add_tool(
                modify_dashboard_tool.get_name(),
                modify_dashboard_tool.into_value_tool(),
            )
            .await;
        self.agent
            .add_tool(
                create_metric_tool.get_name(),
                create_metric_tool.into_value_tool(),
            )
            .await;
        self.agent
            .add_tool(
                modify_metric_tool.get_name(),
                modify_metric_tool.into_value_tool(),
            )
            .await;

        Ok(())
    }

    pub async fn new(user_id: Uuid, session_id: Uuid) -> Result<Self> {
        // Create agent first
        let agent = Arc::new(Agent::new(
            "o3-mini".to_string(),
            HashMap::new(),
            user_id,
            session_id,
        ));

        let dashboard = Self { agent };
        dashboard.load_tools().await?;
        Ok(dashboard)
    }

    pub async fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        // Create a new agent with the same core properties and shared state/stream
        let agent = Arc::new(Agent::from_existing(existing_agent));
        let dashboard = Self { agent };
        dashboard.load_tools().await?;
        Ok(dashboard)
    }

    fn is_completion_signal(msg: &AgentMessage) -> bool {
        matches!(msg, AgentMessage::Assistant { content: Some(content), tool_calls: None, .. } 
            if content == "AGENT_COMPLETE")
    }

    pub async fn run(&self, thread: &mut AgentThread) -> Result<broadcast::Receiver<Result<AgentMessage, AgentError>>> {
        thread.set_developer_message(DASHBOARD_AGENT_PROMPT.to_string());

        // Get shutdown receiver
        let mut shutdown_rx = self.get_agent().get_shutdown_receiver().await;
        let mut rx = self.stream_process_thread(thread).await?;

        let rx_return = rx.resubscribe();

        // Process messages internally until we determine we're done
        loop {
            tokio::select! {
                recv_result = rx.recv() => {
                    match recv_result {
                        Ok(msg_result) => {
                            match msg_result {
                                Ok(msg) => {
                                    // Forward message to stream sender
                                    let sender = self.get_agent().get_stream_sender().await;
                                    if let Err(e) = sender.send(Ok(msg.clone())) {
                                        let err_msg = format!("Error forwarding message: {:?}", e);
                                        let _ = sender.send(Err(AgentError(err_msg)));
                                        continue;
                                    }
                                    
                                    if let Some(content) = msg.get_content() {
                                        if content == "AGENT_COMPLETE" {
                                            return Ok(rx_return);
                                        }
                                    }
                                }
                                Err(e) => {
                                    let err_msg = format!("Error processing message: {:?}", e);
                                    let _ = self.get_agent().get_stream_sender().await.send(Err(AgentError(err_msg)));
                                    continue;
                                }
                            }
                        }
                        Err(e) => {
                            let err_msg = format!("Error receiving message: {:?}", e);
                            let _ = self.get_agent().get_stream_sender().await.send(Err(AgentError(err_msg)));
                            continue;
                        }
                    }
                }
                _ = shutdown_rx.recv() => {
                    // Handle shutdown gracefully
                    let tools = self.get_agent().get_tools().await;
                    for (_, tool) in tools.iter() {
                        if let Err(e) = tool.handle_shutdown().await {
                            let err_msg = format!("Error shutting down tool: {:?}", e);
                            let _ = self.get_agent().get_stream_sender().await.send(Err(AgentError(err_msg)));
                        }
                    }

                    let _ = self.get_agent().get_stream_sender().await.send(
                        Ok(AgentMessage::assistant(
                            Some("shutdown_message".to_string()),
                            Some("Dashboard agent shutting down gracefully".to_string()),
                            None,
                            None,
                            None,
                        ))
                    );

                    return Ok(rx_return);
                }
            }
        }
    }
}

impl AgentExt for DashboardAgent {
    fn get_agent(&self) -> &Arc<Agent> {
        &self.agent
    }
}

const DASHBOARD_AGENT_PROMPT: &str = r##"
You are an expert at determining if new dashboards should be created or modified. Note that the dataset info (which includes database schema information such as table names and column details) will be passed into the function to help understand available data.
Follow these detailed instructions to decide whether to call create a new dashboard or modify an existing one:
──────────────────────────────
**SQL Best Practices and Constraints** (when creating new metrics)  
- **Constraints**: Only join tables with explicit entity relationships.  
- **SQL Requirements**:  
  - Use schema-qualified table names (`<SCHEMA_NAME>.<TABLE_NAME>`).  
  - Select specific columns (avoid `SELECT *` or `COUNT(*)`).  
  - Use CTEs instead of subqueries, and use snake_case for naming them.  
  - Use `DISTINCT` (not `DISTINCT ON`) with matching `GROUP BY`/`SORT BY` clauses.  
  - Show entity names rather than just IDs.  
  - Handle date conversions appropriately.  
  - Order dates in ascending order.
  - Reference database identifiers for cross-database queries.  
  - Format output for the specified visualization type.  
  - Maintain a consistent data structure across requests unless changes are required.  
  - Use explicit ordering for custom buckets or categories.
------------------------------
Your Overall Goal

Your objective is to ensure that the dashboards in the system remain relevant, unique, and up-to-date with the latest user requirements. Analyze the provided context carefully, then determine whether you need to create a new dashboard or modify an existing one (or create/modify metrics, or filter dashboards). Finally, invoke the correct tool—using an array of YAML files formatted exactly as specified above, or the appropriate parameters for `filter_dashboard`.
"##;
