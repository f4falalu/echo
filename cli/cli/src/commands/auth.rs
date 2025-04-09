use anyhow::{Context, Result};
use async_trait::async_trait;
use clap::Parser;
use inquire::{Confirm, Password, Text};
use thiserror::Error;

use crate::utils::{
    buster::BusterClient,
    file::buster_credentials::{get_buster_credentials, set_buster_credentials, BusterCredentials},
};

const DEFAULT_HOST: &str = "https://api.buster.so";

#[derive(Error, Debug)]
pub enum AuthError {
    #[error("API key is required")]
    MissingApiKey,
    #[error("Invalid API key")]
    InvalidApiKey,
    #[error("Failed to validate credentials: {0}")]
    ValidationError(String),
}

#[derive(Parser, Debug)]
#[command(about = "Authenticate with Buster API")]
pub struct AuthArgs {
    /// The Buster API host URL
    #[arg(long, env = "BUSTER_HOST")]
    pub host: Option<String>,

    /// Your Buster API key
    #[arg(long, env = "BUSTER_API_KEY")]
    pub api_key: Option<String>,

    /// Don't save credentials to disk
    #[arg(long)]
    pub no_save: bool,
}

// --- Credentials Validation Trait ---
#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait CredentialsValidator {
    async fn validate(&self, url: &str, api_key: &str) -> Result<(), AuthError>;
}

pub struct RealCredentialsValidator;

#[async_trait]
impl CredentialsValidator for RealCredentialsValidator {
    async fn validate(&self, url: &str, api_key: &str) -> Result<(), AuthError> {
        let buster_client = BusterClient::new(url.to_string(), api_key.to_string())
            .map_err(|e| AuthError::ValidationError(e.to_string()))?;

        if !buster_client.validate_api_key().await
            .map_err(|e| AuthError::ValidationError(e.to_string()))? {
            return Err(AuthError::InvalidApiKey);
        }

        Ok(())
    }
}

/// Inner logic for checking authentication, testable without file system access.
async fn check_authentication_inner(
    cached_credentials_result: Result<BusterCredentials, anyhow::Error>,
    validator: &dyn CredentialsValidator,
) -> Result<()> {
    let host_env = std::env::var("BUSTER_HOST");
    let api_key_env = std::env::var("BUSTER_API_KEY");

    let credentials = match cached_credentials_result {
        Ok(mut creds) => {
            // Override with env vars if they exist
            if let Ok(host) = host_env {
                creds.url = host;
            }
            if let Ok(api_key) = api_key_env {
                creds.api_key = api_key;
            }
            // Use default host if still empty after checking cache and env var
            if creds.url.is_empty() {
                creds.url = DEFAULT_HOST.to_string();
            }
            Some(creds)
        }
        Err(_) => {
            // No cached creds, rely solely on env vars or defaults
            match (host_env, api_key_env) {
                (Ok(host), Ok(api_key)) => Some(BusterCredentials { url: host, api_key }),
                (Err(_), Ok(api_key)) => Some(BusterCredentials {
                    url: DEFAULT_HOST.to_string(),
                    api_key,
                }),
                _ => None, // Can't proceed without at least an API key
            }
        }
    };

    match credentials {
        Some(creds) => {
            if creds.api_key.is_empty() {
                Err(anyhow::anyhow!(
                    "Authentication required. Please run `buster auth` or set BUSTER_API_KEY."
                ))
            } else {
                // Use the validator trait
                validator.validate(&creds.url, &creds.api_key)
                    .await
                    .map_err(|e| {
                        anyhow::anyhow!(
                            "Authentication failed ({}). Please run `buster auth` to configure credentials.",
                            e
                        )
                    })
            }
        }
        None => Err(anyhow::anyhow!(
            "Authentication required. Please run `buster auth` or set BUSTER_API_KEY."
        )),
    }
}

/// Checks if the user is authenticated by loading credentials and validating them.
/// Prioritizes environment variables (BUSTER_HOST, BUSTER_API_KEY) over cached credentials.
/// Returns Ok(()) if authenticated, otherwise returns an Err prompting the user to run `buster auth`.
pub async fn check_authentication() -> Result<()> {
    let cached_credentials_result = get_buster_credentials()
        .await
        .map_err(anyhow::Error::from);
    let validator = RealCredentialsValidator;
    check_authentication_inner(cached_credentials_result, &validator).await
}

pub async fn auth_with_args(args: AuthArgs) -> Result<()> {
    // Get existing credentials or create default
    let mut buster_creds = match get_buster_credentials().await {
        Ok(creds) => creds,
        Err(_) => BusterCredentials {
            url: DEFAULT_HOST.to_string(),
            api_key: String::new(),
        },
    };
    let existing_creds_present = !buster_creds.url.is_empty() && !buster_creds.api_key.is_empty();

    let host_provided = args.host.is_some();
    let api_key_provided = args.api_key.is_some();
    let fully_provided_via_args = host_provided && api_key_provided;

    // If existing credentials are found and the user hasn't provided everything via args/env,
    // prompt for confirmation before proceeding with potential overwrites.
    if existing_creds_present && !fully_provided_via_args {
        let confirm = Confirm::new("Existing credentials found. Do you want to overwrite them?")
            .with_default(false)
            .with_help_message("Select 'y' to proceed with entering new credentials, or 'n' to cancel.")
            .prompt()?;

        if !confirm {
            println!("Authentication cancelled.");
            return Ok(());
        }
        // If confirmed, we will proceed, potentially overwriting existing values below.
    }

    // Apply host from args or use default
    if let Some(host) = args.host {
        buster_creds.url = host;
    }

    // Check if API key was provided via args or environment
    let api_key_from_env_or_args = args.api_key.is_some();

    // Apply API key from args or environment
    if let Some(api_key) = args.api_key {
        buster_creds.api_key = api_key;
    }

    // Interactive mode for missing values
    // Only prompt if the value wasn't provided via args/env
    if !host_provided && buster_creds.url.is_empty() {
        let url_input = Text::new("Enter the URL of your Buster API")
            .with_default(DEFAULT_HOST)
            .with_help_message("Press Enter to use the default URL")
            .prompt()
            .context("Failed to get URL input")?;

        if url_input.is_empty() {
            buster_creds.url = DEFAULT_HOST.to_string();
        } else {
            buster_creds.url = url_input;
        }
    }

    // Always prompt for API key if it wasn't found in environment variables or args
    // unless it's already present from the loaded credentials
    if !api_key_from_env_or_args {
        let obfuscated_api_key = if buster_creds.api_key.is_empty() {
            String::from("None")
        } else {
            format!("{}...", &buster_creds.api_key[0..std::cmp::min(4, buster_creds.api_key.len())]) // Ensure safe slicing
        };

        let prompt_message = if existing_creds_present && !fully_provided_via_args {
             format!("Enter new API key (current: [{obfuscated_api_key}]):")
        } else {
             format!("Enter your API key [{obfuscated_api_key}]:")
        };

        let api_key_input = Password::new(&prompt_message)
            .without_confirmation()
            .with_help_message("Your API key can be found in your Buster dashboard. Leave blank to keep current key.")
            .prompt()
            .context("Failed to get API key input")?;

        if api_key_input.is_empty() && buster_creds.api_key.is_empty() {
             // Only error if no key exists *and* none was entered
            return Err(AuthError::MissingApiKey.into());
        } else if !api_key_input.is_empty() {
            // Update only if new input was provided
            buster_creds.api_key = api_key_input;
        }
    }

    // Validate credentials using the trait
    let validator = RealCredentialsValidator;
    validator.validate(&buster_creds.url, &buster_creds.api_key).await?;

    // Save credentials unless --no-save is specified
    if !args.no_save {
        set_buster_credentials(buster_creds).await
            .context("Failed to save credentials")?;
        println!("Credentials saved successfully!");
    } else {
         // Only print success if we actually went through validation.
         // If validation failed, error would have been returned above.
         println!("Authentication successful!");
         println!("Note: Credentials were not saved due to --no-save flag");
    }

    Ok(())
}

// --- Tests --- 
#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::file::buster_credentials::BusterCredentials;
    use mockall::predicate::*;
    use std::env;

    // Helper to run async tests with env var setup/teardown
    async fn run_test_with_env<F, Fut>(env_vars: Vec<(&str, &str)>, test_fn: F)
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = ()>,
    {
        // Use a mutex to ensure env vars don't interfere between parallel tests
        static ENV_MUTEX: tokio::sync::Mutex<()> = tokio::sync::Mutex::const_new(());
        let _guard = ENV_MUTEX.lock().await;

        let original_vars: Vec<(&str, Option<String>)> = env_vars
            .iter()
            .map(|(k, _)| (*k, env::var(*k).ok()))
            .collect();

        for (k, v) in &env_vars {
            env::set_var(k, v);
        }

        (test_fn)().await;

        // Teardown: Restore original environment variables
        for (k, v) in original_vars {
            match v {
                Some(val) => env::set_var(k, val),
                None => env::remove_var(k),
            }
        }
    }

    #[tokio::test]
    async fn check_inner_success_env_only() {
        let test_host = "http://env.host";
        let test_key = "env_key";
        run_test_with_env(vec![("BUSTER_HOST", test_host), ("BUSTER_API_KEY", test_key)], || async {
            let mut mock_validator = MockCredentialsValidator::new();
            mock_validator
                .expect_validate()
                .with(eq(test_host), eq(test_key))
                .times(1)
                .returning(|_, _| Ok(()));
            
            // Pass Err to simulate no cache file found
            let result = check_authentication_inner(Err(anyhow::anyhow!("No cache")), &mock_validator).await;
            assert!(result.is_ok());
        })
        .await;
    }

    #[tokio::test]
    async fn check_inner_success_cache_only() {
        // Define creds outside the test closure for lifetime reasons
        let cached_creds = BusterCredentials {
            url: "http://cache.host".to_string(),
            api_key: "cache_key".to_string(),
        };
        // Clone fields needed for the closure *before* the test closure
        let expected_url = cached_creds.url.clone();
        let expected_key = cached_creds.api_key.clone();

        run_test_with_env(vec![], || async {
            let mut mock_validator = MockCredentialsValidator::new();
            mock_validator
                .expect_validate()
                 // Use withf with the cloned values
                .withf(move |url: &str, key: &str| {
                    url == expected_url && key == expected_key
                })
                .times(1)
                .returning(|_, _| Ok(()));

             // Clone creds when passing into the function
            let result = check_authentication_inner(Ok(cached_creds.clone()), &mock_validator).await;
            assert!(result.is_ok());
        })
        .await;
    }

     #[tokio::test]
    async fn check_inner_success_env_overrides_cache() {
        // Define creds outside the test closure
        let cached_creds = BusterCredentials {
            url: "http://cache.host".to_string(),
            api_key: "cache_key".to_string(),
        };
        let test_host = "http://env.host";
        let test_key = "env_key";
        // Clone fields needed for the closure
        let expected_host = test_host.to_string(); 
        let expected_key = test_key.to_string();

        run_test_with_env(vec![("BUSTER_HOST", test_host), ("BUSTER_API_KEY", test_key)], || async {
             let mut mock_validator = MockCredentialsValidator::new();
             mock_validator
                 .expect_validate()
                 // Use withf with the cloned values
                 .withf(move |url: &str, key: &str| {
                    url == expected_host && key == expected_key
                 })
                 .times(1)
                 .returning(|_, _| Ok(()));
 
             // Clone creds when passing into the function
             let result = check_authentication_inner(Ok(cached_creds.clone()), &mock_validator).await;
             assert!(result.is_ok());
        })
        .await;
    }

     #[tokio::test]
     async fn check_inner_fail_missing_api_key_env() {
         run_test_with_env(vec![("BUSTER_HOST", "http://some.host")], || async { // No API Key
             let mut mock_validator = MockCredentialsValidator::new();
             mock_validator.expect_validate().times(0); // Validator should not be called
 
             let result = check_authentication_inner(Err(anyhow::anyhow!("No cache")), &mock_validator).await;
             assert!(result.is_err());
             assert!(result.unwrap_err().to_string().contains("BUSTER_API_KEY"));
         })
         .await;
     }

     #[tokio::test]
     async fn check_inner_fail_missing_api_key_cache() {
         // Define creds outside the test closure
         let cached_creds = BusterCredentials {
             url: "http://cache.host".to_string(),
             api_key: "".to_string(), // Empty API Key
         };
         run_test_with_env(vec![], || async {
             let mut mock_validator = MockCredentialsValidator::new();
             mock_validator.expect_validate().times(0);
 
              // Clone creds when passing into the function
             let result = check_authentication_inner(Ok(cached_creds.clone()), &mock_validator).await;
             assert!(result.is_err());
             assert!(result.unwrap_err().to_string().contains("BUSTER_API_KEY"));
         })
         .await;
     }

    #[tokio::test]
    async fn check_inner_fail_validation() {
        let test_host = "http://env.host";
        let test_key = "env_key_invalid";
        run_test_with_env(vec![("BUSTER_HOST", test_host), ("BUSTER_API_KEY", test_key)], || async {
            let mut mock_validator = MockCredentialsValidator::new();
            mock_validator
                .expect_validate()
                .with(eq(test_host), eq(test_key))
                .times(1)
                .returning(|_, _| Err(AuthError::InvalidApiKey)); // Return error

            let result = check_authentication_inner(Err(anyhow::anyhow!("No cache")), &mock_validator).await;
            assert!(result.is_err());
            assert!(result.unwrap_err().to_string().contains("Authentication failed (Invalid API key)"));
        })
        .await;
    }

     #[tokio::test]
     async fn check_inner_fail_no_creds() {
         run_test_with_env(vec![], || async { // No env vars
             let mut mock_validator = MockCredentialsValidator::new();
             mock_validator.expect_validate().times(0);
 
             let result = check_authentication_inner(Err(anyhow::anyhow!("No cache")), &mock_validator).await;
             assert!(result.is_err());
              assert!(result.unwrap_err().to_string().contains("BUSTER_API_KEY"));
         })
         .await;
     }
}
