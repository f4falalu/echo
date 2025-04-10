use anyhow::Result;
use async_trait::async_trait;
use braintrust::{get_prompt_system_message, BraintrustClient};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::env;
use std::sync::Arc;
use std::time::Instant;

use crate::{agent::Agent, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlanOutput {
    pub message: String,
    pub plan_markdown: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePlanInput {
    plan_markdown: String,
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

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        let start_time = Instant::now();
        self.agent
            .set_state_value(String::from("plan_available"), Value::Bool(true))
            .await;

        Ok(CreatePlanOutput {
            message: "Plan created successfully".to_string(),
            plan_markdown: params.plan_markdown,
        })
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": get_create_plan_description().await,
            "parameters": {
                "type": "object",
                "properties": {
                    "plan_markdown": {
                        "type": "string",
                        "description": get_plan_markdown_description().await
                    },
                },
                "required": [
                    "plan_markdown",
                ]
            }
        })
    }
}

async fn get_create_plan_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return "Creates a structured plan for data analysis that is tailored to the user's request. Use this tool when you have sufficient context about the user's needs and want to outline a clear approach.".to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "96ccd8a8-f537-4363-bd72-aad557cef620").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            "Creates a structured plan for data analysis that is tailored to the user's request. Use this tool when you have sufficient context about the user's needs and want to outline a clear approach.".to_string()
        }
    }
}

async fn get_plan_markdown_description() -> String {
    if env::var("USE_BRAINTRUST_PROMPTS").is_err() {
        return PLAN_TEMPLATE.to_string();
    }

    let client = BraintrustClient::new(None, "96af8b2b-cf3c-494f-9092-44eb3d5b96ff").unwrap();
    match get_prompt_system_message(&client, "f6e90035-721e-41a9-be51-e2f8d86f1835").await {
        Ok(message) => message,
        Err(e) => {
            eprintln!("Failed to get prompt system message: {}", e);
            PLAN_TEMPLATE.to_string()
        }
    }
}

const PLAN_TEMPLATE: &str = r##"
This template guides you in creating a data analysis plan tailored to the user's request. Follow the structure and guidelines below to ensure clarity, actionable insights, and alignment with the user's needs.

The term **chart** is used synonymously with terms like 'chart'/'table'/'visualization'/etc. A chart is just a SQl statement and visualization displaying the query results.

---

## Plan

### Objective
Define the goal of the analysis using the SMART framework:
- **Specific**: What exactly will this analysis achieve?
- **Measurable**: How will success be quantified?
- **Achievable**: Is it realistic given the available data and tools?
- **Relevant**: Does it address the user's intent and business context?
- **Time-bound**: What's the timeframe for the analysis or insights?

**Example:** 'Identify the top 3 revenue drivers for Q3 2023 using sales data, achievable with current datasets, to inform marketing strategy within 2 weeks.'

### Plan Framework
- **Analysis Type:** Choose one: `specific_and_straightforward`, `vague_or_undefined`, `exploratory_or_discovery_or_summaries`, `goal_oriented`, `other`.
- **Analysis Type Reasoning:** Justify your choice with context:
  - **specific_and_straightforward**: Detail the precise chart(s) requested and any edge cases (e.g., 'User asked for monthly sales totals').
  - **vague_or_undefined**: Explain assumptions made to clarify the request (e.g., 'User mentioned 'performance'—assuming sales and customer charts').
  - **exploratory_or_discovery_or_summaries**: Outline the topic and how charts will provide a broad view (e.g., 'Exploring customer behavior requires demographics, purchases, and trends').
  - **goal_oriented**: List hypotheses tied to the goal (e.g., 'Hypothesis: Discounts drive sales—test with discount vs. sales data').
  - **other**: Describe the custom approach and why it's needed (e.g., 'Hybrid of exploratory_or_discovery_or_summaries and specific due to mixed request').
- **Number of Charts to Return:** Specify the exact number of charts:
  - 1-5 for `specific_and_straightforward` or `vague_or_undefined`
  - 5-12 for `exploratory_or_discovery_or_summaries` or `goal_oriented`
  - Adjust based on request complexity.
- **Return Method:** Choose how the results will be presented:
  - Single chart
  - Return as individual charts
  - Display charts in a dashboard (recommended for multiple charts)

### Charts to Build
For each chart, include:
- **Chart Title**: A human-readable title (e.g., 'Monthly Sales by Product Category' or 'Revenue Comparison: Last Month vs. Same Month Last Year').
- **Explanation**: Why this chart is valuable and how it contributes to the objective.
- **Dataset(s)**: Specific table/dataset(s) to query (e.g., 'crm_sales_2023').
- **Calculation**: How it's derived (e.g., 'Sum of sales, grouped by month').
- **Filters/Groupings/Time Frames**: Any conditions (e.g., 'Filter: Q3 2023').
- **Chart Type**: (e.g., line, bar, pie/donut, number card, scatter) with justification.

If multiple charts are closely related and can be effectively combined into a single visualization for better insight and comparison (e.g., comparing revenue across two time periods), consider creating a single chart that encompasses them. For example, instead of separate chart cards for revenues of different months, use a bar chart with one bar per period or a line chart highlighting the periods of interest.

For `exploratory_or_discovery_or_summaries` or `goal_oriented`, brainstorm 20 charts and then select 5-12 most relevant.

#### Example:
1. **[Chart Title]**: [Details as above.]
2. [Repeat for each chart.]

**For `goal_oriented` only:** Group by hypotheses:
- **Hypothesis 1:** (e.g., 'Increased marketing spend boosts conversions')
  - **chart 1.1:** (e.g., 'Conversion Rate: From marketing_events_2023, count conversions ÷ clicks, monthly, line chart to track trends.')
  - **chart 1.2:** [Details]
- **Hypothesis 2:** [Add as needed.]

### Validation Criteria
List measurable checks tailored to the analysis type:
- **specific_and_straightforward**: Accuracy (e.g., 'Sales totals match source data') and alignment (e.g., 'Matches user's exact request').
- **vague_or_undefined**: Assumption validation (e.g., 'Performance assumption confirmed with user intent') and reasonableness.
- **exploratory_or_discovery_or_summaries**: Completeness (e.g., 'Covers all key aspects of topic') and holism.
- **goal_oriented**: Hypothesis testing (e.g., 'charts disprove/confirm hypotheses').
- **other**: Custom criteria (e.g., 'Meets unique workflow goals').

**Examples:**
- 'Data is current as of [date].'
- 'Charts clearly show trends requested.'
- 'All charts align with objective.'

### Notes
(Optional, but can include items such as:)
- **Assumptions**: (e.g., 'Assuming complete data for 2023.')
- **Next Steps**: (e.g., 'Deeper dive into top chart.')
- **Non-Analysis Requests**: (e.g., 'The user requested I send the report to their Slack channel.')
- **Unsupported Requests**: (e.g., 'The user requested I make them a sandwich.')

---

## General Guidelines & Best Practices

### Selecting the Analysis Type
Use this checklist to select the most appropriate Analysis Type:
- **specific_and_straightforward**
  - The user explicitly names a specific chart (or a small set of charts).
  - The user already knows exactly what they want (e.g., 'Show me the total number of sales for last month').
  - *Plan Focus*: Return exactly what was requested.
- **vague_or_undefined**
  - The request is somewhat ambiguous or high-level (e.g., 'Show me our top customers' without defining 'top').
  - The user likely expects a single chart or only a few.
  - *Plan Focus*: Make reasonable assumptions to address the request.
- **exploratory_or_discovery_or_summaries**
  - The user wants a broad exploration, summary, or a detailed dashboard (e.g., 'How does our performance look lately?').
  - *Plan Focus*: Provide a holistic view with *at least* 5 relevant charts.
- **goal_oriented**
  - The user wants to accomplish a specific goal (e.g., 'I want to improve X, how do I do it?').
  - *Plan Focus*: Formulate hypotheses, brainstorm 20 charts, then select the most relevant 5–12.

### Building Good Visualizations
- Favor charts (line, bar, etc.) over tables for readability.
- Only use tables for list-style reports or if a user specifically requests a table.
- Time-series charts should almost always use a line chart.

### Data Requests That Use Comparisons
- Do not split a single comparison request into multiple charts.
- Comparisons between two or more values (e.g., revenue across different time periods), should be displayed in a single chart that visually represents the comparison, such as a bar chart for discrete periods or a line chart for comparison of a single measure over multiple time periods.
- This enhances readability and provides immediate insight into the relationship between the values (instead of forcing the user to look at multiple charts at once.)
- Do not split a single comparison request into multiple charts.
- If a single chart request would actually be better displayed as multiple charts in a dashboard, use your judgment.

### Building Validation Criteria
- Ensure criteria confirm the analysis fully meets the request.
- Verify visualizations are effective and data is accurate.

### Considering Datasets
- Specify dataset(s) in **charts to Build** (e.g., 'sales_db').
- Note availability issues in **Notes**.

### Additional Tips for Charts
- Use standard charts over number cards when possible.
- For `exploratory_or_discovery_or_summaries`/`goal_oriented`: Brainstorm 20, pick 5-12 impactful charts.
- Justify each chart's value to the objective.
- Confirm feasibility with available data.

### SQL Best Practices and Constraints** (when creating new metrics)  
- **Constraints**: Only join tables with explicit entity relationships.  
- **SQL Requirements**:  
  - Use schema-qualified table names (`<SCHEMA_NAME>.<TABLE_NAME>`).  
  - Select specific columns (avoid `SELECT *` or `COUNT(*)`).  
  - Use CTEs instead of subqueries, and use snake_case for naming them.  
  - Use `DISTINCT` (not `DISTINCT ON`) with matching `GROUP BY`/`SORT BY` clauses.  
  - Show entity names rather than just IDs.  
  - Handle date conversions appropriately.  
  - Order dates in ascending order.
  - Reference database identifiers for cross-database queries.  
  - Format output for the specified visualization type.  
  - Maintain a consistent data structure across requests unless changes are required.  
  - Use explicit ordering for custom buckets or categories.
  - When grouping metrics by dates, default to monthly granularity for spans over 2 months, yearly for over 3 years, weekly for under 2 months, and daily for under a week, unless the user specifies a different granularity.

---
"##;
