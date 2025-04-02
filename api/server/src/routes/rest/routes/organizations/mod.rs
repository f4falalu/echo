use axum::{routing::{get, put}, Router};

mod users;
mod update_organization;

pub fn router() -> Router {
    Router::new()
        .route("/:id/users", get(users::list_organization_users))
        .route("/:id", put(update_organization::update_organization))
}