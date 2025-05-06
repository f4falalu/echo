use serde::Deserialize;
use std::collections::HashMap;

// Struct definitions for parsing dbt's catalog.json.

#[derive(Debug, Deserialize, Clone)]
pub struct DbtCatalog {
    #[serde(default)]
    pub metadata: Option<DbtCatalogMetadata>,
    #[serde(default)]
    pub nodes: HashMap<String, DbtNode>,
    #[serde(default)]
    pub sources: Option<HashMap<String, DbtSource>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub macros: Option<HashMap<String, serde_json::Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub exposures: Option<HashMap<String, serde_json::Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metrics: Option<HashMap<String, serde_json::Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub selectors: Option<HashMap<String, serde_json::Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub disabled: Option<HashMap<String, Vec<serde_json::Value>>>, // dbt-core uses Vec here
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_map: Option<HashMap<String, Vec<String>>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub child_map: Option<HashMap<String, Vec<String>>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub errors: Option<serde_json::Value>, // Can be null or an object with error details
}

#[derive(Debug, Deserialize, Clone)]
pub struct DbtCatalogMetadata {
    #[serde(rename = "dbt_schema_version", default)]
    pub dbt_schema_version: Option<String>,
    #[allow(dead_code)] // If not used directly by Buster, but good for complete parsing
    pub dbt_version: Option<String>,
    #[allow(dead_code)]
    pub generated_at: Option<String>,
    #[allow(dead_code)]
    pub invocation_id: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DbtNode {
    // Ensure metadata is present, matches example which has it implicitly via direct fields
    // For the example catalog's node structure, we might need to flatten some metadata fields
    // or expect them directly if `metadata` as a block is not always there.
    // However, standard dbt catalog.json *does* have a metadata block within each node.
    // The example provided might be a slight simplification or custom representation.
    // Assuming standard catalog structure for now, where DbtNodeMetadata is a separate struct.
    #[serde(default)]
    pub metadata: Option<DbtNodeMetadata>, 
    #[serde(default)]
    pub columns: HashMap<String, DbtColumn>,
    #[serde(rename = "resource_type")] // if resource_type is not directly in JSON, this helps map if some other key exists
                                     // if type is the key in JSON for resource_type, then it should be:
                                     // #[serde(alias = "type")] // or handle it in DbtNodeMetadata if type is part of metadata
    #[serde(default)] // Make it optional and handle missing field
    pub resource_type: Option<String>, // This refers to model, seed, snapshot, test etc.
    pub unique_id: String,
    #[serde(default)] // original_file_path might not be present for all node types
    pub original_file_path: Option<String>,
    pub database: Option<String>,
    pub schema: Option<String>,
    #[serde(default)] // Make name optional
    pub name: Option<String>, // This is often the filename or alias. metadata.name is relation name.
    pub comment: Option<String>, // Comment can be directly on the node for some versions/types
    pub stats: Option<serde_json::Value>, // To capture general stats blocks
}

#[derive(Debug, Deserialize, Clone)]
pub struct DbtNodeMetadata {
    // Standard dbt catalog.json has `name` here as the relation name.
    #[serde(default)] // Make name optional
    pub name: Option<String>, 
    #[serde(rename = "type")] // This 'type' inside metadata usually refers to the materialization (table, view, etc.) for models
    pub relation_type: Option<String>,
    pub schema: Option<String>,     // schema can also be here
    pub database: Option<String>, // database can also be here
    pub comment: Option<String>,    // comment for the model/node itself
    #[allow(dead_code)]
    pub owner: Option<String>,
    // Add other potential metadata fields if necessary, e.g., tags, config, etc.
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DbtSource {
    #[serde(default)]
    pub name: Option<String>, // This is the source's table name
    pub unique_id: String,
    #[serde(default)]
    pub database: Option<String>,
    #[serde(default)]
    pub schema: Option<String>,
    #[serde(default, alias = "resource_type")] // Sources have "source" as resource_type, or a specific table type.
    pub table_type: Option<String>, // e.g. "table", often not explicitly a 'type' field in catalog for sources, but implied.
    #[serde(default)]
    pub columns: HashMap<String, DbtColumn>,
    #[serde(default)]
    pub comment: Option<String>,
    pub stats: Option<serde_json::Value>,
    // Sources can also have a 'meta' field, 'tags', 'description', 'loader', 'freshness' etc.
    #[serde(default)]
    pub description: Option<String>, // description is preferred over comment for sources usually
    #[serde(default)]
    pub meta: Option<HashMap<String, serde_json::Value>>,
    #[serde(default)]
    pub tags: Vec<String>,
}


#[derive(Debug, Deserialize, Clone)]
pub struct DbtColumn {
    #[serde(rename = "type")]
    pub column_type: String,
    pub index: Option<u32>, // Index might not always be present
    pub name: String,
    pub comment: Option<String>,
    #[serde(default)]
    pub description: Option<String>, // Columns can also have descriptions
    #[serde(default)]
    pub meta: Option<HashMap<String, serde_json::Value>>,
    #[serde(default)]
    pub tags: Vec<String>,
} 