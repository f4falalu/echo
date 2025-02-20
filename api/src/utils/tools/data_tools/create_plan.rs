use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::utils::tools::ToolCall;
use crate::utils::tools::ToolExecutor;

#[derive(Debug, Serialize, Deserialize)]
pub struct PlanOutput {
    status: String,
    error: Option<String>,
    plan_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PlanInput {
    markdown_content: String,
    title: String,
}

pub struct CreatePlan;

#[async_trait]
impl ToolExecutor for CreatePlan {
    type Output = PlanOutput;

    async fn execute(
        &self,
        tool_call: &ToolCall,
        user_id: &Uuid,
        session_id: &Uuid,
    ) -> Result<Self::Output> {
        let input: PlanInput = serde_json::from_str(&tool_call.function.arguments)?;
        
        // TODO: Implement actual plan creation logic here
        // This would typically involve:
        // 1. Validating the markdown content
        // 2. Storing the plan in the database
        // 3. Returning the plan ID or error

        Ok(PlanOutput {
            status: "success".to_string(),
            error: None,
            plan_id: Some("placeholder-id".to_string()),
        })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "create_plan",
            "description": "Creates a new plan from markdown content. The plan will be stored and can be referenced later.",
            "parameters": {
                "type": "object",
                "properties": {
                    "markdown_content": {
                        "type": "string",
                        "description": "The plan content in markdown format"
                    },
                    "title": {
                        "type": "string",
                        "description": "The title of the plan"
                    }
                },
                "required": ["markdown_content", "title"]
            }
        })
    }

    fn get_name(&self) -> String {
        "create_plan".to_string()
    }
} 