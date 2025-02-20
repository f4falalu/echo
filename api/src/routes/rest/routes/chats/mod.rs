use axum::{
    routing::{get, post},
    Router,
};

mod agent_message_transformer;
mod get_chat;
mod post_chat;

pub fn router() -> Router {
    Router::new()
        .route("/", post(post_chat::create_chat))
        .route("/:id", get(get_chat::get_chat_rest_handler))
}
