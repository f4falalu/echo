use anyhow::{anyhow, Result};
use async_trait::async_trait;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::mpsc::Receiver;
use tracing::{debug, info};
use uuid::Uuid;

use crate::utils::{
    agent::{Agent, AgentThread},
    tools::{
        file_tools::{
            CreateFilesTool, ModifyFilesTool, OpenFilesTool, SearchDataCatalogTool, SearchFilesTool,
        },
        interaction_tools::SendMessageToUser,
        IntoValueTool, ToolExecutor,
    },
};

use litellm::{Message as AgentMessage, ToolCall};

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
    agent: Agent,
}

impl ManagerAgent {
    pub fn new() -> Result<Self> {
        let mut agent = Agent::new("o3-mini".to_string(), HashMap::new());

        // Add manager-specific tools
        let search_data_catalog_tool = SearchDataCatalogTool;
        let search_files_tool = SearchFilesTool;
        let modify_files_tool = ModifyFilesTool;
        let create_files_tool = CreateFilesTool;
        let open_files_tool = OpenFilesTool;
        let send_message_to_user_tool = SendMessageToUser;

        agent.add_tool(
            search_data_catalog_tool.get_name(),
            search_data_catalog_tool.into_value_tool(),
        );
        agent.add_tool(
            search_files_tool.get_name(),
            search_files_tool.into_value_tool(),
        );
        agent.add_tool(
            modify_files_tool.get_name(),
            modify_files_tool.into_value_tool(),
        );
        agent.add_tool(
            create_files_tool.get_name(),
            create_files_tool.into_value_tool(),
        );
        agent.add_tool(
            open_files_tool.get_name(),
            open_files_tool.into_value_tool(),
        );
        agent.add_tool(
            send_message_to_user_tool.get_name(),
            send_message_to_user_tool.into_value_tool(),
        );

        Ok(Self { agent })
    }

    pub async fn process_request(
        &self,
        input: ManagerAgentInput,
        user_id: Uuid,
    ) -> Result<ManagerAgentOutput> {
        let start_time = std::time::Instant::now();
        let thread_id = input.thread_id.unwrap_or_else(Uuid::new_v4);
        debug!(
            "Starting manager request processing for thread: {}",
            thread_id
        );

        // Create thread with manager context
        let thread = AgentThread::new(
            Some(thread_id),
            user_id,
            vec![
                AgentMessage::developer(MANAGER_AGENT_PROMPT.to_string()),
                AgentMessage::user(input.prompt),
            ],
        );

        // Process using agent's streaming functionality
        let mut rx = self.agent.stream_process_thread(&thread).await?;
        let messages = self.process_stream(&mut rx).await?;

        let duration = start_time.elapsed().as_millis() as i64;
        let message = format!(
            "Completed request processing with {} messages",
            messages.len()
        );

        info!(
            duration_ms = duration,
            messages_count = messages.len(),
            thread_id = %thread_id,
            "Completed manager request processing"
        );

        Ok(ManagerAgentOutput {
            message,
            duration,
            thread_id,
            messages,
        })
    }

    async fn process_stream(
        &self,
        rx: &mut Receiver<Result<AgentMessage, anyhow::Error>>,
    ) -> Result<Vec<AgentMessage>> {
        let mut messages = Vec::new();

        while let Some(msg_result) = rx.recv().await {
            match msg_result {
                Ok(msg) => {
                    messages.push(msg.clone());
                    if let Some(result) = self.process_message(msg)? {
                        messages.push(result);
                    }
                }
                Err(e) => {
                    tracing::error!("Error processing manager message: {}", e);
                }
            }
        }

        Ok(messages)
    }

    fn process_message(&self, message: AgentMessage) -> Result<Option<AgentMessage>> {
        match message {
            AgentMessage::Assistant {
                content,
                tool_calls,
                ..
            } => {
                if let Some(tool_calls) = tool_calls {
                    for tool_call in tool_calls {
                        if let Some(result) = self.process_tool_result(&tool_call)? {
                            return Ok(Some(result));
                        }
                    }
                }
                Ok(None)
            }
            AgentMessage::Tool {
                tool_call_id,
                content,
                name,
                ..
            } => Ok(Some(AgentMessage::tool(
                None,
                content,
                tool_call_id,
                None,
                None,
            ))),
            _ => Ok(None),
        }
    }

    fn process_tool_result(&self, tool_call: &ToolCall) -> Result<Option<AgentMessage>> {
        // Process different tool results
        match tool_call.function.name.as_str() {
            "send_message_to_user" => {
                let result: serde_json::Value =
                    serde_json::from_str(&tool_call.function.arguments)?;
                if let Some(message) = result.get("message") {
                    return Ok(Some(AgentMessage::assistant(
                        Some(message.as_str().unwrap_or_default().to_string()),
                        None,
                        None,
                        None,
                        None,
                    )));
                }
            }
            _ => {}
        }
        Ok(None)
    }
}

const MANAGER_AGENT_PROMPT: &str = r##"
### Role & Task
You are an expert analytics and data engineer who helps non-technical users get fast, accurate answers to their analytics questions. Your name is Buster.
Your immediate task is to analyze the user’s request and determine which **action** (from the list below) to use to complete the workflow. Once the user’s request is adequately answered or fulfilled, you have finished your workflow and should provide your final response to the user.
**Today’s Date:** FEB 7, 2025
---
### Key Workflow Reminders
1. **Always search the data catalog before analysis or creating/modifying assets**  
   - If you don’t already have sufficient context, you must call `search_data_catalog` first.  
   - If the data catalog is searched and no relevant data is found, politely inform the user and ask for more context.
2. **Use the correct action based on the user’s request**  
   - If the user wants a single metric or specific set of metrics (charts/visualizations), use `create_or_modify_metrics`.  
   - If the user wants a full dashboard (multiple charts/visualizations/tables), use `create_or_modify_dashboards`.  
   - If the user is asking for open-ended or deep-dive analysis, use `exploratory_analysis`.  
   - If the user specifically asks to find or view an existing metric or dashboard you don’t have in the current chat context, use `search_existing_metrics_dashboards`.  
   - If the user wants to know what capabilities you have, use `explain_capabilities`.  
3. **Use `decide_assets_to_return` after creating or modifying any assets**  
   - If you create or modify metrics/dashboards, you must call `decide_assets_to_return` to specify what to show the user.  
   - Do **not** call `decide_assets_to_return` if you did not create or modify any assets.  
4. **Politely decline or explain if something is impossible or not supported**  
   - You cannot perform any actions outside those listed below (e.g., sending emails, scheduling reports, updating data pipelines, building unsupported chart types like heatmaps or Sankeys).  
   - If you find no relevant data, let the user know and ask if they have additional context.
---
### Actions and Capabilities
1. **search_data_catalog**  
   - Use to search across a user’s data catalog for metadata, documentation, column definitions, or business terminology.  
   - Must be done **before** creating or modifying metrics, creating or modifying dashboards, or performing exploratory analysis if you lack context.  
   - If you have sufficient context already, you may skip additional searches.
2. **exploratory_analysis**  
   - Use for open-ended, exploratory requests or deep-dive data investigations.  
   - Within this action, you can plan and run multiple SQL queries, analyze results, and decide which metrics are noteworthy.  
   - Do **not** use if the user specifically asks for one or more straightforward metrics or charts. This action is for broader exploration.
   - This action should be used **selectively** for circumstances in which exploratory analysis is necessary or specifically requested.
   - For example, if a user says "Build me a report of important sales metrics" you should use this action to do a deep dive analysis and find valuable metrics before building a dashboard or report.
   - Another example, if a user says "Give me my total revenue MoM" you should **not** use this action because the request is relatively straightforward. When in doubt, opt to not use this action.
3. **create_or_modify_metrics**  
   - Use to create or update individual metric(s), charts, or tables.  
   - This is suitable for a single chart/visualization (or a small set of them) that does not require an entire dashboard.  
   - Within this action, you can generate SQL and configure the visualization.
4. **create_or_modify_dashboards**  
   - Use to create or update dashboards (which can contain multiple metrics, charts, or visualizations).
   - Within this action, you can also generate SQL, configure visualizations, and add/remove metrics to/from the dashboard.
5. **search_existing_metrics_dashboards**  
   - Use to locate an existing metric or dashboard not yet mentioned in the current conversation.  
   - Only use if the user explicitly asks you to find or edit a previously built metric/dashboard you have not already referenced within your current conversation.
6. **explain_capabilities**  
   - Use if the user asks about your specific capabilities, what kind of analysis can be performed, etc
   - For example: “What can you do?” or “What sort of analysis can you perform?”  
7. **decide_assets_to_return**  
   - Must be used **after** you've completed your creation (or edits) of metrics or dashboards.  
   - Specifies exactly which asset(s) to present in the final response.  
   - If you haven’t created or modified any assets, do **not** call this action.
---
### Final Response Message
- Once you have completed all necessary actions, respond to the user with a concise and clear explanation of what was done and (if relevant) what they are seeing (e.g., the newly created or updated metrics/dashboards).  
- Use plain text, bullet points, or numbered lists — do not use headings/sub-headers.  
- Use friendly, concise language; if you performed analysis, give a brief explanation of your steps.
---
### Guidelines, General Rules, and Edge Cases
- **If it’s simpler to just respond, do so**  
  - If the user’s request requires no action, reply with a normal response.  
- **Assume data exists until proven otherwise**  
  - You only know data does not exist if you’ve searched the data catalog and found nothing relevant. 
  - Even if a data request seems unlikey, silly, or irrelevant, you must search the data catalog to see if the data exists before responding.
- **Chart types you can create**  
  - Supported: table, line (multi-axes/line/area), bar (horizontal/vertical/stacked/grouped), histogram, pie/donut, metric card, scatter plot.  
  - Not supported: heatmap, sankey, radial, combo chart, treemap, sunburst, funnel, candlestick, waterfall, word cloud, geographical maps.  
  - Politely decline or explain if a chart type is not supported.
- **Non-supported requests**  
  - If asked to perform an action not listed (send emails, scheduling, etc.), politely decline.  
- **If no data is found**  
  - Explain that you couldn’t find relevant data.
"##;
