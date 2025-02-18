use anyhow::Result;
use litellm::{
    ChatCompletionRequest, DeltaFunctionCall, DeltaToolCall, FunctionCall, LiteLLMClient, Message,
    MessageProgress, Metadata, Tool, ToolCall, ToolChoice,
};
use serde::Serialize;
use serde_json::Value;
use std::{collections::HashMap, env, sync::Arc};
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::utils::tools::ToolExecutor;

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
        let tools_map =
            Arc::get_mut(&mut self.tools).expect("Failed to get mutable reference to tools");
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
    pub async fn process_thread(
        &self,
        thread: &AgentThread,
    ) -> Result<Message> {
        self.process_thread_with_depth(thread, 0)
            .await
    }

    async fn process_thread_with_depth(
        &self,
        thread: &AgentThread,
        recursion_depth: u32,
    ) -> Result<Message> {
        if recursion_depth >= 30 {
            return Ok(Message::assistant(
                Some("max_recursion_depth_message".to_string()),
                Some("I apologize, but I've reached the maximum number of actions (30). Please try breaking your request into smaller parts.".to_string()),
                None,
                None,
                None,
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

        // Create the tool-enabled request
        let request = ChatCompletionRequest {
            model: self.model.clone(),
            messages: thread.messages.clone(),
            tools: if tools.is_empty() { None } else { Some(tools) },
            tool_choice: Some(ToolChoice::Required),
            metadata: Some(Metadata {
                generation_name: "agent".to_string(),
                user_id: thread.user_id.to_string(),
                session_id: thread.id.to_string(),
            }),
            ..Default::default()
        };

        // Get the response from the LLM
        let response = match self.llm_client.chat_completion(request).await {
            Ok(response) => response,
            Err(e) => return Err(anyhow::anyhow!("Error processing thread: {:?}", e)),
        };

        let llm_message = &response.choices[0].message;

        // Create the assistant message
        let message = match llm_message {
            Message::Assistant {
                content,
                tool_calls,
                ..
            } => Message::assistant(None, content.clone(), tool_calls.clone(), None, None),
            _ => return Err(anyhow::anyhow!("Expected assistant message from LLM")),
        };

        // If this is an auto response without tool calls, it means we're done
        if let Message::Assistant {
            tool_calls: None, ..
        } = &llm_message
        {
            return Ok(message);
        }

        // If the LLM wants to use tools, execute them and continue
        if let Message::Assistant {
            tool_calls: Some(tool_calls),
            ..
        } = &llm_message
        {
            let mut results = Vec::new();

            // Execute each requested tool
            for tool_call in tool_calls {
                if let Some(tool) = self.tools.get(&tool_call.function.name) {
                    let result = tool.execute(tool_call, &thread.user_id, &thread.id).await?;
                    let result_str = serde_json::to_string(&result)?;
                    results.push(Message::tool(
                        None,
                        result_str,
                        tool_call.id.clone(),
                        Some(tool_call.function.name.clone()),
                        None,
                    ));
                }
            }

            // Create a new thread with the tool results and continue recursively
            let mut new_thread = thread.clone();
            new_thread.messages.push(message);
            new_thread.messages.extend(results);

            Box::pin(self.process_thread_with_depth(&new_thread, recursion_depth + 1))
                .await
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
                        Some("max_recursion_depth_message".to_string()),
                        Some("I apologize, but I've reached the maximum number of actions (30). Please try breaking your request into smaller parts.".to_string()),
                        None,
                        None,
                        None,
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

                // Create the tool-enabled request
                let request = ChatCompletionRequest {
                    model: model.to_string(),
                    messages: thread.messages.clone(),
                    tools: if tools.is_empty() { None } else { Some(tools) },
                    tool_choice: Some(ToolChoice::Required),
                    stream: Some(true),
                    metadata: Some(Metadata {
                        generation_name: "agent".to_string(),
                        user_id: thread.user_id.to_string(),
                        session_id: thread.id.to_string(),
                    }),
                    ..Default::default()
                };

                // Get streaming response
                let mut stream = llm_client.stream_chat_completion(request).await?;
                let mut current_message =
                    Message::assistant(None, Some(String::new()), None, None, None);
                let mut current_pending_tool: Option<PendingToolCall> = None;
                let mut has_tool_calls = false;
                let mut tool_results = Vec::new();
                let mut first_tool_message_sent = false;

                // Process stream chunks
                while let Some(chunk_result) = stream.recv().await {
                    match chunk_result {
                        Ok(chunk) => {
                            current_message.set_id(chunk.id.clone());

                            let delta = &chunk.choices[0].delta;

                            // Check for tool call completion
                            if let Some(finish_reason) = &chunk.choices[0].finish_reason {
                                if finish_reason == "tool_calls" {
                                    has_tool_calls = true;
                                    // Tool call is complete - execute it
                                    if let Some(pending) = current_pending_tool.take() {
                                        let tool_call = pending.into_tool_call();

                                        // Create and preserve the assistant message with the tool call
                                        let is_first = !first_tool_message_sent;
                                        first_tool_message_sent = true;

                                        let assistant_tool_message = Message::assistant(
                                            Some(chunk.id.clone()),
                                            None,
                                            Some(vec![tool_call.clone()]),
                                            Some(MessageProgress::Complete),
                                            Some(is_first),
                                        );
                                        let _ = tx.send(Ok(assistant_tool_message.clone())).await;

                                        // Execute the tool
                                        if let Some(tool) = tools_ref.get(&tool_call.function.name)
                                        {
                                            match tool
                                                .execute(&tool_call, &thread.user_id, &thread.id)
                                                .await
                                            {
                                                Ok(result) => {
                                                    let result_str =
                                                        serde_json::to_string(&result)?;
                                                    let tool_result = Message::tool(
                                                        Some(chunk.id.clone()),
                                                        result_str,
                                                        tool_call.id.clone(),
                                                        Some(tool_call.function.name.clone()),
                                                        Some(MessageProgress::Complete),
                                                    );
                                                    let _ = tx.send(Ok(tool_result.clone())).await;

                                                    // Store both the assistant tool message and the tool result
                                                    tool_results.push(assistant_tool_message);
                                                    tool_results.push(tool_result);
                                                }
                                                Err(e) => {
                                                    let error_msg =
                                                        format!("Tool execution failed: {:?}", e);
                                                    let tool_error = Message::tool(
                                                        Some(chunk.id.clone()),
                                                        error_msg,
                                                        tool_call.id.clone(),
                                                        Some(tool_call.function.name.clone()),
                                                        Some(MessageProgress::Complete),
                                                    );
                                                    let _ = tx.send(Ok(tool_error.clone())).await;

                                                    // Store both the assistant tool message and the error
                                                    tool_results.push(assistant_tool_message);
                                                    tool_results.push(tool_error);
                                                }
                                            }
                                        }
                                    }
                                    continue;
                                }
                            }

                            // Handle content updates - only send if we have actual content
                            if let Some(content) = &delta.content {
                                if !content.trim().is_empty() {
                                    if let Message::Assistant {
                                        content: msg_content,
                                        ..
                                    } = &mut current_message
                                    {
                                        if let Some(existing) = msg_content {
                                            existing.push_str(content);
                                        }
                                    }
                                    let _ = tx
                                        .send(Ok(Message::assistant(
                                            Some(chunk.id.clone()),
                                            Some(content.clone()),
                                            None,
                                            Some(MessageProgress::InProgress),
                                            None,
                                        )))
                                        .await;
                                }
                            }

                            // Handle tool calls - only send when we have meaningful tool call data
                            if let Some(tool_calls) = &delta.tool_calls {
                                has_tool_calls = true;

                                if current_pending_tool.is_none() {
                                    current_pending_tool = Some(PendingToolCall::new());
                                }

                                if let Some(pending) = &mut current_pending_tool {
                                    for tool_call in tool_calls {
                                        pending.update_from_delta(tool_call);

                                        // Send an update if we have a name, regardless of arguments
                                        if let Some(name) = &pending.function_name {
                                            let temp_tool_call = ToolCall {
                                                id: pending.id.clone().unwrap_or_default(),
                                                function: FunctionCall {
                                                    name: name.clone(),
                                                    arguments: pending.arguments.clone(),
                                                },
                                                call_type: pending
                                                    .call_type
                                                    .clone()
                                                    .unwrap_or_default(),
                                                code_interpreter: None,
                                                retrieval: None,
                                            };

                                            let is_first = !first_tool_message_sent;
                                            first_tool_message_sent = true;

                                            let _ = tx
                                                .send(Ok(Message::assistant(
                                                    Some(chunk.id.clone()),
                                                    None,
                                                    Some(vec![temp_tool_call]),
                                                    Some(MessageProgress::InProgress),
                                                    Some(is_first),
                                                )))
                                                .await;
                                        }
                                    }
                                }
                            }

                            // Check for completion
                            if let Some(finish_reason) = &chunk.choices[0].finish_reason {
                                if finish_reason == "stop" {
                                    if let Message::Assistant {
                                        content: Some(content),
                                        ..
                                    } = &current_message
                                    {
                                        if !content.trim().is_empty() {
                                            let _ = tx
                                                .send(Ok(Message::assistant(
                                                    Some(chunk.id.clone()),
                                                    Some(content.clone()),
                                                    None,
                                                    Some(MessageProgress::Complete),
                                                    None,
                                                )))
                                                .await;
                                        }
                                    }
                                    // If this was a content-only message, stop recursion
                                    if !has_tool_calls {
                                        return Ok(());
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            let _ = tx.send(Err(anyhow::Error::from(e))).await;
                            return Ok(());
                        }
                    }
                }

                // If we have tool calls, create new thread and recurse
                if has_tool_calls {
                    // Create new thread with tool results and recurse
                    let mut new_thread = thread.clone();
                    // Only include current_message if it has content
                    if let Message::Assistant {
                        content: Some(content),
                        ..
                    } = &current_message
                    {
                        if !content.trim().is_empty() {
                            new_thread.messages.push(current_message);
                        }
                    }
                    new_thread.messages.extend(tool_results);

                    // Recurse with new thread
                    Box::pin(process_stream_recursive(
                        llm_client,
                        model,
                        tools_ref,
                        &new_thread,
                        tx,
                        recursion_depth + 1,
                    ))
                    .await?;
                }

                Ok(())
            }

            // Start recursive processing
            if let Err(e) =
                process_stream_recursive(&llm_client, &model, &tools_ref, &thread, &tx, 0).await
            {
                let _ = tx.send(Err(e)).await;
            }
        });

        Ok(rx)
    }
}

#[derive(Debug, Default)]
struct PendingToolCall {
    id: Option<String>,
    call_type: Option<String>,
    function_name: Option<String>,
    arguments: String,
    code_interpreter: Option<Value>,
    retrieval: Option<Value>,
}

impl PendingToolCall {
    fn new() -> Self {
        Self::default()
    }

    fn update_from_delta(&mut self, tool_call: &DeltaToolCall) {
        if let Some(id) = &tool_call.id {
            self.id = Some(id.clone());
        }
        if let Some(call_type) = &tool_call.call_type {
            self.call_type = Some(call_type.clone());
        }
        if let Some(function) = &tool_call.function {
            if let Some(name) = &function.name {
                self.function_name = Some(name.clone());
            }
            if let Some(args) = &function.arguments {
                self.arguments.push_str(args);
            }
        }
        if let Some(code_interpreter) = &tool_call.code_interpreter {
            self.code_interpreter = None;
        }
        if let Some(retrieval) = &tool_call.retrieval {
            self.retrieval = None;
        }
    }

    fn into_tool_call(self) -> ToolCall {
        ToolCall {
            id: self.id.unwrap_or_default(),
            function: FunctionCall {
                name: self.function_name.unwrap_or_default(),
                arguments: self.arguments,
            },
            call_type: self.call_type.unwrap_or_default(),
            code_interpreter: None,
            retrieval: None,
        }
    }
}

#[cfg(test)]
mod tests {
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

        async fn execute(&self, tool_call: &ToolCall, user_id: &Uuid, session_id: &Uuid) -> Result<Self::Output> {
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

        let thread = AgentThread::new(None, Uuid::new_v4(), vec![Message::user("Hello, world!".to_string())]);

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
            Uuid::new_v4(),
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
            Uuid::new_v4(),
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
