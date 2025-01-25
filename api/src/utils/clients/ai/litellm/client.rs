use reqwest::{Client, header};
use futures_util::StreamExt;
use tokio::sync::mpsc;
use anyhow::Result;

use super::types::*;

pub struct LiteLLMClient {
    client: Client,
    pub(crate) api_key: String,
    pub(crate) base_url: String,
}

impl LiteLLMClient {
    pub fn new(api_key: String, base_url: Option<String>) -> Self {
        let mut headers = header::HeaderMap::new();
        headers.insert(
            "Authorization",
            header::HeaderValue::from_str(&format!("Bearer {}", api_key)).unwrap(),
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
            .expect("Failed to create HTTP client");

        Self {
            client,
            api_key,
            base_url: base_url.unwrap_or_else(|| "http://localhost:8000".to_string()),
        }
    }

    pub async fn chat_completion(&self, request: ChatCompletionRequest) -> Result<ChatCompletionResponse> {
        let url = format!("{}/chat/completions", self.base_url);
        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await?
            .json::<ChatCompletionResponse>()
            .await?;
        Ok(response)
    }

    pub async fn stream_chat_completion(
        &self,
        request: ChatCompletionRequest,
    ) -> Result<mpsc::Receiver<Result<ChatCompletionChunk>>> {
        let url = format!("{}/chat/completions", self.base_url);
        let mut stream = self.client
            .post(&url)
            .json(&ChatCompletionRequest {
                stream: Some(true),
                ..request
            })
            .send()
            .await?
            .bytes_stream();

        let (tx, rx) = mpsc::channel(100);
        
        tokio::spawn(async move {
            let mut buffer = String::new();
            
            while let Some(chunk_result) = stream.next().await {
                match chunk_result {
                    Ok(chunk) => {
                        let chunk_str = String::from_utf8_lossy(&chunk);
                        buffer.push_str(&chunk_str);
                        
                        while let Some(pos) = buffer.find("\n\n") {
                            let line = buffer[..pos].trim().to_string();
                            buffer = buffer[pos + 2..].to_string();
                            
                            if line.starts_with("data: ") {
                                let data = &line["data: ".len()..];
                                if data == "[DONE]" {
                                    break;
                                }
                                
                                if let Ok(response) = serde_json::from_str::<ChatCompletionChunk>(data) {
                                    let _ = tx.send(Ok(response)).await;
                                }
                            }
                        }
                    }
                    Err(e) => {
                        let _ = tx.send(Err(anyhow::Error::from(e))).await;
                    }
                }
            }
        });

        Ok(rx)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use mockito;
    use tokio::time::timeout;
    use std::time::Duration;

    fn create_test_message() -> Message {
        Message {
            role: "user".to_string(),
            content: "Hello".to_string(),
            name: None,
            tool_calls: None,
            tool_call_id: None,
        }
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
        let mut server = mockito::Server::new();
        
        let mock = server.mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_header("Authorization", "Bearer test-key")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(r#"{
                "id": "test-id",
                "object": "chat.completion",
                "created": 1234567890,
                "model": "gpt-4",
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
                    "total_tokens": 30
                }
            }"#)
            .create();

        let client = LiteLLMClient::new(
            "test-key".to_string(),
            Some(server.url()),
        );

        let response = client.chat_completion(create_test_request()).await.unwrap();
        assert_eq!(response.id, "test-id");
        assert_eq!(response.choices[0].message.content, "Hello there!");
        
        mock.assert();
    }

    #[tokio::test]
    async fn test_chat_completion_error() {
        let mut server = mockito::Server::new();
        
        let mock = server.mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .with_status(400)
            .with_body(r#"{"error": "Invalid request"}"#)
            .create();

        let client = LiteLLMClient::new(
            "test-key".to_string(),
            Some(server.url()),
        );

        let result = client.chat_completion(create_test_request()).await;
        assert!(result.is_err());
        
        mock.assert();
    }

    #[tokio::test]
    async fn test_stream_chat_completion() {
        let mut server = mockito::Server::new();
        
        let mock = server.mock("POST", "/chat/completions")
            .match_header("content-type", "application/json")
            .match_body(mockito::Matcher::JsonString(r#"{"stream":true}"#.to_string()))
            .with_status(200)
            .with_header("content-type", "text/event-stream")
            .with_body(
                "data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\",\"content\":\"Hello\"},\"finish_reason\":null}]}\n\n\
                 data: {\"id\":\"1\",\"object\":\"chat.completion.chunk\",\"created\":1234567890,\"model\":\"gpt-4\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\" world\"},\"finish_reason\":null}]}\n\n\
                 data: [DONE]\n\n"
            )
            .create();

        let client = LiteLLMClient::new(
            "test-key".to_string(),
            Some(server.url()),
        );

        let mut request = create_test_request();
        request.stream = Some(true);

        let mut stream = client.stream_chat_completion(request).await.unwrap();
        
        let mut chunks = Vec::new();
        while let Ok(Some(chunk)) = timeout(Duration::from_secs(1), stream.recv()).await {
            if let Ok(chunk) = chunk {
                chunks.push(chunk);
            }
        }

        assert_eq!(chunks.len(), 2);
        assert_eq!(chunks[0].choices[0].delta.content, Some("Hello".to_string()));
        assert_eq!(chunks[1].choices[0].delta.content, Some(" world".to_string()));
        
        mock.assert();
    }

    #[test]
    fn test_client_initialization() {
        let api_key = "test-key".to_string();
        let base_url = "http://custom.url".to_string();
        
        let client = LiteLLMClient::new(api_key.clone(), Some(base_url.clone()));
        assert_eq!(client.api_key, api_key);
        assert_eq!(client.base_url, base_url);

        let client = LiteLLMClient::new(api_key.clone(), None);
        assert_eq!(client.base_url, "http://localhost:8000");
    }
} 