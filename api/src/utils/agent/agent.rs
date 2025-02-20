use anyhow::Result;
use litellm::{
    ChatCompletionRequest, DeltaToolCall, FunctionCall, LiteLLMClient, Message, Metadata, Tool,
    ToolCall, ToolChoice,
};
use serde_json::Value;
use std::{collections::HashMap, env, sync::Arc};
use tokio::sync::{mpsc, RwLock};

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
    /// Flexible state storage for maintaining memory across interactions
    state: Arc<RwLock<HashMap<String, Value>>>,
    /// The current thread being processed, if any
    current_thread: Arc<RwLock<Option<AgentThread>>>,
    /// Sender for streaming messages from this agent and sub-agents
    stream_tx: Arc<RwLock<mpsc::Sender<Result<Message>>>>,
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

        // Create a default channel that just drops messages
        let (tx, _rx) = mpsc::channel(1);

        Self {
            llm_client,
            tools: Arc::new(tools),
            model,
            state: Arc::new(RwLock::new(HashMap::new())),
            current_thread: Arc::new(RwLock::new(None)),
            stream_tx: Arc::new(RwLock::new(tx)),
        }
    }

    /// Update the stream sender for this agent
    pub async fn set_stream_sender(&self, tx: mpsc::Sender<Result<Message>>) {
        *self.stream_tx.write().await = tx;
    }

    /// Get a clone of the current stream sender
    pub async fn get_stream_sender(&self) -> mpsc::Sender<Result<Message>> {
        self.stream_tx.read().await.clone()
    }

    /// Get a value from the agent's state by key
    pub async fn get_state_value(&self, key: &str) -> Option<Value> {
        self.state.read().await.get(key).cloned()
    }

    /// Set a value in the agent's state
    pub async fn set_state_value(&self, key: String, value: Value) {
        self.state.write().await.insert(key, value);
    }

    /// Update multiple state values at once using a closure
    pub async fn update_state<F>(&self, f: F)
    where
        F: FnOnce(&mut HashMap<String, Value>),
    {
        let mut state = self.state.write().await;
        f(&mut state);
    }

    /// Clear all state values
    pub async fn clear_state(&self) {
        self.state.write().await.clear();
    }

    /// Get the current thread being processed, if any
    pub async fn get_current_thread(&self) -> Option<AgentThread> {
        self.current_thread.read().await.clone()
    }

    /// Get the complete conversation history of the current thread
    pub async fn get_conversation_history(&self) -> Option<Vec<Message>> {
        self.current_thread
            .read()
            .await
            .as_ref()
            .map(|thread| thread.messages.clone())
    }

    /// Update the current thread with a new message
    async fn update_current_thread(&self, message: Message) -> Result<()> {
        let mut thread_lock = self.current_thread.write().await;
        if let Some(thread) = thread_lock.as_mut() {
            thread.messages.push(message);
        }
        Ok(())
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
    /// This is a convenience wrapper around process_thread_streaming that collects
    /// all streamed messages into a final response.
    ///
    /// # Arguments
    /// * `thread` - The conversation thread to process
    ///
    /// # Returns
    /// * A Result containing the final Message from the assistant
    pub async fn process_thread(&self, thread: &AgentThread) -> Result<Message> {
        let mut rx = self.process_thread_streaming(thread).await?;

        let mut final_message = None;
        while let Some(msg) = rx.recv().await {
            final_message = Some(msg?);
        }

        final_message.ok_or_else(|| anyhow::anyhow!("No messages received from processing"))
    }

    /// Process a thread of conversation with streaming responses. This is the primary
    /// interface for processing conversations.
    ///
    /// # Arguments
    /// * `thread` - The conversation thread to process
    ///
    /// # Returns
    /// * A Result containing a receiver for streamed messages
    pub async fn process_thread_streaming(
        &self,
        thread: &AgentThread,
    ) -> Result<mpsc::Receiver<Result<Message>>> {
        // Create new channel for this processing session
        let (tx, rx) = mpsc::channel(100);
        self.set_stream_sender(tx).await;

        // Spawn the processing task
        let agent_clone = self.clone();
        let thread_clone = thread.clone();

        tokio::spawn(async move {
            if let Err(e) = agent_clone
                .process_thread_with_depth(&thread_clone, 0)
                .await
            {
                let err_msg = format!("Error processing thread: {:?}", e);
                let _ = agent_clone.get_stream_sender().await.send(Err(e)).await;
            }
        });

        Ok(rx)
    }

    async fn process_thread_with_depth(
        &self,
        thread: &AgentThread,
        recursion_depth: u32,
    ) -> Result<()> {
        // Set the initial thread
        {
            let mut current = self.current_thread.write().await;
            *current = Some(thread.clone());
        }

        if recursion_depth >= 30 {
            let message = Message::assistant(
                Some("max_recursion_depth_message".to_string()),
                Some("I apologize, but I've reached the maximum number of actions (30). Please try breaking your request into smaller parts.".to_string()),
                None,
                None,
                None,
            );
            self.get_stream_sender().await.send(Ok(message)).await?;
            return Ok(());
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

        // Update thread with assistant message
        self.update_current_thread(message.clone()).await?;

        // If this is an auto response without tool calls, it means we're done
        if let Message::Assistant {
            tool_calls: None, ..
        } = &llm_message
        {
            return Ok(());
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
                    let result = tool
                        .execute(tool_call, &thread.user_id, &thread.id, None)
                        .await?;
                    let result_str = serde_json::to_string(&result)?;
                    let tool_message = Message::tool(
                        None,
                        result_str,
                        tool_call.id.clone(),
                        Some(tool_call.function.name.clone()),
                        None,
                    );

                    // Update thread with tool response
                    self.update_current_thread(tool_message.clone()).await?;
                    results.push(tool_message);
                }
            }

            // Create a new thread with the tool results and continue recursively
            let mut new_thread = thread.clone();
            new_thread.messages.push(message);
            new_thread.messages.extend(results);

            Box::pin(self.process_thread_with_depth(&new_thread, recursion_depth + 1)).await
        } else {
            Ok(())
        }
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
        if let Some(_) = &tool_call.code_interpreter {
            self.code_interpreter = None;
        }
        if let Some(_) = &tool_call.retrieval {
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
    use litellm::MessageProgress;
    use serde_json::{json, Value};
    use uuid::Uuid;

    fn setup() {
        dotenv().ok();
    }

    struct WeatherTool;

    #[async_trait]
    impl ToolExecutor for WeatherTool {
        type Output = Value;

        async fn execute(
            &self,
            tool_call: &ToolCall,
            user_id: &Uuid,
            session_id: &Uuid,
            stream_tx: Option<mpsc::Sender<Result<Message>>>,
        ) -> Result<Self::Output> {
            // Simulate some progress messages if streaming is enabled
            if let Some(tx) = &stream_tx {
                let progress = Message::tool(
                    None,
                    "Fetching weather data...".to_string(),
                    tool_call.id.clone(),
                    Some(tool_call.function.name.clone()),
                    Some(MessageProgress::InProgress),
                );
                tx.send(Ok(progress)).await?;
            }

            // Simulate a delay
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

            let result = json!({
                "temperature": 20,
                "unit": "fahrenheit"
            });

            // Send completion message if streaming
            if let Some(tx) = &stream_tx {
                let complete = Message::tool(
                    None,
                    serde_json::to_string(&result)?,
                    tool_call.id.clone(),
                    Some(tool_call.function.name.clone()),
                    Some(MessageProgress::Complete),
                );
                tx.send(Ok(complete)).await?;
            }

            Ok(result)
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

        let thread = AgentThread::new(
            None,
            Uuid::new_v4(),
            vec![Message::user("Hello, world!".to_string())],
        );

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

    #[tokio::test]
    async fn test_agent_state_management() {
        setup();

        // Create agent
        let agent = Agent::new("o1".to_string(), HashMap::new());

        // Test setting single values
        agent
            .set_state_value("test_key".to_string(), json!("test_value"))
            .await;
        let value = agent.get_state_value("test_key").await;
        assert_eq!(value, Some(json!("test_value")));

        // Test updating multiple values
        agent
            .update_state(|state| {
                state.insert("key1".to_string(), json!(1));
                state.insert("key2".to_string(), json!({"nested": "value"}));
            })
            .await;

        assert_eq!(agent.get_state_value("key1").await, Some(json!(1)));
        assert_eq!(
            agent.get_state_value("key2").await,
            Some(json!({"nested": "value"}))
        );

        // Test clearing state
        agent.clear_state().await;
        assert_eq!(agent.get_state_value("test_key").await, None);
        assert_eq!(agent.get_state_value("key1").await, None);
        assert_eq!(agent.get_state_value("key2").await, None);
    }
}
