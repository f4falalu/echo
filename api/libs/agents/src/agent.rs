use anyhow::Result;
use litellm::{
    ChatCompletionRequest, DeltaToolCall, FunctionCall, LiteLLMClient, Message, Metadata, Tool,
    ToolCall, ToolChoice,
};
use serde_json::Value;
use std::{collections::HashMap, env, sync::Arc};
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;

use crate::utils::tools::ToolExecutor;
use crate::models::AgentThread;

#[derive(Debug, Clone)]
pub struct AgentError(pub String);

impl std::error::Error for AgentError {}

impl std::fmt::Display for AgentError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

type MessageResult = Result<Message, AgentError>;

/// A wrapper type that converts ToolCall parameters to Value before executing
struct ToolCallExecutor<T: ToolExecutor> {
    inner: Box<T>,
}

impl<T: ToolExecutor> ToolCallExecutor<T> {
    fn new(inner: T) -> Self {
        Self {
            inner: Box::new(inner),
        }
    }
}

#[async_trait::async_trait]
impl<T: ToolExecutor + Send + Sync> ToolExecutor for ToolCallExecutor<T>
where
    T::Params: serde::de::DeserializeOwned,
    T::Output: serde::Serialize,
{
    type Output = Value;
    type Params = Value;

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        let params = serde_json::from_value(params)?;
        let result = self.inner.execute(params).await?;
        Ok(serde_json::to_value(result)?)
    }

    fn get_schema(&self) -> Value {
        self.inner.get_schema()
    }

    fn get_name(&self) -> String {
        self.inner.get_name()
    }

    async fn is_enabled(&self) -> bool {
        self.inner.is_enabled().await
    }
}

// Add this near the top of the file, with other trait implementations
#[async_trait::async_trait]
impl<T: ToolExecutor<Output = Value, Params = Value> + Send + Sync> ToolExecutor for Box<T> {
    type Output = Value;
    type Params = Value;

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        (**self).execute(params).await
    }

    fn get_schema(&self) -> Value {
        (**self).get_schema()
    }

    fn get_name(&self) -> String {
        (**self).get_name()
    }

    async fn is_enabled(&self) -> bool {
        (**self).is_enabled().await
    }
}

#[derive(Clone)]
/// The Agent struct is responsible for managing conversations with the LLM
/// and coordinating tool executions. It maintains a registry of available tools
/// and handles the recursive nature of tool calls.
pub struct Agent {
    /// Client for communicating with the LLM provider
    llm_client: LiteLLMClient,
    /// Registry of available tools, mapped by their names
    tools: Arc<
        RwLock<
            HashMap<String, Box<dyn ToolExecutor<Output = Value, Params = Value> + Send + Sync>>,
        >,
    >,
    /// The model identifier to use (e.g., "gpt-4")
    model: String,
    /// Flexible state storage for maintaining memory across interactions
    state: Arc<RwLock<HashMap<String, Value>>>,
    /// The current thread being processed, if any
    current_thread: Arc<RwLock<Option<AgentThread>>>,
    /// Sender for streaming messages from this agent and sub-agents
    stream_tx: Arc<RwLock<broadcast::Sender<MessageResult>>>,
    /// The user ID for the current thread
    user_id: Uuid,
    /// The session ID for the current thread
    session_id: Uuid,
    /// Agent name
    name: String,
    /// Shutdown signal sender
    shutdown_tx: Arc<RwLock<broadcast::Sender<()>>>,
}

impl Agent {
    /// Create a new Agent instance with a specific LLM client and model
    pub fn new(
        model: String,
        tools: HashMap<String, Box<dyn ToolExecutor<Output = Value, Params = Value> + Send + Sync>>,
        user_id: Uuid,
        session_id: Uuid,
        name: String,
    ) -> Self {
        let llm_api_key = env::var("LLM_API_KEY").expect("LLM_API_KEY must be set");
        let llm_base_url = env::var("LLM_BASE_URL").expect("LLM_API_BASE must be set");

        let llm_client = LiteLLMClient::new(Some(llm_api_key), Some(llm_base_url));

        // Create a broadcast channel with buffer size 1000
        let (tx, _rx) = broadcast::channel(1000);
        // Create shutdown channel with buffer size 1
        let (shutdown_tx, _) = broadcast::channel(1);

        Self {
            llm_client,
            tools: Arc::new(RwLock::new(tools)),
            model,
            state: Arc::new(RwLock::new(HashMap::new())),
            current_thread: Arc::new(RwLock::new(None)),
            stream_tx: Arc::new(RwLock::new(tx)),
            user_id,
            session_id,
            shutdown_tx: Arc::new(RwLock::new(shutdown_tx)),
            name,
        }
    }

    /// Create a new Agent that shares state and stream with an existing agent
    pub fn from_existing(existing_agent: &Agent, name: String) -> Self {
        let llm_api_key = env::var("LLM_API_KEY").expect("LLM_API_KEY must be set");
        let llm_base_url = env::var("LLM_BASE_URL").expect("LLM_API_BASE must be set");

        let llm_client = LiteLLMClient::new(Some(llm_api_key), Some(llm_base_url));

        Self {
            llm_client,
            tools: Arc::new(RwLock::new(HashMap::new())),
            model: existing_agent.model.clone(),
            state: Arc::clone(&existing_agent.state),
            current_thread: Arc::clone(&existing_agent.current_thread),
            stream_tx: Arc::clone(&existing_agent.stream_tx),
            user_id: existing_agent.user_id,
            session_id: existing_agent.session_id,
            shutdown_tx: Arc::clone(&existing_agent.shutdown_tx),
            name,
        }
    }

    pub async fn get_enabled_tools(&self) -> Vec<Tool> {
        // Collect all registered tools and their schemas
        let tools = self.tools.read().await;

        let mut enabled_tools = Vec::new();

        for (_, tool) in tools.iter() {
            if tool.is_enabled().await {
                enabled_tools.push(Tool {
                    tool_type: "function".to_string(),
                    function: tool.get_schema(),
                });
            }
        }

        enabled_tools
    }

    /// Get a new receiver for the broadcast channel
    pub async fn get_stream_receiver(&self) -> broadcast::Receiver<MessageResult> {
        self.stream_tx.read().await.subscribe()
    }

    /// Get a clone of the current stream sender
    pub async fn get_stream_sender(&self) -> broadcast::Sender<MessageResult> {
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

    pub fn get_user_id(&self) -> Uuid {
        self.user_id
    }

    pub fn get_session_id(&self) -> Uuid {
        self.session_id
    }

    pub fn get_model_name(&self) -> &str {
        &self.model
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
    pub async fn add_tool(&self, name: String, tool: impl ToolExecutor<Output = Value> + 'static) {
        let mut tools = self.tools.write().await;
        tools.insert(name, Box::new(ToolCallExecutor::new(tool)));
    }

    /// Add multiple tools to the agent at once
    ///
    /// # Arguments
    /// * `tools` - HashMap of tool names and their implementations
    pub async fn add_tools<E: ToolExecutor<Output = Value> + 'static>(
        &self,
        tools: HashMap<String, E>,
    ) {
        let mut tools_map = self.tools.write().await;
        for (name, tool) in tools {
            tools_map.insert(name, Box::new(ToolCallExecutor::new(tool)));
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
        while let Ok(msg) = rx.recv().await {
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
    ) -> Result<broadcast::Receiver<MessageResult>> {
        // Spawn the processing task
        let agent_clone = self.clone();
        let thread_clone = thread.clone();

        // Get shutdown receiver
        let mut shutdown_rx = self.get_shutdown_receiver().await;

        tokio::spawn(async move {
            tokio::select! {
                result = agent_clone.process_thread_with_depth(&thread_clone, 0) => {
                    if let Err(e) = result {
                        let err_msg = format!("Error processing thread: {:?}", e);
                        let _ = agent_clone.get_stream_sender().await.send(Err(AgentError(err_msg)));
                    }
                },
                _ = shutdown_rx.recv() => {
                    let _ = agent_clone.get_stream_sender().await.send(
                        Ok(Message::assistant(
                            Some("shutdown_message".to_string()),
                            Some("Processing interrupted due to shutdown signal".to_string()),
                            None,
                            None,
                            None,
                            Some(agent_clone.name.clone()),
                        ))
                    );
                }
            }
        });

        Ok(self.get_stream_receiver().await)
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
                Some(self.name.clone()),
            );
            self.get_stream_sender().await.send(Ok(message))?;
            return Ok(());
        }

        // Collect all registered tools and their schemas
        let tools = self.get_enabled_tools().await;

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
                trace_id: thread.id.to_string(),
            }),
            store: Some(true),
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
            } => Message::assistant(None, content.clone(), tool_calls.clone(), None, None, Some(self.name.clone())),
            _ => return Err(anyhow::anyhow!("Expected assistant message from LLM")),
        };

        // Broadcast the assistant message as soon as we receive it
        self.get_stream_sender().await.send(Ok(message.clone()))?;

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
                if let Some(tool) = self.tools.read().await.get(&tool_call.function.name) {
                    let params: Value = serde_json::from_str(&tool_call.function.arguments)?;
                    let result = tool.execute(params).await?;
                    println!("Tool Call result: {:?}", result);
                    let result_str = serde_json::to_string(&result)?;
                    let tool_message = Message::tool(
                        None,
                        result_str,
                        tool_call.id.clone(),
                        Some(tool_call.function.name.clone()),
                        None,
                    );

                    // Broadcast the tool message as soon as we receive it
                    self.get_stream_sender()
                        .await
                        .send(Ok(tool_message.clone()))?;

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

    /// Get a receiver for the shutdown signal
    pub async fn get_shutdown_receiver(&self) -> broadcast::Receiver<()> {
        self.shutdown_tx.read().await.subscribe()
    }

    /// Signal shutdown to all receivers
    pub async fn shutdown(&self) -> Result<()> {
        // Send shutdown signal
        self.shutdown_tx.read().await.send(())?;
        Ok(())
    }

    /// Get a reference to the tools map
    pub async fn get_tools(
        &self,
    ) -> tokio::sync::RwLockReadGuard<
        '_,
        HashMap<String, Box<dyn ToolExecutor<Output = Value, Params = Value> + Send + Sync>>,
    > {
        self.tools.read().await
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

/// A trait that provides convenient access to Agent functionality
/// when the agent is stored behind an Arc
#[async_trait::async_trait]
pub trait AgentExt {
    fn get_agent(&self) -> &Arc<Agent>;

    async fn stream_process_thread(
        &self,
        thread: &AgentThread,
    ) -> Result<broadcast::Receiver<MessageResult>> {
        (*self.get_agent()).process_thread_streaming(thread).await
    }

    async fn process_thread(&self, thread: &AgentThread) -> Result<Message> {
        (*self.get_agent()).process_thread(thread).await
    }

    async fn get_current_thread(&self) -> Option<AgentThread> {
        (*self.get_agent()).get_current_thread().await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use litellm::MessageProgress;
    use serde_json::{json, Value};
    use uuid::Uuid;

    fn setup() {
        dotenv::dotenv().ok();
    }

    struct WeatherTool {
        agent: Arc<Agent>,
    }

    impl WeatherTool {
        fn new(agent: Arc<Agent>) -> Self {
            Self { agent }
        }
    }

    impl WeatherTool {
        async fn send_progress(
            &self,
            content: String,
            tool_id: String,
            progress: MessageProgress,
        ) -> Result<()> {
            let message = Message::tool(
                None,
                content,
                tool_id,
                Some(self.get_name()),
                Some(progress),
            );
            self.agent.get_stream_sender().await.send(Ok(message))?;
            Ok(())
        }
    }

    #[async_trait]
    impl ToolExecutor for WeatherTool {
        type Output = Value;
        type Params = Value;

        async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
            self.send_progress(
                "Fetching weather data...".to_string(),
                "123".to_string(),
                MessageProgress::InProgress,
            )
            .await?;

            // Simulate a delay
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

            let result = json!({
                "temperature": 20,
                "unit": "fahrenheit"
            });

            self.send_progress(
                serde_json::to_string(&result)?,
                "123".to_string(),
                MessageProgress::Complete,
            )
            .await?;

            Ok(result)
        }

        async fn is_enabled(&self) -> bool {
            true
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
        let agent = Agent::new(
            "o1".to_string(),
            HashMap::new(),
            Uuid::new_v4(),
            Uuid::new_v4(),
            "test_agent".to_string(),
        );

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

        // Create agent first
        let mut agent = Agent::new(
            "o1".to_string(),
            HashMap::new(),
            Uuid::new_v4(),
            Uuid::new_v4(),
            "test_agent".to_string(),
        );

        // Create weather tool with reference to agent
        let weather_tool = WeatherTool::new(Arc::new(agent.clone()));

        // Add tool to agent
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
        let mut agent = Agent::new(
            "o1".to_string(),
            HashMap::new(),
            Uuid::new_v4(),
            Uuid::new_v4(),
            "test_agent".to_string(),
        );

        let weather_tool = WeatherTool::new(Arc::new(agent.clone()));

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
        let agent = Agent::new(
            "o1".to_string(),
            HashMap::new(),
            Uuid::new_v4(),
            Uuid::new_v4(),
            "test_agent".to_string(),
        );

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
