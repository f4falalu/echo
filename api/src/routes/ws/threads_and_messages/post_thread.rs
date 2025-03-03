use std::sync::Arc;

use anyhow::Result;
use handlers::chats::post_chat_handler;
use handlers::chats::post_chat_handler::ChatCreateNewChat;
use handlers::chats::types::ChatWithMessages;
use tokio::sync::mpsc;

use crate::{
    database::models::User,
    routes::ws::{
        threads_and_messages::threads_router::{ThreadEvent, ThreadRoute},
        ws::{SubscriptionRwLock, WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::send_ws_message,
    },
};

/// Creates a new thread for a user and processes their request using the shared handler
pub async fn post_thread(
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &User,
    request: ChatCreateNewChat,
) -> Result<()> {
    let (tx, mut rx) = mpsc::channel(1000);

    // Call the shared handler
    post_chat_handler::post_chat_handler(request, user.clone(), Some(tx)).await?;

    while let Some(result) = rx.recv().await {
        match result {
            Ok(chat_with_messages) => {
                println!("MESSAGE SHOULD BE SENT: {:?}", chat_with_messages);

                let response = WsResponseMessage::new_no_user(
                    WsRoutes::Threads(ThreadRoute::Post),
                    WsEvent::Threads(ThreadEvent::InitializeChat),
                    &chat_with_messages,
                    None,
                    WsSendMethod::All,
                );

                if let Err(e) = send_ws_message(&user.id.to_string(), &response).await {
                    tracing::error!("Failed to send websocket message: {}", e);
                }
            }
            Err(err) => {
                tracing::error!("Error in message stream: {:?}", err);
                return Err(err);
            }
        }
    }

    Ok(())
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
