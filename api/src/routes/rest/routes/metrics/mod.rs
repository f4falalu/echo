use axum::{
    routing::{delete, get, post, put},
    Router,
};

// Import modules
mod delete_metric;
mod get_metric;
mod get_metric_data;
mod list_metrics;
mod sharing;
mod update_metric;

pub fn router() -> Router {
    Router::new()
        .route("/:id", get(get_metric::get_metric_rest_handler))
        .route("/:id", put(update_metric::update_metric_rest_handler))
        .route("/:id", delete(delete_metric::delete_metric_rest_handler))
        .route("/", get(list_metrics::list_metrics_rest_handler))
        .route("/", delete(delete_metric::delete_metrics_rest_handler))
        .route(
            "/:id/data",
            get(get_metric_data::get_metric_data_rest_handler),
        )
        .nest("/:id/sharing", sharing::router())
}
