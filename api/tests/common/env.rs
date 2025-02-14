use std::sync::Once;
use dotenv::dotenv;

static ENV_SETUP: Once = Once::new();

/// Sets up the test environment
/// This function is safe to call multiple times as it will only execute once
pub fn setup_test_env() {
    ENV_SETUP.call_once(|| {
        dotenv().ok();
        
        // Set default test environment variables
        if std::env::var("TEST_ENV").is_err() {
            std::env::set_var("TEST_ENV", "test");
        }
        
        // Ensure required test variables are set
        let required_vars = [
            "TEST_DATABASE_URL",
            "TEST_API_KEY",
        ];
        
        for var in required_vars {
            if std::env::var(var).is_err() {
                panic!("Required test environment variable {} is not set", var);
            }
        }
    });
}

/// Gets a test configuration value, with a default fallback
pub fn get_test_config(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

/// Creates a temporary test directory and returns its path
pub fn setup_test_dir() -> std::path::PathBuf {
    let test_dir = std::env::temp_dir().join("test_workspace");
    std::fs::create_dir_all(&test_dir).expect("Failed to create test directory");
    test_dir
}

/// Cleans up the test directory
pub fn cleanup_test_dir(test_dir: &std::path::Path) {
    if test_dir.exists() {
        std::fs::remove_dir_all(test_dir).expect("Failed to clean up test directory");
    }
} 