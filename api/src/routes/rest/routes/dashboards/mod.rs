use axum::{
    routing::get,
    Router,
};

// Placeholder modules that you'll need to create
mod get_dashboard;

pub fn router() -> Router {
    Router::new()
        .route("/:id", get(get_dashboard::get_dashboard_rest_handler))
}
