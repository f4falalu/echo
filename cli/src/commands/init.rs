use anyhow::Result;
use colored::*;
use inquire::{Select, Text, Password, validator::Validation};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::error::Error;

use crate::utils::{
    buster_credentials::get_and_validate_buster_credentials,
    profiles::{Credential, PostgresCredentials},
    BusterClient, PostDataSourcesRequest,
};

#[derive(Debug, Clone)]
enum DatabaseType {
    Redshift,
    Postgres,
    BigQuery,
    Snowflake,
}

impl std::fmt::Display for DatabaseType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DatabaseType::Redshift => write!(f, "Redshift"),
            DatabaseType::Postgres => write!(f, "Postgres"),
            DatabaseType::BigQuery => write!(f, "BigQuery"),
            DatabaseType::Snowflake => write!(f, "Snowflake"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct RedshiftCredentials {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub database: Option<String>,
    pub schemas: Option<Vec<String>>,
}

pub async fn init() -> Result<()> {
    println!("{}", "Initializing Buster...".bold().green());

    // Check for Buster credentials
    println!("Checking for Buster credentials...");
    let buster_creds = match get_and_validate_buster_credentials().await {
        Ok(creds) => creds,
        Err(_) => {
            println!("{}", "No valid Buster credentials found.".red());
            println!("Please run {} first.", "buster auth".cyan());
            return Err(anyhow::anyhow!("No valid Buster credentials found"));
        }
    };
    println!("{}", "✓ Buster credentials found".green());

    // Select database type
    let db_types = vec![
        DatabaseType::Redshift,
        DatabaseType::Postgres,
        DatabaseType::BigQuery,
        DatabaseType::Snowflake,
    ];

    let db_type = Select::new(
        "Select your database type:",
        db_types,
    )
    .prompt()?;

    println!("You selected: {}", db_type.to_string().cyan());

    match db_type {
        DatabaseType::Redshift => setup_redshift(buster_creds.url, buster_creds.api_key).await,
        _ => {
            println!("{}", format!("{} support is coming soon!", db_type).yellow());
            Err(anyhow::anyhow!("Database type not yet implemented"))
        }
    }
}

async fn setup_redshift(buster_url: String, buster_api_key: String) -> Result<()> {
    println!("{}", "Setting up Redshift connection...".bold());

    // Collect name (with validation)
    let name_regex = Regex::new(r"^[a-zA-Z0-9_-]+$")?;
    let name = Text::new("Enter a unique name for this data source:")
        .with_help_message("Only alphanumeric characters, dash (-) and underscore (_) allowed")
        .with_validator(move |input: &str| {
            if name_regex.is_match(input) {
                Ok(Validation::Valid)
            } else {
                Ok(Validation::Invalid("Name must contain only alphanumeric characters, dash (-) or underscore (_)".into()))
            }
        })
        .prompt()?;

    // Collect host
    let host = Text::new("Enter the Redshift host:")
        .with_help_message("Example: my-cluster.abc123xyz789.us-west-2.redshift.amazonaws.com")
        .prompt()?;

    // Collect port (with validation)
    let port_str = Text::new("Enter the Redshift port:")
        .with_default("5439")
        .with_help_message("Default Redshift port is 5439")
        .with_validator(|input: &str| {
            match input.parse::<u16>() {
                Ok(_) => Ok(Validation::Valid),
                Err(_) => Ok(Validation::Invalid("Port must be a valid number between 1 and 65535".into())),
            }
        })
        .prompt()?;
    let port = port_str.parse::<u16>()?;

    // Collect username
    let username = Text::new("Enter the Redshift username:")
        .prompt()?;

    // Collect password (masked)
    let password = Password::new("Enter the Redshift password:")
        .without_confirmation()
        .prompt()?;

    // Collect database (optional)
    let database = Text::new("Enter the Redshift database (optional):")
        .with_help_message("Leave blank to access all available databases")
        .prompt()?;
    let database = if database.trim().is_empty() {
        None
    } else {
        Some(database)
    };

    // Collect schema (optional)
    let schema = Text::new("Enter the Redshift schema (optional):")
        .with_help_message("Leave blank to access all available schemas")
        .prompt()?;
    let schema = if schema.trim().is_empty() {
        None
    } else {
        Some(schema)
    };

    // Create credentials
    let redshift_creds = RedshiftCredentials {
        host,
        port,
        username,
        password,
        database,
        schemas: schema.map(|s| vec![s]),
    };

    // Create API request
    let request = PostDataSourcesRequest {
        name: name.clone(),
        env: "dev".to_string(), // Default to dev environment
        credential: Credential::Redshift(
            PostgresCredentials {
                host: redshift_creds.host,
                port: redshift_creds.port,
                username: redshift_creds.username,
                password: redshift_creds.password,
                database: redshift_creds.database.clone().unwrap_or_default(),
                schema: redshift_creds.schemas.clone().and_then(|s| s.first().cloned()).unwrap_or_default(),
                jump_host: None,
                ssh_username: None,
                ssh_private_key: None,
            }
        ),
    };

    // Send to API
    println!("Sending credentials to Buster API...");
    let client = BusterClient::new(buster_url, buster_api_key)?;
    
    match client.post_data_sources(vec![request]).await {
        Ok(_) => {
            println!("{}", "✓ Data source created successfully!".green().bold());
            println!("Data source '{}' is now available for use with Buster.", name.cyan());
            Ok(())
        },
        Err(e) => {
            println!("{}", "✗ Failed to create data source".red().bold());
            println!("Error: {}", e);
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}
