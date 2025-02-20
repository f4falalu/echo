use std::sync::Arc;
use std::time::Instant;

use anyhow::Result;
use async_trait::async_trait;
use chrono::Utc;
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
            CreateDashboardFilesTool, CreateMetricFilesTool, ModifyDashboardFilesTool,
            ModifyMetricFilesTool, OpenFilesTool, SearchFilesTool,
        },
        IntoValueTool, ToolExecutor,
    },
};

use litellm::{Message as AgentMessage, ToolCall};

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardAgentOutput {
    pub message: String,
    pub duration: i64,
    pub dashboard_files: Vec<DashboardFileResult>,
    pub metric_files: Vec<MetricFileResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardFileResult {
    pub file_id: Uuid,
    pub file_name: String,
    pub action: String, // "created", "modified", "opened"
    pub status: String, // "success", "error"
    pub details: String,
    pub metrics: Vec<Uuid>, // Associated metric IDs
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MetricFileResult {
    pub file_id: Uuid,
    pub file_name: String,
    pub action: String,
    pub status: String,
    pub details: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardAgentInput {
    pub operation: String, // "create", "modify", "analyze"
    pub dashboard_name: Option<String>,
    pub dashboard_id: Option<Uuid>,
    pub requirements: Option<String>,
    pub modifications: Option<String>,
    pub metric_ids: Option<Vec<Uuid>>, // Existing metrics to include
    pub new_metrics: Option<Vec<String>>, // New metrics to create
}

pub struct DashboardAgent {
    agent: Arc<Agent>,
}

impl AgentExt for DashboardAgent {
    fn get_agent(&self) -> &Arc<Agent> {
        &self.agent
    }
}

impl DashboardAgent {
    pub async fn new(user_id: Uuid, session_id: Uuid) -> Result<Self> {
        // Create agent and immediately wrap in Arc
        let mut agent = Arc::new(Agent::new(
            "o3-mini".to_string(),
            HashMap::new(),
            user_id,
            session_id,
        ));

        // Add dashboard and metric tools
        let create_dashboard_tool = CreateDashboardFilesTool::new(Arc::clone(&agent));
        let modify_dashboard_tool = ModifyDashboardFilesTool::new(Arc::clone(&agent));
        let create_metric_tool = CreateMetricFilesTool::new(Arc::clone(&agent));
        let modify_metric_tool = ModifyMetricFilesTool::new(Arc::clone(&agent));
        let open_files_tool = OpenFilesTool::new(Arc::clone(&agent));
        let search_files_tool = SearchFilesTool::new(Arc::clone(&agent));

        // Get mutable access to add tools
        let tools_map = Arc::get_mut(&mut agent).expect("Failed to get mutable reference to agent");

        // Add tools to the agent
        tools_map.add_tool(
            create_dashboard_tool.get_name(),
            create_dashboard_tool.into_value_tool(),
        ).await;
        tools_map.add_tool(
            modify_dashboard_tool.get_name(),
            modify_dashboard_tool.into_value_tool(),
        ).await;
        tools_map.add_tool(
            create_metric_tool.get_name(),
            create_metric_tool.into_value_tool(),
        ).await;
        tools_map.add_tool(
            modify_metric_tool.get_name(),
            modify_metric_tool.into_value_tool(),
        ).await;
        tools_map.add_tool(
            open_files_tool.get_name(),
            open_files_tool.into_value_tool(),
        ).await;
        tools_map.add_tool(
            search_files_tool.get_name(),
            search_files_tool.into_value_tool(),
        ).await;

        Ok(Self { agent })
    }

    pub async fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        // Create a new agent with the same core properties and shared state/stream
        let mut agent = Arc::new(Agent::from_existing(existing_agent));

        // Add dashboard and metric tools
        let create_dashboard_tool = CreateDashboardFilesTool::new(Arc::clone(&agent));
        let modify_dashboard_tool = ModifyDashboardFilesTool::new(Arc::clone(&agent));
        let create_metric_tool = CreateMetricFilesTool::new(Arc::clone(&agent));
        let modify_metric_tool = ModifyMetricFilesTool::new(Arc::clone(&agent));

        // Get mutable access to add tools
        let tools_map = Arc::get_mut(&mut agent).expect("Failed to get mutable reference to agent");

        // Add tools to the agent
        tools_map.add_tool(
            create_dashboard_tool.get_name(),
            create_dashboard_tool.into_value_tool(),
        ).await;
        tools_map.add_tool(
            modify_dashboard_tool.get_name(),
            modify_dashboard_tool.into_value_tool(),
        ).await;
        tools_map.add_tool(
            create_metric_tool.get_name(),
            create_metric_tool.into_value_tool(),
        ).await;
        tools_map.add_tool(
            modify_metric_tool.get_name(),
            modify_metric_tool.into_value_tool(),
        ).await;

        Ok(Self { agent })
    }

    pub async fn process_dashboard(
        &self,
        input: DashboardAgentInput,
        parent_thread_id: Uuid,
        user_id: Uuid,
    ) -> Result<DashboardAgentOutput> {
        let start_time = Instant::now();
        debug!("Starting dashboard operation: {:?}", input.operation);

        // Create thread with dashboard context
        let thread = AgentThread::new(
            Some(parent_thread_id),
            user_id,
            vec![
                AgentMessage::developer(DASHBOARD_AGENT_PROMPT.to_string()),
                AgentMessage::user(serde_json::to_string(&input)?),
            ],
        );

        // Process using agent's streaming functionality - now using the trait method
        let mut rx = self.stream_process_thread(&thread).await?;
        let (dashboard_files, metric_files) = self.process_stream(rx).await?;

        let duration = start_time.elapsed().as_millis() as i64;
        let message = format!(
            "Completed dashboard operation with {} dashboard(s) and {} metric(s) processed",
            dashboard_files.len(),
            metric_files.len()
        );

        info!(
            duration_ms = duration,
            dashboard_count = dashboard_files.len(),
            metric_count = metric_files.len(),
            operation = input.operation,
            "Completed dashboard operation"
        );

        Ok(DashboardAgentOutput {
            message,
            duration,
            dashboard_files,
            metric_files,
        })
    }

    async fn process_stream(
        &self,
        mut rx: Receiver<Result<AgentMessage, anyhow::Error>>,
    ) -> Result<(Vec<DashboardFileResult>, Vec<MetricFileResult>)> {
        let mut dashboard_results = Vec::new();
        let mut metric_results = Vec::new();

        while let Some(msg_result) = rx.recv().await {
            match msg_result {
                Ok(msg) => {
                    if let Some((dashboard, metric)) = self.process_message(msg)? {
                        if let Some(dashboard_result) = dashboard {
                            dashboard_results.push(dashboard_result);
                        }
                        if let Some(metric_result) = metric {
                            metric_results.push(metric_result);
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Error processing dashboard message: {}", e);
                }
            }
        }

        Ok((dashboard_results, metric_results))
    }

    fn process_message(
        &self,
        message: AgentMessage,
    ) -> Result<Option<(Option<DashboardFileResult>, Option<MetricFileResult>)>> {
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
                        let is_dashboard =
                            name.as_deref().map_or(false, |n| n.contains("dashboard"));

                        if is_dashboard {
                            let metrics = file
                                .get("metrics")
                                .and_then(|m| m.as_array())
                                .map_or_else(Vec::new, |metrics| {
                                    metrics
                                        .iter()
                                        .filter_map(|m| m.get("id").and_then(|id| id.as_str()))
                                        .filter_map(|id| Uuid::parse_str(id).ok())
                                        .collect()
                                });

                            return Ok(Some((
                                Some(DashboardFileResult {
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
                                    details: content.clone(),
                                    metrics,
                                }),
                                None,
                            )));
                        } else {
                            return Ok(Some((
                                None,
                                Some(MetricFileResult {
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
                                    details: content.clone(),
                                }),
                            )));
                        }
                    }
                }
                Ok(None)
            }
            _ => Ok(None),
        }
    }

    fn process_tool_result(
        &self,
        tool_call: &ToolCall,
    ) -> Result<Option<(Option<DashboardFileResult>, Option<MetricFileResult>)>> {
        match tool_call.function.name.as_str() {
            "create_dashboard_files" | "modify_dashboard_files" => {
                let result: Value = serde_json::from_str(&tool_call.function.arguments)?;
                if let Some(files) = result.get("files").and_then(|f| f.as_array()) {
                    if let Some(file) = files.first() {
                        let metrics = file.get("metrics").and_then(|m| m.as_array()).map_or_else(
                            Vec::new,
                            |metrics| {
                                metrics
                                    .iter()
                                    .filter_map(|m| m.get("id").and_then(|id| id.as_str()))
                                    .filter_map(|id| Uuid::parse_str(id).ok())
                                    .collect()
                            },
                        );

                        return Ok(Some((
                            Some(DashboardFileResult {
                                file_id: if tool_call.function.name.starts_with("create") {
                                    Uuid::new_v4()
                                } else {
                                    Uuid::parse_str(
                                        file.get("id")
                                            .and_then(|id| id.as_str())
                                            .unwrap_or_default(),
                                    )?
                                },
                                file_name: file
                                    .get("name")
                                    .and_then(|n| n.as_str())
                                    .unwrap_or_default()
                                    .to_string(),
                                action: if tool_call.function.name.starts_with("create") {
                                    "created".to_string()
                                } else {
                                    "modified".to_string()
                                },
                                status: "pending".to_string(),
                                details: serde_json::to_string(&file)?,
                                metrics,
                            }),
                            None,
                        )));
                    }
                }
            }
            "create_metric_files" | "modify_metric_files" => {
                let result: Value = serde_json::from_str(&tool_call.function.arguments)?;
                if let Some(files) = result.get("files").and_then(|f| f.as_array()) {
                    if let Some(file) = files.first() {
                        return Ok(Some((
                            None,
                            Some(MetricFileResult {
                                file_id: if tool_call.function.name.starts_with("create") {
                                    Uuid::new_v4()
                                } else {
                                    Uuid::parse_str(
                                        file.get("id")
                                            .and_then(|id| id.as_str())
                                            .unwrap_or_default(),
                                    )?
                                },
                                file_name: file
                                    .get("name")
                                    .and_then(|n| n.as_str())
                                    .unwrap_or_default()
                                    .to_string(),
                                action: if tool_call.function.name.starts_with("create") {
                                    "created".to_string()
                                } else {
                                    "modified".to_string()
                                },
                                status: "pending".to_string(),
                                details: serde_json::to_string(&file)?,
                            }),
                        )));
                    }
                }
            }
            _ => {}
        }
        Ok(None)
    }
}

const DASHBOARD_AGENT_PROMPT: &str = r##"
You are an expert at determining if new dashboards should be created or modified. Note that the dataset info (which includes database schema information such as table names and column details) will be passed into the function to help understand available data.
Follow these detailed instructions to decide whether to call create a new dashboard or modify an existing one:
──────────────────────────────
Step 1. ANALYZE THE CONTEXT
• Examine the list of existing dashboards. Each dashboard is defined in its own YAML file that follows the format below:
For context, here is the yml schema for dashboards:
1) title: string  (Top-level dashboard title)
2) rows: array of row definitions - each row is an object with the following:
   - items: array of metric objects (up to 4 per row)
      - Each metric object has:
         - id: string (UUIDv4 identifier of the metric)
         - width: integer (must be between 3 and 12 inclusive)
   - **Constraint:** The sum of 'width' values in each 'items' array (within a row) must not exceed 12.
• Read the user response carefully. Identify the user’s intent:
 – Check if they are asking for a completely new dashboard (including title and row/item layout).
 – Or determine if they want to update an existing dashboard with modifications such as rearranging rows/items, adding new metrics to rows, or changing the dashboard title.
• Review the requested dashboard structure (rows and items). Determine if it represents a new, unique layout of metrics or overlaps with existing dashboard structures.
──────────────────────────────
Step 2. SELECT THE APPROPRIATE TOOL
Based on your analysis in Step 1, determine the best tool to use and execute it as follows:
• **Scenario 1: Creating a Brand New Dashboard**
   - **Decision:** If the analysis shows the user wants a completely new dashboard with a unique layout and combination of metrics, you should create a new dashboard.
   - **Tool to Use:** `bulk_create_dashboard`
     - **Purpose:** This tool is designed to create entirely new dashboards. You will need to provide a YAML file defining the dashboard's title and the arrangement of metrics in rows (following the dashboard YAML schema).
     - **When to Use:**  Use `bulk_create_dashboard` when there's no existing dashboard that meets the user's needs, and you are starting from scratch with a new dashboard design.
     - **Action:** Assemble one or more complete YAML dashboard files that adhere exactly to the Dashboard Configuration Schema. Ensure all required fields (`title` and `rows`) are correctly populated, with valid metric `id` and `width` values, and row width sums not exceeding 12. Then, call `bulk_create_dashboard` with the array of YAML dashboard files.
• **Scenario 2: Modifying an Existing Dashboard's Structure or Appearance**
   - **Decision:** If the user wants to change the layout, title, or metric arrangement *of an existing dashboard*, you should modify the dashboard itself.  This *does not* include changing the underlying metrics, just how they are presented on the dashboard.
   - **Tool to Use:** `bulk_modify_dashboard`
     - **Purpose:** This tool is for updating the dashboard's attributes, such as its title, the arrangement of metrics within rows, and the width of metric items. It's used to adjust the *presentation* of data on the dashboard.
     - **When to Use:** Use `bulk_modify_dashboard` when you need to make changes to an existing dashboard's structure or visual elements (like title or layout) but *not* to the definitions of the metrics themselves.
     - **Action:** Identify the dashboard(s) to be updated. Prepare an array of YAML dashboard files that include all necessary changes (e.g., rearranging rows/items, adding/removing metrics, title changes, etc.) following the Dashboard Configuration Schema. Then, call `bulk_modify_dashboard` with this array of updated dashboard files.
• **Scenario 3: Creating a New Metric to be Used on a Dashboard (or future dashboards)**
   - **Decision:** If the analysis indicates the need for a completely new metric calculation or data point that doesn't yet exist, you need to create a new metric first.
   - **Tool to Use:** `bulk_create_metric`
     - **Purpose:** This tool is used to define and create new metrics. Metrics are the fundamental data elements displayed on dashboards.
     - **When to Use:** Use `bulk_create_metric` when you need to introduce a new metric into the system.  This is often a prerequisite before creating or modifying dashboards that will display this new metric.
     - **Action:** Assemble one or more complete YAML metric files that adhere exactly to the Metric Configuration Schema. Ensure all required fields for metrics (title, dataset_ids, sql if provided, chart_config, and data_metadata) are correctly populated. Then, call `bulk_create_metric` with the array of YAML metric files.
• **Scenario 4: Modifying an Existing Metric (Regardless of Dashboard)**
   - **Decision:** If the user wants to change the definition of an existing metric (e.g., update its SQL query, chart configuration, etc.), you should modify the metric directly. Changes to a metric will affect all dashboards that use it.
   - **Tool to Use:** `bulk_modify_metric`
     - **Purpose:** This tool is for updating the definition of metrics that are already in the system.
     - **When to Use:** Use `bulk_modify_metric` when you need to change the underlying calculation, data source, or presentation settings *of a metric itself*. This will have a system-wide impact on where that metric is used.
     - **Action:** Identify the metric(s) that need to be updated. Prepare an array of YAML metric files that include all necessary changes (e.g., new SQL, chart configuration modifications, color updates, title changes, etc.) following the Metric Configuration Schema. Then, call `bulk_modify_metric` with this array of updated YAML metric files.
• **Scenario 5: Filtering Data Displayed on a Dashboard**
    - **Decision:** If the user wants to narrow down the data shown in the metrics on a *specific dashboard* based on certain criteria, you should apply a filter. This modifies the metric's data *only for that dashboard*.
    - **Tool to Use:** `filter_dashboard`
      - **Purpose:** This tool applies filters to the data displayed in metrics *on a particular dashboard*. It modifies the SQL behind the metrics to show a filtered subset of data for that dashboard.
      - **When to Use:** Use `filter_dashboard` when you need to provide a filtered view of the data on a specific dashboard without changing the underlying metric definitions or affecting other dashboards.
      - **Action:** Identify the dashboard to be filtered and the filter criteria. Prepare the necessary input for `filter_dashboard` (e.g., dashboard ID and filter conditions). Then, call `filter_dashboard` with the filter parameters.
Step 3. EXECUTE THE CHOSEN ACTION
Based on your analysis in Step 2, you will now execute the chosen action by calling the appropriate tool with the necessary parameters.
──────────────────────────────
Your Overall Goal
Your objective is to ensure that the dashboards in the system remain relevant, unique, and up-to-date with the latest user requirements. Analyze the provided context carefully, then determine whether you need to create a new dashboard or modify an existing one (or create/modify metrics, or filter dashboards). Finally, invoke the correct tool—using an array of YAML files formatted exactly as specified above, or the appropriate parameters for `filter_dashboard`.
──────────────────────────────
Available Tools
Here are the tools you can use to manage metrics and dashboards:
1. `bulk_create_metric`:
   - **Purpose:**  Creates a new metric. Metrics represent individual data points or calculations that are displayed on dashboards.
   - **Usage:** Use this tool when you need to define a completely new metric that doesn't exist in the system.  Typically, you would create metrics *before* creating dashboards, as dashboards are built from existing metrics.
   - **Output:** Accepts an array of YAML metric files as input.
2. `bulk_modify_metric`:
   - **Purpose:**  Modifies existing metrics. This tool allows you to update the definition of metrics that are already in the system and potentially used on dashboards.
   - **Usage:** Use this when you need to change the SQL query, chart configuration, data metadata, or other properties of a metric that is already defined.  Changes made to a metric will be reflected wherever that metric is used (e.g., on dashboards).
   - **Output:** Accepts an array of YAML metric files (representing the modified metrics) as input.
3. `bulk_create_dashboard`:
   - **Purpose:** Creates a new dashboard. Dashboards are visual layouts composed of metrics, designed to present data insights.
   - **Usage:**  Use this tool to create a brand new dashboard.  You will typically need to have already created the metrics you intend to display on the dashboard using `bulk_create_metric` or have existing metrics available. You define the dashboard's title, and the arrangement of metrics in rows using the dashboard YAML schema.
   - **Output:** Accepts an array of YAML dashboard files as input.
4. `bulk_modify_dashboard`:
   - **Purpose:** Modifies existing dashboards.  This tool allows you to change the attributes *of the dashboard itself*, such as its title or the sizing and arrangement of metrics *within* the dashboard layout.  **Crucially, it does not modify the metrics themselves.**
   - **Usage:** Use this tool to adjust the visual presentation or structure of an existing dashboard. This includes changing the dashboard title, rearranging the metrics within rows, or adjusting the width of metric items.  It does *not* change the underlying metrics' definitions (for that, use `bulk_modify_metric`).
   - **Output:** Accepts an array of YAML dashboard files (representing the modified dashboards) as input.
5. `filter_dashboard`:
   - **Purpose:** Applies a filter to the metrics displayed on a dashboard. This tool modifies the SQL queries of the metrics *on a specific dashboard* to filter the data being shown.
   - **Usage:** Use this when you need to narrow down the data displayed in the metrics on a dashboard based on certain criteria. This effectively modifies the SQL behind the metrics *in the context of that dashboard* to show a subset of the data.
   - **Output:**  The specific input and output format for `filter_dashboard` would depend on your implementation (e.g., it might take dashboard ID and filter criteria as input).  *Further details on input/output are needed for full description.*
"##;
