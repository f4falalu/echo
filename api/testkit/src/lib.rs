use anyhow::Result;
use dotenv::dotenv;
use std::path::Path;
use std::sync::Once;
use once_cell::sync::OnceCell;
use database::pool::{PgPool, PgPoolSqlx, RedisPool};

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

/// Initialize database and Redis pools for testing
pub async fn init_pools() -> Result<()> {
    // Setup the environment first
    init_test_env();
    
    // Only initialize pools once
    if POOL_INIT.get().is_some() {
        return Ok(());
    }
    
    // Use the init_test_pools function which is specifically designed for tests
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

/// Get the initialized PG pool, initializing it first if needed
pub fn get_pg_pool() -> &'static PgPool {
    ensure_pools_initialized();
    database::pool::get_pg_pool()
}

/// Get the initialized SQLX pool, initializing it first if needed
pub fn get_sqlx_pool() -> &'static PgPoolSqlx {
    ensure_pools_initialized();
    database::pool::get_sqlx_pool()
}

/// Get the initialized Redis pool, initializing it first if needed
pub fn get_redis_pool() -> &'static RedisPool {
    ensure_pools_initialized();
    database::pool::get_redis_pool()
}

/// Helper function to ensure pools are initialized
fn ensure_pools_initialized() {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            // Always initialize test environment
            init_test_env();
            
            // If pools aren't initialized yet, try to initialize them
            if POOL_INIT.get().is_none() {
                if let Err(e) = init_pools().await {
                    panic!("Failed to initialize database pools for tests: {}", e);
                }
            }
        });
}

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

/// Reset the test database to a clean state
/// Only use this in integration tests where you need a completely fresh DB
/// Most tests should isolate their data instead
#[cfg(feature = "db_reset")]
pub async fn reset_test_database() -> Result<()> {
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;
    
    // Execute a transaction that truncates all tables
    // This code is only included when the db_reset feature is enabled
    // as it's potentially destructive
    
    diesel::sql_query("BEGIN").execute(&mut conn).await?;
    
    // List of tables to truncate - add more as needed
    let tables = vec![
        "users", "organizations", "users_to_organizations",
        "api_keys", "teams", "teams_to_users",
        "data_sources", "datasets", "dataset_columns",
        "permission_groups", "datasets_to_permission_groups",
        "terms", "collections", "dashboards", "threads", "messages"
    ];
    
    for table in tables {
        diesel::sql_query(format!("TRUNCATE TABLE {} CASCADE", table))
            .execute(&mut conn)
            .await?;
    }
    
    diesel::sql_query("COMMIT").execute(&mut conn).await?;
    
    Ok(())
} 