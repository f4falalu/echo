use anyhow::{Context, Result};
use database::{
    models::User,
    pool::get_pg_pool,
    schema::users,
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;

/// Finds a user by their email address
///
/// # Arguments
/// * `email` - The email address to search for
///
/// # Returns
/// * `Result<Option<User>>` - The user if found, None otherwise
pub async fn find_user_by_email(email: &str) -> Result<Option<User>> {
    let mut conn = get_pg_pool().get().await?;

    users::table
        .filter(users::email.eq(email))
        .first::<User>(&mut conn)
        .await
        .optional()
        .context("Failed to look up user by email")
}