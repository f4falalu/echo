use axum::{
    routing::{get, put},
    Router,
};

mod list_attributes;
mod list_dataset_groups;
mod list_datasets;
mod list_permission_groups;
mod list_teams;
mod put_teams;

pub fn router() -> Router {
    Router::new()
        .route("/attributes", get(list_attributes::list_attributes))
        .route(
            "/dataset_groups",
            get(list_dataset_groups::list_dataset_groups),
        )
        .route("/datasets", get(list_datasets::list_datasets))
        .route(
            "/permission_groups",
            get(list_permission_groups::list_permission_groups),
        )
        .route("/teams", get(list_teams::list_teams))
        .route("/teams", put(put_teams::put_teams))
}
