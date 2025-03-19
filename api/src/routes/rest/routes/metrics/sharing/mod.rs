use axum::{
    routing::{get, delete},
    Router,
};

mod list_sharing;
mod delete_sharing;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_sharing::list_metric_sharing_rest_handler))
        .route("/", delete(delete_sharing::delete_metric_sharing_rest_handler))
}