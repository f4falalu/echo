use anyhow::Result;
use futures_util::StreamExt;
use reqwest::{header, Client};
use std::env;
use tokio::sync::mpsc;
use once_cell::sync::Lazy;

use super::types::*;

// Debug flag controlled by environment variable
static DEBUG_ENABLED: Lazy<bool> = Lazy::new(|| {
    env::var("LITELLM_DEBUG")
        .map(|val| val.to_lowercase() == "true" || val == "1")
        .unwrap_or(false)
});

#[derive(Clone, Debug)]
pub struct LiteLLMClient {
    client: Client,
    pub(crate) base_url: String,
}

impl LiteLLMClient {
    // Helper function for conditional debug logging
    fn debug_log(msg: &str) {
        if *DEBUG_ENABLED {
            println!("DEBUG: {}", msg);
        }
    }
    
    pub fn new(api_key: Option<String>, base_url: Option<String>) -> Result<Self> {
        let api_key = api_key.or_else(|| env::var("LLM_API_KEY").ok())
            .ok_or_else(|| anyhow::anyhow!("LLM_API_KEY must be provided either through parameter or environment variable"))?;

        let base_url = base_url
            .or_else(|| env::var("LLM_BASE_URL").ok())
            .unwrap_or_else(|| "http://localhost:8000".to_string());

        let mut headers = header::HeaderMap::new();
        headers.insert(
            "Authorization",
            header::HeaderValue::from_str(&format!("Bearer {}", api_key))
                .map_err(|e| anyhow::anyhow!("Invalid API key format: {}", e))?,
        );
        headers.insert(
            "Content-Type",
            header::HeaderValue::from_static("application/json"),
        );
        headers.insert(
            "Accept",
            header::HeaderValue::from_static("application/json"),
        );

        let client = Client::builder()
            .default_headers(headers)
            .build()
            .map_err(|e| anyhow::anyhow!("Failed to create HTTP client: {}", e))?;

        Ok(Self {
            client,
            base_url,
        })
    }

    pub async fn chat_completion(
        &self,
        request: ChatCompletionRequest,
    ) -> Result<ChatCompletionResponse> {
        let url = format!("{}/chat/completions", self.base_url);

        Self::debug_log(&format!("Sending chat completion request to URL: {}", url));
        if *DEBUG_ENABLED {
            Self::debug_log(&format!(
                "Request payload: {}",
                serde_json::to_string_pretty(&request).unwrap()
            ));
        }

        let response = self
            .client
            .post(&url)
            .json(&request)
            .send()
            .await?;

        // Get the raw response text
        let response_text = response.text().await?;
        if *DEBUG_ENABLED {
            Self::debug_log(&format!("Raw response payload: {}", response_text));
        }

        // Parse the response text into the expected type
        let response: ChatCompletionResponse = serde_json::from_str(&response_text)?;

        // Log tool calls if present and debug is enabled
        if *DEBUG_ENABLED {
            if let Some(AgentMessage::Assistant {
                tool_calls: Some(tool_calls),
                ..
            }) = response.choices.first().map(|c| &c.message)
            {
                Self::debug_log("Tool calls in response:");
                for tool_call in tool_calls {
                    Self::debug_log(&format!("Tool Call ID: {}", tool_call.id));
                    Self::debug_log(&format!("Tool Name: {}", tool_call.function.name));
                    Self::debug_log(&format!("Tool Arguments: {}", tool_call.function.arguments));
                }
            }

            Self::debug_log(&format!(
                "Received chat completion response: {}",
                serde_json::to_string_pretty(&response).unwrap()
            ));
        }

        Ok(response)
    }

    pub async fn stream_chat_completion(
        &self,
        request: ChatCompletionRequest,
    ) -> Result<mpsc::Receiver<Result<ChatCompletionChunk>>> {
        let url = format!("{}/chat/completions", self.base_url);

        Self::debug_log(&format!(
            "Starting stream chat completion request to URL: {}",
            url
        ));
        if *DEBUG_ENABLED {
            Self::debug_log(&format!(
                "Stream request payload: {}",
                serde_json::to_string_pretty(&request).unwrap()
            ));
        }

        let mut stream = self
            .client
            .post(&url)
            .json(&ChatCompletionRequest {
                stream: Some(true),
                ..request
            })
            .send()
            .await?
            .bytes_stream();

        let (tx, rx) = mpsc::channel(100);
        let debug_enabled = *DEBUG_ENABLED; // Capture for the async block

        tokio::spawn(async move {
            let mut buffer = String::new();
            if debug_enabled {
                Self::debug_log("Stream processing started");
            }

            while let Some(chunk_result) = stream.next().await {
                match chunk_result {
                    Ok(chunk) => {
                        let chunk_str = String::from_utf8_lossy(&chunk);
                        if debug_enabled {
                            Self::debug_log(&format!("Raw response payload: {}", chunk_str));
                        }
                        buffer.push_str(&chunk_str);

                        while let Some(pos) = buffer.find("\n\n") {
                            let line = buffer[..pos].trim().to_string();
                            buffer = buffer[pos + 2..].to_string();

                            if let Some(data) = line.strip_prefix("data: ") {
                                if debug_enabled {
                                    Self::debug_log(&format!("Processing stream data: {}", data));
                                }
                                if data == "[DONE]" {
                                    if debug_enabled {
                                        Self::debug_log("Stream completed with [DONE] signal");
                                    }
                                    break;
                                }

                                if let Ok(response) =
                                    serde_json::from_str::<ChatCompletionChunk>(data)
                                {
                                    // Log tool calls if present and debug is enabled
                                    if debug_enabled {
                                        if let Some(tool_calls) = &response.choices[0].delta.tool_calls
                                        {
                                            Self::debug_log("Tool calls in stream chunk:");
                                            for tool_call in tool_calls {
                                                if let (Some(id), Some(function)) =
                                                    (tool_call.id.clone(), tool_call.function.clone())
                                                {
                                                    Self::debug_log(&format!("Tool Call ID: {}", id));
                                                    if let Some(name) = function.name {
                                                        Self::debug_log(&format!("Tool Name: {}", name));
                                                    }
                                                    if let Some(arguments) = function.arguments {
                                                        Self::debug_log(&format!(
                                                            "Tool Arguments: {}",
                                                            arguments
                                                        ));
                                                    }
                                                }
                                            }
                                        }
                                        Self::debug_log(&format!("Parsed stream chunk: {:?}", response));
                                    }
                                    
                                    // Use try_send instead of send to avoid blocking
                                    if tx.try_send(Ok(response)).is_err() {
                                        // If the channel is full, log it but continue processing
                                        if debug_enabled {
                                            Self::debug_log("Warning: Channel full, receiver not keeping up");
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => {
                        if debug_enabled {
                            Self::debug_log(&format!("Error in stream processing: {:?}", e));
                        }
                        // Use try_send to avoid blocking
                        let _ = tx.try_send(Err(anyhow::Error::from(e)));
                    }
                }
            }
            if debug_enabled {
                Self::debug_log("Stream processing completed");
            }
        });

        if debug_enabled {
            Self::debug_log("Returning stream receiver");
        }
        Ok(rx)
    }

    pub async fn generate_embeddings(
        &self,
        request: EmbeddingRequest,
    ) -> Result<EmbeddingResponse> {
        let url = format!("{}/embeddings", self.base_url);

        Self::debug_log(&format!("Sending embedding request to URL: {}", url));
        if *DEBUG_ENABLED {
            Self::debug_log(&format!(
                "Embedding request payload: {}",
                serde_json::to_string_pretty(&request).unwrap_or_else(|e| format!("Serialization Error: {}", e))
            ));
        }

        let response = self
            .client
            .post(&url)
            .json(&request)
            .send()
            .await?;

        // Check for non-success status codes first
        let status = response.status();
        let response_text = response.text().await?;
        if !status.is_success() {
            Self::debug_log(&format!(
                "Error response from embedding endpoint (Status: {}): {}",
                status,
                response_text
            ));
            return Err(anyhow::anyhow!(
                "Embedding request failed with status {}: {}",
                status,
                response_text
            ));
        }
        
        if *DEBUG_ENABLED {
            Self::debug_log(&format!("Raw embedding response payload: {}", response_text));
        }

        // Parse the response text into the expected type
        let response: EmbeddingResponse = serde_json::from_str(&response_text)
            .map_err(|e| anyhow::anyhow!("Failed to deserialize embedding response: {}. Response text: {}", e, response_text))?;


        if *DEBUG_ENABLED {
             Self::debug_log(&format!(
                "Received embedding response: {}",
                serde_json::to_string_pretty(&response).unwrap_or_else(|e| format!("Serialization Error: {}", e))
            ));
        }

        Ok(response)
    }
}

impl Default for LiteLLMClient {
    fn default() -> Self {
        match Self::new(None, None) {
            Ok(client) => client,
            Err(e) => {
                if *DEBUG_ENABLED {
                    eprintln!("ERROR: Failed to create default LiteLLMClient: {}", e);
                }
                panic!("Failed to create default LiteLLMClient: {}", e);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use mockito;
    use std::env;
    use std::time::Duration;
    use tokio::time::timeout;
    
    #[tokio::test]
    async fn test_client_initialization_without_api_key() {
        // Clear environment variable first to ensure test consistency
        env::remove_var("LLM_API_KEY");
        
        // Should return an error about missing API key
        let result = LiteLLMClient::new(None, None);
        assert!(result.is_err());
        
        // Verify the error message contains information about the missing API key
        let error = result.unwrap_err();
        let error_message = error.to_string();
        assert!(error_message.contains("LLM_API_KEY must be provided"));
    }
    
    #[tokio::test]
    async fn test_client_initialization_with_explicit_values() {
        let api_key = "test-api-key";
        let base_url = "https://test-url.com";
        
        let client = LiteLLMClient::new(Some(api_key.to_string()), Some(base_url.to_string())).unwrap();
        
        assert_eq!(client.base_url, base_url);
        // We can't directly test the API key as it's stored in the headers
        // but we can test that the client was created successfully
    }
    
    #[tokio::test]
    async fn test_client_default_base_url() {
        // Clear environment variable first
        env::remove_var("LLM_BASE_URL");
        
        let api_key = "test-api-key";
        let expected_default_url = "http://localhost:8000";
        
        let client = LiteLLMClient::new(Some(api_key.to_string()), None).unwrap();
        
        assert_eq!(client.base_url, expected_default_url);
    }
    
    #[tokio::test]
    async fn test_client_default_constructor() {
        // Set environment variables to test default constructor
        env::set_var("LLM_API_KEY", "env-api-key");
        env::set_var("LLM_BASE_URL", "http://env-url.com");
        
        let client = LiteLLMClient::default();
        
        assert_eq!(client.base_url, "http://env-url.com");
        
        // Clean up
        env::remove_var("LLM_API_KEY");
        env::remove_var("LLM_BASE_URL");
    }
    
    #[tokio::test]
    async fn test_headers_configuration() {
        let mut server = mockito::Server::new_async().await;
        
        // Mock the server to check headers
        let mock = server
            .mock("POST", "/chat/completions")
            .match_header("Authorization", "Bearer test-key")
            .match_header("Content-Type", "application/json")
            .match_header("Accept", "application/json")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(r#"{"id":"test-id","object":"chat.completion","created":1,"model":"test","choices":[],"usage":{"prompt_tokens":0,"completion_tokens":0,"total_tokens":0}}"#)
            .create();
        
        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();
        
        // A minimal request to trigger the API call
        let request = ChatCompletionRequest {
            model: "test-model".to_string(),
            messages: vec![AgentMessage::user("test")],
            ..Default::default()
        };
        
        // Make the request to verify headers
        let _ = client.chat_completion(request).await;
        
        // Verify the headers were sent correctly
        mock.assert();
    }

    // Removed unused setup function

    fn create_test_message() -> AgentMessage {
        AgentMessage::user("Hello".to_string())
    }

    fn create_test_request() -> ChatCompletionRequest {
        ChatCompletionRequest {
            model: "gpt-4".to_string(),
            messages: vec![create_test_message()],
            temperature: Some(0.7),
            ..Default::default()
        }
    }

    #[tokio::test]
    async fn test_chat_completion_success() {
        let mut server = mockito::Server::new_async().await;

        let request = create_test_request();
        let request_body = serde_json::to_string(&request).unwrap();

        let mock = server
            .mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .match_body(mockito::Matcher::JsonString(request_body))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(
                r#"{
                "id": "test-id",
                "object": "chat.completion",
                "created": 1234567890,
                "model": "gpt-4",
                "system_fingerprint": "fp_44709d6fcb",
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "Hello there!"
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 20,
                    "total_tokens": 30,
                    "completion_tokens_details": {
                        "reasoning_tokens": 0,
                        "accepted_prediction_tokens": 0,
                        "rejected_prediction_tokens": 0
                    }
                }
            }"#,
            )
            .create();

        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();

        let response = client.chat_completion(request).await.unwrap();
        assert_eq!(response.id, "test-id");
        if let AgentMessage::Assistant { content, .. } = response.choices[0].message.clone() {
            assert_eq!(content.unwrap(), "Hello there!");
        } else {
            panic!("Expected assistant message");
        }

        mock.assert();
    }

    #[tokio::test]
    async fn test_chat_completion_error() {
        let mut server = mockito::Server::new_async().await;

        let request = create_test_request();
        let request_body = serde_json::to_string(&request).unwrap();

        let mock = server
            .mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .match_body(mockito::Matcher::JsonString(request_body))
            .with_status(400)
            .with_header("content-type", "application/json")
            .with_body(r#"{"error": "Invalid request"}"#)
            .create();

        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();

        let result = client.chat_completion(request).await;
        assert!(result.is_err());

        mock.assert();
    }

    #[tokio::test]
    async fn test_stream_chat_completion() {
        let mut server = mockito::Server::new_async().await;

        let mut request = create_test_request();
        request.stream = Some(true);
        let request_body = serde_json::to_string(&request).unwrap();

        let mock = server.mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .match_body(mockito::Matcher::JsonString(request_body))
            .with_status(200)
            .with_header("content-type", "text/event-stream")
            .with_body(
                "data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"system_fingerprint\":\"fp_44709d6fcb\",\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\",\"content\":\"Hello\"},\"finish_reason\":null}]}\n\n\
                 data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"system_fingerprint\":\"fp_44709d6fcb\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\" world\"},\"finish_reason\":null}]}\n\n\
                 data: [DONE]\n\n"
            )
            .create();

        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();

        let mut stream = client.stream_chat_completion(request).await.unwrap();

        let mut chunks = Vec::new();
        while let Ok(Some(chunk)) = timeout(Duration::from_secs(1), stream.recv()).await {
            if let Ok(chunk) = chunk {
                chunks.push(chunk);
            }
        }

        assert_eq!(chunks.len(), 2);
        // First chunk assertions
        let first_chunk = &chunks[0].choices[0].delta;
        assert_eq!(first_chunk.content.as_ref().unwrap(), "Hello");

        // Second chunk assertions
        let second_chunk = &chunks[1].choices[0].delta;
        assert_eq!(second_chunk.content.as_ref().unwrap(), " world");
        assert!(second_chunk.role.is_none());
        assert!(second_chunk.tool_calls.is_none());

        mock.assert();
    }

    #[tokio::test]
    async fn test_tool_call_completion() {
        let mut server = mockito::Server::new_async().await;

        let request = create_test_request();
        let request_body = serde_json::to_string(&request).unwrap();

        let mock = server
            .mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .match_body(mockito::Matcher::JsonString(request_body))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(
                r#"{
                "id": "test-id",
                "object": "chat.completion",
                "created": 1234567890,
                "model": "gpt-4",
                "system_fingerprint": "fp_44709d6fcb",
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": null,
                        "tool_calls": [{
                            "id": "call_123",
                            "type": "function",
                            "function": {
                                "name": "get_current_weather",
                                "arguments": "{\"location\":\"Boston, MA\"}"
                            }
                        }]
                    },
                    "finish_reason": "tool_calls"
                }],
                "usage": {
                    "prompt_tokens": 82,
                    "completion_tokens": 17,
                    "total_tokens": 99,
                    "completion_tokens_details": {
                        "reasoning_tokens": 0,
                        "accepted_prediction_tokens": 0,
                        "rejected_prediction_tokens": 0
                    }
                }
            }"#,
            )
            .create();

        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();

        let response = client.chat_completion(request).await.unwrap();
        assert_eq!(response.id, "test-id");
        if let AgentMessage::Assistant {
            content,
            tool_calls,
            ..
        } = &response.choices[0].message
        {
            assert!(content.is_none());
            let tool_calls = tool_calls.as_ref().unwrap();
            assert_eq!(tool_calls[0].id, "call_123");
            assert_eq!(tool_calls[0].function.name, "get_current_weather");
            assert_eq!(
                tool_calls[0].function.arguments,
                "{\"location\":\"Boston, MA\"}"
            );
        } else {
            panic!("Expected assistant message");
        }

        mock.assert();
    }

    #[test]
    fn test_client_initialization_with_env_vars() {
        let test_api_key = "test-env-key";
        let test_base_url = "http://test-env-url";

        env::set_var("LLM_API_KEY", test_api_key);
        env::set_var("LLM_BASE_URL", test_base_url);

        // Test with no parameters (should use env vars)
        // This would fail without an API key in env, so we set a temporary one
        // We use it to test the constructor fallback to environment variables
        env::set_var("LLM_API_KEY", "test-env-key");
        let client = LiteLLMClient::new(None, None).unwrap();
        assert_eq!(client.base_url, test_base_url);

        // Test with parameters (should override env vars)
        let override_key = "override-key";
        let override_url = "http://override-url";
        let client = LiteLLMClient::new(
            Some(override_key.to_string()),
            Some(override_url.to_string()),
        ).unwrap();
        assert_eq!(client.base_url, override_url);

        env::remove_var("LLM_API_KEY");
        env::remove_var("LLM_BASE_URL");
    }

    #[tokio::test]
    async fn test_single_message_completion() {
        let mut server = mockito::Server::new_async().await;
        
        // Mock the response
        let mock = server
            .mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(r#"{
                "id": "test-id",
                "object": "chat.completion",
                "created": 1234567890,
                "model": "o1",
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": "Hello, world! How can I assist you today?"
                        },
                        "finish_reason": "stop"
                    }
                ],
                "usage": {
                    "prompt_tokens": 10,
                    "completion_tokens": 10,
                    "total_tokens": 20
                }
            }"#)
            .create();

        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();

        let request = ChatCompletionRequest {
            model: "o1".to_string(),
            messages: vec![AgentMessage::user("Hello, world!".to_string())],
            ..Default::default()
        };

        let response = match client.chat_completion(request).await {
            Ok(response) => response,
            Err(e) => panic!("Error processing thread: {:?}", e),
        };

        assert!(response.choices.len() > 0);
        mock.assert();
    }
    
    #[tokio::test]
    async fn test_generate_embeddings_success() {
        let mut server = mockito::Server::new_async().await;
        
        // Create a test embedding request
        let request = EmbeddingRequest {
            model: "text-embedding-3-small".to_string(),
            input: vec!["This is a test sentence.".to_string()],
            encoding_format: None,
            dimensions: None,
            user: None,
        };
        
        let request_body = serde_json::to_string(&request).unwrap();
        
        // Expected response
        let response_body = r#"{
            "object": "list",
            "data": [
                {
                    "object": "embedding",
                    "index": 0,
                    "embedding": [0.1, 0.2, 0.3]
                }
            ],
            "model": "text-embedding-3-small",
            "usage": {
                "prompt_tokens": 5,
                "total_tokens": 5
            }
        }"#;
        
        // Set up mock
        let mock = server
            .mock("POST", "/embeddings")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .match_body(mockito::Matcher::JsonString(request_body))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(response_body)
            .create();
        
        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();
        
        // Make the request
        let response = client.generate_embeddings(request).await.unwrap();
        
        // Verify response
        assert_eq!(response.data.len(), 1);
        assert_eq!(response.data[0].index, 0);
        assert_eq!(response.data[0].embedding, vec![0.1, 0.2, 0.3]);
        assert_eq!(response.model, "text-embedding-3-small");
        assert_eq!(response.usage.prompt_tokens, 5);
        assert_eq!(response.usage.total_tokens, 5);
        
        mock.assert();
    }
    
    #[tokio::test]
    async fn test_generate_embeddings_with_parameters() {
        let mut server = mockito::Server::new_async().await;
        
        // Create a test embedding request with all parameters
        let request = EmbeddingRequest {
            model: "text-embedding-3-large".to_string(),
            input: vec!["First sentence.".to_string(), "Second sentence.".to_string()],
            encoding_format: Some("float".to_string()),
            dimensions: Some(256),
            user: Some("test-user".to_string()),
        };
        
        let request_body = serde_json::to_string(&request).unwrap();
        
        // Expected response for multiple inputs
        let response_body = r#"{
            "object": "list",
            "data": [
                {
                    "object": "embedding",
                    "index": 0,
                    "embedding": [0.1, 0.2, 0.3]
                },
                {
                    "object": "embedding",
                    "index": 1,
                    "embedding": [0.4, 0.5, 0.6]
                }
            ],
            "model": "text-embedding-3-large",
            "usage": {
                "prompt_tokens": 10,
                "total_tokens": 10
            }
        }"#;
        
        // Set up mock
        let mock = server
            .mock("POST", "/embeddings")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .match_body(mockito::Matcher::JsonString(request_body))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(response_body)
            .create();
        
        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();
        
        // Make the request
        let response = client.generate_embeddings(request).await.unwrap();
        
        // Verify response
        assert_eq!(response.data.len(), 2);
        assert_eq!(response.data[0].index, 0);
        assert_eq!(response.data[0].embedding, vec![0.1, 0.2, 0.3]);
        assert_eq!(response.data[1].index, 1);
        assert_eq!(response.data[1].embedding, vec![0.4, 0.5, 0.6]);
        assert_eq!(response.model, "text-embedding-3-large");
        assert_eq!(response.usage.prompt_tokens, 10);
        assert_eq!(response.usage.total_tokens, 10);
        
        mock.assert();
    }
    
    #[tokio::test]
    async fn test_generate_embeddings_api_error() {
        let mut server = mockito::Server::new_async().await;
        
        // Create a test embedding request
        let request = EmbeddingRequest {
            model: "invalid-model".to_string(),
            input: vec!["Test".to_string()],
            encoding_format: None,
            dimensions: None,
            user: None,
        };
        
        let request_body = serde_json::to_string(&request).unwrap();
        
        // Error response
        let error_response = r#"{
            "error": {
                "code": "model_not_found",
                "message": "The model 'invalid-model' does not exist"
            }
        }"#;
        
        // Set up mock
        let mock = server
            .mock("POST", "/embeddings")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .match_body(mockito::Matcher::JsonString(request_body))
            .with_status(404)
            .with_header("content-type", "application/json")
            .with_body(error_response)
            .create();
        
        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();
        
        // Make the request and expect an error
        let result = client.generate_embeddings(request).await;
        assert!(result.is_err());
        
        // Verify the error contains useful information
        let error = result.unwrap_err();
        let error_string = error.to_string();
        assert!(error_string.contains("404"));
        
        mock.assert();
    }
    
    #[tokio::test]
    async fn test_network_error_handling() {
        // Create a server URL that will never connect
        let server_url = "http://localhost:1"; // Using port 1 to ensure no service is running
        
        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server_url.to_string())).unwrap();
        
        let request = ChatCompletionRequest {
            model: "test-model".to_string(),
            messages: vec![AgentMessage::user("Test")],
            ..Default::default()
        };
        
        // Attempt request which should fail with network error
        let result = client.chat_completion(request).await;
        
        // Verify we got an error (don't check the specifics as they vary by environment)
        assert!(result.is_err());
        
        // Print the error for debugging
        let error = result.unwrap_err();
        println!("Network error: {:?}", error);
    }
    
    #[tokio::test]
    #[ignore] // This test actually makes a real HTTP request to an invalid port, so it's slow
    async fn test_timeout_simulation() {
        // Use a blackhole address that will cause a connection timeout
        let server_url = "http://198.51.100.1:8000"; // TEST-NET-2 reserved for documentation
        
        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server_url.to_string())).unwrap();
        
        let request = ChatCompletionRequest {
            model: "test-model".to_string(),
            messages: vec![AgentMessage::user("Test")],
            ..Default::default()
        };
        
        // Wrap the client call with a short timeout
        let result = tokio::time::timeout(
            Duration::from_millis(100), // Short timeout
            client.chat_completion(request)
        ).await;
        
        // We expect the timeout to be hit
        assert!(result.is_err());
        assert!(matches!(result, Err(tokio::time::error::Elapsed { .. })));
    }
    
    #[tokio::test]
    async fn test_rate_limit_error_handling() {
        let mut server = mockito::Server::new_async().await;
        
        // Set up a mock that simulates a rate limit error
        let mock = server
            .mock("POST", "/chat/completions")
            .with_status(429) // Too many requests
            .with_header("content-type", "application/json")
            .with_header("retry-after", "30") // Suggest retry after 30 seconds
            .with_body(r#"{"error":{"message":"Rate limit exceeded","type":"rate_limit_error"}}"#)
            .create();
        
        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();
        
        let request = ChatCompletionRequest {
            model: "test-model".to_string(),
            messages: vec![AgentMessage::user("Test")],
            ..Default::default()
        };
        
        // Attempt request which should fail with rate limit error
        let result = client.chat_completion(request).await;
        
        // Verify we got an error (don't check the specifics as they vary by environment)
        assert!(result.is_err());
        
        // Print the error for debugging
        let error = result.unwrap_err();
        println!("Rate limit error: {:?}", error);
        
        mock.assert();
    }
    
    #[tokio::test]
    async fn test_invalid_json_response_handling() {
        let mut server = mockito::Server::new_async().await;
        
        // Set up a mock that returns invalid JSON
        let mock = server
            .mock("POST", "/chat/completions")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body("This is not valid JSON")
            .create();
        
        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();
        
        let request = ChatCompletionRequest {
            model: "test-model".to_string(),
            messages: vec![AgentMessage::user("Test")],
            ..Default::default()
        };
        
        // Attempt request which should fail with parsing error
        let result = client.chat_completion(request).await;
        
        // Verify we got an error (don't check the specifics as they vary by environment)
        assert!(result.is_err());
        
        // Print the error for debugging
        let error = result.unwrap_err();
        println!("Invalid JSON error: {:?}", error);
        
        mock.assert();
    }
    
    #[tokio::test]
    async fn test_unexpected_server_error_handling() {
        let mut server = mockito::Server::new_async().await;
        
        // Set up a mock that returns a 500 server error
        let mock = server
            .mock("POST", "/chat/completions")
            .with_status(500)
            .with_header("content-type", "application/json")
            .with_body(r#"{"error":{"message":"Internal server error","type":"server_error"}}"#)
            .create();
        
        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();
        
        let request = ChatCompletionRequest {
            model: "test-model".to_string(),
            messages: vec![AgentMessage::user("Test")],
            ..Default::default()
        };
        
        // Attempt request which should fail with server error
        let result = client.chat_completion(request).await;
        
        // Verify we got an error (don't check the specifics as they vary by environment)
        assert!(result.is_err());
        
        // Print the error for debugging
        let error = result.unwrap_err();
        println!("Server error: {:?}", error);
        
        mock.assert();
    }
    
    #[tokio::test]
    async fn test_stream_with_partial_chunks() {
        let mut server = mockito::Server::new_async().await;
        
        // Create a request for streaming
        let request = ChatCompletionRequest {
            model: "gpt-4".to_string(),
            messages: vec![
                AgentMessage::user("Tell me a short story"),
            ],
            stream: Some(true),
            ..Default::default()
        };
        
        // Mock response with multiple chunks building a response
        let stream_response = "data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"system_fingerprint\":\"fp_1\",\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\"},\"finish_reason\":null}]}\n\n\
                               data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"Once\"},\"finish_reason\":null}]}\n\n\
                               data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\" upon\"},\"finish_reason\":null}]}\n\n\
                               data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\" a\"},\"finish_reason\":null}]}\n\n\
                               data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\" time\"},\"finish_reason\":null}]}\n\n\
                               data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{},\"finish_reason\":\"stop\"}]}\n\n\
                               data: [DONE]\n\n";
        
        // Set up mock
        let mock = server
            .mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .with_status(200)
            .with_header("content-type", "text/event-stream")
            .with_body(stream_response)
            .create();
        
        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();
        
        // Make the request
        let mut stream = client.stream_chat_completion(request).await.unwrap();
        
        // Collect all chunks
        let mut chunks = Vec::new();
        while let Some(chunk_result) = stream.recv().await {
            match chunk_result {
                Ok(chunk) => chunks.push(chunk),
                Err(e) => panic!("Error in stream: {:?}", e),
            }
        }
        
        // Verify chunks
        assert_eq!(chunks.len(), 6); // 5 content chunks + 1 finish chunk
        
        // First chunk should have role
        assert_eq!(chunks[0].choices[0].delta.role, Some("assistant".to_string()));
        
        // Content chunks should build the story
        assert_eq!(chunks[1].choices[0].delta.content, Some("Once".to_string()));
        assert_eq!(chunks[2].choices[0].delta.content, Some(" upon".to_string()));
        assert_eq!(chunks[3].choices[0].delta.content, Some(" a".to_string()));
        assert_eq!(chunks[4].choices[0].delta.content, Some(" time".to_string()));
        
        // Last chunk should have finish reason
        assert_eq!(chunks[5].choices[0].finish_reason, Some("stop".to_string()));
        assert!(chunks[5].choices[0].delta.content.is_none());
        
        mock.assert();
    }
    
    #[tokio::test]
    async fn test_stream_with_tool_calls() {
        let mut server = mockito::Server::new_async().await;
        
        // Create a request for streaming with tool calls
        let request = ChatCompletionRequest {
            model: "gpt-4".to_string(),
            messages: vec![
                AgentMessage::user("What's the weather in New York?"),
            ],
            tools: Some(vec![Tool {
                tool_type: "function".to_string(),
                function: serde_json::json!({
                    "name": "get_weather",
                    "description": "Get weather information",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {"type": "string"}
                        },
                        "required": ["location"]
                    }
                }),
            }]),
            stream: Some(true),
            ..Default::default()
        };
        
        // Mock response with tool calls in chunks
        let stream_response = "data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\"},\"finish_reason\":null}]}\n\n\
                               data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"tool_calls\":[{\"index\":0,\"id\":\"call_123\",\"type\":\"function\"}]},\"finish_reason\":null}]}\n\n\
                               data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"tool_calls\":[{\"index\":0,\"function\":{\"name\":\"get_weather\"}}]},\"finish_reason\":null}]}\n\n\
                               data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"tool_calls\":[{\"index\":0,\"function\":{\"arguments\":\"{\\\"\"}}]},\"finish_reason\":null}]}\n\n\
                               data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"tool_calls\":[{\"index\":0,\"function\":{\"arguments\":\"location\\\":\\\"\"}}]},\"finish_reason\":null}]}\n\n\
                               data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"tool_calls\":[{\"index\":0,\"function\":{\"arguments\":\"New York\\\"\"}}]},\"finish_reason\":null}]}\n\n\
                               data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"tool_calls\":[{\"index\":0,\"function\":{\"arguments\":\"}\"}}]},\"finish_reason\":null}]}\n\n\
                               data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{},\"finish_reason\":\"tool_calls\"}]}\n\n\
                               data: [DONE]\n\n";
        
        // Set up mock
        let mock = server
            .mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_header("authorization", "Bearer test-key")
            .with_status(200)
            .with_header("content-type", "text/event-stream")
            .with_body(stream_response)
            .create();
        
        let client = LiteLLMClient::new(Some("test-key".to_string()), Some(server.url())).unwrap();
        
        // Make the request
        let mut stream = client.stream_chat_completion(request).await.unwrap();
        
        // Collect all chunks
        let mut chunks = Vec::new();
        while let Some(chunk_result) = stream.recv().await {
            match chunk_result {
                Ok(chunk) => chunks.push(chunk),
                Err(e) => panic!("Error in stream: {:?}", e),
            }
        }
        
        // Basic validation (number of chunks)
        assert!(chunks.len() > 0);
        
        // First chunk should have role
        assert_eq!(chunks[0].choices[0].delta.role, Some("assistant".to_string()));
        
        // Last chunk should have finish reason
        assert_eq!(chunks.last().unwrap().choices[0].finish_reason, Some("tool_calls".to_string()));
        
        mock.assert();
    }
}
