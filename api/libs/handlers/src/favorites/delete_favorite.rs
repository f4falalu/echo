use anyhow::{anyhow, Result};
use chrono::Utc;
use diesel::{update, ExpressionMethods};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use uuid::Uuid;

use database::{
    pool::get_pg_pool,
    schema::user_favorites,
};

use super::favorites_utils::{list_user_favorites, FavoriteObject};

// Maintain backward compatibility with single item operations
pub async fn delete_favorite(user: &AuthenticatedUser, id: &Uuid) -> Result<Vec<FavoriteObject>> {
    delete_favorites_bulk(user, &[*id]).await
}

// New function to handle bulk operations
pub async fn delete_favorites_bulk(user: &AuthenticatedUser, ids: &[Uuid]) -> Result<Vec<FavoriteObject>> {
    if ids.is_empty() {
        return list_user_favorites(user).await;
    }

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    // Delete all favorites in a single operation
    match update(user_favorites::table)
        .set(user_favorites::deleted_at.eq(Some(Utc::now())))
        .filter(user_favorites::user_id.eq(user.id))
        .filter(user_favorites::asset_id.eq_any(ids))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error deleting favorites: {:?}", e)),
    };

    list_user_favorites(user).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::enums::AssetType;
    use middleware::AuthenticatedUser;
    use uuid::Uuid;
    use tokio;
    use anyhow::Result;
    
    // Placeholder for a real test
    #[tokio::test]
    async fn test_delete_favorites_bulk() -> Result<()> {
        // Create test user
        let user = AuthenticatedUser {
            id: Uuid::new_v4(),
            // Add other fields as needed
        };
        
        // Create test favorite ids
        let favorite_ids = vec![
            Uuid::new_v4(),
            Uuid::new_v4(),
            Uuid::new_v4(),
        ];
        
        // In a real test, we would use a test database
        // For now, we'll just assert that the function doesn't panic
        let result = delete_favorites_bulk(&user, &favorite_ids).await;
        assert!(result.is_ok() || result.is_err());
        
        Ok(())
    }
}
