use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

use crate::{agent::Agent, tools::ToolExecutor};

#[derive(Debug, Serialize, Deserialize)]
pub struct ReviewPlanOutput {
    pub success: bool,
    pub todos: String,
}

#[derive(Debug, Deserialize)]
pub struct ReviewPlanInput {
    pub todo_item: usize, // 0-based index
}

pub struct ReviewPlan {
    agent: Arc<Agent>,
}

impl ReviewPlan {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for ReviewPlan {
    type Output = ReviewPlanOutput;
    type Params = ReviewPlanInput;

    fn get_name(&self) -> String {
        "review_plan".to_string()
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output> {
        // Get the current todos from state
        let mut todos = match self.agent.get_state_value("todos").await {
            Some(Value::Array(arr)) => arr,
            _ => {
                return Err(anyhow::anyhow!("Could not find 'todos' in agent state or it's not an array."));
            }
        };

        let idx = params.todo_item;
        if idx >= todos.len() {
            return Err(anyhow::anyhow!("todo_item index {} out of range ({} todos)", idx, todos.len()));
        }

        // Mark the todo at the given index as complete
        if let Some(Value::Object(map)) = todos.get_mut(idx) {
            map.insert("completed".to_string(), Value::Bool(true));
        } else {
            return Err(anyhow::anyhow!("Todo item at index {} is not a valid object.", idx));
        }

        // Save the updated todos back to state
        self.agent.set_state_value("todos".to_string(), Value::Array(todos.clone())).await; // Clone needed for iteration below

        // Format the output string
        let todos_string = todos.iter()
            .map(|todo_val| {
                if let Value::Object(map) = todo_val {
                    let completed = map.get("completed").and_then(Value::as_bool).unwrap_or(false);
                    let todo_text = map.get("todo").and_then(Value::as_str).unwrap_or("Invalid todo text");
                    format!("[{}] {}", if completed { "x" } else { " " }, todo_text)
                } else {
                    "Invalid todo item format".to_string()
                }
            })
            .collect::<Vec<_>>()
            .join("\n");

        Ok(ReviewPlanOutput { success: true, todos: todos_string })
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Marks a task as complete by its index in the to-do list.",
            "parameters": {
                "type": "object",
                "properties": {
                    "todo_item": {
                        "type": "integer",
                        "description": "The 0-based index of the task to mark as complete (0 is the first item).",
                        "minimum": 0
                    }
                },
                "required": ["todo_item"]
            }
        })
    }
}
