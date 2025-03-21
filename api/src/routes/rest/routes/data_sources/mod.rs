mod post_data_sources;
mod list_data_sources;
mod update_data_source;

use axum::{
    routing::{get, post, put},
    Router,
};

pub fn router() -> Router {
    Router::new()
        .route("/", post(post_data_sources::post_data_sources))
        .route("/", get(list_data_sources::list_data_sources))
        .route("/:id", put(update_data_source::update_data_source))
}
