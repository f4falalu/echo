use anyhow::Result;
use async_trait::async_trait;
use litellm::AgentMessage as AgentMessage;
use serde::Deserialize;
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::broadcast;

use crate::utils::{
    agent::{Agent, AgentError, ExploratoryAgent},
    tools::ToolExecutor,
};

pub struct ExploratoryAgentTool {
    agent: Arc<Agent>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ExploratoryAgentInput {
    pub ticket_description: String,
}

impl ExploratoryAgentTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for ExploratoryAgentTool {
    type Output = Value;
    type Params = ExploratoryAgentInput;
    fn get_name(&self) -> String {
        "exploratory_worker".to_string()
    }

    async fn is_enabled(&self) -> bool {
        match self.agent.get_state_value("data_context").await {
            Some(_) => true,
            None => false,
        }
    }

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        // Create and initialize the agent
        let exploratory_agent = ExploratoryAgent::from_existing(&self.agent).await?;

        let mut current_thread = self
            .agent
            .get_current_thread()
            .await
            .ok_or_else(|| anyhow::anyhow!("No current thread"))?;

        current_thread.remove_last_assistant_message();

        current_thread.add_user_message(params.ticket_description);

        // Run the exploratory agent and get the receiver
        let rx = exploratory_agent.run(&mut current_thread).await?;

        process_agent_output(rx).await?;

        self.agent
            .set_state_value(String::from("files_available"), Value::Bool(false))
            .await;

        // Return success response
        Ok(serde_json::json!({
            "status": "success",
            "message": "Exploratory agent completed successfully"
        }))
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Use when requests are ambiguous and require data exploration to provide meaningful answers. This tool explores data sources, understands relationships, and generates insights to help clarify user needs and create appropriate metrics or dashboards.",
            "strict": true,
            "parameters": {
                "type": "object",
                "required": [
                    "ticket_description"
                ],
                "properties": {
                    "ticket_description": {
                        "type": "string",
                        "description": "A brief description of the ambiguous request that needs exploration. Copy the user's request exactly without adding instructions, thoughts, or assumptions. The exploratory agent will investigate the data to understand context and possibilities before providing recommendations. Example formats: 'Explore what drives customer churn...', 'Investigate performance trends...'"
                    }
                },
                "additionalProperties": false
            }
        })
    }
}

async fn process_agent_output(
    mut rx: broadcast::Receiver<Result<AgentMessage, AgentError>>,
) -> Result<()> {
    while let Ok(msg_result) = rx.recv().await {
        match msg_result {
            Ok(msg) => {
                println!("Agent message: {:?}", msg);
                if let AgentMessage::Assistant {
                    content: Some(_), ..
                } = msg
                {
                    return Ok(());
                }
            }
            Err(e) => {
                println!("Agent error: {:?}", e);
                return Err(e.into());
            }
        }
    }

    // If we get here without finding a completion message, return an error
    Err(anyhow::anyhow!(
        "Agent communication ended without completion message"
    ))
}
