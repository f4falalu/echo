use std::sync::Arc;

use crate::{database_dep::models::User, routes::ws::ws::SubscriptionRwLock};
use anyhow::Result;

use super::agent_thread::{AgentThreadHandler, ChatCreateNewChat};

/// This creates a new thread for a user.  It follows these steps:
///
/// 1. Subscribes the user to a thread channel
/// 2. Creates an empty thread object and returns to the user
/// 3. Saves the thread object and ownership to the database
/// 4. Sends the user progress messages. This consists of streams and such.
/// 5. Go along saving progress to ultimately write to the database

pub async fn post_thread(
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &User,
    request: ChatCreateNewChat,
) -> Result<()> {
    let handler = AgentThreadHandler::new()?;
    handler.handle_request(request, user.clone()).await
}
