use axum::{
    routing::get,
    Router,
};

// Modules for dashboard endpoints
mod get_dashboard;
mod list_dashboards;
mod sharing;

pub fn router() -> Router {
    Router::new()
        .route("/:id", get(get_dashboard::get_dashboard_rest_handler))
        .route("/", get(list_dashboards::list_dashboard_rest_handler))
        .route("/:id/sharing", get(sharing::list_dashboard_sharing_rest_handler))
}
