use anyhow::{Context, Result};
use database::{models::User, pool::get_pg_pool, schema::users};
use diesel::{ExpressionMethods, QueryDsl, OptionalExtension};
use diesel_async::RunQueryDsl;

use crate::errors::SharingError;

/// Find a user by their email address
///
/// # Arguments
/// * `email` - The email address to look up
///
/// # Returns
/// * `Ok(Some(User))` - If the user was found
/// * `Ok(None)` - If no user with that email exists
/// * `Err(_)` - If there was a database error or other issue
///
pub async fn find_user_by_email(email: &str) -> Result<Option<User>> {
    // Validate email format
    if !email.contains('@') {
        return Err(SharingError::InvalidEmail(email.to_string()).into());
    }

    let mut conn = get_pg_pool()
        .get()
        .await
        .context("Failed to get database connection")?;

    let user = users::table
        .filter(users::email.eq(email))
        .first::<User>(&mut conn)
        .await
        .optional()
        .context("Failed to query user by email")?;

    Ok(user)
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::models::User;
    use uuid::Uuid;

    fn mock_user() -> User {
        User {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            name: Some("Test User".to_string()),
            config: serde_json::Value::Null,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            attributes: serde_json::Value::Null,
            avatar_url: Some("https://example.com/avatar.png".to_string()),
        }
    }

    // Note: This test is mocked since we don't want to hit the database in unit tests
    #[test]
    fn test_find_user_by_email_invalid_email() {
        let runtime = tokio::runtime::Runtime::new().unwrap();
        let result = runtime.block_on(find_user_by_email("not-an-email"));
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("Invalid email"));
    }

    // Additional tests would be implemented here, using a test database or more mocks
    // for database interactions
}