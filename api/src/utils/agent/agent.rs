use crate::utils::{
    clients::ai::litellm::{ChatCompletionRequest, LiteLLMClient, Message, Tool},
    tools::ToolExecutor,
};
use anyhow::Result;
use serde_json::Value;
use std::{collections::HashMap, env, sync::Arc};
use tokio::sync::mpsc;
use serde::Serialize;

use super::types::AgentThread;

#[derive(Clone)]
/// The Agent struct is responsible for managing conversations with the LLM
/// and coordinating tool executions. It maintains a registry of available tools
/// and handles the recursive nature of tool calls.
pub struct Agent {
    /// Client for communicating with the LLM provider
    llm_client: LiteLLMClient,
    /// Registry of available tools, mapped by their names
    tools: Arc<HashMap<String, Box<dyn ToolExecutor<Output = Value>>>>,
    /// The model identifier to use (e.g., "gpt-4")
    model: String,
}

impl Agent {
    /// Create a new Agent instance with a specific LLM client and model
    pub fn new(
        model: String,
        tools: HashMap<String, Box<dyn ToolExecutor<Output = Value>>>,
    ) -> Self {
        let llm_api_key = env::var("LLM_API_KEY").expect("LLM_API_KEY must be set");
        let llm_base_url = env::var("LLM_BASE_URL").expect("LLM_API_BASE must be set");

        let llm_client = LiteLLMClient::new(Some(llm_api_key), Some(llm_base_url));

        Self {
            llm_client,
            tools: Arc::new(tools),
            model,
        }
    }

    /// Add a new tool with the agent
    ///
    /// # Arguments
    /// * `name` - The name of the tool, used to identify it in tool calls
    /// * `tool` - The tool implementation that will be executed
    pub fn add_tool(&mut self, name: String, tool: impl ToolExecutor<Output = Value> + 'static) {
        // Get a mutable reference to the HashMap inside the Arc
        Arc::get_mut(&mut self.tools)
            .expect("Failed to get mutable reference to tools")
            .insert(name, Box::new(tool));
    }

    /// Add multiple tools to the agent at once
    ///
    /// # Arguments
    /// * `tools` - HashMap of tool names and their implementations
    pub fn add_tools<E: ToolExecutor<Output = Value> + 'static>(
        &mut self,
        tools: HashMap<String, E>,
    ) {
        let tools_map = Arc::get_mut(&mut self.tools)
            .expect("Failed to get mutable reference to tools");
        for (name, tool) in tools {
            tools_map.insert(name, Box::new(tool));
        }
    }

    /// Process a thread of conversation, potentially executing tools and continuing
    /// the conversation recursively until a final response is reached.
    ///
    /// # Arguments
    /// * `thread` - The conversation thread to process
    ///
    /// # Returns
    /// * A Result containing the final Message from the assistant
    pub async fn process_thread(&self, thread: &AgentThread) -> Result<Message> {
        self.process_thread_with_depth(thread, 0).await
    }

    async fn process_thread_with_depth(&self, thread: &AgentThread, recursion_depth: u32) -> Result<Message> {
        if recursion_depth >= 30 {
            return Ok(Message::assistant(
                Some("I apologize, but I've reached the maximum number of actions (30). Please try breaking your request into smaller parts.".to_string()),
                None
            ));
        }

        // Collect all registered tools and their schemas
        let tools: Vec<Tool> = self
            .tools
            .iter()
            .map(|(name, tool)| Tool {
                tool_type: "function".to_string(),
                function: tool.get_schema(),
            })
            .collect();

        // Create the request to send to the LLM
        let request = ChatCompletionRequest {
            model: self.model.clone(),
            messages: thread.messages.clone(),
            tools: if tools.is_empty() { None } else { Some(tools) },
            ..Default::default()
        };

        // Get the response from the LLM
        let response = match self.llm_client.chat_completion(request).await {
            Ok(response) => response,
            Err(e) => return Err(anyhow::anyhow!("Error processing thread: {:?}", e)),
        };

        let llm_message = &response.choices[0].message;

        // Create the initial assistant message
        let message = match llm_message {
            Message::Assistant {
                content,
                tool_calls,
                ..
            } => Message::assistant(content.clone(), tool_calls.clone()),
            _ => return Err(anyhow::anyhow!("Expected assistant message from LLM")),
        };

        // If the LLM wants to use tools, execute them
        if let Message::Assistant {
            tool_calls: Some(tool_calls),
            ..
        } = &llm_message
        {
            let mut results = Vec::new();

            // Execute each requested tool
            for tool_call in tool_calls {
                if let Some(tool) = self.tools.get(&tool_call.function.name) {
                    let result = tool.execute(tool_call).await?;
                    let result_str = serde_json::to_string(&result)?;
                    results.push(Message::tool(result_str, tool_call.id.clone()));
                }
            }

            // Create a new thread with the tool results and continue recursively
            let mut new_thread = thread.clone();
            new_thread.messages.push(message);
            new_thread.messages.extend(results);

            Box::pin(self.process_thread_with_depth(&new_thread, recursion_depth + 1)).await
        } else {
            Ok(message)
        }
    }

    /// Process a thread of conversation with streaming responses
    ///
    /// # Arguments
    /// * `thread` - The conversation thread to process
    ///
    /// # Returns
    /// * A Result containing a receiver for streamed messages
    pub async fn stream_process_thread(
        &self,
        thread: &AgentThread,
    ) -> Result<mpsc::Receiver<Result<Message>>> {
        let (tx, rx) = mpsc::channel(100);
        let tools_ref = self.tools.clone();
        let model = self.model.clone();
        let llm_client = self.llm_client.clone();

        // Clone thread for task ownership
        let thread = thread.clone();

        tokio::spawn(async move {
            async fn process_stream_recursive(
                llm_client: &LiteLLMClient,
                model: &str,
                tools_ref: &Arc<HashMap<String, Box<dyn ToolExecutor<Output = Value>>>>,
                thread: &AgentThread,
                tx: &mpsc::Sender<Result<Message>>,
                recursion_depth: u32,
            ) -> Result<()> {
                if recursion_depth >= 30 {
                    let limit_message = Message::assistant(
                        Some("I apologize, but I've reached the maximum number of actions (30). Please try breaking your request into smaller parts.".to_string()),
                        None
                    );
                    let _ = tx.send(Ok(limit_message)).await;
                    return Ok(());
                }

                // Collect all registered tools and their schemas
                let tools: Vec<Tool> = tools_ref
                    .iter()
                    .map(|(name, tool)| Tool {
                        tool_type: "function".to_string(),
                        function: tool.get_schema(),
                    })
                    .collect();

                println!("DEBUG: Starting recursive stream with {} tools at depth {}", tools.len(), recursion_depth);

                // Create the request
                let request = ChatCompletionRequest {
                    model: model.to_string(),
                    messages: thread.messages.clone(),
                    tools: Some(tools),
                    stream: Some(true),
                    ..Default::default()
                };

                // Get streaming response
                let mut stream = llm_client.stream_chat_completion(request).await?;
                let mut pending_tool_calls = HashMap::new();
                let mut current_message = Message::assistant(None, None);
                let mut has_tool_calls = false;

                // Process stream chunks
                while let Some(chunk_result) = stream.recv().await {
                    match chunk_result {
                        Ok(chunk) => {
                            let delta = &chunk.choices[0].delta;

                            // Handle role changes
                            if let Some(role) = &delta.role {
                                match role.as_str() {
                                    "assistant" => {
                                        current_message = Message::assistant(None, None);
                                        let _ = tx.send(Ok(current_message.clone())).await;
                                    }
                                    _ => continue,
                                }
                            }

                            // Handle tool calls
                            if let Some(tool_calls) = &delta.tool_calls {
                                has_tool_calls = true;
                                for tool_call in tool_calls {
                                    println!("DEBUG: Tool call detected - ID: {}", tool_call.id);
                                    pending_tool_calls.insert(tool_call.id.clone(), tool_call.clone());
                                    
                                    // Update current message with tool calls
                                    if let Message::Assistant { tool_calls: ref mut msg_tool_calls, .. } = current_message {
                                        *msg_tool_calls = Some(pending_tool_calls.values().cloned().collect());
                                    }
                                    
                                    let _ = tx.send(Ok(current_message.clone())).await;
                                }
                            }

                            // Handle content updates
                            if let Some(content) = &delta.content {
                                match &mut current_message {
                                    Message::Assistant { content: msg_content, .. } => {
                                        *msg_content = Some(
                                            if let Some(existing) = msg_content {
                                                format!("{}{}", existing, content)
                                            } else {
                                                content.clone()
                                            }
                                        );
                                    }
                                    _ => {}
                                }
                                let _ = tx.send(Ok(current_message.clone())).await;
                            }
                        }
                        Err(e) => {
                            let _ = tx.send(Err(anyhow::Error::from(e))).await;
                            return Ok(());
                        }
                    }
                }

                // If we had tool calls, execute them and recurse
                if has_tool_calls {
                    println!("DEBUG: Processing {} tool calls recursively at depth {}", pending_tool_calls.len(), recursion_depth);
                    let mut tool_results = Vec::new();

                    // Execute all tools
                    for tool_call in pending_tool_calls.values() {
                        if let Some(tool) = tools_ref.get(&tool_call.function.name) {
                            match tool.execute(tool_call).await {
                                Ok(result) => {
                                    let result_str = serde_json::to_string(&result)?;
                                    let tool_result = Message::tool(result_str, tool_call.id.clone());
                                    tool_results.push(tool_result.clone());
                                    let _ = tx.send(Ok(tool_result)).await;
                                }
                                Err(e) => {
                                    let error_msg = format!("Tool execution failed: {:?}", e);
                                    let tool_error = Message::tool(error_msg, tool_call.id.clone());
                                    tool_results.push(tool_error.clone());
                                    let _ = tx.send(Ok(tool_error)).await;
                                }
                            }
                        }
                    }

                    // Create new thread with tool results
                    let mut new_thread = thread.clone();
                    new_thread.messages.push(current_message);
                    new_thread.messages.extend(tool_results);

                    // Recurse with new thread
                    Box::pin(process_stream_recursive(llm_client, model, tools_ref, &new_thread, tx, recursion_depth + 1)).await?;
                }

                Ok(())
            }

            // Start recursive processing
            if let Err(e) = process_stream_recursive(&llm_client, &model, &tools_ref, &thread, &tx, 0).await {
                let _ = tx.send(Err(e)).await;
            }
        });

        Ok(rx)
    }
}

#[cfg(test)]
mod tests {
    use crate::utils::clients::ai::litellm::ToolCall;

    use super::*;
    use axum::async_trait;
    use dotenv::dotenv;
    use serde_json::{json, Value};

    fn setup() {
        dotenv().ok();
    }

    struct WeatherTool;

    #[async_trait]
    impl ToolExecutor for WeatherTool {
        type Output = Value;

        async fn execute(&self, tool_call: &ToolCall) -> Result<Self::Output> {
            Ok(json!({
                "temperature": 20,
                "unit": "fahrenheit"
            }))
        }

        fn get_schema(&self) -> Value {
            json!({
                "name": "get_weather",
                "description": "Get current weather information for a specific location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "The city and state, e.g., San Francisco, CA"
                        },
                        "unit": {
                            "type": "string",
                            "enum": ["celsius", "fahrenheit"],
                            "description": "The temperature unit to use"
                        }
                    },
                    "required": ["location"]
                }
            })
        }

        fn get_name(&self) -> String {
            "get_weather".to_string()
        }
    }

    #[tokio::test]
    async fn test_agent_convo_no_tools() {
        setup();

        // Create LLM client and agent
        let agent = Agent::new("o1".to_string(), HashMap::new());

        let thread = AgentThread::new(None, vec![Message::user("Hello, world!".to_string())]);

        let response = match agent.process_thread(&thread).await {
            Ok(response) => response,
            Err(e) => panic!("Error processing thread: {:?}", e),
        };

        println!("Response: {:?}", response);
    }

    #[tokio::test]
    async fn test_agent_convo_with_tools() {
        setup();

        // Create LLM client and agent
        let mut agent = Agent::new("o1".to_string(), HashMap::new());

        let weather_tool = WeatherTool;

        agent.add_tool(weather_tool.get_name(), weather_tool);

        let thread = AgentThread::new(
            None,
            vec![Message::user(
                "What is the weather in vineyard ut?".to_string(),
            )],
        );

        let response = match agent.process_thread(&thread).await {
            Ok(response) => response,
            Err(e) => panic!("Error processing thread: {:?}", e),
        };

        println!("Response: {:?}", response);
    }

    #[tokio::test]
    async fn test_agent_with_multiple_steps() {
        setup();

        // Create LLM client and agent
        let mut agent = Agent::new("o1".to_string(), HashMap::new());

        let weather_tool = WeatherTool;

        agent.add_tool(weather_tool.get_name(), weather_tool);

        let thread = AgentThread::new(
            None,
            vec![Message::user(
                "What is the weather in vineyard ut and san francisco?".to_string(),
            )],
        );

        let response = match agent.process_thread(&thread).await {
            Ok(response) => response,
            Err(e) => panic!("Error processing thread: {:?}", e),
        };

        println!("Response: {:?}", response);
    }
}
