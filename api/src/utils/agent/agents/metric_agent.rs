use std::sync::Arc;

use anyhow::Result;
use std::collections::HashMap;
use uuid::Uuid;

use crate::utils::{
    agent::{agent::AgentError, Agent, AgentExt, AgentThread},
    tools::{
        file_tools::{CreateMetricFilesTool, ModifyMetricFilesTool},
        IntoValueTool, ToolExecutor,
    },
};

use litellm::Message as AgentMessage;
use tokio::sync::broadcast;

pub struct MetricAgent {
    agent: Arc<Agent>,
}

impl MetricAgent {
    async fn load_tools(&self) -> Result<()> {
        // Add metric-specific tools
        let create_metric_files_tool = CreateMetricFilesTool::new(Arc::clone(&self.agent));
        let modify_metric_files_tool = ModifyMetricFilesTool::new(Arc::clone(&self.agent));

        // Add tools to the agent
        self.agent
            .add_tool(
                create_metric_files_tool.get_name(),
                create_metric_files_tool.into_value_tool(),
            )
            .await;
        self.agent
            .add_tool(
                modify_metric_files_tool.get_name(),
                modify_metric_files_tool.into_value_tool(),
            )
            .await;

        Ok(())
    }

    pub async fn new(user_id: Uuid, session_id: Uuid) -> Result<Self> {
        // Create agent and immediately wrap in Arc
        let agent = Arc::new(Agent::new(
            "o3-mini".to_string(),
            HashMap::new(),
            user_id,
            session_id,
        ));

        let metric = Self { agent };
        metric.load_tools().await?;
        Ok(metric)
    }

    pub async fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        // Create a new agent with the same core properties and shared state/stream
        let agent = Arc::new(Agent::from_existing(existing_agent));
        let metric = Self { agent };
        metric.load_tools().await?;
        Ok(metric)
    }

    pub async fn run(
        &self,
        thread: &mut AgentThread,
    ) -> Result<broadcast::Receiver<Result<AgentMessage, AgentError>>> {
        thread.set_developer_message(METRIC_AGENT_PROMPT.to_string());

        // Get shutdown receiver
        let mut shutdown_rx = self.get_agent().get_shutdown_receiver().await;
        let mut rx = self.stream_process_thread(thread).await?;

        // Clone what we need for the processing task
        let agent = Arc::clone(self.get_agent());

        let rx_return = rx.resubscribe();
        
        tokio::spawn(async move {
            loop {
                tokio::select! {
                    recv_result = rx.recv() => {
                        match recv_result {
                            Ok(msg_result) => {
                                match msg_result {
                                    Ok(msg) => {
                                        // Forward message to stream sender
                                        let sender = agent.get_stream_sender().await;
                                        if let Err(e) = sender.send(Ok(msg.clone())) {
                                            let err_msg = format!("Error forwarding message: {:?}", e);
                                            let _ = sender.send(Err(AgentError(err_msg)));
                                            continue;
                                        }

                                        if let Some(content) = msg.get_content() {
                                            if content == "AGENT_COMPLETE" {
                                                break;
                                            }
                                        }
                                    }
                                    Err(e) => {
                                        let err_msg = format!("Error processing message: {:?}", e);
                                        let _ = agent.get_stream_sender().await.send(Err(AgentError(err_msg)));
                                        continue;
                                    }
                                }
                            }
                            Err(e) => {
                                let err_msg = format!("Error receiving message: {:?}", e);
                                let _ = agent.get_stream_sender().await.send(Err(AgentError(err_msg)));
                                continue;
                            }
                        }
                    }
                    _ = shutdown_rx.recv() => {
                        // Handle shutdown gracefully
                        let tools = agent.get_tools().await;
                        for (_, tool) in tools.iter() {
                            if let Err(e) = tool.handle_shutdown().await {
                                let err_msg = format!("Error shutting down tool: {:?}", e);
                                let _ = agent.get_stream_sender().await.send(Err(AgentError(err_msg)));
                            }
                        }

                        let _ = agent.get_stream_sender().await.send(
                            Ok(AgentMessage::assistant(
                                Some("shutdown_message".to_string()),
                                Some("Metric agent shutting down gracefully".to_string()),
                                None,
                                None,
                                None,
                            ))
                        );
                        break;
                    }
                }
            }
        });

        Ok(rx_return)
    }
}

impl AgentExt for MetricAgent {
    fn get_agent(&self) -> &Arc<Agent> {
        &self.agent
    }
}

const METRIC_AGENT_PROMPT: &str = r##"You are an expert at determining if new metrics should be created or modified. Note that the dataset info (which includes database schema information such as table names and column details) will be passed into the function to help generate SQL.
Follow these detailed instructions to decide whether to call create a new metric or modify an existing one:
──────────────────────────────
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
──────────────────────────────
Your Overall Goal
Your objective is to ensure that the metrics in the system remain relevant, unique, and up-to-date with the latest user requirements. Analyze the provided context carefully, then determine whether you need to create a new metric or modify an existing one. Finally, invoke the correct tool—either bulk_create_metric or bulk_modify_metric—using an array of YAML files formatted exactly as specified above.
"##;
