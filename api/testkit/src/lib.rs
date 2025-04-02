use anyhow::Result;
use dotenv::dotenv;
use std::path::Path;
use std::sync::Once;
use once_cell::sync::OnceCell;

static ENV_INIT: Once = Once::new();
static POOL_INIT: OnceCell<()> = OnceCell::new();

/// Initialize the test environment by setting up .env.test
pub fn init_test_env() {
    ENV_INIT.call_once(|| {
        // Try loading .env.test first, then fall back to .env
        if Path::new(".env.test").exists() {
            dotenv::from_filename(".env.test").ok();
        } else {
            dotenv().ok();
        }

        // Override DATABASE_URL to use TEST_DATABASE_URL for tests
        if let Ok(test_db_url) = std::env::var("TEST_DATABASE_URL") {
            std::env::set_var("DATABASE_URL", test_db_url);
        }
    });
}

/// Initialize database and Redis pools for testing
pub async fn init_pools() -> Result<()> {
    // Setup the environment first
    init_test_env();
    
    // Only initialize pools once
    if POOL_INIT.get().is_some() {
        return Ok(());
    }
    
    // Use the database crate's init_pools function
    let result = database::pool::init_pools().await;
    
    // Store initialization state even if there was an error
    // This prevents repeated attempts that we know will fail
    let _ = POOL_INIT.set(());
    
    result
}

/// Get the initialized PG pool
pub fn get_pg_pool() -> &'static database::pool::PgPool {
    // Ensure pools are initialized
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            // Try to initialize pools but continue even if it fails
            let _ = init_pools().await;
        });
    
    // This will panic if pools weren't initialized, which is what we want
    // for tests that actually need the database
    database::pool::get_pg_pool()
}

/// Get the initialized SQLX pool
pub fn get_sqlx_pool() -> &'static database::pool::PgPoolSqlx {
    // Ensure pools are initialized
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            // Try to initialize pools but continue even if it fails
            let _ = init_pools().await;
        });
    
    // This will panic if pools weren't initialized, which is what we want
    // for tests that actually need the database
    database::pool::get_sqlx_pool()
}

/// Get the initialized Redis pool
pub fn get_redis_pool() -> &'static database::pool::RedisPool {
    // Ensure pools are initialized
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            // Try to initialize pools but continue even if it fails
            let _ = init_pools().await;
        });
    
    // This will panic if pools weren't initialized, which is what we want
    // for tests that actually need the database
    database::pool::get_redis_pool()
}

/// Generate a unique test ID
pub fn test_id() -> String {
    uuid::Uuid::new_v4().to_string()
} 