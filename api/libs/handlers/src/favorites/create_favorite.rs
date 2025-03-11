use anyhow::{anyhow, Result};
use chrono::Utc;
use diesel::{insert_into, update, upsert::excluded, ExpressionMethods};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use uuid::Uuid;

use database::{
    enums::AssetType,
    pool::get_pg_pool,
    models::UserFavorite,
    schema::user_favorites,
};

use super::favorites_utils::{list_user_favorites, FavoriteEnum};

pub struct CreateFavoriteReq {
    pub id: Uuid,
    pub asset_type: AssetType,
    pub index: Option<usize>,
}

pub async fn create_favorite(
    user: &AuthenticatedUser,
    req: &CreateFavoriteReq,
) -> Result<Vec<FavoriteEnum>> {
    let index = req.index.unwrap_or(0);

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    match update(user_favorites::table)
        .set(user_favorites::order_index.eq(user_favorites::order_index + 1))
        .filter(user_favorites::user_id.eq(user.id))
        .filter(user_favorites::order_index.ge(index as i32))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error updating user favorite: {}", e)),
    };

    let user_favorite = UserFavorite {
        asset_type: req.asset_type.clone(),
        user_id: user.id,
        asset_id: req.id,
        order_index: index as i32,
        created_at: Utc::now(),
        deleted_at: None,
    };

    match insert_into(user_favorites::table)
        .values(user_favorite)
        .on_conflict((
            user_favorites::user_id,
            user_favorites::asset_id,
            user_favorites::asset_type,
        ))
        .do_update()
        .set((
            user_favorites::deleted_at.eq(excluded(user_favorites::deleted_at)),
            user_favorites::order_index.eq(excluded(user_favorites::order_index)),
        ))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error inserting or updating user favorite: {}", e)),
    };

    list_user_favorites(user).await
}
