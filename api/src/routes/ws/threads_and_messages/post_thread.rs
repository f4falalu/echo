use std::sync::Arc;

use anyhow::Result;
use handlers::chats::post_chat_handler;
use handlers::chats::post_chat_handler::ChatCreateNewChat;
use handlers::chats::types::ChatWithMessages;

use crate::{
    database::models::User,
    routes::ws::{
        threads_and_messages::threads_router::{ThreadEvent, ThreadRoute},
        ws::{SubscriptionRwLock, WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::{send_ws_message, subscribe_to_stream},
    },
};

/// Creates a new thread for a user and processes their request using the shared handler
pub async fn post_thread(
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &User,
    request: ChatCreateNewChat,
) -> Result<()> {
    // Call the shared handler
    let result = post_chat_handler::post_chat_handler(request, user.clone()).await;

    match result {
        Ok(chat_with_messages) => {
            // Send the response through WebSocket
            send_ws_response(&user.id.to_string(), &chat_with_messages).await?;
            Ok(())
        }
        Err(err) => {
            // Handle error
            tracing::error!("Error creating thread: {:?}", err);
            Err(err)
        }
    }
}

/// Sends the chat response to the client via WebSocket
async fn send_ws_response(subscription: &str, chat_with_messages: &ChatWithMessages) -> Result<()> {
    let response = WsResponseMessage::new_no_user(
        WsRoutes::Threads(ThreadRoute::Post),
        WsEvent::Threads(ThreadEvent::InitializeChat),
        chat_with_messages,
        None,
        WsSendMethod::All,
    );

    if let Err(e) = send_ws_message(&subscription.to_string(), &response).await {
        tracing::error!("Failed to send websocket message: {}", e);
    }

    Ok(())
}
