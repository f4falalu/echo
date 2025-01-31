use anyhow::Result;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct File {
    pub name: String,
    pub file_type: String,
    pub yml_content: String,
}