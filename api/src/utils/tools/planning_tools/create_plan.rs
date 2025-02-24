use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

use crate::utils::{agent::Agent, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlanOutput {
    message: String,
    plan: String,
    summary: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePlanInput {
    markdown_content: String,
    summary: String,
}

pub struct CreatePlan {
    agent: Arc<Agent>,
}

impl CreatePlan {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for CreatePlan {
    type Output = CreatePlanOutput;
    type Params = CreatePlanInput;

    fn get_name(&self) -> String {
        "create_plan".to_string()
    }

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        self.agent
            .set_state_value(String::from("plan_available"), Value::Bool(true))
            .await;

        Ok(CreatePlanOutput {
            message: "Plan created successfully".to_string(),
            plan: params.markdown_content,
            summary: params.summary,
        })
    }

    async fn is_enabled(&self) -> bool {
        match self.agent.get_state_value("data_context").await {
            Some(_) => true,
            None => false,
        }
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Creates a structured plan for responding to user requests. Use this tool when you have sufficient context about the user's needs and want to outline a clear approach. The plan should include specific, actionable steps and validation criteria.",
            "parameters": {
                "type": "object",
                "properties": {
                    "markdown_content": {
                        "type": "string",
                        "description": PLAN_TEMPLATE
                    },
                    "summary": {
                        "type": "string",
                        "description": "A brief summary of the plan's key points and objectives"
                    }
                },
                "required": ["markdown_content", "summary"]
            }
        })
    }
}

const PLAN_TEMPLATE: &str = r##"
# Plan

## Overview
[Provide a brief summary of what needs to be accomplished and why]

## Context Requirements
- [ ] Sufficient data context is available
- [ ] User requirements are clear
- [ ] Necessary tools are accessible

## Tasks
1. [Task Name]
   - Description: [Detailed explanation of what needs to be done]
   - Tools to Use: [List relevant tools, e.g., create_metric, create_dashboard]
   - Visualization Type: [Specify chart type: table, line, bar, histogram, pie/donut, metric card, or scatter plot]
     - The goal is to make the data as digestible as possible for the user.
   - Validation Criteria:
     * [Specific, measurable criteria to confirm task completion]

2. [Additional Tasks as needed...]
   - Follow the same structure as above
   - Each task should be concrete and actionable

## Metrics Selection
- Metrics to Create:
  * [List each visualization/metric with its purpose]
- Response Strategy:
  * [If multiple metrics/dashboards are created, specify which ones to highlight in the response]
  * [Include rationale for metric selection]

## Review and Validation
1. Quality Check
   - [ ] All tasks completed according to validation criteria
   - [ ] Visualizations are properly configured
   - [ ] Dashboards are functional and informative
   - [ ] Data is effectively communicated through chosen chart types

2. User Requirements Check
   - [ ] All user requirements have been addressed
   - [ ] Solution matches the original request
   - [ ] Documentation is clear and complete

## Notes
[Any additional information or considerations]
"##;
