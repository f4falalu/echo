use axum::{
    routing::get,
    Router,
};

// Import modules
mod get_metric;
mod get_metric_data;

pub fn router() -> Router {
    Router::new()
        .route("/:id", get(get_metric::get_metric_rest_handler))
        .route("/:id/data", get(get_metric_data::get_metric_data_rest_handler))
}
