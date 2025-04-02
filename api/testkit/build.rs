use std::env;
use std::fs;
use std::path::Path;

fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    
    // Create default .env.test if it doesn't exist
    ensure_test_env_exists();
    
    // Load environment variables from .env
    load_env_file();
    
    // Try to initialize pools but don't fail the build if it fails
    if let Err(e) = try_init_pools() {
        println!("cargo:warning=Failed to initialize pools: {}", e);
        println!("cargo:warning=This is not a build error - pools will be initialized when tests run");
    } else {
        println!("cargo:warning=Successfully initialized database pools");
    }
}

fn ensure_test_env_exists() {
    let test_env_path = Path::new(".env.test");
    
    // Only create if it doesn't exist
    if !test_env_path.exists() {
        println!("cargo:warning=Creating default .env.test file");
        
        let default_content = r#"
# Test Environment Configuration
TEST_ENV=test
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
TEST_POOLER_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
TEST_REDIS_URL=redis://localhost:6379
TEST_DATABASE_POOL_SIZE=10
TEST_SQLX_POOL_SIZE=10
TEST_LOG=true
TEST_LOG_LEVEL=debug
        "#.trim();
        
        fs::write(test_env_path, default_content)
            .expect("Failed to create default .env.test file");
            
        println!("cargo:warning=Created default .env.test file");
    }
}

fn load_env_file() {
    // Try loading .env.test first, then fall back to .env
    if Path::new(".env.test").exists() {
        if let Ok(_) = dotenv::from_filename(".env.test") {
            println!("cargo:warning=Loaded environment from .env.test");
        }
    } else if let Ok(_) = dotenv::dotenv() {
        println!("cargo:warning=Loaded environment from .env");
    }
    
    // Override DATABASE_URL to use TEST_DATABASE_URL for tests
    if let Ok(test_db_url) = env::var("TEST_DATABASE_URL") {
        env::set_var("DATABASE_URL", test_db_url);
        println!("cargo:warning=Using TEST_DATABASE_URL for DATABASE_URL");
    }

    // Override POOLER_URL to use TEST_POOLER_URL for tests
    if let Ok(test_pooler_url) = env::var("TEST_POOLER_URL") {
        env::set_var("POOLER_URL", test_pooler_url);
        println!("cargo:warning=Using TEST_POOLER_URL for POOLER_URL");
    }

    // Override REDIS_URL to use TEST_REDIS_URL for tests
    if let Ok(test_redis_url) = env::var("TEST_REDIS_URL") {
        env::set_var("REDIS_URL", test_redis_url);
        println!("cargo:warning=Using TEST_REDIS_URL for REDIS_URL");
    }

    // Override pool sizes to prevent excessive connections in test environment
    if let Ok(test_pool_size) = env::var("TEST_DATABASE_POOL_SIZE") {
        env::set_var("DATABASE_POOL_SIZE", test_pool_size);
    }

    if let Ok(test_sqlx_pool_size) = env::var("TEST_SQLX_POOL_SIZE") {
        env::set_var("SQLX_POOL_SIZE", test_sqlx_pool_size);
    }
}

fn try_init_pools() -> Result<(), String> {
    // Create a runtime for async operations
    let runtime = match tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build() {
            Ok(rt) => rt,
            Err(e) => return Err(e.to_string()),
        };
    
    // Try to initialize pools through the testkit's internal function
    // This won't fail the build if it can't connect to the database
    runtime.block_on(async {
        match database::pool::init_pools().await {
            Ok(_) => Ok(()),
            Err(e) => Err(e.to_string()),
        }
    })
} 