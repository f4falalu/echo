use axum::{
    routing::get,
    Router,
};

// Placeholder modules that you'll need to create
mod get_metrics;

pub fn router() -> Router {
    Router::new()
        .route("/:id", get(get_metrics::get_metrics_rest_handler))
}
