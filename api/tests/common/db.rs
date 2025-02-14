use anyhow::Result;
use diesel::PgConnection;
use diesel::r2d2::{ConnectionManager, Pool};
use dotenv::dotenv;

/// Represents a test database instance with utility functions
pub struct TestDb {
    pub pool: Pool<ConnectionManager<PgConnection>>,
}

impl TestDb {
    /// Creates a new test database connection pool
    pub async fn new() -> Result<Self> {
        dotenv().ok();
        
        let database_url = std::env::var("TEST_DATABASE_URL")
            .expect("TEST_DATABASE_URL must be set");
            
        let manager = ConnectionManager::<PgConnection>::new(database_url);
        let pool = Pool::builder()
            .max_size(5)
            .build(manager)?;
            
        Ok(Self { pool })
    }
    
    /// Sets up common test data that might be needed across multiple tests
    pub async fn setup_test_data(&self) -> Result<()> {
        // Add common test data setup here
        // For example:
        // - Create default test users
        // - Set up required organization data
        // - Initialize any required configuration
        Ok(())
    }
    
    /// Cleans up test data after tests complete
    pub async fn cleanup(&self) -> Result<()> {
        // Implement cleanup logic
        // For example:
        // - Delete test users
        // - Remove test organizations
        // - Clean up any test data created during tests
        Ok(())
    }
    
    /// Gets a connection from the pool
    pub async fn get_conn(&self) -> Result<diesel::r2d2::PooledConnection<ConnectionManager<PgConnection>>> {
        Ok(self.pool.get()?)
    }
}

/// Implement Drop to ensure cleanup runs even if tests panic
impl Drop for TestDb {
    fn drop(&mut self) {
        // Implement synchronous cleanup if needed
        // Note: This runs on drop, so it should be quick and not fail
    }
} 