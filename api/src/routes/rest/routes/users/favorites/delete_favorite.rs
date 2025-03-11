use axum::{
    extract::{Json, Path, Extension},
    http::StatusCode,
};
use uuid::Uuid;
use handlers::favorites::{FavoriteEnum, delete_favorite};
use middleware::AuthenticatedUser;

pub async fn delete_favorite_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<FavoriteEnum>>, (StatusCode, String)> {
    match delete_favorite(&user, &id).await {
        Ok(favorites) => Ok(Json(favorites)),
        Err(e) => {
            tracing::error!("Error deleting favorite: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error deleting favorite: {:?}", e),
            ))
        }
    }
}
