use crate::database::models::User;
use chrono::Utc;
use serde_json::json;
use uuid::Uuid;

/// Creates a test user with default values
pub fn create_test_user() -> User {
    User {
        id: Uuid::new_v4(),
        email: "test@example.com".to_string(),
        name: Some("Test User".to_string()),
        config: json!({}),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes: json!({}),
    }
}

/// Creates a test user with custom values
pub fn create_custom_test_user(
    email: &str,
    name: Option<&str>,
    attributes: serde_json::Value,
) -> User {
    User {
        id: Uuid::new_v4(),
        email: email.to_string(),
        name: name.map(String::from),
        config: json!({}),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes,
    }
}

/// Creates multiple test users
pub fn create_test_users(count: usize) -> Vec<User> {
    (0..count)
        .map(|i| {
            User {
                id: Uuid::new_v4(),
                email: format!("test{}@example.com", i),
                name: Some(format!("Test User {}", i)),
                config: json!({}),
                created_at: Utc::now(),
                updated_at: Utc::now(),
                attributes: json!({}),
            }
        })
        .collect()
} 