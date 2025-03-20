mod post_data_sources;
mod list_data_sources;

use axum::{
    routing::{get, post},
    Router,
};

pub fn router() -> Router {
    Router::new()
        .route("/", post(post_data_sources::post_data_sources))
        .route("/", get(list_data_sources::list_data_sources))
}
