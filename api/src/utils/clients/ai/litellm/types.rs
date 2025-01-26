use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<Message>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub store: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reasoning_effort: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frequency_penalty: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logit_bias: Option<HashMap<String, i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub log_probs: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_logprobs: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_completion_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub n: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modalities: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prediction: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub presence_penalty: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub response_format: Option<ResponseFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub service_tier: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stop: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<Vec<Tool>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_choice: Option<ToolChoice>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parallel_tool_calls: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user: Option<String>,
}

impl Default for ChatCompletionRequest {
    fn default() -> Self {
        Self {
            model: String::new(),
            messages: Vec::new(),
            store: None,
            reasoning_effort: None,
            frequency_penalty: None,
            logit_bias: None,
            log_probs: None,
            top_logprobs: None,
            max_completion_tokens: None,
            n: None,
            presence_penalty: None,
            response_format: None,
            seed: None,
            stop: None,
            stream: None,
            temperature: None,
            top_p: None,
            tools: None,
            tool_choice: None,
            user: None,
            parallel_tool_calls: None,
            service_tier: None,
            metadata: None,
            modalities: None,
            prediction: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "role")]
#[serde(rename_all = "lowercase")]
pub enum Message {
    #[serde(alias = "system")]
    Developer {
        content: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        name: Option<String>,
    },
    User {
        content: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        name: Option<String>,
    },
    Assistant {
        #[serde(skip_serializing_if = "Option::is_none")]
        content: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        name: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        tool_calls: Option<Vec<ToolCall>>,
    },
    Tool {
        content: String,
        tool_call_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        name: Option<String>,
    },
}

// Helper methods for Message
// Intentionally leaving out name for now.
impl Message {
    pub fn system(content: impl Into<String>) -> Self {
        Self::System {
            content: content.into(),
            name: None,
        }
    }

    pub fn user(content: impl Into<String>) -> Self {
        Self::User {
            content: content.into(),
            name: None,
        }
    }

    pub fn assistant(content: impl Into<String>, tool_calls: Option<Vec<ToolCall>>) -> Self {
        Self::Assistant {
            content: Some(content.into()),
            name: None,
            tool_calls,
        }
    }

    pub fn tool(content: impl Into<String>, tool_call_id: impl Into<String>) -> Self {
        Self::Tool {
            content: content.into(),
            tool_call_id: tool_call_id.into(),
            name: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ResponseFormat {
    #[serde(rename = "type")]
    pub type_: String,
    pub json_schema: Option<Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tool {
    #[serde(rename = "type")]
    pub tool_type: String,
    pub function: Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum ToolChoice {
    None(String),
    Auto(String),
    Function { function: FunctionToolChoice },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FunctionToolChoice {
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FunctionCall {
    pub name: String,
    pub arguments: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ToolCall {
    pub id: String,
    #[serde(rename = "type")]
    pub call_type: String,
    pub function: FunctionCall,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code_interpreter: Option<CodeInterpreter>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retrieval: Option<Retrieval>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CodeInterpreter {
    pub input: String,
    pub outputs: Vec<CodeInterpreterOutput>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CodeInterpreterOutput {
    #[serde(rename = "type")]
    pub output_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<ImageOutput>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImageOutput {
    pub data: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Retrieval {
    pub id: String,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatCompletionResponse {
    pub id: String,
    pub object: String,
    pub created: i64,
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system_fingerprint: Option<String>,
    pub choices: Vec<Choice>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub service_tier: Option<String>,
    pub usage: Usage,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Choice {
    pub index: i32,
    pub message: Message,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delta: Option<Delta>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logprobs: Option<LogProbs>,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogProbs {
    pub content: Option<Vec<ContentLogProb>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContentLogProb {
    pub token: String,
    pub logprob: f32,
    pub bytes: Vec<u8>,
    pub top_logprobs: Vec<TopLogProb>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TopLogProb {
    pub token: String,
    pub logprob: f32,
    pub bytes: Vec<u8>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Usage {
    pub prompt_tokens: i32,
    pub completion_tokens: i32,
    pub total_tokens: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completion_tokens_details: Option<CompletionTokensDetails>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CompletionTokensDetails {
    pub reasoning_tokens: i32,
    pub accepted_prediction_tokens: i32,
    pub rejected_prediction_tokens: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatCompletionChunk {
    pub id: String,
    pub object: String,
    pub created: i64,
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system_fingerprint: Option<String>,
    pub choices: Vec<StreamChoice>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StreamChoice {
    pub index: i32,
    pub delta: Delta,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logprobs: Option<LogProbs>,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Delta {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub function_call: Option<FunctionCall>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<ToolCall>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_completion_request_serialization() {
        let request = ChatCompletionRequest {
            model: "gpt-4".to_string(),
            messages: vec![Message::user("Hello".to_string())],
            temperature: Some(0.7),
            ..Default::default()
        };

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("\"model\":\"gpt-4\""));
        assert!(json.contains("\"temperature\":0.7"));
        assert!(!json.contains("frequency_penalty")); // Optional fields should be omitted
    }

    #[test]
    fn test_chat_completion_request_deserialization() {
        let json = r#"{
            "model": "gpt-4",
            "messages": [{
                "role": "user",
                "content": "Hello"
            }],
            "temperature": 0.7
        }"#;

        let request: ChatCompletionRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.model, "gpt-4");
        assert_eq!(request.messages[0].role, "user");
        let content = request.messages[0].clone().content.unwrap().clone();
        assert_eq!(content, "Hello");
        assert_eq!(request.temperature, Some(0.7));
        assert_eq!(request.frequency_penalty, None);
    }

    #[test]
    fn test_tool_choice_serialization() {
        let none_choice = ToolChoice::None("none".to_string());
        let json = serde_json::to_string(&none_choice).unwrap();
        assert_eq!(json, "\"none\"");

        let function_choice = ToolChoice::Function {
            function: FunctionToolChoice {
                name: "test".to_string(),
            },
        };
        let json = serde_json::to_string(&function_choice).unwrap();
        assert!(json.contains("\"type\":\"function\""));
    }

    #[test]
    fn test_chat_completion_response_deserialization() {
        let json = r#"{
            "id": "test-id",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "gpt-4",
            "system_fingerprint": "fp_44709d6fcb",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": {
                        "text": "Hello there!",
                        "type": "text"
                    }
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
        }"#;

        let response: ChatCompletionResponse = serde_json::from_str(json).unwrap();
        assert_eq!(response.id, "test-id");
        assert_eq!(
            response.system_fingerprint,
            Some("fp_44709d6fcb".to_string())
        );
        let message = &response.choices[0].message;
        assert!(message.content.is_some());
        let content = message.content.as_ref().unwrap();
        assert_eq!(content, "Hello there!");
        assert_eq!(response.usage.total_tokens, 30);
        assert!(response.usage.completion_tokens_details.is_some());
    }

    #[test]
    fn test_chat_completion_chunk_deserialization() {
        let json = r#"{
            "id": "test-id",
            "object": "chat.completion.chunk",
            "created": 1234567890,
            "model": "gpt-4",
            "system_fingerprint": "fp_44709d6fcb",
            "choices": [{
                "index": 0,
                "delta": {
                    "role": "assistant",
                    "content": "Hello"
                },
                "finish_reason": null
            }]
        }"#;

        let chunk: ChatCompletionChunk = serde_json::from_str(json).unwrap();
        assert_eq!(chunk.id, "test-id");
        assert_eq!(chunk.system_fingerprint, Some("fp_44709d6fcb".to_string()));
        let content = chunk.choices[0].delta.content.as_ref().unwrap().clone();
        assert_eq!(content, "Hello");
    }

    #[test]
    fn test_tool_call_response_deserialization() {
        let json = r#"{
            "id": "test-id",
            "object": "chat.completion",
            "created": 1234567890,
            "model": "gpt-4",
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
                            "arguments": "{\"location\":\"Boston, MA\"}",
                            "type": "function"
                        }
                    }]
                },
                "finish_reason": "tool_calls"
            }],
            "usage": {
                "prompt_tokens": 82,
                "completion_tokens": 17,
                "total_tokens": 99
            }
        }"#;

        let response: ChatCompletionResponse = serde_json::from_str(json).unwrap();
        assert_eq!(response.id, "test-id");
        let tool_calls = response.choices[0].message.tool_calls.as_ref().unwrap();
        assert_eq!(tool_calls[0].id, "call_123");
        assert_eq!(tool_calls[0].function.name, "get_current_weather");
    }
}
