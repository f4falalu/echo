use axum::{
    routing::get,
    Router,
};

mod list_sharing;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_sharing::list_metric_sharing_rest_handler))
}