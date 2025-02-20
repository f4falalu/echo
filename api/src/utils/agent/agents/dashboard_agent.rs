use std::time::Instant;

use anyhow::Result;
use async_trait::async_trait;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::sync::mpsc::Receiver;
use tracing::{debug, info};
use uuid::Uuid;
use std::collections::HashMap;

use crate::utils::{
    agent::{Agent, AgentThread},
    tools::{
        file_tools::{
            CreateDashboardFilesTool,
            CreateMetricFilesTool,
            ModifyDashboardFilesTool,
            ModifyMetricFilesTool,
            OpenFilesTool,
            SearchFilesTool,
        }, IntoValueTool, ToolExecutor
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
    pub action: String,  // "created", "modified", "opened"
    pub status: String,  // "success", "error"
    pub details: String,
    pub metrics: Vec<Uuid>,  // Associated metric IDs
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
    pub operation: String,  // "create", "modify", "analyze"
    pub dashboard_name: Option<String>,
    pub dashboard_id: Option<Uuid>,
    pub requirements: Option<String>,
    pub modifications: Option<String>,
    pub metric_ids: Option<Vec<Uuid>>,  // Existing metrics to include
    pub new_metrics: Option<Vec<String>>,  // New metrics to create
}

pub struct DashboardAgent {
    agent: Agent,
}

impl DashboardAgent {
    pub fn new() -> Result<Self> {
        let mut agent = Agent::new("o3-mini".to_string(), HashMap::new());
        
        // Add dashboard and metric tools
        let create_dashboard_tool = CreateDashboardFilesTool;
        let modify_dashboard_tool = ModifyDashboardFilesTool;
        let create_metric_tool = CreateMetricFilesTool;
        let modify_metric_tool = ModifyMetricFilesTool;
        let open_files_tool = OpenFilesTool;
        let search_files_tool = SearchFilesTool;

        agent.add_tool(
            create_dashboard_tool.get_name(),
            create_dashboard_tool.into_value_tool(),
        );
        agent.add_tool(
            modify_dashboard_tool.get_name(),
            modify_dashboard_tool.into_value_tool(),
        );
        agent.add_tool(
            create_metric_tool.get_name(),
            create_metric_tool.into_value_tool(),
        );
        agent.add_tool(
            modify_metric_tool.get_name(),
            modify_metric_tool.into_value_tool(),
        );
        agent.add_tool(
            open_files_tool.get_name(),
            open_files_tool.into_value_tool(),
        );
        agent.add_tool(
            search_files_tool.get_name(),
            search_files_tool.into_value_tool(),
        );

        Ok(Self { agent })
    }

    pub async fn process_dashboard(
        &self,
        input: DashboardAgentInput,
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

        // Process using agent's streaming functionality
        let mut rx = self.agent.stream_process_thread(&thread).await?;
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

    fn process_message(&self, message: AgentMessage) -> Result<Option<(Option<DashboardFileResult>, Option<MetricFileResult>)>> {
        match message {
            AgentMessage::Assistant { content: _, tool_calls, .. } => {
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
                        let is_dashboard = name.as_deref().map_or(false, |n| n.contains("dashboard"));
                        
                        if is_dashboard {
                            let metrics = file.get("metrics")
                                .and_then(|m| m.as_array())
                                .map_or_else(Vec::new, |metrics| {
                                    metrics.iter()
                                        .filter_map(|m| m.get("id").and_then(|id| id.as_str()))
                                        .filter_map(|id| Uuid::parse_str(id).ok())
                                        .collect()
                                });

                            return Ok(Some((Some(DashboardFileResult {
                                file_id: Uuid::parse_str(file.get("id").and_then(|id| id.as_str()).unwrap_or_default())?,
                                file_name: file.get("name").and_then(|n| n.as_str()).unwrap_or_default().to_string(),
                                action: name.unwrap_or_else(|| "unknown".to_string()),
                                status: "success".to_string(),
                                details: content.clone(),
                                metrics,
                            }), None)));
                        } else {
                            return Ok(Some((None, Some(MetricFileResult {
                                file_id: Uuid::parse_str(file.get("id").and_then(|id| id.as_str()).unwrap_or_default())?,
                                file_name: file.get("name").and_then(|n| n.as_str()).unwrap_or_default().to_string(),
                                action: name.unwrap_or_else(|| "unknown".to_string()),
                                status: "success".to_string(),
                                details: content.clone(),
                            }))));
                        }
                    }
                }
                Ok(None)
            }
            _ => Ok(None),
        }
    }

    fn process_tool_result(&self, tool_call: &ToolCall) -> Result<Option<(Option<DashboardFileResult>, Option<MetricFileResult>)>> {
        match tool_call.function.name.as_str() {
            "create_dashboard_files" | "modify_dashboard_files" => {
                let result: Value = serde_json::from_str(&tool_call.function.arguments)?;
                if let Some(files) = result.get("files").and_then(|f| f.as_array()) {
                    if let Some(file) = files.first() {
                        let metrics = file.get("metrics")
                            .and_then(|m| m.as_array())
                            .map_or_else(Vec::new, |metrics| {
                                metrics.iter()
                                    .filter_map(|m| m.get("id").and_then(|id| id.as_str()))
                                    .filter_map(|id| Uuid::parse_str(id).ok())
                                    .collect()
                            });

                        return Ok(Some((Some(DashboardFileResult {
                            file_id: if tool_call.function.name.starts_with("create") {
                                Uuid::new_v4()
                            } else {
                                Uuid::parse_str(file.get("id").and_then(|id| id.as_str()).unwrap_or_default())?
                            },
                            file_name: file.get("name").and_then(|n| n.as_str()).unwrap_or_default().to_string(),
                            action: if tool_call.function.name.starts_with("create") {
                                "created".to_string()
                            } else {
                                "modified".to_string()
                            },
                            status: "pending".to_string(),
                            details: serde_json::to_string(&file)?,
                            metrics,
                        }), None)));
                    }
                }
            }
            "create_metric_files" | "modify_metric_files" => {
                let result: Value = serde_json::from_str(&tool_call.function.arguments)?;
                if let Some(files) = result.get("files").and_then(|f| f.as_array()) {
                    if let Some(file) = files.first() {
                        return Ok(Some((None, Some(MetricFileResult {
                            file_id: if tool_call.function.name.starts_with("create") {
                                Uuid::new_v4()
                            } else {
                                Uuid::parse_str(file.get("id").and_then(|id| id.as_str()).unwrap_or_default())?
                            },
                            file_name: file.get("name").and_then(|n| n.as_str()).unwrap_or_default().to_string(),
                            action: if tool_call.function.name.starts_with("create") {
                                "created".to_string()
                            } else {
                                "modified".to_string()
                            },
                            status: "pending".to_string(),
                            details: serde_json::to_string(&file)?,
                        }))));
                    }
                }
            }
            _ => {}
        }
        Ok(None)
    }
}

const DASHBOARD_AGENT_PROMPT: &str = r##"
You are an expert dashboard engineer focused on creating and managing dashboard definitions and their associated metrics. Your role is to:

1. Create well-structured dashboard definitions following YAML schema
2. Manage and create required metrics for dashboards
3. Ensure dashboards and metrics follow best practices
4. Validate all definitions for completeness and accuracy

When working with dashboards:
1. Always validate against both dashboard and metric YAML schemas
2. Ensure all referenced metrics exist or create them
3. Use appropriate layouts and configurations
4. Include comprehensive metadata and documentation

Your operations should:
- Follow file naming conventions for both dashboards and metrics
- Maintain proper relationships between dashboards and metrics
- Set appropriate chart configurations for each metric
- Document any assumptions or limitations

Remember to:
- Verify metric dependencies
- Use clear, descriptive names
- Include all required fields
- Validate all modifications
- Consider dashboard layout and user experience
"##; 