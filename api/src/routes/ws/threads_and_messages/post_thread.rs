
use anyhow::Result;
use handlers::chats::post_chat_handler::ChatCreateNewChat;
use handlers::chats::post_chat_handler::{self, ThreadEvent};
use middleware::AuthenticatedUser;
use tokio::sync::mpsc;

use crate::routes::ws::{
        threads_and_messages::threads_router::{ThreadEvent as WSThreadEvent, ThreadRoute},
        ws::{WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::send_ws_message,
    };

/// Creates a new thread for a user and processes their request using the shared handler
pub async fn post_thread(
    user: &AuthenticatedUser,
    request: ChatCreateNewChat,
) -> Result<()> {
    let (tx, mut rx) = mpsc::channel(1000);

    let user_id = user.id.to_string();

    tokio::spawn(async move {
        while let Some(result) = rx.recv().await {
            match result {
                Ok((message, event)) => {
                    println!("MESSAGE SHOULD BE SENT: {:?}", message);

                    let event = match event {
                        ThreadEvent::GeneratingResponseMessage => {
                            WsEvent::Threads(WSThreadEvent::GeneratingResponseMessage)
                        }
                        ThreadEvent::GeneratingReasoningMessage => {
                            WsEvent::Threads(WSThreadEvent::GeneratingReasoningMessage)
                        }
                        ThreadEvent::GeneratingTitle => {
                            WsEvent::Threads(WSThreadEvent::GeneratingTitle)
                        }
                        ThreadEvent::InitializeChat => {
                            WsEvent::Threads(WSThreadEvent::InitializeChat)
                        }
                        ThreadEvent::Completed => {
                            WsEvent::Threads(WSThreadEvent::Complete)
                        }
                    };

                    let response = WsResponseMessage::new_no_user(
                        WsRoutes::Threads(ThreadRoute::Post),
                        event,
                        &message,
                        None,
                        WsSendMethod::All,
                    );

                    if let Err(e) = send_ws_message(&user_id, &response).await {
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
    });

    // Call the shared handler
    post_chat_handler::post_chat_handler(request, user.clone(), Some(tx)).await?;

    Ok(())
}