use axum::{
    extract::Json,
    http::StatusCode, Extension,
};
use uuid::Uuid;
use handlers::favorites::{FavoriteEnum, UserFavoritesReq, update_favorites};
use middleware::AuthenticatedUser;

pub async fn update_favorites_handler(
    Extension(user): Extension<AuthenticatedUser>,    Json(payload): Json<UserFavoritesReq>,
) -> Result<Json<Vec<FavoriteEnum>>, (StatusCode, String)> {
    let favorite_ids: Vec<Uuid> = payload
        .favorites
        .into_iter()
        .map(|favorite| favorite.id)
        .collect();

    match update_favorites(&user, &favorite_ids).await {
        Ok(_) => {
            // After updating, fetch the updated list to return
            match handlers::favorites::list_favorites(&user).await {
                Ok(favorites) => Ok(Json(favorites)),
                Err(e) => {
                    tracing::error!("Error listing favorites after update: {:?}", e);
                    Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Error listing favorites after update: {:?}", e),
                    ))
                }
            }
        },
        Err(e) => {
            tracing::error!("Error updating favorites: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error updating favorites: {:?}", e),
            ))
        }
    }
}
