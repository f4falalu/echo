use anyhow::Result;
use reqwest::{
    header::{HeaderMap, HeaderValue},
    Client,
};

use super::{
    PostDataSourcesRequest, DeployDatasetsRequest, ValidateApiKeyRequest, ValidateApiKeyResponse,
    DeployDatasetsResponse,
};

pub struct BusterClient {
    client: Client,
    base_url: String,
    api_key: String,
}

impl BusterClient {
    pub fn new(base_url: String, api_key: String) -> Result<Self> {
        let client = Client::builder().build()?;

        Ok(Self {
            client,
            base_url,
            api_key,
        })
    }

    fn build_headers(&self) -> Result<HeaderMap> {
        let mut headers = HeaderMap::new();
        headers.insert(
            "Authorization",
            HeaderValue::from_str(&format!("Bearer {}", self.api_key))?,
        );
        Ok(headers)
    }

    pub async fn validate_api_key(&self) -> Result<bool> {
        let request = ValidateApiKeyRequest {
            api_key: self.api_key.clone(),
        };

        let response = self
            .client
            .post(format!("{}/api/v1/api_keys/validate", self.base_url))
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Failed to validate API key. This could be due to an invalid URL"
            ));
        }

        match response.json::<ValidateApiKeyResponse>().await {
            Ok(validate_response) => Ok(validate_response.valid),
            Err(e) => Err(anyhow::anyhow!(
                "Failed to parse validate API key response: {}",
                e
            )),
        }
    }

    pub async fn post_data_sources(&self, req_body: Vec<PostDataSourcesRequest>) -> Result<()> {
        let headers = self.build_headers()?;

        match self
            .client
            .post(format!("{}/api/v1/data_sources", self.base_url))
            .headers(headers)
            .json(&req_body)
            .send()
            .await
        {
            Ok(res) => {
                if !res.status().is_success() {
                    return Err(anyhow::anyhow!(
                        "POST /api/v1/data_sources failed: {}",
                        res.text().await?
                    ));
                }
                Ok(())
            }
            Err(e) => Err(anyhow::anyhow!("POST /api/v1/data_sources failed: {}", e)),
        }
    }

    pub async fn deploy_datasets(&self, req_body: Vec<DeployDatasetsRequest>) -> Result<DeployDatasetsResponse> {
        let headers = self.build_headers()?;

        match self
            .client
            .post(format!("{}/api/v1/datasets/deploy", self.base_url))
            .headers(headers)
            .json(&req_body)
            .send()
            .await
        {
            Ok(res) => {
                if !res.status().is_success() {
                    return Err(anyhow::anyhow!(
                        "POST /api/v1/datasets/deploy failed: {}",
                        res.text().await?
                    ));
                }
                Ok(res.json().await?)
            }
            Err(e) => Err(anyhow::anyhow!("POST /api/v1/datasets/deploy failed: {}", e)),
        }
    }
}
