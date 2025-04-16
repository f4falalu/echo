use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use crate::tools::ToolExecutor;
use crate::Agent; // For get_name()

// Import necessary types from the parent module (modes/mod.rs)
use super::{ModeAgentData, ModeConfiguration};

// Import necessary tools for this mode
use crate::tools::{
    categories::response_tools::{Done, MessageUserClarifyingQuestion},
    planning_tools::ReviewPlan,
    IntoToolCallExecutor,
};

// Function to get the configuration for the Review mode
pub fn get_configuration(_agent_data: &ModeAgentData) -> ModeConfiguration {
    // 1. Get the prompt (doesn't need formatting for this mode)
    let prompt = REVIEW_PROMPT.to_string();

    // 2. Define the model for this mode (From original MODEL const)
    let model = "gemini-2.0-flash-001".to_string();

    // 3. Define the tool loader closure
    let tool_loader: Box<
        dyn Fn(&Arc<Agent>) -> Pin<Box<dyn Future<Output = Result<()>> + Send>> + Send + Sync,
    > = Box::new(|agent_arc: &Arc<Agent>| {
        let agent_clone = Arc::clone(agent_arc); // Clone Arc for the async block
        Box::pin(async move {
            // Clear existing tools before loading mode-specific ones
            agent_clone.clear_tools().await;

            // Instantiate tools for this mode
            let review_tool = ReviewPlan::new(agent_clone.clone());
            let done_tool = Done::new(agent_clone.clone());

            // Condition (always true for this mode's tools)
            let condition = Some(|_state: &HashMap<String, Value>| -> bool { true });

            // Add tools to the agent
            agent_clone
                .add_tool(
                    review_tool.get_name(),
                    review_tool.into_tool_call_executor(),
                    condition.clone(),
                )
                .await;

            agent_clone
                .add_tool(
                    done_tool.get_name(),
                    done_tool.into_tool_call_executor(),
                    condition.clone(),
                )
                .await;

            Ok(())
        })
    });

    // 4. Define terminating tools for this mode (From original load_tools)
    let terminating_tools = vec![Done::get_name()];

    // 5. Construct and return the ModeConfiguration
    ModeConfiguration {
        prompt,
        model,
        tool_loader,
        terminating_tools,
    }
}

// Keep the prompt constant, but it's no longer pub
const REVIEW_PROMPT: &str = r##"
Role & Task
You are Buster, an expert analytics and data engineer. In this "review" mode, your only responsibility is to evaluate a to-do list from the workflow and check off tasks that have been completed. You do not create or analyze anything—just assess and track progress.

Workflow Summary

Review the to-do list to see the tasks that need to be checked.
Check off completed tasks:
For each task that is done, use the review_plan tool with the task's index (todo_item, an integer starting from 1) to mark it as complete.
If a task isn't done, leave it unchecked.


Finish up:
When all tasks are reviewed (checked or not), use the done tool to send a final response to the user summarizing what's complete and what's not.




Tool Calling
You have two tools to do your job:

review_plan: Marks a task as complete. Needs todo_item (an integer) to specify which task (starts at 1).
done: Marks all remaining unfinished tasks as complete, sends the final response to the user, and ends the workflow. Typically, you should only use this tool when one unfinished task remains.

Follow these rules:

Use tools for everything—no direct replies allowed.
Stick to the exact tool format with all required details.
Only use these two tools, nothing else.
Don't mention tool names in your explanations (e.g., say "I marked the task as done" instead of naming the tool).
Don't ask questions—if something's unclear, assume based on what you've got.


Guidelines

Keep it simple: Just check what's done and move on.
Be accurate: Only mark tasks that are actually complete.
Summarize clearly: In the final response, list what's finished and what's still pending in plain language.


Final Response Guidelines
When using the done tool:

Use simple, friendly language anyone can understand.
Say what's done and what's not, keeping it short and clear.
Use "I" (e.g., "I marked three tasks as done").
Use markdown for lists if it helps.
Don't use technical terms or mention tools.


Keep going until you've reviewed every task on the list. Don't stop until you're sure everything's checked or noted as pending, then use the done tool to wrap it up. If you're unsure about a task, assume it's not done unless you have clear evidence otherwise—don't guess randomly.

"##;
