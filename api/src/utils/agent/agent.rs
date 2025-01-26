use crate::utils::clients::ai::litellm::{
    ChatCompletionRequest, Content, Function, LiteLLMClient, Message, ResponseFormat, Tool,
};
use anyhow::Result;
use std::collections::HashMap;
use tokio::sync::mpsc;

use super::types::{Thread, ToolExecutor};

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
    pub async fn process_thread(&self, thread: &Thread) -> Result<Message> {
        // Collect all registered tools and their schemas
        let tools: Vec<Tool> = self
            .tools
            .iter()
            .map(|(name, tool)| Tool {
                tool_type: "function".to_string(),
                function: Function {
                    name: name.clone(),
                    description: None,
                    parameters: tool.get_schema(),
                },
            })
            .collect();

        // Create the request to send to the LLM
        let request = ChatCompletionRequest {
            model: self.model.clone(),
            messages: thread.messages.clone(),
            tools: Some(tools),
            response_format: Some(ResponseFormat {
                type_: "text".to_string(),
            }),
            ..Default::default()
        };

        // Get the response from the LLM
        let response = self.llm_client.chat_completion(request).await?;
        let llm_message = &response.choices[0].message;

        // Create the initial assistant message
        let mut message = Message {
            role: "assistant".to_string(),
            content: Some(vec![Content {
                text: String::new(),
                type_: "text".to_string(),
            }]),
            name: None,
            tool_calls: llm_message.tool_calls.clone(),
            tool_call_id: None,
        };

        // If the LLM wants to use tools, execute them
        if let Some(tool_calls) = &llm_message.tool_calls {
            let mut results = Vec::new();

            // Execute each requested tool
            for tool_call in tool_calls {
                if let Some(tool) = self.tools.get(&tool_call.function.name) {
                    let result = tool.execute(tool_call).await?;
                    // Create a message for the tool's response
                    results.push(Message {
                        role: "tool".to_string(),
                        content: Some(vec![Content {
                            text: result,
                            type_: "text".to_string(),
                        }]),
                        name: None,
                        tool_calls: None,
                        tool_call_id: Some(tool_call.id.clone()),
                    });
                }
            }

            // Create a new thread with the tool results and continue recursively
            let mut new_thread = thread.clone();
            new_thread.messages.push(message);
            new_thread.messages.extend(results);

            Box::pin(self.process_thread(&new_thread)).await
        } else {
            // If no tools were called, return the final response
            message.content = if let Some(content) = &llm_message.content {
                Some(content.clone())
            } else {
                Some(vec![Content {
                    text: String::new(),
                    type_: "text".to_string(),
                }])
            };
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
        thread: &Thread,
    ) -> Result<mpsc::Receiver<Result<Message>>> {
        // Collect all registered tools and their schemas
        let tools: Vec<Tool> = self
            .tools
            .iter()
            .map(|(name, tool)| Tool {
                tool_type: "function".to_string(),
                function: Function {
                    name: name.clone(),
                    description: None,
                    parameters: tool.get_schema(),
                },
            })
            .collect();

        // Create the request to send to the LLM
        let request = ChatCompletionRequest {
            model: self.model.clone(),
            messages: thread.messages.clone(),
            tools: Some(tools),
            stream: Some(true),
            response_format: Some(ResponseFormat {
                type_: "text".to_string(),
            }),
            ..Default::default()
        };

        // Get the streaming response from the LLM
        let mut stream = self.llm_client.stream_chat_completion(request).await?;
        let (tx, rx) = mpsc::channel(100);

        // Process the stream in a separate task
        tokio::spawn(async move {
            let mut current_message = Message {
                role: "assistant".to_string(),
                content: Some(vec![Content {
                    text: String::new(),
                    type_: "text".to_string(),
                }]),
                name: None,
                tool_calls: None,
                tool_call_id: None,
            };

            while let Some(chunk_result) = stream.recv().await {
                match chunk_result {
                    Ok(chunk) => {
                        let delta = &chunk.choices[0].delta;

                        // Update the message with the new content
                        if let Some(content) = &mut current_message.content {
                            content[0].text.push_str(&delta.content);
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

#[cfg(test)]
mod tests {
    use crate::utils::clients::ai::litellm::ToolCall;

    use super::*;
    use async_trait::async_trait;
    use mockito;
    use serde_json::json;

    /// Mock weather tools for testing
    struct CurrentWeatherTool;
    struct ForecastTool;
    struct WeatherAlertsTool;
    struct AirQualityTool;

    #[async_trait]
    impl ToolExecutor for CurrentWeatherTool {
        async fn execute(&self, tool_call: &ToolCall) -> Result<String> {
            let args: serde_json::Value = serde_json::from_str(&tool_call.function.arguments)?;
            let city = args["city"].as_str().unwrap_or("unknown");

            match city.to_lowercase().as_str() {
                "salt lake city" => {
                    Ok("Current weather in Salt Lake City: 75°F, Sunny, Humidity: 45%".to_string())
                }
                "new york" => {
                    Ok("Current weather in New York: 68°F, Cloudy, Humidity: 72%".to_string())
                }
                _ => Ok(format!("Weather data not available for {}", city)),
            }
        }

        fn get_schema(&self) -> serde_json::Value {
            json!({
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "The city to get current weather for"
                    }
                },
                "required": ["city"]
            })
        }
    }

    #[async_trait]
    impl ToolExecutor for ForecastTool {
        async fn execute(&self, tool_call: &ToolCall) -> Result<String> {
            let args: serde_json::Value = serde_json::from_str(&tool_call.function.arguments)?;
            let city = args["city"].as_str().unwrap_or("unknown");
            let days = args["days"].as_i64().unwrap_or(7);

            if city.to_lowercase() == "salt lake city" {
                Ok(format!("{}-day forecast for Salt Lake City:\nDay 1: 75°F, Sunny\nDay 2: 78°F, Partly Cloudy\nDay 3: 72°F, Sunny", days))
            } else {
                Ok(format!("{}-day forecast not available for {}", days, city))
            }
        }

        fn get_schema(&self) -> serde_json::Value {
            json!({
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "The city to get forecast for"
                    },
                    "days": {
                        "type": "integer",
                        "description": "Number of days to forecast (1-7)",
                        "minimum": 1,
                        "maximum": 7
                    }
                },
                "required": ["city"]
            })
        }
    }

    #[async_trait]
    impl ToolExecutor for WeatherAlertsTool {
        async fn execute(&self, tool_call: &ToolCall) -> Result<String> {
            let args: serde_json::Value = serde_json::from_str(&tool_call.function.arguments)?;
            let city = args["city"].as_str().unwrap_or("unknown");

            match city.to_lowercase().as_str() {
                "salt lake city" => Ok("No current weather alerts for Salt Lake City".to_string()),
                "miami" => Ok("ALERT: Tropical Storm Warning for Miami area".to_string()),
                _ => Ok(format!("Weather alerts not available for {}", city)),
            }
        }

        fn get_schema(&self) -> serde_json::Value {
            json!({
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "The city to get weather alerts for"
                    }
                },
                "required": ["city"]
            })
        }
    }

    #[async_trait]
    impl ToolExecutor for AirQualityTool {
        async fn execute(&self, tool_call: &ToolCall) -> Result<String> {
            let args: serde_json::Value = serde_json::from_str(&tool_call.function.arguments)?;
            let city = args["city"].as_str().unwrap_or("unknown");

            match city.to_lowercase().as_str() {
                "salt lake city" => Ok("Air Quality in Salt Lake City: Good (AQI: 42)".to_string()),
                "beijing" => Ok("Air Quality in Beijing: Unhealthy (AQI: 152)".to_string()),
                _ => Ok(format!("Air quality data not available for {}", city)),
            }
        }

        fn get_schema(&self) -> serde_json::Value {
            json!({
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "The city to get air quality for"
                    }
                },
                "required": ["city"]
            })
        }
    }

    /// Helper function to create a mock server with a specific response
    async fn setup_mock_server(
        response_body: &str,
        content_type: Option<&str>,
    ) -> (mockito::ServerGuard, String) {
        let mut server = mockito::Server::new_async().await;
        let mock = server
            .mock("POST", "/v1/chat/completions")
            .with_status(200)
            .with_header("content-type", content_type.unwrap_or("application/json"))
            .with_body(response_body)
            .create_async()
            .await;

        let url = server.url();

        (server, url)
    }

    /// Helper function to create an agent with weather tools
    fn create_weather_agent(client: LiteLLMClient) -> Agent {
        let mut tools: HashMap<String, Box<dyn ToolExecutor>> = HashMap::new();
        tools.insert(
            "get_current_weather".to_string(),
            Box::new(CurrentWeatherTool),
        );
        tools.insert("get_forecast".to_string(), Box::new(ForecastTool));
        tools.insert(
            "get_weather_alerts".to_string(),
            Box::new(WeatherAlertsTool),
        );
        tools.insert("get_air_quality".to_string(), Box::new(AirQualityTool));

        Agent::new(client, "gpt-4".to_string(), tools)
    }

    /// Test 1: Direct text response without tool calls
    #[tokio::test]
    async fn test_direct_response() {
        let response = r#"{
            "id": "test-id",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "gpt-4",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": [{
                        "text": "The weather service is currently available for Salt Lake City, New York, Miami, and Beijing.",
                        "type": "text"
                    }]
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 20,
                "total_tokens": 30
            }
        }"#;

        let (server, url) = setup_mock_server(response, None).await;
        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(url));
        let agent = create_weather_agent(client);

        let thread = Thread {
            id: "test-thread".to_string(),
            messages: vec![Message {
                role: "user".to_string(),
                content: Some(vec![Content {
                    text: "What cities can I get weather for?".to_string(),
                    type_: "text".to_string(),
                }]),
                name: None,
                tool_calls: None,
                tool_call_id: None,
            }],
        };

        let result = agent.process_thread(&thread).await.unwrap();
        let content = result.content.unwrap();
        assert!(content[0].text.contains("Salt Lake City"));
    }

    /// Test 2: Single tool call then response
    #[tokio::test]
    async fn test_single_tool_call() {
        let first_response = r#"{
            "id": "test-id",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "gpt-4",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": [],
                    "tool_calls": [{
                        "id": "call_123",
                        "type": "function",
                        "function": {
                            "name": "get_current_weather",
                            "arguments": "{\"city\":\"Salt Lake City\"}",
                            "call_type": "function"
                        }
                    }]
                },
                "finish_reason": "tool_calls"
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 20,
                "total_tokens": 30
            }
        }"#;

        let second_response = r#"{
            "id": "test-id",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "gpt-4",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": [{
                        "text": "The current weather in Salt Lake City is 75°F, Sunny, with 45% humidity.",
                        "type": "text"
                    }]
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 15,
                "completion_tokens": 25,
                "total_tokens": 40
            }
        }"#;

        let mut server = mockito::Server::new_async().await;
        let mock1 = server
            .mock("POST", "/v1/chat/completions")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(first_response)
            .expect(1)
            .create_async()
            .await;

        let mock2 = server
            .mock("POST", "/v1/chat/completions")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(second_response)
            .expect(1)
            .create_async()
            .await;

        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url()));
        let agent = create_weather_agent(client);

        let thread = Thread {
            id: "test-thread".to_string(),
            messages: vec![Message {
                role: "user".to_string(),
                content: Some(vec![Content {
                    text: "What's the current weather in Salt Lake City?".to_string(),
                    type_: "text".to_string(),
                }]),
                name: None,
                tool_calls: None,
                tool_call_id: None,
            }],
        };

        let result = agent.process_thread(&thread).await.unwrap();
        let content = result.content.unwrap();
        assert!(content[0].text.contains("75°F"));
    }

    /// Test 3: Multiple tool calls then response
    #[tokio::test]
    async fn test_multiple_tool_calls() {
        let first_response = r#"{
            "id": "test-id",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "gpt-4",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": [],
                    "tool_calls": [
                        {
                            "id": "call_123",
                            "type": "function",
                            "function": {
                                "name": "get_current_weather",
                                "arguments": "{\"city\":\"Salt Lake City\"}",
                                "call_type": "function"
                            }
                        },
                        {
                            "id": "call_124",
                            "type": "function",
                            "function": {
                                "name": "get_air_quality",
                                "arguments": "{\"city\":\"Salt Lake City\"}",
                                "call_type": "function"
                            }
                        }
                    ]
                },
                "finish_reason": "tool_calls"
            }],
            "usage": {
                "prompt_tokens": 12,
                "completion_tokens": 22,
                "total_tokens": 34
            }
        }"#;

        let second_response = r#"{
            "id": "test-id",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "gpt-4",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": [{
                        "text": "In Salt Lake City, it's currently 75°F and sunny with good air quality (AQI: 42).",
                        "type": "text"
                    }]
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 18,
                "completion_tokens": 28,
                "total_tokens": 46
            }
        }"#;

        let mut server = mockito::Server::new_async().await;
        let mock1 = server
            .mock("POST", "/v1/chat/completions")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(first_response)
            .expect(1)
            .create_async()
            .await;

        let mock2 = server
            .mock("POST", "/v1/chat/completions")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(second_response)
            .expect(1)
            .create_async()
            .await;

        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url()));
        let agent = create_weather_agent(client);

        let thread = Thread {
            id: "test-thread".to_string(),
            messages: vec![Message {
                role: "user".to_string(),
                content: Some(vec![Content {
                    text: "What's the weather and air quality in Salt Lake City?".to_string(),
                    type_: "text".to_string(),
                }]),
                name: None,
                tool_calls: None,
                tool_call_id: None,
            }],
        };

        let result = agent.process_thread(&thread).await.unwrap();
        let content = result.content.unwrap();
        assert!(content[0].text.contains("75°F") && content[0].text.contains("AQI"));
    }

    /// Test 4: Streaming response
    #[tokio::test]
    async fn test_streaming_response() {
        let stream_responses = vec![
            serde_json::json!({
                "id": "test-id",
                "object": "chat.completion.chunk",
                "created": 1234567890,
                "model": "gpt-4",
                "choices": [{
                    "index": 0,
                    "delta": {
                        "role": "assistant",
                        "content": [{
                            "text": "The current",
                            "type": "text"
                        }]
                    },
                    "finish_reason": null
                }]
            }),
            serde_json::json!({
                "id": "test-id",
                "object": "chat.completion.chunk",
                "created": 1234567890,
                "model": "gpt-4",
                "choices": [{
                    "index": 0,
                    "delta": {
                        "content": [{
                            "text": " weather",
                            "type": "text"
                        }]
                    },
                    "finish_reason": null
                }]
            }),
            serde_json::json!({
                "id": "test-id",
                "object": "chat.completion.chunk",
                "created": 1234567890,
                "model": "gpt-4",
                "choices": [{
                    "index": 0,
                    "delta": {
                        "content": [{
                            "text": " in Salt Lake City",
                            "type": "text"
                        }]
                    },
                    "finish_reason": null
                }]
            }),
            serde_json::json!({
                "id": "test-id",
                "object": "chat.completion.chunk",
                "created": 1234567890,
                "model": "gpt-4",
                "choices": [{
                    "index": 0,
                    "delta": {
                        "content": [{
                            "text": " is sunny",
                            "type": "text"
                        }]
                    },
                    "finish_reason": "stop"
                }]
            }),
        ];

        let stream_body = stream_responses
            .iter()
            .map(|r| format!("data: {}\n\n", r.to_string()))
            .collect::<String>()
            + "data: [DONE]\n\n";

        let mut server = mockito::Server::new_async().await;
        let mock = server
            .mock("POST", "/v1/chat/completions")
            .with_status(200)
            .with_header("content-type", "text/event-stream")
            .with_body(stream_body)
            .create_async()
            .await;

        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url()));
        let agent = create_weather_agent(client);

        let thread = Thread {
            id: "test-thread".to_string(),
            messages: vec![Message {
                role: "user".to_string(),
                content: Some(vec![Content {
                    text: "What's the weather in Salt Lake City?".to_string(),
                    type_: "text".to_string(),
                }]),
                name: None,
                tool_calls: None,
                tool_call_id: None,
            }],
        };

        let mut stream = agent.stream_process_thread(&thread).await.unwrap();
        let mut received_content = String::new();

        while let Some(message_result) = stream.recv().await {
            let message = message_result.unwrap();
            received_content = message.content.unwrap()[0].text.clone();
        }

        assert_eq!(
            received_content,
            "The current weather in Salt Lake City is sunny"
        );
    }
}
