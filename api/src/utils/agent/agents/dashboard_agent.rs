use std::sync::Arc;

use anyhow::Result;
use std::collections::HashMap;
use uuid::Uuid;

use crate::utils::{
    agent::{Agent, AgentExt, AgentThread},
    tools::{
        agents_as_tools::dashboard_agent_tool::DashboardAgentOutput, file_tools::{
            CreateDashboardFilesTool, CreateMetricFilesTool, ModifyDashboardFilesTool,
            ModifyMetricFilesTool,
        }, IntoValueTool, ToolExecutor
    },
};

use litellm::Message as AgentMessage;

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

    pub async fn run(&self, thread: &mut AgentThread) -> Result<DashboardAgentOutput> {
        println!("Running dashboard agent");
        println!("Setting developer message");
        thread.set_developer_message(DASHBOARD_AGENT_PROMPT.to_string());

        println!("Starting stream_process_thread");
        let mut rx = self.stream_process_thread(thread).await?;
        println!("Got receiver from stream_process_thread");

        println!("Starting message processing loop");
        // Process messages internally until we determine we're done
        while let Some(msg_result) = rx.recv().await {
            println!("Received message from channel");
            match msg_result {
                Ok(msg) => {
                    println!("Message content: {:?}", msg.get_content());
                    println!("Message has tool calls: {:?}", msg.get_tool_calls());
                    
                    println!("Forwarding message to stream sender");
                    if let Err(e) = self.get_agent().get_stream_sender().await.send(Ok(msg.clone())).await {
                        println!("Error forwarding message: {:?}", e);
                        // Continue processing even if we fail to forward
                        continue;
                    }
                    
                    if let Some(content) = msg.get_content() {
                        println!("Message has content: {}", content);
                        if content == "AGENT_COMPLETE" {
                            println!("Found completion signal, breaking loop");
                            break;
                        }
                    }
                }
                Err(e) => {
                    println!("Error receiving message: {:?}", e);
                    println!("Error details: {:?}", e.to_string());
                    // Log error but continue processing instead of returning error
                    continue;
                }
            }
        }
        println!("Exited message processing loop");

        println!("Creating completion signal");
        let completion_msg = AgentMessage::assistant(
            None,
            Some("AGENT_COMPLETE".to_string()),
            None,
            None,
            None,
        );

        println!("Sending completion signal");
        self.get_agent()
            .get_stream_sender()
            .await
            .send(Ok(completion_msg))
            .await?;

        println!("Sent completion signal, returning output");
        Ok(DashboardAgentOutput {
            message: "Dashboard processing complete".to_string(),
            duration: 0,
            files: vec![],
        })
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
