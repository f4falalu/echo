use anyhow::{anyhow, Result};
use handlers::chats::get_chat_handler;
use indexmap::IndexMap;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

use uuid::Uuid;

use crate::{
    routes::ws::{
        ws::{SubscriptionRwLock, WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::{send_ws_message, subscribe_to_stream},
    },
    utils::{clients::sentry_utils::send_sentry_error, query_engine::data_types::DataType},
};
use database::models::StepProgress;

use super::threads_router::{ThreadEvent, ThreadRoute};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FetchingData {
    pub thread_id: Uuid,
    pub message_id: Uuid,
    pub progress: StepProgress,
    pub data: Option<Vec<IndexMap<String, DataType>>>,
    pub chart_config: Option<Value>,
    pub code: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct GetThreadRequest {
    pub id: Uuid,
    #[allow(dead_code)]
    pub password: Option<String>,
}

#[derive(Serialize, Debug)]
pub struct JoinThreadResponse {
    pub id: Uuid,
    pub thread_id: Uuid,
    pub email: String,
    pub name: Option<String>,
}

pub async fn get_thread_ws(
    subscriptions: &Arc<SubscriptionRwLock>,
    user_group: &String,
    user: &AuthenticatedUser,
    req: GetThreadRequest,
) -> Result<()> {
    let subscription = format!("thread:{}", req.id);

    match subscribe_to_stream(subscriptions, &subscription, user_group, &user.id).await {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error subscribing to thread: {}", e)),
    };

    let thread = get_chat_handler::get_chat_handler(&req.id, &user, false).await?;

    let get_thread_ws_message = WsResponseMessage::new(
        WsRoutes::Threads(ThreadRoute::Get),
        WsEvent::Threads(ThreadEvent::GetChat),
        &thread,
        None,
        user,
        WsSendMethod::SenderOnly,
    );

    match send_ws_message(&subscription, &get_thread_ws_message).await {
        Ok(_) => {}
        Err(e) => {
            tracing::error!("Error sending message to pubsub: {}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            return Err(anyhow!("Error sending message to pubsub: {}", e));
        }
    }

    Ok(())
}
