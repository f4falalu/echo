use anyhow::Result;

#[tokio::test]
async fn test_database_connection() -> Result<()> {
    // Get the database pool from testkit
    let pool = testkit::get_pg_pool();
    
    // Test the connection by getting a connection from the pool
    let conn = pool.get().await?;
    
    // If we got here without errors, the connection is working
    Ok(())
}

#[tokio::test]
async fn test_with_isolation() -> Result<()> {
    // Get a unique test ID for data isolation
    let test_id = testkit::test_id();
    
    // Get database pool
    let pool = testkit::get_pg_pool();
    
    // Get a DB connection
    let mut conn = pool.get().await?;
    
    // Here you would create test data with test_id for isolation
    // For example:
    // diesel::sql_query("INSERT INTO users (id, email, test_id) VALUES ($1, $2, $3)")
    //     .bind::<diesel::sql_types::Uuid, _>(uuid::Uuid::new_v4())
    //     .bind::<diesel::sql_types::Text, _>("test@example.com")
    //     .bind::<diesel::sql_types::Text, _>(&test_id)
    //     .execute(&mut conn)
    //     .await?;
    
    // Run assertions on the test data
    
    // Clean up after the test
    // For example:
    // diesel::sql_query("DELETE FROM users WHERE test_id = $1")
    //     .bind::<diesel::sql_types::Text, _>(&test_id)
    //     .execute(&mut conn)
    //     .await?;
    
    Ok(())
} 