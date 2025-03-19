use axum::{
    routing::{get, post},
    Router,
};

mod list_sharing;
mod create_sharing;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_sharing::list_collection_sharing_rest_handler))
        .route("/", post(create_sharing::create_collection_sharing_rest_handler))
}