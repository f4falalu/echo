use axum::{
    routing::{get, delete},
    Router,
};

mod list_sharing;
mod delete_sharing;

pub use list_sharing::list_chat_sharing_rest_handler;
pub use delete_sharing::delete_chat_sharing_rest_handler;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_chat_sharing_rest_handler))
        .route("/", delete(delete_chat_sharing_rest_handler))
}
