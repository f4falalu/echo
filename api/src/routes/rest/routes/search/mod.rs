use axum::{
    routing::get,
    Router,
};

mod search;

pub fn router() -> Router {
    Router::new()
        .route("/", get(search::search))
}