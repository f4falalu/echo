use anyhow::Result;
use chrono::{DateTime, Utc};
use uuid::Uuid;

/// Generates a unique test identifier
pub fn generate_test_id() -> String {
    format!("test_{}", Uuid::new_v4())
}

/// Gets the current timestamp for test data
pub fn get_test_timestamp() -> DateTime<Utc> {
    Utc::now()
}

/// Creates a test error for error case testing
pub fn create_test_error(message: &str) -> anyhow::Error {
    anyhow::anyhow!("Test error: {}", message)
}

/// Waits for a condition with timeout
pub async fn wait_for_condition<F>(
    condition: F,
    timeout_ms: u64,
    check_interval_ms: u64,
) -> Result<bool>
where
    F: Fn() -> Result<bool>,
{
    let start = std::time::Instant::now();
    let timeout = std::time::Duration::from_millis(timeout_ms);
    let check_interval = std::time::Duration::from_millis(check_interval_ms);

    while start.elapsed() < timeout {
        if condition()? {
            return Ok(true);
        }
        tokio::time::sleep(check_interval).await;
    }

    Ok(false)
}

/// Runs a function with retry logic
pub async fn retry_with_backoff<F, T, E>(
    operation: F,
    max_retries: u32,
    initial_delay_ms: u64,
) -> Result<T>
where
    F: Fn() -> Result<T, E>,
    E: std::error::Error + Send + Sync + 'static,
{
    let mut current_retry = 0;
    let mut delay = initial_delay_ms;

    loop {
        match operation() {
            Ok(value) => return Ok(value),
            Err(e) => {
                if current_retry >= max_retries {
                    return Err(anyhow::Error::new(e));
                }
                tokio::time::sleep(std::time::Duration::from_millis(delay)).await;
                current_retry += 1;
                delay *= 2; // Exponential backoff
            }
        }
    }
} 