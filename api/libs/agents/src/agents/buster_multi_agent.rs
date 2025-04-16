use anyhow::Result;
use chrono::Local;
use database::helpers::datasets::get_dataset_names_for_organization;
use database::organization::get_user_organization_id;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::{
    tools::{
        categories::{
            file_tools::{
                CreateDashboardFilesTool, CreateMetricFilesTool, ModifyDashboardFilesTool,
                ModifyMetricFilesTool, SearchDataCatalogTool,
            },
            planning_tools::{CreatePlanInvestigative, CreatePlanStraightforward},
            response_tools::{Done, MessageUserClarifyingQuestion},
            utility_tools::no_search_needed::NoSearchNeededTool, // <-- Fixed import path
        },
        planning_tools::ReviewPlan,
        IntoToolCallExecutor, ToolExecutor,
    },
    Agent, AgentError, AgentExt, AgentThread,
};

use litellm::AgentMessage;

use super::{
    analysis_prompt::ANALYSIS_PROMPT, create_plan_prompt::CREATE_PLAN_PROMPT,
    data_catalog_search_prompt::DATA_CATALOG_SEARCH_PROMPT,
    initialization_follow_up_prompt::FOLLOW_UP_INTIALIZATION_PROMPT,
    initialization_prompt::INTIALIZATION_PROMPT, review_prompt::REVIEW_PROMPT,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct BusterSuperAgentOutput {
    pub message: String,
    pub duration: i64,
    pub thread_id: Uuid,
    pub messages: Vec<AgentMessage>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BusterSuperAgentInput {
    pub prompt: String,
    pub thread_id: Option<Uuid>,
    pub message_id: Option<Uuid>,
}

pub struct BusterMultiAgent {
    agent: Arc<Agent>,
}

impl AgentExt for BusterMultiAgent {
    fn get_agent(&self) -> &Arc<Agent> {
        &self.agent
    }
}

impl BusterMultiAgent {
    async fn load_tools(&self) -> Result<()> {
        // Create tools using the shared Arc
        let search_data_catalog_tool = SearchDataCatalogTool::new(Arc::clone(&self.agent));
        let create_plan_straightforward_tool =
            CreatePlanStraightforward::new(Arc::clone(&self.agent));
        let create_plan_investigative_tool = CreatePlanInvestigative::new(Arc::clone(&self.agent));
        let create_metric_files_tool = CreateMetricFilesTool::new(Arc::clone(&self.agent));
        let modify_metric_files_tool = ModifyMetricFilesTool::new(Arc::clone(&self.agent));
        let create_dashboard_files_tool = CreateDashboardFilesTool::new(Arc::clone(&self.agent));
        let modify_dashboard_files_tool = ModifyDashboardFilesTool::new(Arc::clone(&self.agent));
        let message_user_clarifying_question_tool = MessageUserClarifyingQuestion::new();
        let done_tool = Done::new();
        let no_search_needed_tool = NoSearchNeededTool::new(Arc::clone(&self.agent));
        let review_tool = ReviewPlan::new(Arc::clone(&self.agent));

        // Get names before moving tools
        let done_tool_name = done_tool.get_name();
        let msg_clarifying_q_tool_name = message_user_clarifying_question_tool.get_name();

        // Define conditions
        let data_catalog_search_condition = Some(|state: &HashMap<String, Value>| -> bool {
            // Enabled when the agent hasn't searched the catalog yet.
            // The LLM decides whether to actually search or use no_search_needed.
            !state
                .get("searched_data_catalog")
                .and_then(Value::as_bool)
                .unwrap_or(false)
        });

        // New condition: Enable tools only AFTER the data catalog has been searched (or skipped).
        let after_search_condition = Some(|state: &HashMap<String, Value>| -> bool {
            state
                .get("searched_data_catalog")
                .and_then(Value::as_bool)
                .unwrap_or(false)
        });

        let review_condition =
            Some(|state: &HashMap<String, Value>| -> bool { state.contains_key("review_needed") });

        let planning_tools_condition = Some(|state: &HashMap<String, Value>| -> bool {
            let searched_catalog = state
                .get("searched_data_catalog")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            let has_data_context = state.contains_key("data_context");
            let has_plan = state.contains_key("plan_available");

            // Enable planning only after catalog search/skip, with data context, and no existing plan.
            searched_catalog && has_data_context && !has_plan
        });

        let create_metric_files_condition = Some(|state: &HashMap<String, Value>| -> bool {
            state.contains_key("data_context") && state.contains_key("plan_available")
        });

        let modify_metric_files_condition = Some(|state: &HashMap<String, Value>| -> bool {
            state.contains_key("metrics_available")
                && state.contains_key("plan_available")
                && state.contains_key("data_context")
        });

        let create_dashboard_files_condition = Some(|state: &HashMap<String, Value>| -> bool {
            state.contains_key("metrics_available")
                && state.contains_key("plan_available")
                && state.contains_key("data_context")
        });

        let modify_dashboard_files_condition = Some(|state: &HashMap<String, Value>| -> bool {
            state.contains_key("dashboards_available")
                && state.contains_key("plan_available")
                && state.contains_key("data_context")
        });

        // Add tools to the agent with their conditions
        self.agent
            .add_tool(
                search_data_catalog_tool.get_name(),
                search_data_catalog_tool.into_tool_call_executor(),
                data_catalog_search_condition.clone(),
            )
            .await;
        self.agent
            .add_tool(
                no_search_needed_tool.get_name(),
                no_search_needed_tool.into_tool_call_executor(),
                data_catalog_search_condition.clone(),
            )
            .await;
        self.agent
            .add_tool(
                create_metric_files_tool.get_name(),
                create_metric_files_tool.into_tool_call_executor(),
                create_metric_files_condition,
            )
            .await;
        self.agent
            .add_tool(
                modify_metric_files_tool.get_name(),
                modify_metric_files_tool.into_tool_call_executor(),
                modify_metric_files_condition,
            )
            .await;
        self.agent
            .add_tool(
                create_dashboard_files_tool.get_name(),
                create_dashboard_files_tool.into_tool_call_executor(),
                create_dashboard_files_condition,
            )
            .await;
        self.agent
            .add_tool(
                modify_dashboard_files_tool.get_name(),
                modify_dashboard_files_tool.into_tool_call_executor(),
                modify_dashboard_files_condition,
            )
            .await;
        self.agent
            .add_tool(
                create_plan_straightforward_tool.get_name(),
                create_plan_straightforward_tool.into_tool_call_executor(),
                planning_tools_condition.clone(),
            )
            .await;
        self.agent
            .add_tool(
                create_plan_investigative_tool.get_name(),
                create_plan_investigative_tool.into_tool_call_executor(),
                planning_tools_condition,
            )
            .await;
        self.agent
            .add_tool(
                message_user_clarifying_question_tool.get_name(),
                message_user_clarifying_question_tool.into_tool_call_executor(),
                after_search_condition.clone(), // Use after_search_condition
            )
            .await;
        self.agent
            .add_tool(
                done_tool.get_name(),
                done_tool.into_tool_call_executor(),
                after_search_condition.clone(), // Use after_search_condition instead of None
            )
            .await;
        self.agent
            .add_tool(
                review_tool.get_name(),
                review_tool.into_tool_call_executor(),
                review_condition.clone(),
            )
            .await;

        // Register terminating tools by name using the stored names
        self.agent.register_terminating_tool(done_tool_name).await;
        self.agent
            .register_terminating_tool(msg_clarifying_q_tool_name)
            .await;

        Ok(())
    }

    pub async fn new(
        user_id: Uuid,
        session_id: Uuid,
        is_follow_up: bool, // Add flag to determine initial prompt
    ) -> Result<Self> {
        let organization_id = match get_user_organization_id(&user_id).await {
            Ok(Some(org_id)) => org_id,
            Ok(None) => return Err(anyhow::anyhow!("User does not belong to any organization")),
            Err(e) => return Err(e),
        };

        let todays_date = Local::now().format("%Y-%m-%d").to_string();

        let dataset_names = get_dataset_names_for_organization(organization_id).await?;

        // Select initial default prompt based on whether it's a follow-up
        let initial_default_prompt = if is_follow_up {
            FOLLOW_UP_INTIALIZATION_PROMPT
                .replace("{DATASETS}", &dataset_names.join(", "))
                .replace("{TODAYS_DATE}", &todays_date)
        } else {
            INTIALIZATION_PROMPT
                .replace("{DATASETS}", &dataset_names.join(", "))
                .replace("{TODAYS_DATE}", &todays_date)
        };

        // Create agent, passing the selected initialization prompt as default
        let agent = Arc::new(Agent::new(
            "o3-mini".to_string(),
            user_id,
            session_id,
            "buster_multi_agent".to_string(),
            None,
            None,
            initial_default_prompt, // Use selected default prompt
        ));

        if is_follow_up {
            agent
                .set_state_value("is_follow_up".to_string(), Value::Bool(true))
                .await;
        }

        // Define prompt switching conditions
        let needs_plan_condition = move |state: &HashMap<String, Value>| -> bool {
            state.contains_key("data_context")
                && !state.contains_key("plan_available")
                && !is_follow_up
        };
        let needs_analysis_condition = |state: &HashMap<String, Value>| -> bool {
            // Example: Trigger analysis prompt once plan is available and metrics/dashboards are not yet available
            state.contains_key("plan_available") && state.contains_key("data_context")
        };
        let needs_data_catalog_search_condition = |state: &HashMap<String, Value>| -> bool {
            !state.contains_key("searched_data_catalog")
        };

        let needs_review_condition =
            |state: &HashMap<String, Value>| -> bool { state.contains_key("review_needed") };

        // Add prompt rules (order matters)
        // The agent will use the prompt associated with the first condition that evaluates to true.
        // If none match, it uses the default (INITIALIZATION_PROMPT).
        agent
            .add_dynamic_prompt_rule(needs_review_condition, REVIEW_PROMPT.to_string())
            .await;
        agent
            .add_dynamic_prompt_rule(
                needs_data_catalog_search_condition,
                DATA_CATALOG_SEARCH_PROMPT
                    .replace("{DATASETS}", &dataset_names.join(", "))
                    .to_string(),
            )
            .await;
        agent
            .add_dynamic_prompt_rule(
                needs_plan_condition,
                CREATE_PLAN_PROMPT
                    .replace("{TODAYS_DATE}", &todays_date)
                    .to_string(),
            )
            .await;
        agent
            .add_dynamic_prompt_rule(
                needs_analysis_condition,
                ANALYSIS_PROMPT
                    .replace("{TODAYS_DATE}", &todays_date)
                    .to_string(),
            )
            .await;

        // Add dynamic model rule: Use gpt-4.1 when searching the data catalog
        agent
            .add_dynamic_model_rule(
                needs_review_condition, // Reuse the same condition
                "gemini-2.0-flash-001".to_string(),
            )
            .await;
        agent
            .add_dynamic_model_rule(
                needs_data_catalog_search_condition, // Reuse the same condition
                "gpt-4.1".to_string(),
            )
            .await;

        let manager = Self { agent };
        manager.load_tools().await?; // Load tools with conditions
        Ok(manager)
    }

    pub async fn from_existing(existing_agent: &Arc<Agent>) -> Result<Self> {
        // Create a new agent instance using Agent::from_existing,
        // specifically setting the default prompt to the follow-up version.
        let agent = Arc::new(Agent::from_existing(
            existing_agent,
            "buster_super_agent".to_string(),
            FOLLOW_UP_INTIALIZATION_PROMPT.to_string(), // Explicitly use follow-up prompt
        ));

        // Re-apply prompt rules for the new agent instance
        let needs_plan_condition = move |state: &HashMap<String, Value>| -> bool {
            state.contains_key("data_context") && !state.contains_key("plan_available")
        };
        let needs_analysis_condition = |state: &HashMap<String, Value>| -> bool {
            state.contains_key("data_context") && state.contains_key("plan_available")
        };
        agent
            .add_dynamic_prompt_rule(needs_plan_condition, CREATE_PLAN_PROMPT.to_string())
            .await;
        agent
            .add_dynamic_prompt_rule(needs_analysis_condition, ANALYSIS_PROMPT.to_string())
            .await;

        let manager = Self { agent };
        manager.load_tools().await?; // Load tools with conditions for the new agent instance
        Ok(manager)
    }

    pub async fn run(
        &self,
        thread: &mut AgentThread,
    ) -> Result<broadcast::Receiver<Result<AgentMessage, AgentError>>> {
        self.get_agent()
            .set_state_value(
                "user_prompt".to_string(),
                Value::String(self.get_latest_user_message(thread).unwrap_or_default()),
            )
            .await;

        // Start processing (prompt is handled dynamically within process_thread_with_depth)
        let rx = self.stream_process_thread(thread).await?;

        Ok(rx)
    }

    /// Shutdown the manager agent and all its tools
    pub async fn shutdown(&self) -> Result<()> {
        self.get_agent().shutdown().await
    }

    /// Gets the most recent user message from the agent thread
    ///
    /// This function extracts the latest message with role "user" from the thread's messages.
    /// Returns None if no user messages are found.
    pub fn get_latest_user_message(&self, thread: &AgentThread) -> Option<String> {
        // Iterate through messages in reverse order to find the most recent user message
        for message in thread.messages.iter().rev() {
            if let AgentMessage::User { content, .. } = message {
                return Some(content.clone());
            }
        }
        None
    }
}
