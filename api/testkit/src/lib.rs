use anyhow::Result;
use dotenv::dotenv;
use std::path::Path;
use std::sync::Once;
use once_cell::sync::OnceCell;

static ENV_INIT: Once = Once::new();
static POOL_INIT: OnceCell<()> = OnceCell::new();

/// Initialize the test environment by setting up .env.test
/// This should only be used internally or by build.rs
fn init_test_env() {
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

        // Override POOLER_URL to use TEST_POOLER_URL for tests
        if let Ok(test_pooler_url) = std::env::var("TEST_POOLER_URL") {
            std::env::set_var("POOLER_URL", test_pooler_url);
        }

        // Override REDIS_URL to use TEST_REDIS_URL for tests
        if let Ok(test_redis_url) = std::env::var("TEST_REDIS_URL") {
            std::env::set_var("REDIS_URL", test_redis_url);
        }

        // Override pool sizes to prevent excessive connections in test environment
        if let Ok(test_pool_size) = std::env::var("TEST_DATABASE_POOL_SIZE") {
            std::env::set_var("DATABASE_POOL_SIZE", test_pool_size);
        }

        if let Ok(test_sqlx_pool_size) = std::env::var("TEST_SQLX_POOL_SIZE") {
            std::env::set_var("SQLX_POOL_SIZE", test_sqlx_pool_size);
        }
    });
}

// This function is only for internal use by build.rs - the pools should be
// initialized at build time, not during test runtime
#[doc(hidden)]
pub async fn _internal_init_pools() -> Result<()> {
    // Setup the environment first
    init_test_env();
    
    // Only initialize pools once
    if POOL_INIT.get().is_some() {
        return Ok(());
    }
    
    // Use the database crate's init_pools function
    let result = match database::pool::init_pools().await {
        Ok(_) => {
            // Success case - cache the result
            let _ = POOL_INIT.set(());
            Ok(())
        },
        Err(e) => {
            // Log the error but still cache the attempt to prevent repeated tries
            tracing::error!("Failed to initialize test pools: {}", e);
            let _ = POOL_INIT.set(());
            Err(e)
        }
    };
    
    result
}

// No need for pool accessor functions - users should access pools directly
// through the database library (database::pool::get_pg_pool(), etc.)

/// Generate a unique test ID - useful for creating test resources
pub fn test_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

/// Clean up a test database connection - useful in test teardown
pub async fn cleanup_connection() -> Result<()> {
    // This is a placeholder for any future cleanup that might be needed
    // Currently the pools handle their own cleanup
    Ok(())
}