use mockito::Matcher;
use std::collections::HashMap;

/// Matcher for HTTP headers
/// 
/// Creates a mockito matcher that checks for specific HTTP headers
/// in the request. This is useful for validating that requests are
/// properly sending required headers like authentication tokens.
/// 
/// Example:
/// ```
/// let headers = vec![
///     ("Authorization", "Bearer token"),
///     ("Content-Type", "application/json")
/// ];
/// let matcher = header_matcher(headers);
/// ```
pub fn header_matcher<'a, I, K, V>(headers: I) -> HashMap<&'static str, Matcher>
where
    I: IntoIterator<Item = (K, V)>,
    K: AsRef<str>,
    V: AsRef<str>,
{
    let mut matchers = HashMap::new();
    
    for (key, value) in headers {
        let header_key = key.as_ref();
        let header_value = value.as_ref();
        
        // Create a matcher for this header
        let matcher = Matcher::Exact(header_value.to_string());
        
        // Convert the header name to a static string ref (required by mockito)
        // This is a bit of a hack, but mockito requires static strings
        let static_key = match header_key {
            "authorization" | "Authorization" => "authorization",
            "content-type" | "Content-Type" => "content-type",
            "accept" | "Accept" => "accept",
            "user-agent" | "User-Agent" => "user-agent",
            "x-api-key" | "X-Api-Key" => "x-api-key",
            _ => "custom-header", // Fallback for other headers
        };
        
        matchers.insert(static_key, matcher);
    }
    
    matchers
}

#[cfg(test)]
mod tests {
    use super::*;
    use mockito::Server;
    use reqwest::Client;
    
    #[tokio::test]
    async fn test_header_matcher() {
        let server = Server::new_async().await;
        
        // Create a matcher for Authorization and Content-Type headers
        let headers = vec![
            ("Authorization", "Bearer test-token"),
            ("Content-Type", "application/json"),
        ];
        
        let header_matchers = header_matcher(headers);
        
        // Create a mock that requires these headers
        let mock = server.mock("GET", "/test")
            .match_header("authorization", header_matchers["authorization"].clone())
            .match_header("content-type", header_matchers["content-type"].clone())
            .with_status(200)
            .with_body("success")
            .create();
        
        // Send request with the required headers
        let client = Client::new();
        let response = client.get(&format!("{}/test", server.url()))
            .header("Authorization", "Bearer test-token")
            .header("Content-Type", "application/json")
            .send()
            .await
            .expect("Request failed");
        
        assert_eq!(response.status().as_u16(), 200);
        assert_eq!(response.text().await.unwrap(), "success");
        
        // Verify the mock was called
        mock.assert();
    }
}