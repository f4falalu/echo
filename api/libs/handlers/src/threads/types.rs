use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct ThreadRequest {
    pub title: String,
    pub organization_id: Uuid,
    pub created_by: Uuid,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ThreadResponse {
    pub id: Uuid,
    pub title: String,
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Add more thread-related types as needed 