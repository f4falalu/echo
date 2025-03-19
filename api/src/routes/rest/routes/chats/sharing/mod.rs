use axum::{
    routing::{get, post},
    Router,
};

mod create_sharing;

pub fn router() -> Router {
    Router::new()
        .route("/", post(create_sharing::create_chat_sharing_rest_handler))
}