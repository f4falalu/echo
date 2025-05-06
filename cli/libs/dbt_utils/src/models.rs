use serde::Deserialize;
use std::collections::HashMap;

// Struct definitions copied from commands/init.rs and made pub.
// These are for parsing dbt's catalog.json.

#[derive(Debug, Deserialize, Clone)]
pub struct DbtCatalog {
    #[allow(dead_code)]
    pub metadata: DbtCatalogMetadata,
    pub nodes: HashMap<String, DbtNode>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DbtCatalogMetadata {
    #[serde(rename = "dbt_schema_version")]
    #[allow(dead_code)]
    pub dbt_schema_version: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DbtNode {
    pub metadata: DbtNodeMetadata,
    pub columns: HashMap<String, DbtColumn>,
    pub resource_type: String,
    pub unique_id: String,
    #[serde(default)]
    pub original_file_path: String,
    pub database: Option<String>,
    pub schema: Option<String>,
    pub name: String, // This is the alias in dbt, metadata.name is the relation name
}

#[derive(Debug, Deserialize, Clone)]
pub struct DbtNodeMetadata {
    #[serde(rename = "type")]
    pub relation_type: Option<String>,
    pub schema: Option<String>,
    pub name: String,
    pub database: Option<String>,
    pub comment: Option<String>,
    #[allow(dead_code)]
    pub owner: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DbtColumn {
    #[serde(rename = "type")]
    pub column_type: String,
    pub index: u32,
    pub name: String,
    pub comment: Option<String>,
} 