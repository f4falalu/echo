use anyhow::Result;
use colored::*;
use indicatif::{ProgressBar, ProgressStyle};
use inquire::{validator::Validation, Confirm, Password, Select, Text};
use query_engine::credentials::{
    BigqueryCredentials, Credential, DatabricksCredentials, MySqlCredentials, PostgresCredentials,
    RedshiftCredentials, SnowflakeCredentials, SqlServerCredentials,
};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::error::Error;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

use crate::utils::exclusion::{BusterConfig, ProjectContext};
use crate::utils::{
    buster::{BusterClient, PostDataSourcesRequest},
    file::buster_credentials::get_and_validate_buster_credentials,
};

#[derive(Debug, Clone)]
enum DatabaseType {
    Redshift,
    Postgres,
    BigQuery,
    Snowflake,
    MySql,
    SqlServer,
    Databricks,
}

impl std::fmt::Display for DatabaseType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DatabaseType::Redshift => write!(f, "Redshift"),
            DatabaseType::Postgres => write!(f, "Postgres"),
            DatabaseType::BigQuery => write!(f, "BigQuery"),
            DatabaseType::Snowflake => write!(f, "Snowflake"),
            DatabaseType::MySql => write!(f, "MySQL/MariaDB"),
            DatabaseType::SqlServer => write!(f, "SQL Server"),
            DatabaseType::Databricks => write!(f, "Databricks"),
        }
    }
}

// Using shared RedshiftCredentials from query_engine now, no need for local definition

// Helper struct to parse dbt_project.yml
#[derive(Debug, Deserialize)]
struct DbtProject {
    #[serde(rename = "model-paths")]
    model_paths: Option<Vec<String>>,
}

pub async fn init(destination_path: Option<&str>) -> Result<()> {
    println!("{}", "Initializing Buster...".bold().green());

    // Determine the destination path for buster.yml
    let dest_path = match destination_path {
        Some(path) => PathBuf::from(path),
        None => std::env::current_dir()?,
    };

    // Ensure destination directory exists
    if !dest_path.exists() {
        fs::create_dir_all(&dest_path)?;
    }

    let config_path = dest_path.join("buster.yml");

    if config_path.exists() {
        let overwrite = Confirm::new(&format!(
            "A buster.yml file already exists at {}. Do you want to overwrite it?",
            config_path.display().to_string().cyan()
        ))
        .with_default(false)
        .prompt()?;

        if !overwrite {
            println!(
                "{}",
                "Keeping existing buster.yml file. Configuration will be skipped.".yellow()
            );
            return Ok(());
        }
    }

    // Check for Buster credentials with progress indicator
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
            .template("{spinner:.green} {msg}")
            .unwrap(),
    );
    spinner.set_message("Checking for Buster credentials...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    let buster_creds = match get_and_validate_buster_credentials().await {
        Ok(creds) => {
            spinner.finish_with_message("✓ Buster credentials found".green().to_string());
            creds
        }
        Err(_) => {
            spinner.finish_with_message("✗ No valid Buster credentials found".red().to_string());
            println!("Please run {} first.", "buster auth".cyan());
            return Err(anyhow::anyhow!("No valid Buster credentials found"));
        }
    };

    // Select database type
    // Sort database types alphabetically by display name
    let mut db_types = vec![
        DatabaseType::Redshift,
        DatabaseType::Postgres,
        DatabaseType::BigQuery,
        DatabaseType::Snowflake,
        DatabaseType::MySql,
        DatabaseType::SqlServer,
        DatabaseType::Databricks,
    ];
    db_types.sort_by_key(|db| db.to_string()); // Sort alphabetically

    let db_type = Select::new("Select your database type:", db_types).prompt()?;

    println!("You selected: {}", db_type.to_string().cyan());

    match db_type {
        DatabaseType::Redshift => {
            setup_redshift(buster_creds.url, buster_creds.api_key, &config_path).await
        }
        DatabaseType::Postgres => {
            setup_postgres(buster_creds.url, buster_creds.api_key, &config_path).await
        }
        DatabaseType::BigQuery => {
            setup_bigquery(buster_creds.url, buster_creds.api_key, &config_path).await
        }
        DatabaseType::Snowflake => {
            setup_snowflake(buster_creds.url, buster_creds.api_key, &config_path).await
        }
        DatabaseType::MySql => {
            setup_mysql(buster_creds.url, buster_creds.api_key, &config_path).await
        }
        DatabaseType::SqlServer => {
            setup_sqlserver(buster_creds.url, buster_creds.api_key, &config_path).await
        }
        DatabaseType::Databricks => {
            setup_databricks(buster_creds.url, buster_creds.api_key, &config_path).await
        }
    }
}

async fn setup_redshift(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
) -> Result<()> {
    println!("{}", "Setting up Redshift connection...".bold().green());

    // Collect name (with validation)
    let name_regex = Regex::new(r"^[a-zA-Z0-9_-]+$")?;
    let name = Text::new("Enter a unique name for this data source:")
        .with_help_message("Only alphanumeric characters, dash (-) and underscore (_) allowed")
        .with_validator(move |input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Name cannot be empty".into()));
            }
            if name_regex.is_match(input) {
                Ok(Validation::Valid)
            } else {
                Ok(Validation::Invalid(
                    "Name must contain only alphanumeric characters, dash (-) or underscore (_)"
                        .into(),
                ))
            }
        })
        .prompt()?;

    // Collect host
    let host = Text::new("Enter the Redshift host:")
        .with_help_message("Example: my-cluster.abc123xyz789.us-west-2.redshift.amazonaws.com")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Host cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect port (with validation)
    let port_str = Text::new("Enter the Redshift port:")
        .with_default("5439")
        .with_help_message("Default Redshift port is 5439")
        .with_validator(|input: &str| match input.parse::<u16>() {
            Ok(_) => Ok(Validation::Valid),
            Err(_) => Ok(Validation::Invalid(
                "Port must be a valid number between 1 and 65535".into(),
            )),
        })
        .prompt()?;
    let port = port_str.parse::<u16>()?;

    // Collect username
    let username = Text::new("Enter the Redshift username:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Username cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect password (masked)
    let password = Password::new("Enter the Redshift password:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Password cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .without_confirmation()
        .prompt()?;

    // Collect database (required)
    let database = Text::new("Enter the default Redshift database:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Database cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect schema (required)
    let schema = Text::new("Enter the default Redshift schema (optional):")
        .prompt()?;
    let schema_opt = if schema.trim().is_empty() {
        None
    } else {
        Some(schema.clone())
    };

    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("Port: {}", port.to_string().cyan());
    println!("Username: {}", username.cyan());
    println!("Password: {}", "********".cyan());
    println!("Default Database: {}", database.cyan());
    if let Some(s) = &schema_opt {
        println!("Default Schema: {}", s.cyan());
    }

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create API request
    let redshift_creds = RedshiftCredentials {
        host,
        port,
        username,
        password,
        default_database: database.clone(),
        default_schema: schema_opt.clone(),
    };
    let credential = Credential::Redshift(redshift_creds);
    let request = PostDataSourcesRequest {
        name: name.clone(),
        credential,
    };

    // Send to API with progress indicator
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
            .template("{spinner:.green} {msg}")
            .unwrap(),
    );
    spinner.set_message("Sending credentials to Buster API...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    let client = BusterClient::new(buster_url, buster_api_key)?;

    match client.post_data_sources(request).await {
        Ok(_) => {
            spinner.finish_with_message(
                "✓ Data source created successfully!"
                    .green()
                    .bold()
                    .to_string(),
            );
            println!(
                "\nData source '{}' is now available for use with Buster.",
                name.cyan()
            );

            // Create buster.yml file
            create_buster_config_file(
                config_path,
                &name,
                &database,
                schema_opt.as_deref(),
            )?;

            println!("You can now use this data source with other Buster commands.");
            Ok(())
        }
        Err(e) => {
            spinner.finish_with_message("✗ Failed to create data source".red().bold().to_string());
            println!("\nError: {}", e);
            println!("Please check your credentials and try again.");
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}

async fn setup_postgres(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
) -> Result<()> {
    println!("{}", "Setting up PostgreSQL connection...".bold().green());

    // Collect name (with validation)
    let name_regex = Regex::new(r"^[a-zA-Z0-9_-]+$")?;
    let name = Text::new("Enter a unique name for this data source:")
        .with_help_message("Only alphanumeric characters, dash (-) and underscore (_) allowed")
        .with_validator(move |input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Name cannot be empty".into()));
            }
            if name_regex.is_match(input) {
                Ok(Validation::Valid)
            } else {
                Ok(Validation::Invalid(
                    "Name must contain only alphanumeric characters, dash (-) or underscore (_)"
                        .into(),
                ))
            }
        })
        .prompt()?;

    // Collect host
    let host = Text::new("Enter the PostgreSQL host:")
        .with_help_message("Example: localhost or db.example.com")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Host cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect port (with validation)
    let port_str = Text::new("Enter the PostgreSQL port:")
        .with_default("5432") // Default Postgres port is 5432
        .with_help_message("Default PostgreSQL port is 5432")
        .with_validator(|input: &str| match input.parse::<u16>() {
            Ok(_) => Ok(Validation::Valid),
            Err(_) => Ok(Validation::Invalid(
                "Port must be a valid number between 1 and 65535".into(),
            )),
        })
        .prompt()?;
    let port = port_str.parse::<u16>()?;

    // Collect username
    let username = Text::new("Enter the PostgreSQL username:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Username cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect password (masked)
    let password = Password::new("Enter the PostgreSQL password:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Password cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .without_confirmation()
        .prompt()?;

    // Collect database (required)
    let database = Text::new("Enter the default PostgreSQL database name:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Database cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect schema (required)
    let schema = Text::new("Enter the default PostgreSQL schema (optional):")
        .prompt()?;
    let schema_opt = if schema.trim().is_empty() {
        None
    } else {
        Some(schema.clone())
    };

    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("Port: {}", port.to_string().cyan());
    println!("Username: {}", username.cyan());
    println!("Password: {}", "********".cyan());
    println!("Default Database: {}", database.cyan());
    if let Some(s) = &schema_opt {
        println!("Default Schema: {}", s.cyan());
    }

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create API request
    let postgres_creds = PostgresCredentials {
        host,
        port,
        username,
        password,
        default_database: database.clone(),
        default_schema: schema_opt.clone(),
        jump_host: None,
        ssh_username: None,
        ssh_private_key: None,
    };
    let credential = Credential::Postgres(postgres_creds);
    let request = PostDataSourcesRequest {
        name: name.clone(),
        credential,
    };

    // Send to API with progress indicator
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
            .template("{spinner:.green} {msg}")
            .unwrap(),
    );
    spinner.set_message("Sending credentials to Buster API...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    let client = BusterClient::new(buster_url, buster_api_key)?;

    match client.post_data_sources(request).await {
        Ok(_) => {
            spinner.finish_with_message(
                "✓ Data source created successfully!"
                    .green()
                    .bold()
                    .to_string(),
            );
            println!(
                "\nData source '{}' is now available for use with Buster.",
                name.cyan()
            );

            // Create buster.yml file
            create_buster_config_file(
                config_path,
                &name,
                &database,
                schema_opt.as_deref(),
            )?;

            println!("You can now use this data source with other Buster commands.");
            Ok(())
        }
        Err(e) => {
            spinner.finish_with_message("✗ Failed to create data source".red().bold().to_string());
            println!("\nError: {}", e);
            println!("Please check your credentials and try again.");
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}

async fn setup_bigquery(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
) -> Result<()> {
    println!("{}", "Setting up BigQuery connection...".bold().green());

    // Collect name (with validation)
    let name_regex = Regex::new(r"^[a-zA-Z0-9_-]+$")?;
    let name = Text::new("Enter a unique name for this data source:")
        .with_help_message("Only alphanumeric characters, dash (-) and underscore (_) allowed")
        .with_validator(move |input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Name cannot be empty".into()));
            }
            if name_regex.is_match(input) {
                Ok(Validation::Valid)
            } else {
                Ok(Validation::Invalid(
                    "Name must contain only alphanumeric characters, dash (-) or underscore (_)"
                        .into(),
                ))
            }
        })
        .prompt()?;

    // Collect project ID
    let project_id = Text::new("Enter the default Google Cloud project ID:")
        .with_help_message("Example: my-project-123456")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Project ID cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect dataset ID (required)
    let dataset_id = Text::new("Enter the default BigQuery dataset ID:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Dataset ID cannot be empty".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Collect credentials JSON
    println!(
        "\n{}",
        "BigQuery requires a service account credentials JSON file.".bold()
    );
    println!(
        "You can create one in the Google Cloud Console under IAM & Admin > Service Accounts."
    );

    let credentials_path = Text::new("Enter the path to your credentials JSON file:")
        .with_help_message("Example: /path/to/credentials.json")
        .with_validator(|input: &str| {
            let path = Path::new(input);
            if !path.exists() {
                return Ok(Validation::Invalid("File does not exist".into()));
            }
            if !path.is_file() {
                return Ok(Validation::Invalid("Path is not a file".into()));
            }
            Ok(Validation::Valid)
        })
        .prompt()?;

    // Read credentials file
    let credentials_content = match fs::read_to_string(&credentials_path) {
        Ok(content) => content,
        Err(e) => {
            return Err(anyhow::anyhow!("Failed to read credentials file: {}", e));
        }
    };

    // Parse JSON to ensure it's valid and convert to serde_json::Value
    let credentials_json: serde_json::Value = match serde_json::from_str(&credentials_content) {
        Ok(json) => json,
        Err(e) => {
            return Err(anyhow::anyhow!("Invalid JSON in credentials file: {}", e));
        }
    };

    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Default Project ID: {}", project_id.cyan());
    println!("Default Dataset ID: {}", dataset_id.cyan());
    println!("Credentials: {}", credentials_path.cyan());

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create API request
    let bigquery_creds = BigqueryCredentials {
        default_project_id: project_id.clone(),
        default_dataset_id: dataset_id.clone(),
        credentials_json: credentials_json,
    };
    let credential = Credential::Bigquery(bigquery_creds);
    let request = PostDataSourcesRequest {
        name: name.clone(),
        credential,
    };

    // Send to API with progress indicator
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
            .template("{spinner:.green} {msg}")
            .unwrap(),
    );
    spinner.set_message("Sending credentials to Buster API...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    let client = BusterClient::new(buster_url, buster_api_key)?;

    match client.post_data_sources(request).await {
        Ok(_) => {
            spinner.finish_with_message(
                "✓ Data source created successfully!"
                    .green()
                    .bold()
                    .to_string(),
            );
            println!(
                "\nData source '{}' is now available for use with Buster.",
                name.cyan()
            );

            // Create buster.yml file
            create_buster_config_file(
                config_path,
                &name,
                &project_id,
                Some(&dataset_id),
            )?;

            println!("You can now use this data source with other Buster commands.");
            Ok(())
        }
        Err(e) => {
            spinner.finish_with_message("✗ Failed to create data source".red().bold().to_string());
            println!("\nError: {}", e);
            println!("Please check your credentials and try again.");
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}

async fn setup_mysql(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
) -> Result<()> {
    println!("{}", "Setting up MySQL/MariaDB connection...".bold().green());

    // Collect name
    let name_regex = Regex::new(r"^[a-zA-Z0-9_-]+$")?;
    let name = Text::new("Enter a unique name for this data source:")
        .with_help_message("Only alphanumeric characters, dash (-) and underscore (_) allowed")
        .with_validator(move |input: &str| {
            if input.trim().is_empty() { Ok(Validation::Invalid("Name cannot be empty".into())) }
            else if name_regex.is_match(input) { Ok(Validation::Valid) }
            else { Ok(Validation::Invalid("Name must contain only alphanumeric characters, dash (-) or underscore (_)".into())) }
        })
        .prompt()?;

    // Collect host
    let host = Text::new("Enter the MySQL/MariaDB host:")
        .with_help_message("Example: localhost or db.example.com")
        .with_validator(|input: &str| {
            if input.trim().is_empty() { Ok(Validation::Invalid("Host cannot be empty".into())) }
            else { Ok(Validation::Valid) }
        })
        .prompt()?;

    // Collect port
    let port_str = Text::new("Enter the MySQL/MariaDB port:")
        .with_default("3306")
        .with_help_message("Default MySQL/MariaDB port is 3306")
        .with_validator(|input: &str| match input.parse::<u16>() {
            Ok(_) => Ok(Validation::Valid),
            Err(_) => Ok(Validation::Invalid("Port must be a valid number between 1 and 65535".into())),
        })
        .prompt()?;
    let port = port_str.parse::<u16>()?;

    // Collect username
    let username = Text::new("Enter the MySQL/MariaDB username:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() { Ok(Validation::Invalid("Username cannot be empty".into())) }
            else { Ok(Validation::Valid) }
        })
        .prompt()?;

    // Collect password
    let password = Password::new("Enter the MySQL/MariaDB password:")
        .with_validator(|input: &str| {
             if input.trim().is_empty() { Ok(Validation::Invalid("Password cannot be empty".into())) }
             else { Ok(Validation::Valid) }
        })
        .without_confirmation()
        .prompt()?;

    // Collect database (required)
    let database = Text::new("Enter the default MySQL/MariaDB database name:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() { Ok(Validation::Invalid("Database cannot be empty".into())) }
            else { Ok(Validation::Valid) }
        })
        .prompt()?;

    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("Port: {}", port.to_string().cyan());
    println!("Username: {}", username.cyan());
    println!("Password: {}", "********".cyan());
    println!("Default Database: {}", database.cyan());

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create API request
    let mysql_creds = MySqlCredentials {
        host,
        port,
        username,
        password,
        default_database: database.clone(),
        jump_host: None, // Not prompted for simplicity
        ssh_username: None,
        ssh_private_key: None,
    };
    let credential = Credential::MySql(mysql_creds);
    let request = PostDataSourcesRequest { name: name.clone(), credential };

    // Send to API
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(ProgressStyle::default_spinner().tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ").template("{spinner:.green} {msg}").unwrap());
    spinner.set_message("Sending credentials to Buster API...");
    spinner.enable_steady_tick(Duration::from_millis(100));
    let client = BusterClient::new(buster_url, buster_api_key)?;

    match client.post_data_sources(request).await {
        Ok(_) => {
            spinner.finish_with_message("✓ Data source created successfully!".green().bold().to_string());
            println!("\nData source '{}' is now available for use with Buster.", name.cyan());
            create_buster_config_file(config_path, &name, &database, None)?; // MySQL doesn't have a top-level schema concept like others
            println!("You can now use this data source with other Buster commands.");
            Ok(())
        }
        Err(e) => {
            spinner.finish_with_message("✗ Failed to create data source".red().bold().to_string());
            println!("\nError: {}", e);
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}

async fn setup_sqlserver(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
) -> Result<()> {
    println!("{}", "Setting up SQL Server connection...".bold().green());

    // Collect name
    let name_regex = Regex::new(r"^[a-zA-Z0-9_-]+$")?;
    let name = Text::new("Enter a unique name for this data source:")
        .with_help_message("Only alphanumeric characters, dash (-) and underscore (_) allowed")
        .with_validator(move |input: &str| {
             if input.trim().is_empty() { Ok(Validation::Invalid("Name cannot be empty".into())) }
             else if name_regex.is_match(input) { Ok(Validation::Valid) }
             else { Ok(Validation::Invalid("Name must contain only alphanumeric characters, dash (-) or underscore (_)".into())) }
        })
        .prompt()?;

    // Collect host
    let host = Text::new("Enter the SQL Server host:")
        .with_help_message("Example: server.database.windows.net or localhost")
        .with_validator(|input: &str| {
            if input.trim().is_empty() { Ok(Validation::Invalid("Host cannot be empty".into())) }
            else { Ok(Validation::Valid) }
        })
        .prompt()?;

    // Collect port
    let port_str = Text::new("Enter the SQL Server port:")
        .with_default("1433")
        .with_help_message("Default SQL Server port is 1433")
        .with_validator(|input: &str| match input.parse::<u16>() {
             Ok(_) => Ok(Validation::Valid),
             Err(_) => Ok(Validation::Invalid("Port must be a valid number between 1 and 65535".into())),
        })
        .prompt()?;
    let port = port_str.parse::<u16>()?;

    // Collect username
    let username = Text::new("Enter the SQL Server username:")
         .with_validator(|input: &str| {
             if input.trim().is_empty() { Ok(Validation::Invalid("Username cannot be empty".into())) }
             else { Ok(Validation::Valid) }
         })
         .prompt()?;

    // Collect password
    let password = Password::new("Enter the SQL Server password:")
        .with_validator(|input: &str| {
             if input.trim().is_empty() { Ok(Validation::Invalid("Password cannot be empty".into())) }
             else { Ok(Validation::Valid) }
        })
        .without_confirmation()
        .prompt()?;

    // Collect database (required)
    let database = Text::new("Enter the default SQL Server database name:")
        .with_validator(|input: &str| {
             if input.trim().is_empty() { Ok(Validation::Invalid("Database cannot be empty".into())) }
             else { Ok(Validation::Valid) }
        })
        .prompt()?;

    // Collect schema (optional)
    let schema = Text::new("Enter the default SQL Server schema (optional, default: dbo):")
        // No validator needed for optional field
        .prompt()?;
    let schema_opt = if schema.trim().is_empty() {
        None // Or perhaps Some("dbo".to_string()) depending on desired default behavior
    } else {
        Some(schema.clone())
    };

    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("Port: {}", port.to_string().cyan());
    println!("Username: {}", username.cyan());
    println!("Password: {}", "********".cyan());
    println!("Default Database: {}", database.cyan());
    if let Some(s) = &schema_opt {
        println!("Default Schema: {}", s.cyan());
    }

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create API request
    let sqlserver_creds = SqlServerCredentials {
        host,
        port,
        username,
        password,
        default_database: database.clone(),
        default_schema: schema_opt.clone(),
        jump_host: None, // Not prompted for simplicity
        ssh_username: None,
        ssh_private_key: None,
    };
    let credential = Credential::SqlServer(sqlserver_creds);
    let request = PostDataSourcesRequest { name: name.clone(), credential };

    // Send to API
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(ProgressStyle::default_spinner().tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ").template("{spinner:.green} {msg}").unwrap());
    spinner.set_message("Sending credentials to Buster API...");
    spinner.enable_steady_tick(Duration::from_millis(100));
    let client = BusterClient::new(buster_url, buster_api_key)?;

    match client.post_data_sources(request).await {
        Ok(_) => {
            spinner.finish_with_message("✓ Data source created successfully!".green().bold().to_string());
            println!("\nData source '{}' is now available for use with Buster.", name.cyan());
            create_buster_config_file(config_path, &name, &database, schema_opt.as_deref())?;
            println!("You can now use this data source with other Buster commands.");
            Ok(())
        }
        Err(e) => {
            spinner.finish_with_message("✗ Failed to create data source".red().bold().to_string());
            println!("\nError: {}", e);
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}

async fn setup_databricks(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
) -> Result<()> {
    println!("{}", "Setting up Databricks connection...".bold().green());

    // Collect name
    let name_regex = Regex::new(r"^[a-zA-Z0-9_-]+$")?;
    let name = Text::new("Enter a unique name for this data source:")
         .with_help_message("Only alphanumeric characters, dash (-) and underscore (_) allowed")
         .with_validator(move |input: &str| {
             if input.trim().is_empty() { Ok(Validation::Invalid("Name cannot be empty".into())) }
             else if name_regex.is_match(input) { Ok(Validation::Valid) }
             else { Ok(Validation::Invalid("Name must contain only alphanumeric characters, dash (-) or underscore (_)".into())) }
         })
        .prompt()?;

    // Collect host
    let host = Text::new("Enter the Databricks host:")
        .with_help_message("Example: adb-xxxxxxxxxxxx.xx.azuredatabricks.net")
        .with_validator(|input: &str| {
            if input.trim().is_empty() { Ok(Validation::Invalid("Host cannot be empty".into())) }
            else { Ok(Validation::Valid) }
        })
        .prompt()?;

    // Collect API key
    let api_key = Password::new("Enter the Databricks API key (Personal Access Token):")
        .with_validator(|input: &str| {
             if input.trim().is_empty() { Ok(Validation::Invalid("API key cannot be empty".into())) }
             else { Ok(Validation::Valid) }
        })
        .without_confirmation()
        .prompt()?;

     // Collect Warehouse ID
    let warehouse_id = Text::new("Enter the Databricks SQL Warehouse HTTP Path:")
        .with_help_message("Example: /sql/1.0/warehouses/xxxxxxxxxxxx")
        .with_validator(|input: &str| {
            if input.trim().is_empty() { Ok(Validation::Invalid("Warehouse ID cannot be empty".into())) }
            else { Ok(Validation::Valid) }
        })
        .prompt()?;

    // Collect default catalog (required)
    let catalog = Text::new("Enter the default Databricks catalog:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() { Ok(Validation::Invalid("Catalog cannot be empty".into())) }
            else { Ok(Validation::Valid) }
        })
        .prompt()?;

    // Collect default schema (optional)
    let schema = Text::new("Enter the default Databricks schema (optional):")
        .prompt()?;
    let schema_opt = if schema.trim().is_empty() { None } else { Some(schema) };

    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("API Key: {}", "********".cyan());
    println!("Warehouse ID: {}", warehouse_id.cyan());
    println!("Default Catalog: {}", catalog.cyan());
    if let Some(s) = &schema_opt {
        println!("Default Schema: {}", s.cyan());
    }

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create API request
    let databricks_creds = DatabricksCredentials {
        host,
        api_key,
        warehouse_id,
        default_catalog: catalog.clone(),
        default_schema: schema_opt.clone(),
    };
    let credential = Credential::Databricks(databricks_creds);
    let request = PostDataSourcesRequest { name: name.clone(), credential };

    // Send to API
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(ProgressStyle::default_spinner().tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ").template("{spinner:.green} {msg}").unwrap());
    spinner.set_message("Sending credentials to Buster API...");
    spinner.enable_steady_tick(Duration::from_millis(100));
    let client = BusterClient::new(buster_url, buster_api_key)?;

    match client.post_data_sources(request).await {
        Ok(_) => {
            spinner.finish_with_message("✓ Data source created successfully!".green().bold().to_string());
            println!("\nData source '{}' is now available for use with Buster.", name.cyan());
            // Map catalog to database, schema to schema for buster.yml
            create_buster_config_file(config_path, &name, &catalog, schema_opt.as_deref())?;
            println!("You can now use this data source with other Buster commands.");
            Ok(())
        }
        Err(e) => {
            spinner.finish_with_message("✗ Failed to create data source".red().bold().to_string());
            println!("\nError: {}", e);
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}

async fn setup_snowflake(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
) -> Result<()> {
    println!("{}", "Setting up Snowflake connection...".bold().green());

    // Collect name
     let name_regex = Regex::new(r"^[a-zA-Z0-9_-]+$")?;
     let name = Text::new("Enter a unique name for this data source:")
         .with_help_message("Only alphanumeric characters, dash (-) and underscore (_) allowed")
         .with_validator(move |input: &str| {
             if input.trim().is_empty() { Ok(Validation::Invalid("Name cannot be empty".into())) }
             else if name_regex.is_match(input) { Ok(Validation::Valid) }
             else { Ok(Validation::Invalid("Name must contain only alphanumeric characters, dash (-) or underscore (_)".into())) }
         })
         .prompt()?;

    // Collect account ID
    let account_id = Text::new("Enter the Snowflake account identifier:")
        .with_help_message("Example: xy12345.us-east-1")
        .with_validator(|input: &str| {
            if input.trim().is_empty() { Ok(Validation::Invalid("Account identifier cannot be empty".into())) }
            else { Ok(Validation::Valid) }
        })
        .prompt()?;

    // Collect Warehouse ID
    let warehouse_id = Text::new("Enter the Snowflake warehouse name:")
        .with_help_message("Example: COMPUTE_WH")
         .with_validator(|input: &str| {
             if input.trim().is_empty() { Ok(Validation::Invalid("Warehouse name cannot be empty".into())) }
             else { Ok(Validation::Valid) }
         })
        .prompt()?;

    // Collect username
    let username = Text::new("Enter the Snowflake username:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() { Ok(Validation::Invalid("Username cannot be empty".into())) }
            else { Ok(Validation::Valid) }
        })
        .prompt()?;

    // Collect password
    let password = Password::new("Enter the Snowflake password:")
        .with_validator(|input: &str| {
             if input.trim().is_empty() { Ok(Validation::Invalid("Password cannot be empty".into())) }
             else { Ok(Validation::Valid) }
        })
        .without_confirmation()
        .prompt()?;

     // Collect role (optional)
    let role = Text::new("Enter the Snowflake role (optional):")
        .prompt()?;
    let role_opt = if role.trim().is_empty() { None } else { Some(role) };

    // Collect database (required)
    let database = Text::new("Enter the default Snowflake database name:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() { Ok(Validation::Invalid("Database cannot be empty".into())) }
            else { Ok(Validation::Valid) }
        })
        .prompt()?;

    // Collect schema (optional)
    let schema = Text::new("Enter the default Snowflake schema (optional):")
        .prompt()?;
    let schema_opt = if schema.trim().is_empty() { None } else { Some(schema) };


    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Account Identifier: {}", account_id.cyan());
    println!("Warehouse: {}", warehouse_id.cyan());
    println!("Username: {}", username.cyan());
    println!("Password: {}", "********".cyan());
    if let Some(r) = &role_opt {
        println!("Role: {}", r.cyan());
    }
    println!("Default Database: {}", database.cyan());
     if let Some(s) = &schema_opt {
        println!("Default Schema: {}", s.cyan());
    }

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create API request
    let snowflake_creds = SnowflakeCredentials {
        account_id,
        warehouse_id,
        username,
        password,
        role: role_opt.clone(),
        default_database: database.clone(),
        default_schema: schema_opt.clone(),
    };
    let credential = Credential::Snowflake(snowflake_creds);
    let request = PostDataSourcesRequest { name: name.clone(), credential };

    // Send to API
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(ProgressStyle::default_spinner().tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ").template("{spinner:.green} {msg}").unwrap());
    spinner.set_message("Sending credentials to Buster API...");
    spinner.enable_steady_tick(Duration::from_millis(100));
    let client = BusterClient::new(buster_url, buster_api_key)?;

    match client.post_data_sources(request).await {
        Ok(_) => {
            spinner.finish_with_message("✓ Data source created successfully!".green().bold().to_string());
            println!("\nData source '{}' is now available for use with Buster.", name.cyan());
            create_buster_config_file(config_path, &name, &database, schema_opt.as_deref())?;
            println!("You can now use this data source with other Buster commands.");
            Ok(())
        }
        Err(e) => {
            spinner.finish_with_message("✗ Failed to create data source".red().bold().to_string());
            println!("\nError: {}", e);
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}

// Helper function to create buster.yml file
fn create_buster_config_file(
    path: &Path,
    data_source_name: &str,
    database: &str,
    schema: Option<&str>,
) -> Result<()> {
    // --- BEGIN DBT PROJECT DETECTION ---
    let mut suggested_model_paths = "".to_string(); // Default to empty string

    // Construct path to dbt_project.yml relative to the buster.yml path
    if let Some(parent_dir) = path.parent() {
        let dbt_project_path = parent_dir.join("dbt_project.yml");
        if dbt_project_path.exists() && dbt_project_path.is_file() {
            match fs::read_to_string(&dbt_project_path) {
                Ok(content) => {
                    match serde_yaml::from_str::<DbtProject>(&content) {
                        Ok(dbt_config) => {
                            // Use specified model-paths or default ["models"] if present in file
                            let paths_to_suggest = dbt_config.model_paths.unwrap_or_else(|| vec!["models".to_string()]);
                             if !paths_to_suggest.is_empty() {
                                suggested_model_paths = paths_to_suggest.join(",");
                                println!(
                                    "{}",
                                    format!("Found dbt_project.yml, suggesting model paths: {}", suggested_model_paths.cyan()).dimmed()
                                );
                            }
                        },
                        Err(e) => {
                            // Log error but don't fail the init process
                            eprintln!(
                                "{}",
                                format!("Warning: Failed to parse {}: {}. Proceeding without suggested model paths.", dbt_project_path.display(), e).yellow()
                            );
                        }
                    }
                },
                Err(e) => {
                     eprintln!(
                         "{}",
                         format!("Warning: Failed to read {}: {}. Proceeding without suggested model paths.", dbt_project_path.display(), e).yellow()
                     );
                }
            }
        }
    }
    // --- END DBT PROJECT DETECTION ---


    // Prompt for model paths (optional), now with potential initial input
    let model_paths_input = Text::new(
        "Enter paths to your SQL models (optional, comma-separated):",
    )
    .with_default(&suggested_model_paths) // Use with_default instead
    .with_help_message(
        "Leave blank if none, or specify paths like './models,./analytics/models'",
    )
    .prompt()?;

    // Process the comma-separated input into a vector if not empty
    let model_paths_vec = if model_paths_input.trim().is_empty() {
        None
    } else {
        Some(
            model_paths_input
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect::<Vec<String>>(),
        )
    };

    // --- Create config using the new ProjectContext structure ---
    let main_context = ProjectContext {
        path: ".".to_string(), // Default path for the primary context
        data_source_name: Some(data_source_name.to_string()),
        database: Some(database.to_string()),
        schema: schema.map(|s| s.to_string()),
        model_paths: model_paths_vec,
        exclude_files: None, // Keep excludes at top-level for now, or handle differently?
        exclude_tags: None,  // Decide if these should be part of context or remain top-level
    };

    let config = BusterConfig {
        // --- Top-level fields are None when generating new config ---
        data_source_name: None,
        schema: None,
        database: None, 
        exclude_files: None, // Define top-level excludes if needed
        exclude_tags: None,
        model_paths: None,
        // --- Populate the projects field --- 
        projects: Some(vec![main_context]),
    };

    let yaml = serde_yaml::to_string(&config)?; 
    fs::write(path, yaml)?;

    println!(
        "{} {}",
        "✓".green(),
        format!("Created buster.yml at {}", path.display()).green()
    );

    Ok(())
}
