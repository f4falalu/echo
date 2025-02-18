use database::enums::Verification;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

// Note: BusterChartConfigProps needs to be defined
// #[derive(Debug, Serialize, Deserialize, Clone)]
// pub struct BusterChartConfigProps { ... }

// Note: VerificationStatus needs to be defined
// #[derive(Debug, Serialize, Deserialize, Clone)]
// pub enum VerificationStatus { ... }

// Note: BusterShare needs to be defined
// #[derive(Debug, Serialize, Deserialize, Clone)]
// pub struct BusterShare { ... }

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterMetric {
    pub id: String,
    #[serde(rename = "type")]
    pub metric_type: String, // Assuming always "metric"
    pub title: String,
    pub version_number: i32,
    pub description: Option<String>,
    pub file_name: String,
    pub time_frame: String,
    pub dataset_id: String,
    pub data_source_id: String,
    pub dataset_name: Option<String>,
    pub error: Option<String>,
    pub chart_config: Option<Value>, // Needs to be defined
    pub data_metadata: Option<DataMetadata>,
    pub status: Verification, 
    #[serde(rename = "evaluation_score")]
    pub evaluation_score: Option<String>,
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
    // BusterShare fields would be included here
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
}

#[derive(Debug, Serialize, Deserialize, Clone)]
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
