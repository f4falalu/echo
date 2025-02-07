use anyhow::{Error, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use tokio::sync::mpsc::Receiver;
use tracing;

use crate::{
    routes::ws::{
        threads_and_messages::threads_router::{ThreadEvent, ThreadRoute},
        ws::{WsEvent, WsResponseMessage, WsSendMethod},
        ws_router::WsRoutes,
        ws_utils::send_ws_message,
    },
    utils::{
        agent::Agent,
        clients::ai::litellm::Message,
        tools::file_tools::{
            CreateFilesTool, ModifyFilesTool, OpenFilesTool, SearchDataCatalogTool,
            SearchFilesTool, SendToUserTool,
        },
    },
};

#[derive(Debug, Deserialize, Clone)]
pub struct ChatCreateNewChat {
    pub prompt: String,
    pub chat_id: Option<String>,
    pub message_id: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AgentResponse {
    pub event: String,
    pub data: Value,
}

pub struct AgentThreadHandler {
    agent: Agent,
}

impl AgentThreadHandler {
    pub fn new() -> Result<Self> {
        let mut agent = Agent::new("o3-mini".to_string(), HashMap::new());

        let search_data_catalog_tool = SearchDataCatalogTool;
        let search_files_tool = SearchFilesTool;
        let modify_files_tool = ModifyFilesTool;
        let create_files_tool = CreateFilesTool;
        let open_files_tool = OpenFilesTool;
        let send_to_user_tool = SendToUserTool;

        // Add each tool individually
        agent.add_tool(
            search_data_catalog_tool.get_name(),
            search_data_catalog_tool,
        );
        agent.add_tool(search_files_tool.get_name(), search_files_tool);
        agent.add_tool(modify_files_tool.get_name(), modify_files_tool);
        agent.add_tool(create_files_tool.get_name(), create_files_tool);
        agent.add_tool(open_files_tool.get_name(), open_files_tool);
        agent.add_tool(send_to_user_tool.get_name(), send_to_user_tool);

        Ok(Self { agent })
    }

    pub async fn handle_request(&self, request: ChatCreateNewChat) -> Result<()> {
        let rx = self.process_chat_request(request.clone()).await?;
        tokio::spawn(async move {
            Self::process_stream(rx, request.chat_id).await;
        });
        Ok(())
    }

    async fn process_chat_request(
        &self,
        request: ChatCreateNewChat,
    ) -> Result<Receiver<Result<Message, Error>>> {
        let thread = AgentThread::new(request.chat_id, vec![Message::user(request.prompt)]);
        self.agent.stream_process_thread(&thread).await
    }

    async fn process_stream(mut rx: Receiver<Result<Message, Error>>, chat_id: Option<String>) {
        let subscription = chat_id.unwrap_or_else(|| "chat:new".to_string());

        while let Some(msg_result) = rx.recv().await {
            if let Ok(msg) = msg_result {
                let response = WsResponseMessage::new_no_user(
                    WsRoutes::Threads(ThreadRoute::Post),
                    WsEvent::Threads(ThreadEvent::PostThread),
                    msg,
                    None,
                    WsSendMethod::All,
                );

                if let Err(e) = send_ws_message(&subscription, &response).await {
                    tracing::error!("Failed to send websocket message: {}", e);
                    break;
                }
            }
        }
    }
}
