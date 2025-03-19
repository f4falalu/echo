use axum::{
    routing::{get, post, delete},
    Router,
};

mod list_sharing;
mod create_sharing;
mod delete_sharing;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_sharing::list_collection_sharing_rest_handler))
        .route("/", post(create_sharing::create_collection_sharing_rest_handler))
        .route("/", delete(delete_sharing::delete_collection_sharing_rest_handler))
}