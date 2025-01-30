use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct File {
    pub name: String,
    #[serde(rename = "type")]
    pub file_type: String,
    pub yml_content: String,
}
