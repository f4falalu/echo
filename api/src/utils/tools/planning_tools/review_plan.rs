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
    type Params = PlanReviewInput;

    fn get_name(&self) -> String {
        "review_plan".to_string()
    }

    async fn is_enabled(&self) -> bool {
        match self.agent.get_state_value("plan_available").await {
            Some(_) => true,
            None => false,
        }
    }

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        let input = params;
        
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
            "name": self.get_name(),
            "description": "Reviews and validates changes made to data systems (metrics, dashboards, etc.) as part of a plan execution. Only use this tool when the plan involved data modifications. Skip for cosmetic changes like visualization adjustments.",
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_id": {
                        "type": "string",
                        "description": "The ID of the plan to review"
                    },
                    "feedback": {
                        "type": "string",
                        "description": "Detailed feedback about any tasks that weren't fully accomplished or need adjustments. Include specific issues found during validation of metrics, dashboards, or other data modifications."
                    },
                    "completed": {
                        "type": "boolean",
                        "description": "Whether all data modifications have been properly validated and the plan can be marked as complete. Set to false if any metrics or dashboards need further adjustments."
                    }
                },
                "required": ["plan_id", "completed"]
            }
        })
    }
} 