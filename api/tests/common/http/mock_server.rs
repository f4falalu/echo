use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;

/// Wrapper around mockito server for easier mock creation and tracking
pub struct MockServer {
    server: mockito::Server,
    mock_responses: HashMap<String, Vec<mockito::Mock>>,
}

impl MockServer {
    /// Create a new mock server
    pub async fn new() -> Result<Self> {
        Ok(Self {
            server: mockito::Server::new_async().await,
            mock_responses: HashMap::new(),
        })
    }
    
    /// Get the base URL for the mock server
    pub fn url(&self) -> String {
        self.server.url()
    }
    
    /// Mock a successful JSON response
    pub fn mock_json<T: serde::Serialize>(
        &mut self, 
        method: &str, 
        path: &str, 
        status: usize, 
        body: &T
    ) -> Result<&mockito::Mock> {
        let body_str = serde_json::to_string(body)?;
        let mock = self.server
            .mock(method, path)
            .with_status(status)
            .with_header("content-type", "application/json")
            .with_body(body_str)
            .create();
            
        let key = format!("{}:{}", method, path);
        self.mock_responses.entry(key).or_insert_with(Vec::new).push(mock);
        
        // Return reference to the created mock
        let mocks = self.mock_responses.get(key.as_str()).unwrap();
        Ok(&mocks[mocks.len() - 1])
    }
    
    /// Mock an error response
    pub fn mock_error(
        &mut self, 
        method: &str, 
        path: &str, 
        status: usize, 
        error_message: &str
    ) -> Result<&mockito::Mock> {
        let body = serde_json::json!({
            "error": error_message
        });
        self.mock_json(method, path, status, &body)
    }
    
    /// Mock a response with specific matcher for the request body
    pub fn mock_with_body_match<M, T>(
        &mut self,
        method: &str,
        path: &str,
        body_matcher: M,
        response_body: &T,
        status: usize,
    ) -> Result<&mockito::Mock>
    where
        M: Into<mockito::Matcher>,
        T: serde::Serialize,
    {
        let body_str = serde_json::to_string(response_body)?;
        let mock = self.server
            .mock(method, path)
            .match_body(body_matcher)
            .with_status(status)
            .with_header("content-type", "application/json")
            .with_body(body_str)
            .create();
            
        let key = format!("{}:{}", method, path);
        self.mock_responses.entry(key).or_insert_with(Vec::new).push(mock);
        
        let mocks = self.mock_responses.get(key.as_str()).unwrap();
        Ok(&mocks[mocks.len() - 1])
    }
    
    /// Mock a response with custom headers
    pub fn mock_with_headers<T: serde::Serialize>(
        &mut self,
        method: &str,
        path: &str,
        status: usize,
        headers: &[(&str, &str)],
        body: &T,
    ) -> Result<&mockito::Mock> {
        let body_str = serde_json::to_string(body)?;
        
        // Create a mock builder
        let mut mock_builder = self.server
            .mock(method, path)
            .with_status(status);
        
        // Add headers
        for (name, value) in headers {
            mock_builder = mock_builder.with_header(name, value);
        }
        
        // Add body and create mock
        let mock = mock_builder
            .with_body(body_str)
            .create();
            
        let key = format!("{}:{}", method, path);
        self.mock_responses.entry(key).or_insert_with(Vec::new).push(mock);
        
        let mocks = self.mock_responses.get(key.as_str()).unwrap();
        Ok(&mocks[mocks.len() - 1])
    }
    
    /// Verify all registered mocks have been called
    pub fn verify_all_mocks_called(&self) -> Result<()> {
        for (endpoint, mocks) in &self.mock_responses {
            for (i, mock) in mocks.iter().enumerate() {
                match mock.matched() {
                    true => {}
                    false => return Err(anyhow::anyhow!("Mock not matched for endpoint '{}' (index: {})", endpoint, i)),
                }
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use reqwest::Client;
    
    #[tokio::test]
    async fn test_mock_json() -> Result<()> {
        let mut server = MockServer::new().await?;
        
        // Create a mock response
        let response_data = serde_json::json!({
            "id": 123,
            "name": "Test User"
        });
        
        let _mock = server.mock_json("GET", "/users/123", 200, &response_data)?;
        
        // Make a request to the mock server
        let client = Client::new();
        let response = client.get(&format!("{}/users/123", server.url()))
            .send()
            .await?;
            
        assert_eq!(response.status().as_u16(), 200);
        
        let body: Value = response.json().await?;
        assert_eq!(body["id"], 123);
        assert_eq!(body["name"], "Test User");
        
        // Verify the mock was called
        server.verify_all_mocks_called()?;
        
        Ok(())
    }
    
    #[tokio::test]
    async fn test_mock_error() -> Result<()> {
        let mut server = MockServer::new().await?;
        
        // Create an error mock
        let _mock = server.mock_error("GET", "/users/invalid", 404, "User not found")?;
        
        // Make a request to the mock server
        let client = Client::new();
        let response = client.get(&format!("{}/users/invalid", server.url()))
            .send()
            .await?;
            
        assert_eq!(response.status().as_u16(), 404);
        
        let body: Value = response.json().await?;
        assert_eq!(body["error"], "User not found");
        
        // Verify the mock was called
        server.verify_all_mocks_called()?;
        
        Ok(())
    }
}