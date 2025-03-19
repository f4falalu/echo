use anyhow::Result;
use reqwest::Response;
use serde::de::DeserializeOwned;
use async_trait::async_trait;

/// Extension trait for reqwest::Response that adds common assertions
#[async_trait]
pub trait ResponseAssertions {
    /// Assert response has expected status code
    fn assert_status(&self, expected: reqwest::StatusCode) -> &Self;
    
    /// Parse response body as JSON and perform assertions on it
    async fn assert_json<F, T>(&self, assertions: F) -> Result<T>
    where
        F: FnOnce(&T) -> bool + Send,
        T: DeserializeOwned;
    
    /// Assert response contains expected header
    fn assert_header(&self, name: &str, expected_value: &str) -> &Self;
    
    /// Assert response body contains a string
    async fn assert_body_contains(&self, expected_content: &str) -> Result<&Self>;
    
    /// Assert response body matches exactly
    async fn assert_body_text(&self, expected_text: &str) -> Result<&Self>;
}

/// Helper for cloning responses so we can extract JSON and still keep the response
fn try_clone(response: &Response) -> Result<Response> {
    response.try_clone()
        .ok_or_else(|| anyhow::anyhow!("Failed to clone response"))
}

#[async_trait]
impl ResponseAssertions for Response {
    fn assert_status(&self, expected: reqwest::StatusCode) -> &Self {
        assert_eq!(
            self.status(), 
            expected, 
            "Expected status code {}, got {}", 
            expected, 
            self.status()
        );
        self
    }
    
    async fn assert_json<F, T>(&self, assertions: F) -> Result<T>
    where
        F: FnOnce(&T) -> bool + Send,
        T: DeserializeOwned,
    {
        // Clone the response so we can return the parsed data
        let mut response_copy = try_clone(self)?;
        
        // Parse JSON
        let json_data: T = response_copy.json().await?;
        
        // Run assertions
        assert!(
            assertions(&json_data), 
            "JSON assertions failed for response"
        );
        
        Ok(json_data)
    }
    
    fn assert_header(&self, name: &str, expected_value: &str) -> &Self {
        let header_value = self.headers().get(name)
            .unwrap_or_else(|| panic!("Header {} not found in response", name))
            .to_str()
            .unwrap_or_else(|_| panic!("Header {} contains non-string value", name));
            
        assert_eq!(
            header_value, 
            expected_value, 
            "Expected header {} to have value {}, got {}", 
            name, 
            expected_value, 
            header_value
        );
        
        self
    }
    
    async fn assert_body_contains(&self, expected_content: &str) -> Result<&Self> {
        let response_copy = try_clone(self)?;
        let body_text = response_copy.text().await?;
        
        assert!(
            body_text.contains(expected_content),
            "Expected response body to contain '{}', got '{}'",
            expected_content,
            body_text
        );
        
        Ok(self)
    }
    
    async fn assert_body_text(&self, expected_text: &str) -> Result<&Self> {
        let response_copy = try_clone(self)?;
        let body_text = response_copy.text().await?;
        
        assert_eq!(
            body_text,
            expected_text,
            "Expected response body to be '{}', got '{}'",
            expected_text,
            body_text
        );
        
        Ok(self)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use reqwest::{Client, StatusCode, Response};
    use serde::{Deserialize, Serialize};
    use mockito::Server;
    
    #[derive(Debug, Serialize, Deserialize, PartialEq)]
    struct TestUser {
        id: i32,
        name: String,
    }
    
    async fn get_mock_response() -> Result<Response> {
        let server = Server::new_async().await;
        
        let _mock = server.mock("GET", "/test")
            .with_status(200)
            .with_header("X-Test", "test-value")
            .with_body(r#"{"id": 123, "name": "Test User"}"#)
            .create();
            
        let client = Client::new();
        let response = client.get(&format!("{}/test", server.url()))
            .send()
            .await?;
            
        Ok(response)
    }
    
    #[tokio::test]
    async fn test_assert_status() -> Result<()> {
        let response = get_mock_response().await?;
        response.assert_status(StatusCode::OK);
        Ok(())
    }
    
    #[tokio::test]
    async fn test_assert_json() -> Result<()> {
        let response = get_mock_response().await?;
        
        let user = response.assert_json::<_, TestUser>(|user| {
            user.id == 123 && user.name == "Test User"
        }).await?;
        
        assert_eq!(user.id, 123);
        assert_eq!(user.name, "Test User");
        
        Ok(())
    }
    
    #[tokio::test]
    async fn test_assert_header() -> Result<()> {
        let response = get_mock_response().await?;
        response.assert_header("X-Test", "test-value");
        Ok(())
    }
    
    #[tokio::test]
    async fn test_assert_body_contains() -> Result<()> {
        let response = get_mock_response().await?;
        response.assert_body_contains("Test User").await?;
        Ok(())
    }
}