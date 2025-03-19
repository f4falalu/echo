use axum::{
    routing::get,
    Router,
};

mod list_sharing;

pub use list_sharing::list_chat_sharing_rest_handler;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_chat_sharing_rest_handler))
}