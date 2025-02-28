use axum::{
    routing::{get, post},
    Router,
};

mod get_chat;
mod post_chat;

pub fn router() -> Router {
    Router::new()
        .route("/", post(post_chat::post_chat_route))
        .route("/:id", get(get_chat::get_chat_route))
}
