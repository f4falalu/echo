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
            CreateFilesTool,
            ModifyFilesTool,
            OpenFilesTool,
            SearchFilesTool,
        }, IntoValueTool, ToolExecutor
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
    pub action: String,  // "created", "modified", "opened"
    pub status: String,  // "success", "error"
    pub details: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MetricAgentInput {
    pub operation: String,  // "create", "modify", "analyze"
    pub metric_name: Option<String>,
    pub metric_id: Option<Uuid>,
    pub requirements: Option<String>,
    pub modifications: Option<String>,
}

pub struct MetricAgent {
    agent: Agent,
}

impl MetricAgent {
    pub fn new() -> Result<Self> {
        let mut agent = Agent::new("o3-mini".to_string(), HashMap::new());
        
        // Add metric-specific tools
        let create_files_tool = CreateFilesTool;
        let modify_files_tool = ModifyFilesTool;
        let open_files_tool = OpenFilesTool;
        let search_files_tool = SearchFilesTool;

        agent.add_tool(
            create_files_tool.get_name(),
            create_files_tool.into_value_tool(),
        );
        agent.add_tool(
            modify_files_tool.get_name(),
            modify_files_tool.into_value_tool(),
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

        // Process using agent's streaming functionality
        let mut rx = self.agent.stream_process_thread(&thread).await?;
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
                        return Ok(Some(MetricFileResult {
                            file_id: Uuid::parse_str(file.get("id").and_then(|id| id.as_str()).unwrap_or_default())?,
                            file_name: file.get("name").and_then(|n| n.as_str()).unwrap_or_default().to_string(),
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
                            file_name: file.get("name").and_then(|n| n.as_str()).unwrap_or_default().to_string(),
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
                            file_id: Uuid::parse_str(file.get("id").and_then(|id| id.as_str()).unwrap_or_default())?,
                            file_name: file.get("file_name").and_then(|n| n.as_str()).unwrap_or_default().to_string(),
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
                            file_id: Uuid::parse_str(file.get("id").and_then(|id| id.as_str()).unwrap_or_default())?,
                            file_name: file.get("name").and_then(|n| n.as_str()).unwrap_or_default().to_string(),
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

const METRIC_AGENT_PROMPT: &str = r##"
You are an expert metric engineer focused on creating and managing metric definitions. Your role is to:

1. Create well-structured metric definitions following YAML schema
2. Modify existing metrics based on requirements
3. Ensure metrics follow best practices and standards
4. Validate metric definitions for completeness and accuracy

When working with metrics:
1. Always validate against the metric YAML schema
2. Ensure SQL queries are properly formatted and efficient
3. Use appropriate chart configurations for the data type
4. Include comprehensive metadata and documentation

Your operations should:
- Follow the metric file naming conventions
- Include proper data type specifications
- Set appropriate chart configurations
- Document any assumptions or limitations

Remember to:
- Be precise with SQL queries
- Use clear, descriptive names
- Include all required fields
- Validate all modifications
"##; 