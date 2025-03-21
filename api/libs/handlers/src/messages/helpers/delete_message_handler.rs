use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{models::Message, pool::get_pg_pool, schema::messages};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use tracing::info;
use middleware::AuthenticatedUser;
use uuid::Uuid;

/// Deletes a message and marks all subsequent messages in the same chat as deleted
///
/// # Arguments
/// * `message_id` - The ID of the message to delete
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn delete_message_handler(_user: AuthenticatedUser, message_id: Uuid) -> Result<()> {
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    // Get the message to delete to find its chat_id and created_at timestamp
    let message = match messages::table
        .filter(messages::id.eq(message_id))
        .first::<Message>(&mut conn)
        .await
    {
        Ok(message) => message,
        Err(diesel::NotFound) => return Err(anyhow!("Message not found")),
        Err(e) => return Err(anyhow!("Database error: {}", e)),
    };

    // Mark the target message and all subsequent messages in the same chat as deleted
    let updated_count = diesel::update(messages::table)
        .filter(
            messages::chat_id
                .eq(message.chat_id)
                .and(messages::created_at.ge(message.created_at)),
        )
        .set(messages::deleted_at.eq(Some(Utc::now())))
        .execute(&mut conn)
        .await?;

    info!(
        message_id = %message_id,
        chat_id = %message.chat_id,
        updated_count = updated_count,
        "Deleted message and subsequent messages in chat"
    );

    // TODO: Add access controls to verify the user has permission to delete this message

    Ok(())
}
