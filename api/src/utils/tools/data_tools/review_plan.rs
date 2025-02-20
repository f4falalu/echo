use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use std::sync::Arc;

use crate::utils::{
    tools::ToolExecutor,
    agent::Agent,
};
use litellm::ToolCall;

#[derive(Debug, Serialize, Deserialize)]
pub struct PlanReviewOutput {
    status: String,
    error: Option<String>,
    plan_id: String,
    is_completed: bool,
    updated_content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PlanReviewInput {
    plan_id: String,
    mark_completed: bool,
    updated_markdown_content: Option<String>,
    review_comments: Option<String>,
}

pub struct ReviewPlan {
    agent: Arc<Agent>
}

impl ReviewPlan {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for ReviewPlan {
    type Output = PlanReviewOutput;

    fn get_name(&self) -> String {
        "review_plan".to_string()
    }

    async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
        let input: PlanReviewInput = serde_json::from_str(&tool_call.function.arguments)?;
        
        // TODO: Implement actual plan review logic here
        // This would typically involve:
        // 1. Fetching the existing plan from the database
        // 2. Verifying the user (current_thread.user_id) has access to the plan
        // 3. If updated_markdown_content is provided, validate and update the plan
        // 4. If mark_completed is true, mark the plan as completed
        // 5. Store review comments if provided
        // 6. Save changes to the database

        Ok(PlanReviewOutput {
            status: "success".to_string(),
            error: None,
            plan_id: input.plan_id,
            is_completed: input.mark_completed,
            updated_content: input.updated_markdown_content,
        })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "review_plan",
            "description": "Reviews an existing plan, optionally updates its content, and/or marks it as completed. Used for checking work and finalizing data analysis.",
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_id": {
                        "type": "string",
                        "description": "The ID of the plan to review"
                    },
                    "mark_completed": {
                        "type": "boolean",
                        "description": "Whether to mark the plan as completed"
                    },
                    "updated_markdown_content": {
                        "type": "string",
                        "description": "Optional updated markdown content for the plan"
                    },
                    "review_comments": {
                        "type": "string",
                        "description": "Optional comments about the review or changes made"
                    }
                },
                "required": ["plan_id", "mark_completed"]
            }
        })
    }
} 