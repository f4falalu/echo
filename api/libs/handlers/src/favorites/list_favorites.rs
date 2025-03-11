use anyhow::Result;
use middleware::AuthenticatedUser;

use super::favorites_utils::{list_user_favorites, FavoriteEnum};

pub async fn list_favorites(user: &AuthenticatedUser) -> Result<Vec<FavoriteEnum>> {
    list_user_favorites(user).await
}
