use std::sync::Arc;

use anyhow::Result;
use std::collections::HashMap;
use tokio::sync::mpsc::Receiver;
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

use litellm::Message as AgentMessage;

pub struct DashboardAgent {
    agent: Arc<Agent>,
}

impl DashboardAgent {
    pub async fn new(user_id: Uuid, session_id: Uuid) -> Result<Self> {
        // Create agent first
        let agent = Arc::new(Agent::new(
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

        // Add tools directly to the Arc<Agent>
        agent
            .add_tool(
                create_dashboard_tool.get_name(),
                create_dashboard_tool.into_value_tool(),
            )
            .await;
        agent
            .add_tool(
                modify_dashboard_tool.get_name(),
                modify_dashboard_tool.into_value_tool(),
            )
            .await;
        agent
            .add_tool(
                create_metric_tool.get_name(),
                create_metric_tool.into_value_tool(),
            )
            .await;
        agent
            .add_tool(
                modify_metric_tool.get_name(),
                modify_metric_tool.into_value_tool(),
            )
            .await;
        agent
            .add_tool(
                open_files_tool.get_name(),
                open_files_tool.into_value_tool(),
            )
            .await;
        agent
            .add_tool(
                search_files_tool.get_name(),
                search_files_tool.into_value_tool(),
            )
            .await;

        Ok(Self { agent })
    }

    pub async fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        // Create a new agent with the same core properties and shared state/stream
        let agent = Arc::new(Agent::from_existing(existing_agent));

        // Add dashboard and metric tools
        let create_dashboard_tool = CreateDashboardFilesTool::new(Arc::clone(&agent));
        let modify_dashboard_tool = ModifyDashboardFilesTool::new(Arc::clone(&agent));
        let create_metric_tool = CreateMetricFilesTool::new(Arc::clone(&agent));
        let modify_metric_tool = ModifyMetricFilesTool::new(Arc::clone(&agent));
        let open_files_tool = OpenFilesTool::new(Arc::clone(&agent));
        let search_files_tool = SearchFilesTool::new(Arc::clone(&agent));


        // Add tools to the agent
        agent
            .add_tool(
                create_dashboard_tool.get_name(),
                create_dashboard_tool.into_value_tool(),
            )
            .await;
        agent
            .add_tool(
                modify_dashboard_tool.get_name(),
                modify_dashboard_tool.into_value_tool(),
            )
            .await;
        agent
            .add_tool(
                create_metric_tool.get_name(),
                create_metric_tool.into_value_tool(),
            )
            .await;
        agent
            .add_tool(
                modify_metric_tool.get_name(),
                modify_metric_tool.into_value_tool(),
            )
            .await;
        agent
            .add_tool(
                open_files_tool.get_name(),
                open_files_tool.into_value_tool(),
            )
            .await;
        agent
            .add_tool(
                search_files_tool.get_name(),
                search_files_tool.into_value_tool(),
            )
            .await;

        Ok(Self { agent })
    }

    pub async fn run(
        &self,
        thread: &mut AgentThread,
    ) -> Result<Receiver<Result<AgentMessage, anyhow::Error>>> {
        // Process using agent's streaming functionality
        thread.set_developer_message(DASHBOARD_AGENT_PROMPT.to_string());

        println!("Dashboard agent thread: {:?}", thread);

        self.stream_process_thread(thread).await
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
• Read the user response carefully. Identify the user's intent:
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
"##;
