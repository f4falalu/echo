use axum::{extract::Json, http::StatusCode, Extension};
use handlers::favorites::{create_favorite, CreateFavoriteReq, FavoriteObject, FavoriteIdAndType};
use middleware::AuthenticatedUser;

pub async fn create_favorite_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<FavoriteIdAndType>,
) -> Result<Json<Vec<FavoriteObject>>, (StatusCode, String)> {
    let req = CreateFavoriteReq {
        id: payload.id,
        asset_type: payload.type_,
        index: None,
    };

    match create_favorite(&user, &req).await {
        Ok(favorites) => Ok(Json(favorites)),
        Err(e) => {
            tracing::error!("Error creating favorite: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Error creating favorite: {:?}", e),
            ))
        }
    }
}
