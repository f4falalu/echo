use dotenv::dotenv;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use std::error::Error;

pub struct Reranker {
    api_key: String,
    base_url: String,
    model: String,
    client: Client,
    environment: String,
}

impl Reranker {
    pub fn new() -> Result<Self, Box<dyn Error>> {
        dotenv().ok();
        let environment = env::var("ENVIRONMENT").unwrap_or_else(|_| "production".to_string());

        // If local environment, we don't need these values
        let (api_key, model, base_url) = if environment == "local" {
            (String::new(), String::new(), String::new())
        } else {
            (
                env::var("RERANK_API_KEY")?,
                env::var("RERANK_MODEL")?,
                env::var("RERANK_BASE_URL")?,
            )
        };

        let client = Client::new();
        Ok(Self {
            api_key,
            base_url,
            model,
            client,
            environment,
        })
    }

    pub async fn rerank(
        &self,
        query: &str,
        documents: &[&str],
        top_n: usize,
    ) -> Result<Vec<RerankResult>, Box<dyn Error>> {
        // Otherwise use the remote API
        let request_body = RerankRequest {
            query: query.to_string(),
            documents: documents.iter().map(|s| s.to_string()).collect(),
            top_n,
            model: self.model.clone(),
        };
        let response = self
            .client
            .post(&self.base_url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&request_body)
            .send()
            .await?;
        let response_body: RerankResponse = response.json().await?;
        Ok(response_body.results)
    }
}

#[derive(Serialize)]
struct RerankRequest {
    query: String,
    documents: Vec<String>,
    top_n: usize,
    model: String,
}

#[derive(Deserialize)]
struct RerankResponse {
    results: Vec<RerankResult>,
}

#[derive(Deserialize, Clone, Debug)]
pub struct RerankResult {
    pub index: usize,
    pub relevance_score: f32,
}
