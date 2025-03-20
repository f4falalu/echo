use anyhow::Result;
use reqwest::{Client, ClientBuilder};
use uuid::Uuid;
use std::sync::Arc;

use crate::common::{db::TestDb, env::init_test_env};

#[derive(Debug, Clone)]
pub struct TestUser {
    pub id: Uuid,
    pub token: String,
    pub email: String,
}

pub struct TestApp {
    pub client: Client,
    pub test_user: TestUser,
    pub db: Arc<TestDb>,
}

impl TestApp {
    pub async fn new() -> Result<Self> {
        // Initialize test environment
        init_test_env();
        
        // Initialize database connection
        let db = Arc::new(TestDb::new().await?);
        
        // Create test user ID
        let user_id = Uuid::new_v4();
        
        // Mock token for auth
        let token = format!("test-token-{}", user_id);
        
        // Create test user
        let test_user = TestUser {
            id: user_id,
            token,
            email: format!("test-{}@example.com", user_id),
        };
        
        // Initialize HTTP client
        // We're using localhost assuming the test server is running locally
        let base_url = std::env::var("TEST_SERVER_URL")
            .unwrap_or_else(|_| "http://localhost:3000".to_string());
            
        let client = ClientBuilder::new()
            .build()?
            .to_owned();
        
        // Create TestApp
        let app = Self {
            client,
            test_user,
            db,
        };
        
        // Set up initial test data if needed
        app.db.setup_test_data().await?;
        
        Ok(app)
    }
}