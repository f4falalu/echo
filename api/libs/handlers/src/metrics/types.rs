use database::{enums::Verification, types::VersionHistory};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Dataset {
    pub name: String,
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Version {
    pub version_number: i32,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterMetric {
    pub id: String,
    #[serde(rename = "type")]
    pub metric_type: String, // Always "metric"
    pub title: String,
    pub version_number: i32,
    pub description: Option<String>,
    pub file_name: String,
    pub time_frame: String,
    pub datasets: Vec<Dataset>,
    pub data_source_id: String,
    pub error: Option<String>,
    pub chart_config: Option<Value>, // BusterChartConfigProps
    pub data_metadata: Option<DataMetadata>,
    pub status: Verification,
    pub evaluation_score: Option<String>, // "Moderate" | "High" | "Low"
    pub evaluation_summary: String,
    pub file: String, // yaml file
    pub created_at: String,
    pub updated_at: String,
    pub sent_by_id: String,
    pub sent_by_name: String,
    pub sent_by_avatar_url: Option<String>,
    pub code: Option<String>,
    pub dashboards: Vec<Dashboard>,
    pub collections: Vec<Collection>,
    pub versions: VersionHistory,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Dashboard {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Collection {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DataMetadata {
    pub column_count: i32,
    pub column_metadata: Vec<ColumnMetaData>,
    pub row_count: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ColumnMetaData {
    pub name: String,
    #[serde(rename = "min_value")]
    pub min_value: MinMaxValue,
    #[serde(rename = "max_value")]
    pub max_value: MinMaxValue,
    pub unique_values: i32,
    pub simple_type: SimpleType,
    #[serde(rename = "type")]
    pub column_type: ColumnType,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum MinMaxValue {
    String(String),
    Number(f64),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum SimpleType {
    #[serde(rename = "text")]
    Text,
    #[serde(rename = "number")]
    Number,
    #[serde(rename = "date")]
    Date,
    #[serde(rename = "boolean")]
    Boolean,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum ColumnType {
    Text,
    Float,
    Integer,
    Date,
    Float8,
    Timestamp,
    Timestamptz,
    Bool,
    Time,
    Boolean,
    Json,
    Jsonb,
    Int8,
    Int4,
    Int2,
    Decimal,
    Char,
    #[serde(rename = "character varying")]
    CharacterVarying,
    Character,
    Varchar,
    Number,
    Numeric,
    Tinytext,
    Mediumtext,
    Longtext,
    Nchar,
    Nvarchat,
    Ntext,
    Float4,
}

// IDataResult equivalent
pub type DataResult = Option<Vec<HashMap<String, Option<DataValue>>>>;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum DataValue {
    String(String),
    Number(f64),
    Null,
}
