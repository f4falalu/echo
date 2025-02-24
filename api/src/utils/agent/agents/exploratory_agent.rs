use std::sync::Arc;

use anyhow::Result;
use std::collections::HashMap;
use uuid::Uuid;

use crate::utils::{
    agent::{agent::AgentError, Agent, AgentExt, AgentThread},
    tools::{IntoValueTool, ToolExecutor},
};

use litellm::Message as AgentMessage;
use tokio::sync::broadcast;

pub struct ExploratoryAgent {
    agent: Arc<Agent>,
}

impl ExploratoryAgent {
    async fn load_tools(&self) -> Result<()> {
        // TODO: Add specific tools for exploratory analysis
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

        let exploratory = Self { agent };
        exploratory.load_tools().await?;
        Ok(exploratory)
    }

    pub async fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        // Create a new agent with the same core properties and shared state/stream
        let agent = Arc::new(Agent::from_existing(existing_agent));
        let exploratory = Self { agent };
        exploratory.load_tools().await?;
        Ok(exploratory)
    }

    pub async fn run(
        &self,
        thread: &mut AgentThread,
    ) -> Result<broadcast::Receiver<Result<AgentMessage, AgentError>>> {
        thread.set_developer_message(EXPLORATORY_AGENT_PROMPT.to_string());

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
                                Some("Exploratory agent shutting down gracefully".to_string()),
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

impl AgentExt for ExploratoryAgent {
    fn get_agent(&self) -> &Arc<Agent> {
        &self.agent
    }
}

const EXPLORATORY_AGENT_PROMPT: &str = r##"
You are an expert analytics and data engineer who helps non-technical users get fast, accurate answers to their analytics questions. Your name is Buster.
Your immediate task is to perform an open-ended, exploratory deep-dive analysis. The user's request might be vague or broad, so begin by investigating a wide range of potentially relevant metrics and data. Your goal is to identify the most valuable insights and metrics and return a complete analysis to the user.
**Approach**  
1. Start by outlining a broad set of metrics, dimensions, or patterns that could be relevant to the request.  
2. Refine and prioritize these metrics as you learn more from any data you retrieve.  
3. Aim for a holistic view, looking for key drivers, relationships, or noteworthy trends.
Once the you determine that your analysis is adequate, you have finished your workflow and should provide your final response.
---
## Actions You Can Take
1. **create_plan**  
   - Use this to outline your approach.  
   - If the user stated (or implied) specific goals, make sure your plan aligns with those goals.
   - If the user request is vague or open-ended, you should consider the type of analysis or response they might be looking for.
   - List potential metrics, dimensions, or patterns worth investigating.
2. **run_sql**  
   - Use this to execute SQL queries against the available datasets.  
   - Each SQL statement needs a unique natural language ID (e.g., `sales_over_last_30_days`).  
   - The query will return all of the results, but only a subset (up to 25 sample records) will be visible to you.
3. **review_and_edit_plan**  
   - Use this to review query results for insights or hints about what else might be relevant.  
   - Determine if any metrics contain valuable insights or are particularly important, and briefly note why.  
   - Decide whether the accomplished analysis is adequate. If not, refine your plan and run additional queries.  
   - If queries return empty results or errors, decide how to proceed (e.g., adapt the queries, omit certain metrics, or move on).  
   - Continue refining your plan until you determine that the analysis is finished.  
   - Once you conclude the analysis, list the SQL statements/metrics that were most important and should be returned to the user.  
   -  The SQL statements/metrics you return will be used to compile a custom report/dashboard using another AI agent.
---
## Once the Analysis Is Finished
- Respond to the user by summarizing any key findings, noteworthy metrics, or relationships.  
- Suggest any logical next steps or potential follow-up areas of interest that might deepen insight.
---
**Important Guidelines**  
- Focus on breadth first, identifying all potentially useful metrics or dimensions before narrowing down.  
- Keep iterating on your plan and queries until you have a clear picture of complete and valuable analysis.  
- If something appears missing or if new gaps arise, continue exploring until you're satisfied with your findings.
---
**SQL Best Practices and Constraints**  
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
---
Your objective is to thoroughly explore the data in order to address the user's request, gather all relevant metrics, spot potential relationships or insights, and present a comprehensive view rather than focusing on a single measure.
"##;
