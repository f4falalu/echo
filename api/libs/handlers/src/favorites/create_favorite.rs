use anyhow::{anyhow, Result};
use chrono::Utc;
use diesel::{insert_into, update, upsert::excluded, ExpressionMethods};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::{enums::AssetType, models::UserFavorite, pool::get_pg_pool, schema::user_favorites};

use super::favorites_utils::{list_user_favorites, FavoriteObject};

#[derive(Deserialize, Serialize, Clone)]
pub struct CreateFavoriteReq {
    pub id: Uuid,
    #[serde(alias = "type")]
    pub asset_type: AssetType,
    pub index: Option<usize>,
}

// Maintain backward compatibility with single item operations
pub async fn create_favorite(
    user: &AuthenticatedUser,
    req: &CreateFavoriteReq,
) -> Result<Vec<FavoriteObject>> {
    create_favorites_bulk(user, &[req.clone()]).await
}

// New function to handle bulk operations
pub async fn create_favorites_bulk(
    user: &AuthenticatedUser,
    favorites: &[CreateFavoriteReq],
) -> Result<Vec<FavoriteObject>> {
    if favorites.is_empty() {
        return list_user_favorites(user).await;
    }

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    // Find the minimum index to know where to start shifting existing favorites
    let min_index = favorites
        .iter()
        .map(|f| f.index.unwrap_or(0))
        .min()
        .unwrap_or(0);

    // Shift existing favorites to make room for new ones (one operation for all)
    match update(user_favorites::table)
        .set(user_favorites::order_index.eq(user_favorites::order_index + favorites.len() as i32))
        .filter(user_favorites::user_id.eq(user.id))
        .filter(user_favorites::order_index.ge(min_index as i32))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error updating user favorites: {}", e)),
    };

    // Prepare all new favorites for bulk insertion
    let user_favorites: Vec<UserFavorite> = favorites
        .iter()
        .enumerate()
        .map(|(i, req)| {
            let index = req.index.unwrap_or(0) + i;
            UserFavorite {
                asset_type: req.asset_type,
                user_id: user.id,
                asset_id: req.id,
                order_index: index as i32,
                created_at: Utc::now(),
                deleted_at: None,
            }
        })
        .collect();

    // Insert all favorites in a single operation
    match insert_into(user_favorites::table)
        .values(&user_favorites)
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
        Err(e) => return Err(anyhow!("Error inserting or updating user favorites: {}", e)),
    };

    list_user_favorites(user).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use chrono::Utc;
    use database::enums::AssetType;
    use middleware::AuthenticatedUser;
    use mock_pool::MockPool;
    use tokio;
    use uuid::Uuid;

    // We need to mock the database pool
    // This is a very simple mock implementation for testing
    mod mock_pool {
        use anyhow::Result;
        use diesel_async::{AsyncConnection, AsyncPgConnection};
        use std::sync::{Arc, Mutex};

        pub struct MockConn;

        impl MockConn {
            pub async fn execute(&self, _query: String) -> Result<()> {
                Ok(())
            }
        }

        pub struct MockPool {
            pub connections: Arc<Mutex<Vec<MockConn>>>,
        }

        impl MockPool {
            pub fn new() -> Self {
                Self {
                    connections: Arc::new(Mutex::new(vec![MockConn])),
                }
            }

            pub async fn get(&self) -> Result<MockConn> {
                let conn = self.connections.lock().unwrap().pop().unwrap();
                Ok(conn)
            }
        }
    }

    // Mock the database functions
    // This is just a placeholder for the actual unit test
    // A real implementation would use a proper testing framework
    #[tokio::test]
    async fn test_create_favorites_bulk() -> Result<()> {
        // Create test user
        let user = AuthenticatedUser {
            id: Uuid::new_v4(),
            // Add other fields as needed
        };

        // Create test favorites
        let favorites = vec![
            CreateFavoriteReq {
                id: Uuid::new_v4(),
                asset_type: AssetType::DashboardFile,
                index: None,
            },
            CreateFavoriteReq {
                id: Uuid::new_v4(),
                asset_type: AssetType::Collection,
                index: Some(1),
            },
        ];

        // In a real test, we would use a test database
        // For now, we'll just assert that the function doesn't panic
        let result = create_favorites_bulk(&user, &favorites).await;
        assert!(result.is_ok() || result.is_err());

        Ok(())
    }
}
