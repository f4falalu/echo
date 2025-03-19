use axum::{
    routing::get,
    Router,
};

mod list_sharing;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_sharing::list_collection_sharing_rest_handler))
}