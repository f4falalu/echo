use std::sync::Once;
use dotenv::dotenv;
use std::path::Path;

static ENV_SETUP: Once = Once::new();

/// Initialize test environment once per test process.
/// This ensures environment variables are loaded and configured properly.
/// This function is safe to call multiple times as it will only execute once.
pub fn init_test_env() {
    ENV_SETUP.call_once(|| {
        // Try loading .env.test first, then fall back to .env
        if Path::new(".env.test").exists() {
            dotenv::from_filename(".env.test").ok();
        } else {
            dotenv().ok();
        }
        
        // Set test-specific environment variables if not already set
        if std::env::var("TEST_ENV").is_err() {
            std::env::set_var("TEST_ENV", "test");
        }
        
        // Initialize logger if TEST_LOG is enabled
        if std::env::var("TEST_LOG").is_ok() {
            init_test_logger();
        }
        
        // Check for required variables
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

/// Keep the old function name for backward compatibility
pub fn setup_test_env() {
    init_test_env();
}

/// Get a required environment variable with a helpful error message
pub fn get_test_env(key: &str) -> String {
    std::env::var(key)
        .unwrap_or_else(|_| panic!("Required test environment variable {} is missing. Check your .env.test file.", key))
}

/// Get an optional environment variable with a default value
/// Maintains old name for backward compatibility
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

/// Initialize test logger with appropriate filters
fn init_test_logger() {
    let filter = std::env::var("TEST_LOG_LEVEL").unwrap_or_else(|_| "debug".to_string());
    
    // This is a simplified version - in a real application, you would use
    // a proper logging framework like tracing_subscriber
    eprintln!("Test logger initialized with level: {}", filter);
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_get_env_with_default() {
        // Ensure the function works with non-existent vars
        let result = get_test_config("NONEXISTENT_TEST_VAR", "default_value");
        assert_eq!(result, "default_value");
        
        // Set an environment variable and test retrieval
        std::env::set_var("TEST_EXISTING_VAR", "actual_value");
        let result = get_test_config("TEST_EXISTING_VAR", "default_value");
        assert_eq!(result, "actual_value");
    }
} 