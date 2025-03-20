use crate::tools::{IntoToolCallExecutor, ToolExecutor};
use anyhow::Result;
use braintrust::{BraintrustClient, TraceBuilder};
use litellm::{
    AgentMessage, ChatCompletionRequest, DeltaToolCall, FunctionCall, LiteLLMClient,
    MessageProgress, Metadata, Tool, ToolCall, ToolChoice,
};
use once_cell::sync::Lazy;
use serde_json::Value;
use std::{collections::HashMap, env, sync::Arc};
use tokio::sync::{broadcast, RwLock};
use tracing::error;
use uuid::Uuid;
use std::time::{Duration, Instant};
use crate::models::AgentThread;

// Global BraintrustClient instance
static BRAINTRUST_CLIENT: Lazy<Option<Arc<BraintrustClient>>> = Lazy::new(|| {
    match (std::env::var("BRAINTRUST_API_KEY"), std::env::var("BRAINTRUST_LOGGING_ID")) {
        (Ok(_), Ok(buster_logging_id)) => {
            match BraintrustClient::new(None, &buster_logging_id) {
                Ok(client) => Some(client),
                Err(e) => {
                    eprintln!("Failed to create Braintrust client: {}", e);
                    None
                }
            }
        }
        _ => None,
    }
});

#[derive(Debug, Clone)]
pub struct AgentError(pub String);

impl std::error::Error for AgentError {}

impl std::fmt::Display for AgentError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

type MessageResult = Result<AgentMessage, AgentError>;

#[derive(Debug)]
struct MessageBuffer {
    content: String,
    tool_calls: HashMap<String, PendingToolCall>,
    last_flush: Instant,
    message_id: Option<String>,
    first_message_sent: bool,
}


impl MessageBuffer {
    fn new() -> Self {
        Self {
            content: String::new(),
            tool_calls: HashMap::new(),
            last_flush: Instant::now(),
            message_id: None,
            first_message_sent: false,
        }
    }

    fn should_flush(&self) -> bool {
        self.last_flush.elapsed() >= Duration::from_millis(50)
    }

    fn has_changes(&self) -> bool {
        !self.content.is_empty() || !self.tool_calls.is_empty()
    }

    async fn flush(&mut self, agent: &Agent) -> Result<()> {
        if !self.has_changes() {
            return Ok(());
        }

        // Create tool calls vector if we have any
        let tool_calls: Option<Vec<ToolCall>> = if !self.tool_calls.is_empty() {
            Some(
                self.tool_calls
                    .values()
                    .filter_map(|p| {
                        if p.function_name.is_some() {
                            Some(p.clone().into_tool_call())
                        } else {
                            None
                        }
                    })
                    .collect(),
            )
        } else {
            None
        };

        // Create and send the message
        let message = AgentMessage::assistant(
            self.message_id.clone(),
            if self.content.is_empty() { None } else { Some(self.content.clone()) },
            tool_calls,
            MessageProgress::InProgress,
            Some(!self.first_message_sent),
            Some(agent.name.clone()),
        );

        // Continue on error with broadcast::error::SendError
        if let Err(e) = agent.get_stream_sender().await.send(Ok(message)) {
            // Log warning but don't fail the operation
            tracing::warn!("Channel send error, message may be dropped: {}", e);
        }
        
        // Update state
        self.first_message_sent = true;
        self.last_flush = Instant::now();
        // Do NOT clear content between flushes - we need to accumulate all content 
        // only to keep tool calls as they may still be accumulating

        Ok(())
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
    stream_tx: Arc<RwLock<Option<broadcast::Sender<MessageResult>>>>,
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

        // When creating a new agent, initialize broadcast channel with higher capacity for better concurrency
        let (tx, _rx) = broadcast::channel(5000);
        // Increase shutdown channel capacity to avoid blocking
        let (shutdown_tx, _) = broadcast::channel(100);

        Self {
            llm_client,
            tools: Arc::new(RwLock::new(tools)),
            model,
            state: Arc::new(RwLock::new(HashMap::new())),
            current_thread: Arc::new(RwLock::new(None)),
            stream_tx: Arc::new(RwLock::new(Some(tx))),
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
                    function: tool.get_schema().await,
                });
            }
        }

        enabled_tools
    }

    /// Get a new receiver for the broadcast channel
    pub async fn get_stream_receiver(&self) -> broadcast::Receiver<MessageResult> {
        self.stream_tx.read().await.as_ref().unwrap().subscribe()
    }

    /// Get a clone of the current stream sender
    pub async fn get_stream_sender(&self) -> broadcast::Sender<MessageResult> {
        self.stream_tx.read().await.as_ref().unwrap().clone()
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
    pub async fn get_conversation_history(&self) -> Option<Vec<AgentMessage>> {
        self.current_thread
            .read()
            .await
            .as_ref()
            .map(|thread| thread.messages.clone())
    }

    /// Update the current thread with a new message
    async fn update_current_thread(&self, message: AgentMessage) -> Result<()> {
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
    pub async fn add_tool<T>(&self, name: String, tool: T)
    where
        T: ToolExecutor + 'static,
        T::Params: serde::de::DeserializeOwned,
        T::Output: serde::Serialize,
    {
        let mut tools = self.tools.write().await;
        // Convert the tool to a ToolCallExecutor
        let value_tool = tool.into_tool_call_executor();
        tools.insert(name, Box::new(value_tool));
    }

    /// Add multiple tools to the agent at once
    ///
    /// # Arguments
    /// * `tools` - HashMap of tool names and their implementations
    pub async fn add_tools<E>(&self, tools: HashMap<String, E>)
    where
        E: ToolExecutor + 'static,
        E::Params: serde::de::DeserializeOwned,
        E::Output: serde::Serialize,
    {
        let mut tools_map = self.tools.write().await;
        for (name, tool) in tools {
            // Convert each tool to a ToolCallExecutor
            let value_tool = tool.into_tool_call_executor();
            tools_map.insert(name, Box::new(value_tool));
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
    pub async fn process_thread(&self, thread: &AgentThread) -> Result<AgentMessage> {
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
                result = agent_clone.process_thread_with_depth(&thread_clone, 0, None, None) => {
                    if let Err(e) = result {
                        let err_msg = format!("Error processing thread: {:?}", e);
                        let _ = agent_clone.get_stream_sender().await.send(Err(AgentError(err_msg)));
                        // Send Done message after error
                        let _ = agent_clone.get_stream_sender().await.send(Ok(AgentMessage::Done));
                    }
                },
                _ = shutdown_rx.recv() => {
                    // Send shutdown notification
                    let _ = agent_clone.get_stream_sender().await.send(
                        Ok(AgentMessage::assistant(
                            Some("shutdown_message".to_string()),
                            Some("Processing interrupted due to shutdown signal".to_string()),
                            None,
                            MessageProgress::Complete,
                            None,
                            Some(agent_clone.name.clone()),
                        ))
                    );
                    // Send Done message after shutdown
                    let _ = agent_clone.get_stream_sender().await.send(Ok(AgentMessage::Done));
                }
            }
        });

        Ok(self.get_stream_receiver().await)
    }

    async fn process_thread_with_depth(
        &self,
        thread: &AgentThread,
        recursion_depth: u32,
        trace_builder: Option<TraceBuilder>,
        parent_span: Option<braintrust::Span>,
    ) -> Result<()> {
        // Set the initial thread
        {
            let mut current = self.current_thread.write().await;
            *current = Some(thread.clone());
        }

        // Initialize trace and parent span if not provided (first call)
        let (trace_builder, parent_span) = if trace_builder.is_none() && parent_span.is_none() {
            if let Some(client) = &*BRAINTRUST_CLIENT {
                // Find the most recent user message to use as our input content
                let user_input_message = thread.messages.iter()
                    .filter(|msg| matches!(msg, AgentMessage::User { .. }))
                    .last()
                    .cloned();
                
                // Extract the content from the user message
                let user_prompt_text = user_input_message
                    .as_ref()
                    .and_then(|msg| {
                        if let AgentMessage::User { content, .. } = msg {
                            Some(content.clone())
                        } else {
                            None
                        }
                    })
                    .unwrap_or_else(|| "No prompt available".to_string());
                
                // Create a trace name with the thread ID
                let trace_name = format!("Buster Super Agent {}", thread.id);
                
                // Create the trace with just the user prompt as input
                let trace = TraceBuilder::new(client.clone(), &trace_name);
                
                // Add the user prompt text (not the full message) as input to the root span
                // Ensure we're passing ONLY the content text, not the full message object
                let root_span = trace.root_span().clone().with_input(serde_json::json!(user_prompt_text));
                
                // Add chat_id (session_id) as metadata to the root span
                let span = root_span.with_metadata("chat_id", self.session_id.to_string());
                
                // Log the span non-blockingly (client handles the background processing)
                if let Err(e) = client.log_span(span.clone()).await {
                    error!("Failed to log initial span: {}", e);
                }
                
                (Some(trace), Some(span))
            } else {
                (None, None)
            }
        } else {
            (trace_builder, parent_span)
        };

        // Limit recursion to a maximum of 15 times
        if recursion_depth >= 15 {
            let message = AgentMessage::assistant(
                Some("max_recursion_depth_message".to_string()),
                Some("I apologize, but I've reached the maximum number of actions (15). Please try breaking your request into smaller parts.".to_string()),
                None,
                MessageProgress::Complete,
                None,
                Some(self.name.clone()),
            );
            if let Err(e) = self.get_stream_sender().await.send(Ok(message)) {
                tracing::warn!("Channel send error when sending recursion limit message: {}", e);
            }
            self.close().await;
            return Ok(());
        }

        // Collect all registered tools and their schemas
        let tools = self.get_enabled_tools().await;

        // Get the most recent user message for logging (used only in error logging)
        let _user_message = thread.messages.last()
            .filter(|msg| matches!(msg, AgentMessage::User { .. }))
            .cloned();

        // Create the tool-enabled request
        let request = ChatCompletionRequest {
            model: self.model.clone(),
            messages: thread.messages.clone(),
            tools: if tools.is_empty() { None } else { Some(tools) },
            tool_choice: Some(ToolChoice::Auto),
            stream: Some(true), // Enable streaming
            metadata: Some(Metadata {
                generation_name: "agent".to_string(),
                user_id: thread.user_id.to_string(),
                session_id: thread.id.to_string(),
                trace_id: thread.id.to_string(),
            }),
            ..Default::default()
        };
        
        // Get the streaming response from the LLM
        let mut stream_rx = match self.llm_client.stream_chat_completion(request.clone()).await {
            Ok(rx) => rx,
            Err(e) => {
                // Log error in span
                if let Some(parent_span) = parent_span.clone() {
                    if let Some(client) = &*BRAINTRUST_CLIENT {
                        let error_span = parent_span.with_output(serde_json::json!({
                            "error": format!("Error starting stream: {:?}", e)
                        }));
                        
                        // Log span non-blockingly (client handles the background processing)
                        if let Err(log_err) = client.log_span(error_span).await {
                            error!("Failed to log error span: {}", log_err);
                        }
                    }
                }
                let error_message = format!("Error starting stream: {:?}", e);
                return Err(anyhow::anyhow!(error_message));
            },
        };

        // We store the parent span to use for creating individual tool spans
        // This avoids creating a general assistant span that would never be completed
        let parent_for_tool_spans = parent_span.clone();

        // Process the streaming chunks
        let mut buffer = MessageBuffer::new();
        let mut _is_complete = false;

        while let Some(chunk_result) = stream_rx.recv().await {
            match chunk_result {
                Ok(chunk) => {
                    if chunk.choices.is_empty() {
                        continue;
                    }

                    buffer.message_id = Some(chunk.id.clone());
                    let delta = &chunk.choices[0].delta;

                    // Accumulate content if present
                    if let Some(content) = &delta.content {
                        buffer.content.push_str(content);
                    }

                    // Process tool calls if present
                    if let Some(tool_calls) = &delta.tool_calls {
                        for tool_call in tool_calls {
                            let id = tool_call.id.clone().unwrap_or_else(|| {
                                buffer.tool_calls
                                    .keys()
                                    .next()
                                    .map(|s| s.clone())
                                    .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
                            });

                            // Get or create the pending tool call
                            let pending_call = buffer.tool_calls
                                .entry(id.clone())
                                .or_insert_with(PendingToolCall::new);

                            // Update the pending call with the delta
                            pending_call.update_from_delta(tool_call);
                        }
                    }

                    // Check if we should flush the buffer
                    if buffer.should_flush() {
                        buffer.flush(self).await?;
                    }

                    // Check if this is the final chunk
                    if chunk.choices[0].finish_reason.is_some() {
                        _is_complete = true;
                    }
                }
                Err(e) => {
                    // Log error in parent span
                    if let Some(parent) = &parent_for_tool_spans {
                        if let Some(client) = &*BRAINTRUST_CLIENT {
                            // Create error info
                            let error_info = serde_json::json!({
                                "error": format!("Error in stream: {:?}", e)
                            });
                            
                            // Log error as output to parent span
                            let error_span = parent.clone().with_output(error_info);
                            
                            // Log span non-blockingly (client handles the background processing)
                            if let Err(log_err) = client.log_span(error_span).await {
                                error!("Failed to log stream error span: {}", log_err);
                            }
                        }
                    }
                    let error_message = format!("Error in stream: {:?}", e);
                    return Err(anyhow::anyhow!(error_message));
                },
            }
        }

        // Create and send the final message
        let final_tool_calls: Option<Vec<ToolCall>> = if !buffer.tool_calls.is_empty() {
            Some(
                buffer.tool_calls
                    .values()
                    .map(|p| p.clone().into_tool_call())
                    .collect(),
            )
        } else {
            None
        };

        let final_message = AgentMessage::assistant(
            buffer.message_id,
            if buffer.content.is_empty() { None } else { Some(buffer.content) },
            final_tool_calls.clone(),
            MessageProgress::Complete,
            Some(false),
            Some(self.name.clone()),
        );

        // Broadcast the final assistant message
        self.get_stream_sender()
            .await
            .send(Ok(final_message.clone()))?;

        // Update thread with assistant message
        self.update_current_thread(final_message.clone()).await?;

        // For a message without tool calls, create and log a new complete message span
        // Otherwise, tool spans will be created individually for each tool call
        if final_tool_calls.is_none() && trace_builder.is_some() {
            if let (Some(trace), Some(parent)) = (&trace_builder, &parent_span) {
                if let Some(client) = &*BRAINTRUST_CLIENT {
                    // Ensure we have the complete message content
                    // Make sure we clone the final message to avoid mutating it
                    let complete_final_message = final_message.clone();
                    
                    // Create a fresh span for the text-only response
                    let span = trace.add_child_span("Assistant Response", "llm", parent).await?;
                    
                    // Add chat_id (session_id) as metadata to the span
                    let span = span.with_metadata("chat_id", self.session_id.to_string());
                    
                    // Add the full request/response information
                    let span = span.with_input(serde_json::to_value(&request)?);
                    let span = span.with_output(serde_json::to_value(&complete_final_message)?);
                    
                    // Log span non-blockingly (client handles the background processing)
                    if let Err(log_err) = client.log_span(span).await {
                        error!("Failed to log assistant response span: {}", log_err);
                    }
                }
            }
        }
        // For messages with tool calls, we won't log the output here
        // Instead, we'll create tool spans with this assistant span as parent

        // If this is an auto response without tool calls, it means we're done
        if final_tool_calls.is_none() {
            // Log the final output to the parent span
            if let Some(parent_span) = &parent_span {
                if let Some(client) = &*BRAINTRUST_CLIENT {
                    // Create a new span with the final message as output
                    let final_span = parent_span.clone().with_output(serde_json::to_value(&final_message)?);
                    
                    // Log span non-blockingly (client handles the background processing)
                    if let Err(log_err) = client.log_span(final_span).await {
                        error!("Failed to log final output span: {}", log_err);
                    }
                }
            }
            
            // Finish the trace without consuming it
            self.finish_trace(&trace_builder).await?;
            
            // Send Done message and return
            self.get_stream_sender()
                .await
                .send(Ok(AgentMessage::Done))?;
            return Ok(());
        }

        // If the LLM wants to use tools, execute them and continue
        if let Some(tool_calls) = final_tool_calls {
            let mut results = Vec::new();

            // Execute each requested tool
            for tool_call in tool_calls {
                if let Some(tool) = self.tools.read().await.get(&tool_call.function.name) {
                    // Create a tool span that combines the assistant request with the tool execution
                    let tool_span = if let (Some(trace), Some(parent)) = (&trace_builder, &parent_for_tool_spans) {
                        if let Some(_client) = &*BRAINTRUST_CLIENT {
                            // Create a span for the assistant + tool execution
                            let span = trace.add_child_span(
                                &format!("Assistant: {}", tool_call.function.name), 
                                "tool", 
                                parent
                            ).await?;
                            
                            // Add chat_id (session_id) as metadata to the span
                            let span = span.with_metadata("chat_id", self.session_id.to_string());
                            
                            // Parse the parameters (unused in this context since we're using final_message)
                            let _params: Value = serde_json::from_str(&tool_call.function.arguments)?;
                            
                            // Use the assistant message as input to this span
                            // This connects the assistant's request to the tool execution
                            let span = span.with_input(serde_json::to_value(&final_message)?);
                            
                            // We don't log the span yet - we'll log it after we have the tool result
                            // The tool result will be added as output to this span
                            
                            Some(span)
                        } else {
                            None
                        }
                    } else {
                        None
                    };
                    
                    // Parse the parameters
                    let params: Value = serde_json::from_str(&tool_call.function.arguments)?;
                    let _tool_input = serde_json::json!({
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": params
                        },
                        "id": tool_call.id
                    });
                    
                    // Execute the tool
                    let result = match tool.execute(params, tool_call.id.clone()).await {
                        Ok(r) => r,
                        Err(e) => {
                            // Log error in tool span
                            if let Some(tool_span) = &tool_span {
                                if let Some(client) = &*BRAINTRUST_CLIENT {
                                    let error_info = serde_json::json!({
                                        "error": format!("Tool execution error: {:?}", e)
                                    });
                                    
                                    // Create a new span with the error output
                                    let error_span = tool_span.clone().with_output(error_info);
                                    
                                    // Log span non-blockingly (client handles the background processing)
                                    if let Err(log_err) = client.log_span(error_span).await {
                                        error!("Failed to log tool execution error span: {}", log_err);
                                    }
                                }
                            }
                            let error_message = format!("Tool execution error: {:?}", e);
                            return Err(anyhow::anyhow!(error_message));
                        }
                    };
                    
                    let result_str = serde_json::to_string(&result)?;
                    let tool_message = AgentMessage::tool(
                        None,
                        result_str.clone(),
                        tool_call.id.clone(),
                        Some(tool_call.function.name.clone()),
                        MessageProgress::Complete,
                    );

                    // Log the combined assistant+tool span with the tool result as output
                    if let Some(tool_span) = &tool_span {
                        if let Some(client) = &*BRAINTRUST_CLIENT {
                            // Only log completed messages
                            if matches!(tool_message, AgentMessage::Tool { progress: MessageProgress::Complete, .. }) {
                                // Now that we have the tool result, add it as output and log the span
                                // This creates a span showing assistant message -> tool execution -> tool result
                                let result_span = tool_span.clone().with_output(serde_json::to_value(&tool_message)?);
                                
                                // Log span non-blockingly (client handles the background processing)
                                if let Err(log_err) = client.log_span(result_span).await {
                                    error!("Failed to log tool result span: {}", log_err);
                                }
                            }
                        }
                    }

                    // Broadcast the tool message as soon as we receive it - use try_send to avoid blocking
                    if let Err(e) = self.get_stream_sender().await.send(Ok(tool_message.clone())) {
                        tracing::warn!("Channel send error when sending tool message: {}", e);
                    }

                    // Update thread with tool response
                    self.update_current_thread(tool_message.clone()).await?;
                    results.push(tool_message);
                }
            }

            // Create a new thread with the tool results and continue recursively
            let mut new_thread = thread.clone();
            new_thread.messages.push(final_message);
            new_thread.messages.extend(results);

            // For recursive calls, we'll continue with the same trace
            // We don't finish the trace here to keep all interactions in one trace
            Box::pin(self.process_thread_with_depth(&new_thread, recursion_depth + 1, trace_builder, parent_span)).await
        } else {
            // Log the final output to the parent span
            if let Some(parent_span) = &parent_span {
                if let Some(client) = &*BRAINTRUST_CLIENT {
                    // Create a new span with the final message as output
                    let final_span = parent_span.clone().with_output(serde_json::to_value(&final_message)?);
                    
                    // Log span non-blockingly (client handles the background processing)
                    if let Err(log_err) = client.log_span(final_span).await {
                        error!("Failed to log final output span: {}", log_err);
                    }
                }
            }
            
            // Finish the trace without consuming it
            self.finish_trace(&trace_builder).await?;
            
            // Send Done message and return
            self.get_stream_sender()
                .await
                .send(Ok(AgentMessage::Done))?;
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

    /// Helper method to finish a trace without consuming the TraceBuilder
    /// This method is fully non-blocking and never affects application performance
    async fn finish_trace(&self, trace: &Option<TraceBuilder>) -> Result<()> {
        // If there's no trace to finish or no client to log with, return immediately
        if trace.is_none() || BRAINTRUST_CLIENT.is_none() {
            return Ok(());
        }
        
        // Only create a completion span if we have an actual trace
        if let Some(trace_builder) = trace {
            // Get the trace root span ID to properly link the completion
            let root_span_id = trace_builder.root_span_id();
            
            // Create and log a completion span non-blockingly
            if let Some(client) = &*BRAINTRUST_CLIENT {
                // Create a new span for completion linked to the trace
                let completion_span = client.create_span(
                    "Trace Completion", 
                    "completion",
                    Some(root_span_id),  // Link to the trace's root span
                    Some(root_span_id)   // Set parent to also be the root span
                ).with_metadata("chat_id", self.session_id.to_string());
                
                // Log span non-blockingly (client handles the background processing)
                if let Err(e) = client.log_span(completion_span).await {
                    error!("Failed to log completion span: {}", e);
                }
            }
        }
        
        // Return immediately, without waiting for any logging operations
        Ok(())
    }

    // Add this new method alongside other channel-related methods
    pub async fn close(&self) {
        let mut tx = self.stream_tx.write().await;
        *tx = None;
    }
}

#[derive(Debug, Default, Clone)]
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

    async fn process_thread(&self, thread: &AgentThread) -> Result<AgentMessage> {
        (*self.get_agent()).process_thread(thread).await
    }

    async fn get_current_thread(&self) -> Option<AgentThread> {
        (*self.get_agent()).get_current_thread().await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tools::ToolExecutor;
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
            let message = AgentMessage::tool(
                None,
                content,
                tool_id,
                Some(self.get_name()),
                progress,
            );
            self.agent.get_stream_sender().await.send(Ok(message))?;
            Ok(())
        }
    }

    #[async_trait]
    impl ToolExecutor for WeatherTool {
        type Output = Value;
        type Params = Value;

        async fn execute(&self, params: Self::Params, tool_call_id: String) -> Result<Self::Output> {
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

        async fn get_schema(&self) -> Value {
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
            vec![AgentMessage::user("Hello, world!".to_string())],
        );

        let response = match agent.process_thread(&thread).await {
            Ok(response) => response,
            Err(e) => panic!("Error processing thread: {:?}", e),
        };
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
            vec![AgentMessage::user(
                "What is the weather in vineyard ut?".to_string(),
            )],
        );

        let response = match agent.process_thread(&thread).await {
            Ok(response) => response,
            Err(e) => panic!("Error processing thread: {:?}", e),
        };
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
            vec![AgentMessage::user(
                "What is the weather in vineyard ut and san francisco?".to_string(),
            )],
        );

        let response = match agent.process_thread(&thread).await {
            Ok(response) => response,
            Err(e) => panic!("Error processing thread: {:?}", e),
        };
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