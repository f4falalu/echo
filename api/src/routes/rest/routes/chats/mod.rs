use axum::{routing::post, Router};

mod post_chat;
mod agent_thread;   
mod agent_message_transformer;

pub fn router() -> Router {
    Router::new()
        .route("/", post(post_chat::create_chat))
} 