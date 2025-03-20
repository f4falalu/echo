use axum::{
    routing::{get, post, put, delete},
    Router,
};

mod add_assets_to_collection;
mod add_dashboards_to_collection;
mod list_collections;
mod get_collection;
mod create_collection;
mod update_collection;
mod delete_collection;
mod remove_assets_from_collection;
mod remove_metrics_from_collection;
mod sharing;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_collections::list_collections))
        .route("/", post(create_collection::create_collection))
        .route("/:id", get(get_collection::get_collection))
        .route("/:id", put(update_collection::update_collection))
        .route("/:id", delete(delete_collection::delete_collection))
        .route("/:id/assets", post(add_assets_to_collection::add_assets_to_collection))
        .route("/:id/dashboards", post(add_dashboards_to_collection::add_dashboards_to_collection))
        .route("/:id/assets", delete(remove_assets_from_collection::remove_assets_from_collection))
        .route("/:id/metrics", delete(remove_metrics_from_collection::remove_metrics_from_collection))
        .nest("/:id/sharing", sharing::router())
}
