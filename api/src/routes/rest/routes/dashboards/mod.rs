use axum::{
    routing::get,
    Router,
};

// Placeholder modules that you'll need to create
mod get_dashboard;
mod list_dashboards;

pub fn router() -> Router {
    Router::new()
        .route("/:id", get(get_dashboard::get_dashboard_rest_handler))
        .route("/", get(list_dashboards::list_dashboard_rest_handler))
}
