use std::{sync::Arc, time::Instant};

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use tokio::sync::mpsc::Receiver;
use tracing::{debug, info};
use uuid::Uuid;

use crate::utils::{
    agent::{Agent, AgentExt, AgentThread},
    tools::{
        file_tools::{
            CreateFilesTool, CreateMetricFilesTool, ModifyFilesTool, ModifyMetricFilesTool,
            OpenFilesTool, SearchFilesTool,
        },
        IntoValueTool, ToolExecutor,
    },
};

use litellm::{Message as AgentMessage, ToolCall};

#[derive(Debug, Serialize, Deserialize)]
pub struct MetricAgentOutput {
    pub message: String,
    pub duration: i64,
    pub metric_files: Vec<MetricFileResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MetricFileResult {
    pub file_id: Uuid,
    pub file_name: String,
    pub action: String, // "created", "modified", "opened"
    pub status: String, // "success", "error"
    pub details: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MetricAgentInput {
    pub operation: String, // "create", "modify", "analyze"
    pub metric_name: Option<String>,
    pub metric_id: Option<Uuid>,
    pub requirements: Option<String>,
    pub modifications: Option<String>,
}

pub struct MetricAgent {
    agent: Arc<Agent>,
}

impl MetricAgent {
    pub async fn new(user_id: Uuid, session_id: Uuid) -> Result<Self> {
        // Create agent and immediately wrap in Arc
        let mut agent = Arc::new(Agent::new(
            "o3-mini".to_string(),
            HashMap::new(),
            user_id,
            session_id,
        ));

        // Use the SAME Arc<Agent> for tools
        let create_metric_files_tool = CreateMetricFilesTool::new(Arc::clone(&agent));
        let modify_metric_files_tool = ModifyMetricFilesTool::new(Arc::clone(&agent));

        // Get mutable access to add tools
        let tools_map = Arc::get_mut(&mut agent).expect("Failed to get mutable reference to agent");

        // Add tools to the agent
        tools_map.add_tool(
            create_metric_files_tool.get_name(),
            create_metric_files_tool.into_value_tool(),
        ).await;
        tools_map.add_tool(
            modify_metric_files_tool.get_name(),
            modify_metric_files_tool.into_value_tool(),
        ).await;

        Ok(Self { agent })
    }

    pub async fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        // Create a new agent with the same core properties and shared state/stream
        let mut agent = Arc::new(Agent::from_existing(existing_agent));

        // Add metric-specific tools
        let create_metric_files_tool = CreateMetricFilesTool::new(Arc::clone(&agent));
        let modify_metric_files_tool = ModifyMetricFilesTool::new(Arc::clone(&agent));

        // Get mutable access to add tools
        let tools_map = Arc::get_mut(&mut agent).expect("Failed to get mutable reference to agent");

        // Add tools to the agent
        tools_map.add_tool(
            create_metric_files_tool.get_name(),
            create_metric_files_tool.into_value_tool(),
        ).await;
        tools_map.add_tool(
            modify_metric_files_tool.get_name(),
            modify_metric_files_tool.into_value_tool(),
        ).await;

        Ok(Self { agent })
    }

    pub async fn process_metric(
        &self,
        input: MetricAgentInput,
        parent_thread_id: Uuid,
        user_id: Uuid,
    ) -> Result<MetricAgentOutput> {
        let start_time = Instant::now();
        debug!("Starting metric operation: {:?}", input.operation);

        // Create thread with metric context
        let thread = AgentThread::new(
            Some(parent_thread_id),
            user_id,
            vec![
                AgentMessage::developer(METRIC_AGENT_PROMPT.to_string()),
                AgentMessage::user(serde_json::to_string(&input).unwrap()),
            ],
        );

        // Process using agent's streaming functionality - now using the trait method
        let mut rx = self.stream_process_thread(&thread).await?;
        let metric_files = self.process_stream(rx).await?;

        let duration = start_time.elapsed().as_millis() as i64;
        let message = format!(
            "Completed metric operation with {} file(s) processed",
            metric_files.len()
        );

        info!(
            duration_ms = duration,
            files_count = metric_files.len(),
            operation = input.operation,
            "Completed metric operation"
        );

        Ok(MetricAgentOutput {
            message,
            duration,
            metric_files,
        })
    }

    async fn process_stream(
        &self,
        mut rx: Receiver<Result<AgentMessage, anyhow::Error>>,
    ) -> Result<Vec<MetricFileResult>> {
        let mut results = Vec::new();

        while let Some(msg_result) = rx.recv().await {
            match msg_result {
                Ok(msg) => {
                    if let Some(result) = self.process_message(msg)? {
                        results.push(result);
                    }
                }
                Err(e) => {
                    tracing::error!("Error processing metric message: {}", e);
                }
            }
        }

        Ok(results)
    }

    fn process_message(&self, message: AgentMessage) -> Result<Option<MetricFileResult>> {
        match message {
            AgentMessage::Assistant {
                content: _,
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
            AgentMessage::Tool { content, name, .. } => {
                // Process tool response
                let result: Value = serde_json::from_str(&content)?;

                // Extract file information from the tool response
                if let Some(file_info) = result.get("files").and_then(|f| f.as_array()) {
                    if let Some(file) = file_info.first() {
                        return Ok(Some(MetricFileResult {
                            file_id: Uuid::parse_str(
                                file.get("id")
                                    .and_then(|id| id.as_str())
                                    .unwrap_or_default(),
                            )?,
                            file_name: file
                                .get("name")
                                .and_then(|n| n.as_str())
                                .unwrap_or_default()
                                .to_string(),
                            action: name.unwrap_or_else(|| "unknown".to_string()),
                            status: "success".to_string(),
                            details: content,
                        }));
                    }
                }
                Ok(None)
            }
            _ => Ok(None),
        }
    }

    fn process_tool_result(&self, tool_call: &ToolCall) -> Result<Option<MetricFileResult>> {
        // Process different tool results into appropriate metric results
        match tool_call.function.name.as_str() {
            "create_files" => {
                let result: Value = serde_json::from_str(&tool_call.function.arguments)?;
                if let Some(files) = result.get("files").and_then(|f| f.as_array()) {
                    if let Some(file) = files.first() {
                        return Ok(Some(MetricFileResult {
                            file_id: Uuid::new_v4(), // This will be replaced with actual ID after creation
                            file_name: file
                                .get("name")
                                .and_then(|n| n.as_str())
                                .unwrap_or_default()
                                .to_string(),
                            action: "created".to_string(),
                            status: "pending".to_string(),
                            details: serde_json::to_string(&file)?,
                        }));
                    }
                }
            }
            "modify_files" => {
                let result: Value = serde_json::from_str(&tool_call.function.arguments)?;
                if let Some(files) = result.get("files").and_then(|f| f.as_array()) {
                    if let Some(file) = files.first() {
                        return Ok(Some(MetricFileResult {
                            file_id: Uuid::parse_str(
                                file.get("id")
                                    .and_then(|id| id.as_str())
                                    .unwrap_or_default(),
                            )?,
                            file_name: file
                                .get("file_name")
                                .and_then(|n| n.as_str())
                                .unwrap_or_default()
                                .to_string(),
                            action: "modified".to_string(),
                            status: "pending".to_string(),
                            details: serde_json::to_string(&file)?,
                        }));
                    }
                }
            }
            "open_files" => {
                let result: Value = serde_json::from_str(&tool_call.function.arguments)?;
                if let Some(files) = result.get("files").and_then(|f| f.as_array()) {
                    if let Some(file) = files.first() {
                        return Ok(Some(MetricFileResult {
                            file_id: Uuid::parse_str(
                                file.get("id")
                                    .and_then(|id| id.as_str())
                                    .unwrap_or_default(),
                            )?,
                            file_name: file
                                .get("name")
                                .and_then(|n| n.as_str())
                                .unwrap_or_default()
                                .to_string(),
                            action: "opened".to_string(),
                            status: "success".to_string(),
                            details: serde_json::to_string(&file)?,
                        }));
                    }
                }
            }
            _ => {}
        }
        Ok(None)
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
Step 1. ANALYZE THE CONTEXT
• Examine the list of existing metrics. Each metric is defined in its own YAML file that follows the format below:
• Read the user response carefully. Identify the user’s intent:
 – Check if they are asking for a completely new metric (whether SQL-related or just non-SQL changes like chart configuration, colors, title, etc.).
 – Or determine if they want to update an existing metric with modifications such as a new SQL query, chart config adjustments, or visual styling changes.
• Review any generated SQL statements provided. Determine if they present a new analytical query or if they overlap with the functionality of an existing metric.
──────────────────────────────
Step 2. DETERMINE THE ACTION (CREATE OR MODIFY)
• If the generated SQL (or other changes) indicates a new, unique insight or if the modifications cannot be merged with an existing metric, you should create a new metric.
 – When creating a new metric, build complete YAML metric files following the format in the tool call.
 – Call bulk_create_metric with an array of these complete YAML metric files.
• If the requested changes (whether in SQL or visual/chart properties) align closely with an existing metric, update that metric.
 – When modifying, prepare an array of YAML metric files (each following the format above) that contain the updated information.
 – Call bulk_modify_metric with this array of modified metric files.
──────────────────────────────
Step 3. EXECUTE THE CHOSEN ACTION
• For creating a new metric:
 – Assemble one or more complete YAML metric files that adhere exactly to the Metric Configuration Schema provided (as shown above).
 – Ensure all required fields (title, dataset_ids, sql if provided, chart_config, and data_metadata) are correctly populated and omit any fields that are null or empty.
 – Call bulk_create_metric with the array of YAML metric files.
• For modifying an existing metric:
 – Identify the metric(s) that need to be updated.
 – Prepare an array of YAML metric files (formatted as shown above) that include all necessary changes (e.g., new SQL, chart configuration modifications, color updates, title changes, etc.).
 – Call bulk_modify_metric with this array of updated YAML metric files.
──────────────────────────────
Your Overall Goal
Your objective is to ensure that the metrics in the system remain relevant, unique, and up-to-date with the latest user requirements. Analyze the provided context carefully, then determine whether you need to create a new metric or modify an existing one. Finally, invoke the correct tool—either bulk_create_metric or bulk_modify_metric—using an array of YAML files formatted exactly as specified above.
"##;
