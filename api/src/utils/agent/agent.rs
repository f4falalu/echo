use crate::utils::clients::ai::litellm::{ChatCompletionRequest, LiteLLMClient, Message, Tool};
use anyhow::Result;
use std::collections::HashMap;
use tokio::sync::mpsc;

use super::types::{AgentThread, ToolExecutor};

/// The Agent struct is responsible for managing conversations with the LLM
/// and coordinating tool executions. It maintains a registry of available tools
/// and handles the recursive nature of tool calls.
pub struct Agent {
    /// Client for communicating with the LLM provider
    llm_client: LiteLLMClient,
    /// Registry of available tools, mapped by their names
    tools: HashMap<String, Box<dyn ToolExecutor>>,
    /// The model identifier to use (e.g., "gpt-4")
    model: String,
}

impl Agent {
    /// Create a new Agent instance with a specific LLM client and model
    pub fn new(
        llm_client: LiteLLMClient,
        model: String,
        tools: HashMap<String, Box<dyn ToolExecutor>>,
    ) -> Self {
        Self {
            llm_client,
            tools,
            model,
        }
    }

    /// Register a new tool with the agent
    ///
    /// # Arguments
    /// * `name` - The name of the tool, used to identify it in tool calls
    /// * `tool` - The tool implementation that will be executed
    pub fn register_tool(&mut self, name: String, tool: Box<dyn ToolExecutor>) {
        self.tools.insert(name, tool);
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
            tools: Some(tools),
            ..Default::default()
        };

        // Get the response from the LLM
        let response = self.llm_client.chat_completion(request).await?;
        let llm_message = &response.choices[0].message;

        // Create the initial assistant message
        let mut message = match llm_message {
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
                    // Create a message for the tool's response
                    results.push(Message::tool(
                        serde_json::to_string(&result).unwrap(),
                        tool_call.id.clone(),
                    ));
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

        // Create the request to send to the LLM
        let request = ChatCompletionRequest {
            model: self.model.clone(),
            messages: thread.messages.clone(),
            tools: Some(tools),
            stream: Some(true),
            ..Default::default()
        };

        // Get the streaming response from the LLM
        let mut stream = self.llm_client.stream_chat_completion(request).await?;
        let (tx, rx) = mpsc::channel(100);

        // Process the stream in a separate task
        tokio::spawn(async move {
            let mut current_message = Message::assistant(None, None);

            while let Some(chunk_result) = stream.recv().await {
                match chunk_result {
                    Ok(chunk) => {
                        let delta = &chunk.choices[0].delta;

                        // Update the message with the new content
                        if let Message::Assistant { content, .. } = &mut current_message {
                            if let Some(new_content) = &delta.content {
                                *content = Some(if let Some(existing) = content {
                                    format!("{}{}", existing, new_content)
                                } else {
                                    new_content.clone()
                                });
                            }
                        }
                        let _ = tx.send(Ok(current_message.clone())).await;

                        // TODO: Handle streaming tool calls when they are supported by the API
                    }
                    Err(e) => {
                        let _ = tx.send(Err(e)).await;
                    }
                }
            }
        });

        Ok(rx)
    }
}
