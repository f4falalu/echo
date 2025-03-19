use anyhow::Result;
use diesel::PgConnection;
use diesel::r2d2::{ConnectionManager, Pool};
use uuid::Uuid;
use crate::tests::common::env::init_test_env;

/// Represents a test database instance with utility functions
pub struct TestDb {
    pub pool: Pool<ConnectionManager<PgConnection>>,
    pub test_id: String, // Unique identifier for this test run
}

/// Trait for models that can be tagged with test_id
pub trait TestTaggable {
    fn set_test_id(&mut self, test_id: &str);
    fn get_test_id(&self) -> Option<&str>;
}

impl TestDb {
    /// Creates a new test database connection pool
    pub async fn new() -> Result<Self> {
        // Initialize the test environment
        init_test_env();
        
        // Generate unique test identifier
        let test_id = Uuid::new_v4().to_string();
        
        let database_url = std::env::var("TEST_DATABASE_URL")
            .expect("TEST_DATABASE_URL must be set");
            
        let manager = ConnectionManager::<PgConnection>::new(database_url);
        let pool = Pool::builder()
            .max_size(5)
            .build(manager)?;
            
        let db = Self { pool, test_id };
        
        // Run any initial setup
        db.setup_schema().await?;
            
        Ok(db)
    }
    
    /// Sets up database schema and initial configuration
    async fn setup_schema(&self) -> Result<()> {
        // This would typically run migrations or setup test-specific tables
        // For now, we're just ensuring we have a connection
        let _conn = self.pool.get()?;
        Ok(())
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
        // In a real implementation, we'd delete all data associated with this test_id
        // Example:
        // let conn = &mut self.pool.get()?;
        // diesel::delete(users::table)
        //    .filter(users::test_id.eq(&self.test_id))
        //    .execute(conn)?;
        Ok(())
    }
    
    /// Gets a connection from the pool
    pub fn get_conn(&self) -> Result<diesel::r2d2::PooledConnection<ConnectionManager<PgConnection>>> {
        Ok(self.pool.get()?)
    }
    
    /// Add test_id to model to track test data
    pub fn tag_model<T>(&self, model: &mut T) 
    where 
        T: TestTaggable,
    {
        model.set_test_id(&self.test_id);
    }
    
    /// Create a transaction for test operations
    /// Note: Transactions are not recommended for certain operations,
    /// but can be useful for tests to ensure isolation
    pub fn transaction<F, R>(&self, f: F) -> Result<R>
    where
        F: FnOnce(&diesel::PgConnection) -> Result<R>,
    {
        let conn = self.pool.get()?;
        let result = diesel::connection::Connection::transaction(&*conn, |c| {
            f(c)
        })?;
        Ok(result)
    }
    
    /// Execute raw SQL, useful for test setup/teardown
    pub fn execute_sql(&self, sql: &str) -> Result<()> {
        use diesel::RunQueryDsl;
        diesel::sql_query(sql).execute(&*self.pool.get()?)?;
        Ok(())
    }
}

/// Implement Drop to ensure cleanup runs even if tests panic
impl Drop for TestDb {
    fn drop(&mut self) {
        // Implement synchronous cleanup if needed
        // Note: This runs on drop, so it should be quick and not fail
    }
}

/// Example implementation of TestTaggable for a User model
#[cfg(test)]
mod examples {
    use super::*;
    
    // This is just an example - in your real code, you'd implement this for your actual models
    pub struct User {
        pub id: Uuid,
        pub name: String,
        pub test_id: Option<String>,
    }
    
    impl TestTaggable for User {
        fn set_test_id(&mut self, test_id: &str) {
            self.test_id = Some(test_id.to_string());
        }
        
        fn get_test_id(&self) -> Option<&str> {
            self.test_id.as_deref()
        }
    }
    
    #[test]
    fn test_tagging() {
        let db = TestDb {
            pool: Pool::builder()
                .build(ConnectionManager::<PgConnection>::new("dummy"))
                .unwrap(),
            test_id: "test-123".to_string(),
        };
        
        let mut user = User {
            id: Uuid::new_v4(),
            name: "Test User".to_string(),
            test_id: None,
        };
        
        db.tag_model(&mut user);
        assert_eq!(user.test_id, Some("test-123".to_string()));
    }
} 