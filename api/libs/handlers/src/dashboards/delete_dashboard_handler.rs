use anyhow::{anyhow, Result};
use chrono::Utc;
use database::pool::get_pg_pool;
use database::schema::dashboard_files;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

pub async fn delete_dashboard_handler(dashboard_id: Uuid, user_id: &Uuid) -> Result<()> {
    let mut conn = get_pg_pool().get().await?;
    
    // Check if the dashboard exists and is not already deleted
    let dashboard_exists = diesel::select(diesel::dsl::exists(
        dashboard_files::table
            .filter(dashboard_files::id.eq(dashboard_id))
            .filter(dashboard_files::deleted_at.is_null())
    ))
    .get_result::<bool>(&mut conn)
    .await?;
    
    if !dashboard_exists {
        return Err(anyhow!("Dashboard not found or already deleted"));
    }
    
    // Soft delete the dashboard by setting deleted_at to the current time
    let now = Utc::now();
    let rows_affected = diesel::update(dashboard_files::table)
        .filter(dashboard_files::id.eq(dashboard_id))
        .filter(dashboard_files::deleted_at.is_null())
        .set(dashboard_files::deleted_at.eq(now))
        .execute(&mut conn)
        .await?;
    
    if rows_affected == 0 {
        return Err(anyhow!("Failed to delete dashboard"));
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;
    
    // Note: These tests would normally use a test database fixture
    // For now, we'll just sketch the test structure
    
    #[tokio::test]
    async fn test_delete_dashboard_handler() {
        // This would require setting up a test database with a dashboard
        // For a real implementation, we would:
        // 1. Create a test database
        // 2. Insert a test dashboard
        // 3. Call delete_dashboard_handler
        // 4. Verify the dashboard is marked as deleted
        
        // For now, just demonstrate the test structure
        let dashboard_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        // In a real test with fixtures:
        // let result = delete_dashboard_handler(dashboard_id, &user_id).await;
        // assert!(result.is_ok());
        
        // Then verify the dashboard is marked as deleted in the database
    }
    
    #[tokio::test]
    async fn test_delete_nonexistent_dashboard() {
        // This would require setting up a test database
        // For a real implementation, we would:
        // 1. Create a test database
        // 2. Call delete_dashboard_handler with a non-existent ID
        // 3. Verify we get the expected error
        
        // For now, just demonstrate the test structure
        let dashboard_id = Uuid::new_v4(); // A random ID that doesn't exist
        let user_id = Uuid::new_v4();
        
        // In a real test with fixtures:
        // let result = delete_dashboard_handler(dashboard_id, &user_id).await;
        // assert!(result.is_err());
        // assert!(result.unwrap_err().to_string().contains("not found"));
    }
}