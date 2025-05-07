use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::error::Error;

#[derive(Debug)]
pub enum RerankerType {
    Cohere,
    Mxbai,
    Jina,
}

pub struct Reranker {
    reranker_type: RerankerType,
    api_key: String,
    base_url: String,
    model: String,
    client: Client,
}

impl Reranker {
    pub fn new() -> Result<Self, Box<dyn Error>> {
        let provider = std::env::var("RERANK_PROVIDER")?;
        let reranker_type = match provider.to_lowercase().as_str() {
            "cohere" => RerankerType::Cohere,
            "mxbai" => RerankerType::Mxbai,
            "jina" => RerankerType::Jina,
            _ => return Err("Invalid provider specified".into()),
        };
        let api_key = std::env::var("RERANK_API_KEY")?;
        let model = std::env::var("RERANK_MODEL")?;
        let base_url = match reranker_type {
            RerankerType::Cohere => "https://api.cohere.com/v2/rerank",
            RerankerType::Mxbai => "https://api.mixedbread.ai/v1/rerank",
            RerankerType::Jina => "https://api.jina.ai/v1/rerank",
        }.to_string();
        let client = Client::new();
        Ok(Self {
            reranker_type,
            api_key,
            base_url,
            model,
            client,
        })
    }

    pub async fn rerank(
        &self,
        query: &str,
        documents: &[&str],
        top_n: usize,
    ) -> Result<Vec<RerankResult>, Box<dyn Error>> {
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

#[derive(Deserialize)]
pub struct RerankResult {
    pub index: usize,
    pub relevance_score: f32,
} 