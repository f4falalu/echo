use anyhow::Result;
use reqwest::{Client, RequestBuilder, Response};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use crate::tests::common::env::get_test_env_or;

/// HTTP client for testing with convenient helper methods
pub struct TestHttpClient {
    client: Client,
    base_url: String,
    default_headers: Vec<(String, String)>,
}

impl TestHttpClient {
    /// Create a new test HTTP client with default configuration
    pub fn new() -> Result<Self> {
        // Initialize client with reasonable defaults for testing
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .build()?;
            
        // Get base URL from environment or use default
        let base_url = get_test_env_or("TEST_API_URL", "http://localhost:8080");
        
        Ok(Self {
            client,
            base_url,
            default_headers: Vec::new(),
        })
    }
    
    /// Create a client that uses a specific URL (like a mock server)
    pub fn with_base_url(base_url: impl Into<String>) -> Result<Self> {
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .build()?;
            
        Ok(Self {
            client,
            base_url: base_url.into(),
            default_headers: Vec::new(),
        })
    }
    
    /// Add a default header to be sent with every request
    pub fn with_default_header(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.default_headers.push((name.into(), value.into()));
        self
    }
    
    /// Add authorization header
    pub fn with_auth(self, token: impl Into<String>) -> Self {
        self.with_default_header("Authorization", format!("Bearer {}", token.into()))
    }
    
    /// Make a GET request to the specified path
    pub fn get(&self, path: impl AsRef<str>) -> RequestBuilder {
        let url = self.build_url(path.as_ref());
        let mut builder = self.client.get(url);
        builder = self.apply_default_headers(builder);
        builder
    }
    
    /// Make a POST request to the specified path with JSON body
    pub fn post<T: Serialize>(&self, path: impl AsRef<str>, body: &T) -> Result<RequestBuilder> {
        let url = self.build_url(path.as_ref());
        let mut builder = self.client.post(url).json(body);
        builder = self.apply_default_headers(builder);
        Ok(builder)
    }
    
    /// Make a PUT request to the specified path with JSON body
    pub fn put<T: Serialize>(&self, path: impl AsRef<str>, body: &T) -> Result<RequestBuilder> {
        let url = self.build_url(path.as_ref());
        let mut builder = self.client.put(url).json(body);
        builder = self.apply_default_headers(builder);
        Ok(builder)
    }
    
    /// Make a DELETE request to the specified path
    pub fn delete(&self, path: impl AsRef<str>) -> RequestBuilder {
        let url = self.build_url(path.as_ref());
        let mut builder = self.client.delete(url);
        builder = self.apply_default_headers(builder);
        builder
    }
    
    /// Send a request and parse the JSON response
    pub async fn request_json<T: for<'de> Deserialize<'de>>(
        &self, 
        builder: RequestBuilder
    ) -> Result<(Response, T)> {
        let response = builder.send().await?;
        let status = response.status();
        
        if !status.is_success() {
            let error_text = response.text().await?;
            return Err(anyhow::anyhow!(
                "Request failed with status {}: {}", 
                status, 
                error_text
            ));
        }
        
        // Clone the response so we can return both the response and the parsed body
        let response_copy = response.try_clone().ok_or_else(|| 
            anyhow::anyhow!("Failed to clone response")
        )?;
        
        let body: T = response.json().await?;
        
        Ok((response_copy, body))
    }
    
    // Helper methods
    
    /// Build the full URL for a path
    fn build_url(&self, path: &str) -> String {
        let base = self.base_url.trim_end_matches('/');
        let path = path.trim_start_matches('/');
        format!("{}/{}", base, path)
    }
    
    /// Apply default headers to a request builder
    fn apply_default_headers(&self, mut builder: RequestBuilder) -> RequestBuilder {
        for (name, value) in &self.default_headers {
            builder = builder.header(name, value);
        }
        builder
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::common::http::MockServer;
    use serde_json::json;
    
    #[derive(Debug, Deserialize, Serialize, PartialEq)]
    struct TestUser {
        id: i32,
        name: String,
    }
    
    #[tokio::test]
    async fn test_request_with_mock() -> Result<()> {
        // Create a mock server
        let mut mock_server = MockServer::new().await?;
        
        // Setup mock response
        let test_user = TestUser { id: 123, name: "Test User".to_string() };
        mock_server.mock_json("GET", "/users/123", 200, &test_user)?;
        
        // Create test client with mock server URL
        let client = TestHttpClient::with_base_url(mock_server.url())?
            .with_default_header("X-Test-Header", "test-value");
        
        // Make a request
        let (response, user) = client.request_json::<TestUser>(
            client.get("/users/123")
        ).await?;
        
        // Verify response
        assert_eq!(response.status().as_u16(), 200);
        assert_eq!(user, test_user);
        
        // Verify mock was called
        mock_server.verify_all_mocks_called()?;
        
        Ok(())
    }
    
    #[tokio::test]
    async fn test_post_request() -> Result<()> {
        // Create a mock server
        let mut mock_server = MockServer::new().await?;
        
        // Setup mock response for POST
        let request_body = TestUser { id: 0, name: "New User".to_string() };
        let response_data = TestUser { id: 456, name: "New User".to_string() };
        
        // Using a JSON matcher would be better, but for simplicity using any body
        let mock = mock_server.server
            .mock("POST", "/users")
            .with_status(201)
            .with_header("content-type", "application/json")
            .with_body(json!(response_data).to_string())
            .create();
        
        // Create test client
        let client = TestHttpClient::with_base_url(mock_server.url())?;
        
        // Make POST request
        let builder = client.post("/users", &request_body)?;
        let (response, created_user) = client.request_json::<TestUser>(builder).await?;
        
        // Verify response
        assert_eq!(response.status().as_u16(), 201);
        assert_eq!(created_user.id, 456);
        assert_eq!(created_user.name, "New User");
        
        // Verify mock was called
        mock.assert();
        
        Ok(())
    }
}