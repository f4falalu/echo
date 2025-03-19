use axum::{routing::{get, put, delete, post}, Router};

// Import modules
mod delete_metric;
mod get_metric;
mod get_metric_data;
mod list_metrics;
mod post_metric_dashboard;
mod update_metric;
mod sharing;

pub fn router() -> Router {
    Router::new()
        .route("/:id", get(get_metric::get_metric_rest_handler))
        .route("/:id", put(update_metric::update_metric_rest_handler))
        .route("/:id", delete(delete_metric::delete_metric_rest_handler))
        .route("/", get(list_metrics::list_metrics_rest_handler))
        .route(
            "/:id/data",
            get(get_metric_data::get_metric_data_rest_handler),
        )
        .route(
            "/:id/dashboards",
            post(post_metric_dashboard::post_metric_dashboard_rest_handler),
        )
        .nest("/:id/sharing", sharing::router())
}
