use crate::utils::{
    clients::ai::litellm::{ChatCompletionRequest, LiteLLMClient, Message, Tool},
    tools::ToolExecutor,
};
use anyhow::Result;
use serde_json::Value;
use std::{collections::HashMap, env};
use tokio::sync::mpsc;
use serde::Serialize;

use super::types::AgentThread;

/// The Agent struct is responsible for managing conversations with the LLM
/// and coordinating tool executions. It maintains a registry of available tools
/// and handles the recursive nature of tool calls.
pub struct Agent {
    /// Client for communicating with the LLM provider
    llm_client: LiteLLMClient,
    /// Registry of available tools, mapped by their names
    tools: HashMap<String, Box<dyn ToolExecutor<Output = Value>>>,
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
            tools,
            model,
        }
    }

    /// Add a new tool with the agent
    ///
    /// # Arguments
    /// * `name` - The name of the tool, used to identify it in tool calls
    /// * `tool` - The tool implementation that will be executed
    pub fn add_tool(&mut self, name: String, tool: impl ToolExecutor<Output = Value> + 'static) {
        self.tools.insert(name, Box::new(tool));
    }

    /// Add multiple tools to the agent at once
    ///
    /// # Arguments
    /// * `tools` - HashMap of tool names and their implementations
    pub fn add_tools<E: ToolExecutor<Output = Value> + 'static>(
        &mut self,
        tools: HashMap<String, E>,
    ) {
        for (name, tool) in tools {
            self.tools.insert(name, Box::new(tool));
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

            Box::pin(self.process_thread(&new_thread)).await
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
        // Collect all registered tools and their schemas
        let tools: Vec<Tool> = self
            .tools
            .iter()
            .map(|(name, tool)| Tool {
                tool_type: "function".to_string(),
                function: tool.get_schema(),
            })
            .collect();

        println!("DEBUG: Starting stream_process_thread with {} tools", tools.len());
        println!("DEBUG: Tools registered: {:?}", tools);

        // Create the request to send to the LLM
        let request = ChatCompletionRequest {
            model: self.model.clone(),
            messages: thread.messages.clone(),
            tools: Some(tools),
            stream: Some(true),
            ..Default::default()
        };

        println!("DEBUG: Created chat completion request with model: {}", self.model);

        // Get the streaming response from the LLM
        let mut stream = self.llm_client.stream_chat_completion(request).await?;
        let (tx, rx) = mpsc::channel(100);
        let mut pending_tool_calls = HashMap::new();

        // Clone the tools map for use in the spawned task
        let tools_for_execution = self.tools.clone();

        println!("DEBUG: Stream initialized, starting processing task");

        // Process the stream in a separate task
        tokio::spawn(async move {
            let mut current_message = Message::assistant(None, None);

            while let Some(chunk_result) = stream.recv().await {
                println!("DEBUG: Received new stream chunk");
                match chunk_result {
                    Ok(chunk) => {
                        let delta = &chunk.choices[0].delta;
                        println!("DEBUG: Processing delta: {:?}", delta);

                        // Handle role changes
                        if let Some(role) = &delta.role {
                            println!("DEBUG: Role change detected: {}", role);
                            match role.as_str() {
                                "assistant" => {
                                    current_message = Message::assistant(None, None);
                                    println!("DEBUG: Reset current_message for assistant");
                                }
                                "tool" => {
                                    println!("DEBUG: Tool role detected, waiting for content");
                                    continue;
                                }
                                _ => continue,
                            }
                        }

                        // Handle tool calls (tool execution start)
                        if let Some(tool_calls) = &delta.tool_calls {
                            println!("DEBUG: Processing {} tool calls", tool_calls.len());
                            for tool_call in tool_calls {
                                println!("DEBUG: Tool call detected - ID: {}, Name: {}", 
                                    tool_call.id, 
                                    tool_call.function.name);
                                
                                // Store or update the tool call
                                pending_tool_calls.insert(tool_call.id.clone(), tool_call.clone());
                                
                                // Check if this tool call is complete and ready for execution
                                if let Some(complete_tool_call) = pending_tool_calls.get(&tool_call.id) {
                                    if let Some(tool) = tools_for_execution.get(&complete_tool_call.function.name) {
                                        println!("DEBUG: Executing tool: {}", complete_tool_call.function.name);
                                        
                                        // Execute the tool
                                        match tool.execute(complete_tool_call).await {
                                            Ok(result) => {
                                                let result_str = serde_json::to_string(&result)
                                                    .unwrap_or_else(|e| format!("Error serializing result: {}", e));
                                                println!("DEBUG: Tool execution successful: {}", result_str);
                                                
                                                // Send tool result message
                                                let tool_result_msg = Message::tool(
                                                    result_str,
                                                    complete_tool_call.id.clone(),
                                                );
                                                let _ = tx.send(Ok(tool_result_msg)).await;
                                            }
                                            Err(e) => {
                                                println!("DEBUG: Tool execution failed: {:?}", e);
                                                let error_msg = format!("Tool execution failed: {:?}", e);
                                                let tool_error_msg = Message::tool(
                                                    error_msg,
                                                    complete_tool_call.id.clone(),
                                                );
                                                let _ = tx.send(Ok(tool_error_msg)).await;
                                            }
                                        }
                                        
                                        // Remove the executed tool call
                                        pending_tool_calls.remove(&tool_call.id);
                                    }
                                }

                                // Send the tool start message
                                let tool_start_msg = Message::assistant(None, Some(vec![tool_call.clone()]));
                                let _ = tx.send(Ok(tool_start_msg)).await;
                            }
                        }

                        // Handle content updates
                        if let Some(content) = &delta.content {
                            println!("DEBUG: Content update received: {}", content);
                            match &mut current_message {
                                Message::Assistant { content: msg_content, tool_calls, .. } => {
                                    *msg_content = Some(if let Some(existing) = msg_content {
                                        let combined = format!("{}{}", existing, content);
                                        println!("DEBUG: Updated assistant content: {}", combined);
                                        combined
                                    } else {
                                        println!("DEBUG: New assistant content: {}", content);
                                        content.clone()
                                    });
                                }
                                Message::Tool { content: msg_content, .. } => {
                                    println!("DEBUG: Updating tool content: {}", content);
                                    *msg_content = content.clone();
                                }
                                _ => {}
                            }
                            let _ = tx.send(Ok(current_message.clone())).await;
                        }
                    }
                    Err(e) => {
                        println!("DEBUG: Error processing stream chunk: {:?}", e);
                        let _ = tx.send(Err(anyhow::Error::from(e))).await;
                    }
                }
            }
            println!("DEBUG: Stream processing completed");
        });

        println!("DEBUG: Returning stream receiver");
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
