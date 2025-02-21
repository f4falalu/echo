use std::sync::Arc;

use anyhow::Result;
use std::collections::HashMap;
use tokio::sync::mpsc::Receiver;
use uuid::Uuid;

use crate::utils::{
    agent::{Agent, AgentExt, AgentThread},
    tools::{
        file_tools::{CreateMetricFilesTool, ModifyMetricFilesTool},
        IntoValueTool, ToolExecutor,
    },
};

use litellm::Message as AgentMessage;

pub struct MetricAgent {
    agent: Arc<Agent>,
}

impl MetricAgent {
    pub async fn new(user_id: Uuid, session_id: Uuid) -> Result<Self> {
        // Create agent and immediately wrap in Arc
        let agent = Arc::new(Agent::new(
            "o3-mini".to_string(),
            HashMap::new(),
            user_id,
            session_id,
        ));

        // Use the SAME Arc<Agent> for tools
        let create_metric_files_tool = CreateMetricFilesTool::new(Arc::clone(&agent));
        let modify_metric_files_tool = ModifyMetricFilesTool::new(Arc::clone(&agent));

        // Add tools to the agent
        agent
            .add_tool(
                create_metric_files_tool.get_name(),
                create_metric_files_tool.into_value_tool(),
            )
            .await;
        agent
            .add_tool(
                modify_metric_files_tool.get_name(),
                modify_metric_files_tool.into_value_tool(),
            )
            .await;

        Ok(Self { agent })
    }

    pub async fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        // Create a new agent with the same core properties and shared state/stream
        let agent = Arc::new(Agent::from_existing(existing_agent));

        // Add metric-specific tools
        let create_metric_files_tool = CreateMetricFilesTool::new(Arc::clone(&agent));
        let modify_metric_files_tool = ModifyMetricFilesTool::new(Arc::clone(&agent));

        // Add tools to the agent
        agent
            .add_tool(
                create_metric_files_tool.get_name(),
                create_metric_files_tool.into_value_tool(),
            )
            .await;
        agent
            .add_tool(
                modify_metric_files_tool.get_name(),
                modify_metric_files_tool.into_value_tool(),
            )
            .await;

        Ok(Self { agent })
    }

    pub async fn run(
        &self,
        thread: &mut AgentThread,
    ) -> Result<Receiver<Result<AgentMessage, anyhow::Error>>> {
        thread.set_developer_message(METRIC_AGENT_PROMPT.to_string());
        // Process using agent's streaming functionality
        self.stream_process_thread(thread).await
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
• Read the user response carefully. Identify the user's intent:
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
