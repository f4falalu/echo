use std::time::Instant;
use std::sync::Arc;

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
    agent::{Agent, AgentThread, AgentExt},
    tools::ToolExecutor,
};

use litellm::{Message as AgentMessage, ToolCall};

#[derive(Debug, Serialize, Deserialize)]
pub struct ExploratoryAgentOutput {
    pub message: String,
    pub duration: i64,
    pub findings: Vec<ExploratoryFinding>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExploratoryFinding {
    pub finding_type: String, // "data_profile", "sample", "analysis"
    pub source: String,
    pub details: String,
    pub timestamp: chrono::DateTime<Utc>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ExploratoryAgentInput {
    pub target: String,                   // table/dataset to explore
    pub focus_areas: Option<Vec<String>>, // specific aspects to analyze
    pub constraints: Option<String>,      // any limitations or requirements
}

pub struct ExploratoryAgent {
    agent: Arc<Agent>,
}

impl AgentExt for ExploratoryAgent {
    fn get_agent(&self) -> &Arc<Agent> {
        &self.agent
    }
}

impl ExploratoryAgent {
    pub fn new(user_id: Uuid, session_id: Uuid) -> Result<Self> {
        // Create agent and immediately wrap in Arc
        let mut agent = Arc::new(Agent::new(
            "o3-mini".to_string(), 
            HashMap::new(),
            user_id,
            session_id
        ));

        // TODO: Add tools here with Arc::clone(&agent)
        let tools_map = Arc::get_mut(&mut agent)
            .expect("Failed to get mutable reference to agent");

        Ok(Self { agent })
    }

    pub fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        // Create a new agent with the same core properties and shared state/stream
        let mut agent = Arc::new(Agent::from_existing(existing_agent));

        // TODO: Add tools here with Arc::clone(&agent)
        let tools_map = Arc::get_mut(&mut agent)
            .expect("Failed to get mutable reference to agent");

        Ok(Self { agent })
    }

    pub async fn explore(
        &self,
        input: ExploratoryAgentInput,
        parent_thread_id: Uuid,
        user_id: Uuid,
    ) -> Result<ExploratoryAgentOutput> {
        let start_time = Instant::now();
        debug!("Starting exploratory analysis for: {}", input.target);

        // Create thread with exploration context
        let thread = AgentThread::new(
            Some(parent_thread_id),
            user_id,
            vec![
                AgentMessage::developer(EXPLORATORY_AGENT_PROMPT.to_string()),
                AgentMessage::user(serde_json::to_string(&input)?),
            ],
        );

        // Process using agent's streaming functionality - now using the trait method
        let mut rx = self.stream_process_thread(&thread).await?;
        let findings = self.process_stream(rx).await?;

        let duration = start_time.elapsed().as_millis() as i64;
        let message = format!(
            "Completed exploratory analysis with {} finding(s)",
            findings.len()
        );

        info!(
            duration_ms = duration,
            findings_count = findings.len(),
            target = input.target,
            "Completed exploratory analysis"
        );

        Ok(ExploratoryAgentOutput {
            message,
            duration,
            findings,
        })
    }

    async fn process_stream(
        &self,
        mut rx: Receiver<Result<AgentMessage, anyhow::Error>>,
    ) -> Result<Vec<ExploratoryFinding>> {
        let mut findings = Vec::new();

        while let Some(msg_result) = rx.recv().await {
            match msg_result {
                Ok(msg) => {
                    if let Some(finding) = self.process_message(msg)? {
                        findings.push(finding);
                    }
                }
                Err(e) => {
                    tracing::error!("Error processing exploratory message: {}", e);
                }
            }
        }

        Ok(findings)
    }

    fn process_message(&self, message: AgentMessage) -> Result<Option<ExploratoryFinding>> {
        match message {
            AgentMessage::Assistant {
                content: _,
                tool_calls,
                ..
            } => {
                if let Some(tool_calls) = tool_calls {
                    for tool_call in tool_calls {
                        if let Some(finding) = self.process_tool_result(&tool_call)? {
                            return Ok(Some(finding));
                        }
                    }
                }
                Ok(None)
            }
            AgentMessage::Tool { content, name, .. } => {
                // Process tool response
                let result: Value = serde_json::from_str(&content)?;

                // Extract finding information from the tool response
                let finding_type = match name.as_deref() {
                    Some("search_data_catalog") => "data_profile",
                    Some("sample_query") => "sample",
                    Some("analyze_data") => "analysis",
                    _ => "unknown",
                };

                Ok(Some(ExploratoryFinding {
                    finding_type: finding_type.to_string(),
                    source: name.unwrap_or_else(|| "unknown".to_string()),
                    details: content,
                    timestamp: Utc::now(),
                }))
            }
            _ => Ok(None),
        }
    }

    fn process_tool_result(&self, tool_call: &ToolCall) -> Result<Option<ExploratoryFinding>> {
        // Process different tool results into appropriate findings
        match tool_call.function.name.as_str() {
            "search_data_catalog" => {
                let result: Value = serde_json::from_str(&tool_call.function.arguments)?;
                Ok(Some(ExploratoryFinding {
                    finding_type: "data_profile".to_string(),
                    source: "catalog_search".to_string(),
                    details: serde_json::to_string(&result)?,
                    timestamp: Utc::now(),
                }))
            }
            "sample_query" => {
                let result: Value = serde_json::from_str(&tool_call.function.arguments)?;
                Ok(Some(ExploratoryFinding {
                    finding_type: "sample".to_string(),
                    source: "query_execution".to_string(),
                    details: serde_json::to_string(&result)?,
                    timestamp: Utc::now(),
                }))
            }
            "analyze_data" => {
                let result: Value = serde_json::from_str(&tool_call.function.arguments)?;
                Ok(Some(ExploratoryFinding {
                    finding_type: "analysis".to_string(),
                    source: "data_analysis".to_string(),
                    details: serde_json::to_string(&result)?,
                    timestamp: Utc::now(),
                }))
            }
            _ => Ok(None),
        }
    }
}

const EXPLORATORY_AGENT_PROMPT: &str = r##"
You are an expert data analyst focused on exploratory data analysis. Your role is to:

1. Understand and profile data sources
2. Sample and analyze data patterns
3. Identify potential data quality issues
4. Generate insights about the data

When exploring data:
1. Start with basic profiling to understand the shape and structure
2. Take representative samples to analyze patterns
3. Look for anomalies or unexpected values
4. Document all findings and insights

Your analysis should:
- Be thorough but focused on the specified areas
- Consider data quality and completeness
- Identify potential issues or limitations
- Provide actionable insights

Remember to:
- Document your methodology
- Note any assumptions
- Highlight key findings
- Suggest areas for deeper analysis
"##;
