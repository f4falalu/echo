use axum::{
    routing::{get, put},
    Router,
};

mod list_users;
mod list_dataset_groups;
mod list_datasets;

pub use list_users::list_users;
pub use list_dataset_groups::list_dataset_groups;
pub use list_datasets::list_datasets;

pub fn router() -> Router {
    Router::new()
        .route("/users", get(list_users))
        .route("/dataset_groups", get(list_dataset_groups))
        .route("/datasets", get(list_datasets))
}
