use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::collections::HashMap;

use query_engine::credentials::Credential;

#[derive(Debug, Deserialize)]
pub struct ValidateApiKeyResponse {
    pub valid: bool,
}

#[derive(Debug, Serialize)]
pub struct ValidateApiKeyRequest {
    pub api_key: String,
}

#[derive(Debug, Serialize)]
pub struct PostDataSourcesRequest {
    pub name: String,
    pub env: String,
    #[serde(rename = "type")]
    pub type_: String,
    // Use a manual flatten pattern to ensure correct field names
    // Postgres fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_database: Option<String>,  // This is what the API expects, not default_database
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_schema: Option<String>,  // This is what the API expects, not default_schema
    #[serde(skip_serializing_if = "Option::is_none")]
    pub jump_host: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ssh_username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ssh_private_key: Option<String>,
    
    // BigQuery fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub credentials_json: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dataset_id: Option<String>,
    
    // Snowflake fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub account_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warehouse_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
    
    // Databricks fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_catalog: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct DeployDatasetsRequest {
    pub id: Option<Uuid>,
    pub data_source_name: String,
    pub env: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub name: String,
    pub model: Option<String>,
    pub schema: String,
    pub database: Option<String>,
    pub description: String,
    pub sql_definition: Option<String>,
    pub entity_relationships: Option<Vec<DeployDatasetsEntityRelationshipsRequest>>,
    pub columns: Vec<DeployDatasetsColumnsRequest>,
    pub yml_file: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct DeployDatasetsColumnsRequest {
    pub name: String,
    pub description: String,
    pub semantic_type: Option<String>,
    pub expr: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub agg: Option<String>,
    #[serde(default)]
    pub searchable: bool,
}

#[derive(Debug, Serialize)]
pub struct DeployDatasetsEntityRelationshipsRequest {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub type_: String,
}

#[derive(Debug, Deserialize)]
pub struct ValidationResult {
    pub success: bool,
    pub model_name: String,
    pub data_source_name: String,
    pub schema: String,
    pub errors: Vec<ValidationError>,
}

#[derive(Debug, Deserialize)]
pub struct ValidationError {
    pub error_type: ValidationErrorType,
    pub column_name: Option<String>,
    pub message: String,
    pub suggestion: Option<String>,
}

#[derive(Debug, Deserialize, PartialEq)]
pub enum ValidationErrorType {
    TableNotFound,
    ColumnNotFound,
    TypeMismatch,
    DataSourceError,
    ModelNotFound,
    InvalidRelationship,
    ExpressionError,
    ProjectNotFound,
    InvalidBusterYml,
    DataSourceMismatch,
}

#[derive(Debug, Deserialize)]
pub struct DeployDatasetsResponse {
    pub results: Vec<ValidationResult>,
}

#[derive(Debug, Serialize)]
pub struct GenerateApiRequest {
    pub data_source_name: String,
    pub schema: String,
    pub database: Option<String>,
    pub model_names: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct GenerateApiResponse {
    pub yml_contents: HashMap<String, String>,
    pub errors: HashMap<String, GenerateApiError>,
}

#[derive(Debug, Deserialize)]
pub struct GenerateApiError {
    pub message: String,
    pub error_type: Option<String>,
    pub context: Option<String>,
}
