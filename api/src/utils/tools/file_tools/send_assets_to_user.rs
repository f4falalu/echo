use std::sync::Arc;

use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::utils::{agent::Agent, tools::ToolExecutor};
use litellm::ToolCall;

#[derive(Debug, Serialize, Deserialize)]
pub struct SendToUserParams {
    metric_id: String,
}

#[derive(Debug, Serialize)]
pub struct SendToUserOutput {
    success: bool,
}

pub struct SendAssetsToUserTool {
    agent: Arc<Agent>,
}

impl SendAssetsToUserTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for SendAssetsToUserTool {
    type Output = SendToUserOutput;
    type Params = SendToUserParams;

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        // TODO: Implement actual send to user logic
        Ok(SendToUserOutput { success: true })
    }

    fn get_name(&self) -> String {
        "decide_assets_to_return".to_string()
    }

    async fn is_enabled(&self) -> bool {
        match self.agent.get_state_value("files_available").await {
            Some(_) => true,
            None => false,
        }
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
          "name": "decide_assets_to_return",
          "description": "Use after you have created or modified any assets (metrics or dashboards) to specify exactly which assets to present in the final response. If you have not created or modified any assets, do not call this action.",
          "strict": true,
          "parameters": {
            "type": "object",
            "required": [
              "assets_to_return",
              "ticket_description"
            ],
            "properties": {
              "assets_to_return": {
                "type": "array",
                "description": "List of assets to present in the final response, each with an ID and a name",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string",
                      "description": "Unique identifier for the asset"
                    },
                    "name": {
                      "type": "string",
                      "description": "Name of the asset"
                    }
                  },
                  "required": [
                    "id",
                    "name"
                  ],
                  "additionalProperties": false
                }
              },
              "ticket_description": {
                "type": "string",
                "description": "Description of the ticket related to the assets"
              }
            },
            "additionalProperties": false
          }
        })
    }
}
