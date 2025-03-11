use axum::{
    extract::Json,
    http::StatusCode, Extension,
};
use handlers::favorites::{FavoriteEnum, list_favorites};
use middleware::AuthenticatedUser;

pub async fn list_favorites_handler(
    Extension(user): Extension<AuthenticatedUser>,) -> Result<Json<Vec<FavoriteEnum>>, (StatusCode, String)> {
    match list_favorites(&user).await {
        Ok(favorites) => Ok(Json(favorites)),
        Err(e) => {
            tracing::error!("Error listing favorites: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error listing favorites: {:?}", e),
            ))
        }
    }
}
