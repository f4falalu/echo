use anyhow::Result;
use uuid::Uuid;

// Import the TestInstance type
use crate::TestInstance;

/// Example test that requires database access - environment automatically initialized
#[tokio::test]
async fn test_simple_database_connection() -> Result<()> {
    // The environment is already initialized by the test framework
    
    // Just create a test instance to get a unique test ID and access to pools
    let test = TestInstance::new().await?;
    
    // Now we can use the test database
    let pool = test.get_diesel_pool();
    
    // Verify connection works by getting a connection from the pool
    let conn = pool.get().await?;
    
    // We've successfully connected!
    Ok(())
}

/// Example test for working with test data
#[tokio::test]
async fn test_with_isolation() -> Result<()> {
    // Create a test instance with a unique ID
    let test = TestInstance::new().await?;
    
    // Use the test_id to tag test data
    let test_id = &test.test_id;
    
    // Create a connection
    let mut conn = test.get_diesel_pool().get().await?;
    
    // Example raw SQL for test data creation (using the test_id)
    diesel::sql_query("INSERT INTO example_table (id, name, test_id) VALUES ($1, $2, $3)")
        .bind::<diesel::sql_types::Uuid, _>(Uuid::new_v4())
        .bind::<diesel::sql_types::Text, _>("Test item")
        .bind::<diesel::sql_types::Text, _>(test_id)
        .execute(&mut conn)
        .await?;
    
    // Run your test logic...
    
    // Clean up after the test
    diesel::sql_query("DELETE FROM example_table WHERE test_id = $1")
        .bind::<diesel::sql_types::Text, _>(test_id)
        .execute(&mut conn)
        .await?;
    
    Ok(())
}

/// Example test for third-party API integration
#[tokio::test]
async fn test_third_party_api() -> Result<()> {
    // Skip test if third-party testing is disabled
    if std::env::var("ENABLE_THIRD_PARTY_TESTS").is_err() {
        println!("Skipping third-party API test");
        return Ok(());
    }
    
    // Get API credentials from the test environment
    let api_key = std::env::var("THIRD_PARTY_API_KEY")
        .expect("THIRD_PARTY_API_KEY must be set for this test");
    let api_url = std::env::var("THIRD_PARTY_API_URL")
        .expect("THIRD_PARTY_API_URL must be set for this test");
    
    // Create test instance for database access if needed
    let test = TestInstance::new().await?;
    
    // Create API client with test credentials
    // let client = ThirdPartyClient::new(&api_key, &api_url);
    
    // Run API tests...
    
    Ok(())
}

/// Example test that specifically uses Redis
#[tokio::test]
async fn test_redis_connection() -> Result<()> {
    // Create test instance
    let test = TestInstance::new().await?;
    
    // Get Redis pool
    let redis_pool = test.get_redis_pool();
    
    // Get Redis connection
    let mut conn = redis_pool.get().await?;
    
    // Example Redis operations
    // redis::cmd("SET").arg("test_key").arg("test_value").execute(&mut *conn);
    // let value: String = redis::cmd("GET").arg("test_key").query_async(&mut *conn).await?;
    // assert_eq!(value, "test_value");
    
    Ok(())
}

/// Example of a test that runs with parallel services
#[tokio::test]
async fn test_multiple_services() -> Result<()> {
    // Create test instance
    let test = TestInstance::new().await?;
    
    // Access both SQL and Redis databases
    let pg_pool = test.get_diesel_pool();
    let redis_pool = test.get_redis_pool();
    
    // Example of parallel operations
    let pg_conn = pg_pool.get().await?;
    let redis_conn = redis_pool.get().await?;
    
    // Use both connections...
    
    Ok(())
} 