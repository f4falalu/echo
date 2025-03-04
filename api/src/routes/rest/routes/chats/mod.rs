use axum::{
    routing::{get, post, put, delete},
    Router,
};

mod get_chat;
mod post_chat;
mod update_chats;
mod delete_chats;

pub fn router() -> Router {
    Router::new()
        .route("/", post(post_chat::post_chat_route))
        .route("/", put(update_chats::update_chats_route))
        .route("/", delete(delete_chats::delete_chats_route))
        .route("/:id", get(get_chat::get_chat_route))
}
