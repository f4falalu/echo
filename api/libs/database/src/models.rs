// Database models will be defined here 

use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde_json::Value;
use uuid::Uuid;

#[derive(Queryable)]
pub struct ThreadWithUser {
    pub id: Uuid,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub user_id: Uuid,
    pub user_name: Option<String>,
    pub user_email: String,
    pub user_attributes: Value,
}

#[derive(Queryable)]
pub struct MessageWithUser {
    pub id: Uuid,
    pub request: String,
    pub response: Value,
    pub created_at: DateTime<Utc>,
    pub user_id: Uuid,
    pub user_name: Option<String>,
    pub user_attributes: Value,
} 