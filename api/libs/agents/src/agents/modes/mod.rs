use anyhow::Result;
use std::collections::HashMap;
use serde_json::Value;
use std::sync::Arc;
use std::pin::Pin;
use std::future::Future;
use crate::Agent; // Assuming Agent is accessible at this path

pub mod analysis;
pub mod data_catalog_search;
pub mod follow_up_initialization;
pub mod initialization;
pub mod planning;
pub mod review;

// Renaming from the attached file listing for clarity
// pub use analysis::AgentState as AnalysisAgentState;
// pub use data_catalog_search::AgentState as DataCatalogSearchAgentState;

// --- Shared Mode Structures ---

/// Data required by different modes to generate their configuration.
#[derive(Clone)] // Cloneable if needed to pass around easily
pub struct ModeAgentData {
   pub dataset_names: Arc<Vec<String>>,
   pub todays_date: Arc<String>,
   // Add other shared data if needed by modes, e.g., user_id, session_id if not in Agent state
}

/// Configuration specific to an agent mode.
pub struct ModeConfiguration {
    /// The system prompt to use for the LLM call in this mode.
    pub prompt: String,
    /// The specific LLM model identifier (e.g., "o3-mini") to use for this mode.
    pub model: String,
    /// An async function/closure responsible for clearing existing tools
    /// and loading the specific tools required for this mode onto the agent.
    pub tool_loader: Box<dyn Fn(&Arc<Agent>) -> Pin<Box<dyn Future<Output = Result<()>> + Send>> + Send + Sync>,
    /// A list of tool names that, upon successful execution in this mode,
    /// should terminate the agent's processing loop.
    pub terminating_tools: Vec<String>,
}


// --- Agent State Definition and Determination ---
// It's better to have a single unified AgentState enum if possible.
// Moving the definition from buster_multi_agent.rs here seems appropriate.

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum AgentState {
    Initializing,
    FollowUpInitialization,
    DataCatalogSearch,
    Planning,
    AnalysisExecution,
    Review,
}

// Moving the state determination logic here as well.
// This function determines the *logical* state the agent should be in based on its memory.
pub fn determine_agent_state(state: &HashMap<String, Value>) -> AgentState {
    let is_follow_up = state
        .get("is_follow_up")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    let searched_catalog = state
        .get("searched_data_catalog")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    // Let's refine this: check if data_context has meaningful content, not just if key exists
    let has_data_context = state.get("data_context").map_or(false, |v| !v.is_null() && (!v.is_string() || !v.as_str().unwrap_or("").is_empty()));
    let has_plan = state.get("plan_available").and_then(Value::as_bool).unwrap_or(false); // Check if plan is marked available
    let needs_review = state
        .get("review_needed")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let has_user_prompt = state.contains_key("user_prompt"); // Check if latest user prompt is stored


    // Initial state determination is tricky - depends when this is called relative to receiving the first user message.
    // Assuming this is called *after* the first user message is added to the state.
    if is_follow_up {
        // Follow-up specific flow
        if !has_user_prompt { // If this is the very start of a follow-up *before* user speaks
             return AgentState::FollowUpInitialization;
        }
        // Now assume user has spoken in this follow-up turn
        if needs_review { AgentState::Review }
        else if !searched_catalog && !has_data_context { AgentState::DataCatalogSearch } // Need to search if no context yet
        else if has_data_context && !has_plan { AgentState::Planning }
        else if has_data_context && has_plan { AgentState::AnalysisExecution }
        else { AgentState::FollowUpInitialization } // Fallback for follow-up if state is unclear

    } else {
        // Initial conversation flow
        if !has_user_prompt { // If this is the very start *before* user speaks
            return AgentState::Initializing;
        }
        // Now assume user has spoken
        if needs_review { AgentState::Review }
        else if !searched_catalog { AgentState::DataCatalogSearch }
        else if has_data_context && !has_plan { AgentState::Planning }
        else if has_data_context && has_plan { AgentState::AnalysisExecution }
         else { AgentState::Initializing } // Fallback for initial if state is unclear
    }

    // Original logic kept for reference:
    // // Initial state checks should happen first
    // if !has_user_prompt && !is_follow_up {
    //     return AgentState::Initializing; // Haven't even received the first real prompt
    // }
    // if !has_user_prompt && is_follow_up {
    //     return AgentState::FollowUpInitialization; // Follow up state before first turn
    // }

    // // Subsequent state logic
    // if needs_review {
    //     AgentState::Review
    // } else if !searched_catalog {
    //     // If we haven't searched the catalog, we're in the initial search phase
    //     // unless it's a follow-up, where we might skip straight to planning/analysis
    //     // if context already exists from the previous run.
    //     if is_follow_up && has_data_context {
    //         if has_plan {
    //             AgentState::AnalysisExecution // Follow-up with context and plan -> Analysis
    //         } else {
    //             AgentState::Planning // Follow-up with context but no plan -> Planning
    //         }
    //     } else {
    //         AgentState::DataCatalogSearch
    //     }
    // } else if has_data_context && !has_plan {
    //     // After search, if we have context but no plan, we plan.
    //     // This covers both initial runs and follow-ups that gain context but need a plan.
    //     AgentState::Planning
    // } else if has_data_context && has_plan {
    //     // With context and a plan, we execute analysis/actions.
    //     AgentState::AnalysisExecution
    // } else if is_follow_up {
    //     // Default follow-up state if other conditions aren't met yet (e.g., post-search, no context yet)
    //     AgentState::FollowUpInitialization
    // } else {
    //     // Default initial state if other conditions aren't met (e.g., post-search, no context yet)
    //     AgentState::Initializing
    // }
}