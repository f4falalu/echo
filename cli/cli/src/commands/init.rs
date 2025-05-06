use anyhow::Result;
use colored::*;
use indicatif::{ProgressBar, ProgressStyle};
use inquire::{validator::Validation, Confirm, Password, Select, Text};
use once_cell::sync::Lazy;
use query_engine::credentials::{
    BigqueryCredentials, Credential, DatabricksCredentials, MySqlCredentials, PostgresCredentials,
    RedshiftCredentials, SnowflakeCredentials, SqlServerCredentials,
};
use regex::Regex;
use serde::Deserialize;
use serde_yaml;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

// Update imports to use new modules via mod.rs re-exports
use crate::utils::{
    buster::{BusterClient, PostDataSourcesRequest},
    file::buster_credentials::get_and_validate_buster_credentials,
    BusterConfig,
    ProjectContext, // Use re-exported items directly
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

// Helper struct to parse dbt_project.yml
#[derive(Debug, Deserialize)]
struct DbtProject {
    name: Option<String>,
    #[serde(rename = "model-paths")]
    model_paths: Option<Vec<String>>,
}

// Helper function to parse dbt_project.yml if it exists
fn parse_dbt_project(base_dir: &Path) -> Result<Option<DbtProject>> {
    let dbt_project_path = base_dir.join("dbt_project.yml");
    if dbt_project_path.exists() && dbt_project_path.is_file() {
        println!(
            "{}",
            format!(
                "Found {}, attempting to read config...",
                dbt_project_path.display()
            )
            .dimmed()
        );
        match fs::read_to_string(&dbt_project_path) {
            Ok(content) => {
                match serde_yaml::from_str::<DbtProject>(&content) {
                    Ok(dbt_config) => Ok(Some(dbt_config)),
                    Err(e) => {
                        eprintln!(
                            "{}",
                            format!("Warning: Failed to parse {}: {}. Proceeding without dbt project info.", dbt_project_path.display(), e).yellow()
                        );
                        Ok(None)
                    }
                }
            }
            Err(e) => {
                eprintln!(
                    "{}",
                    format!(
                        "Warning: Failed to read {}: {}. Proceeding without dbt project info.",
                        dbt_project_path.display(),
                        e
                    )
                    .yellow()
                );
                Ok(None)
            }
        }
    } else {
        Ok(None)
    }
}

// --- Input Helper Functions ---

static NAME_REGEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[a-zA-Z0-9_-]+$").unwrap());

fn prompt_required_text(prompt: &str, help_message: Option<&str>) -> Result<String> {
    let mut text_prompt = Text::new(prompt);
    if let Some(help) = help_message {
        text_prompt = text_prompt.with_help_message(help);
    }
    let prompt_string = prompt.to_string(); // Clone prompt
    text_prompt
        .with_validator(move |input: &str| { // Add move keyword
            if input.trim().is_empty() {
                // Use the cloned prompt_string here
                Ok(Validation::Invalid(format!("{} cannot be empty", prompt_string.replace(":", "")).into()))
            } else {
                Ok(Validation::Valid)
            }
        })
        .prompt()
        .map_err(Into::into) // Convert inquire::Error to anyhow::Error
}

fn prompt_validated_name(prompt: &str, suggested_name: Option<&str>) -> Result<String> {
    let mut name_prompt = Text::new(prompt)
        .with_help_message("Only alphanumeric characters, dash (-) and underscore (_) allowed");

    if let Some(s_name) = suggested_name {
        name_prompt = name_prompt.with_default(s_name);
    }

    name_prompt
        .with_validator(move |input: &str| {
            if input.trim().is_empty() {
                Ok(Validation::Invalid("Name cannot be empty".into()))
            } else if NAME_REGEX.is_match(input) {
                Ok(Validation::Valid)
            } else {
                Ok(Validation::Invalid(
                    "Name must contain only alphanumeric characters, dash (-) or underscore (_)"
                        .into(),
                ))
            }
        })
        .prompt()
        .map_err(Into::into)
}

fn prompt_password(prompt: &str) -> Result<String> {
    Password::new(prompt)
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                Ok(Validation::Invalid("Password cannot be empty".into()))
            } else {
                Ok(Validation::Valid)
            }
        })
        .without_confirmation()
        .prompt()
        .map_err(Into::into)
}

fn prompt_u16_with_default(prompt: &str, default: &str, help_message: Option<&str>) -> Result<u16> {
    let mut port_prompt = Text::new(prompt).with_default(default);
    if let Some(help) = help_message {
        port_prompt = port_prompt.with_help_message(help);
    }
    let port_str = port_prompt
        .with_validator(|input: &str| match input.parse::<u16>() {
            Ok(_) => Ok(Validation::Valid),
            Err(_) => Ok(Validation::Invalid(
                "Port must be a valid number between 1 and 65535".into(),
            )),
        })
        .prompt()?;
    port_str.parse::<u16>().map_err(Into::into) // Convert parse error
}

// --- End Input Helper Functions ---

// --- API Interaction Helper ---

async fn create_data_source_with_progress(
    client: &BusterClient,
    request: PostDataSourcesRequest,
) -> Result<()> {
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
            .template("{spinner:.green} {msg}")
            .unwrap(),
    );
    spinner.set_message("Sending credentials to Buster API...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    match client.post_data_sources(request).await {
        Ok(_) => {
            spinner.finish_with_message(
                "✓ Data source created successfully!"
                    .green()
                    .bold()
                    .to_string(),
            );
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

// --- End API Interaction Helper ---

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

    // --- Try to parse dbt_project.yml ---
    let dbt_config = parse_dbt_project(&dest_path)?;
    // Extract suggested name (if available)
    let suggested_name = dbt_config.as_ref().and_then(|c| c.name.as_deref());
    if let Some(name) = suggested_name {
        println!(
            "{}",
            format!(
                "Suggesting data source name '{}' from dbt_project.yml",
                name.cyan()
            )
            .dimmed()
        );
    }
    // --- End dbt_project.yml parsing ---

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

    println!(
        "{}",
        format!("You selected: {}", db_type.to_string().cyan()).dimmed()
    );

    match db_type {
        DatabaseType::Redshift => {
            setup_redshift(
                buster_creds.url,
                buster_creds.api_key,
                &config_path,
                suggested_name,
            )
            .await
        }
        DatabaseType::Postgres => {
            setup_postgres(
                buster_creds.url,
                buster_creds.api_key,
                &config_path,
                suggested_name,
            )
            .await
        }
        DatabaseType::BigQuery => {
            setup_bigquery(
                buster_creds.url,
                buster_creds.api_key,
                &config_path,
                suggested_name,
            )
            .await
        }
        DatabaseType::Snowflake => {
            setup_snowflake(
                buster_creds.url,
                buster_creds.api_key,
                &config_path,
                suggested_name,
            )
            .await
        }
        DatabaseType::MySql => {
            setup_mysql(
                buster_creds.url,
                buster_creds.api_key,
                &config_path,
                suggested_name,
            )
            .await
        }
        DatabaseType::SqlServer => {
            setup_sqlserver(
                buster_creds.url,
                buster_creds.api_key,
                &config_path,
                suggested_name,
            )
            .await
        }
        DatabaseType::Databricks => {
            setup_databricks(
                buster_creds.url,
                buster_creds.api_key,
                &config_path,
                suggested_name,
            )
            .await
        }
    }
}

async fn setup_redshift(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
) -> Result<()> {
    println!("{}", "Setting up Redshift connection...".bold().green());

    // Collect name (with validation)
    let name_regex = Regex::new(r"^[a-zA-Z0-9_-]+$")?;
    let mut name_prompt = Text::new("Enter a unique name for this data source:")
        .with_help_message("Only alphanumeric characters, dash (-) and underscore (_) allowed");

    // Set default if provided
    if let Some(s_name) = suggested_name {
        name_prompt = name_prompt.with_default(s_name);
    }

    let name = name_prompt
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
    let schema = Text::new("Enter the default Redshift schema:")
        .with_validator(|input: &str| {
            if input.trim().is_empty() {
                return Ok(Validation::Invalid("Schema cannot be empty".into()));
            }
            Ok(Validation::Valid)
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
    println!("Default Schema: {}", schema.cyan());

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
        default_schema: Some(schema.clone()),
    };
    let credential = Credential::Redshift(redshift_creds);
    let request = PostDataSourcesRequest {
        name: name.clone(),
        credential,
    };

    // Send to API with progress indicator
    let client = BusterClient::new(buster_url, buster_api_key)?;
    create_data_source_with_progress(&client, request).await?;

    // Create buster.yml file
    create_buster_config_file(config_path, &name, &database, Some(&schema))?;

    println!("You can now use this data source with other Buster commands.");
    Ok(())
}

async fn setup_postgres(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
) -> Result<()> {
    println!("{}", "Setting up PostgreSQL connection...".bold().green());

    // Collect fields using helpers
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text(
        "Enter the PostgreSQL host:",
        Some("Example: localhost or db.example.com"),
    )?;
    let port = prompt_u16_with_default(
        "Enter the PostgreSQL port:",
        "5432",
        Some("Default PostgreSQL port is 5432"),
    )?;
    let username = prompt_required_text("Enter the PostgreSQL username:", None)?;
    let password = prompt_password("Enter the PostgreSQL password:")?;
    let database = prompt_required_text("Enter the default PostgreSQL database name:", None)?;
    let schema = prompt_required_text("Enter the default PostgreSQL schema:", None)?;

    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("Port: {}", port.to_string().cyan());
    println!("Username: {}", username.cyan());
    println!("Password: {}", "********".cyan());
    println!("Default Database: {}", database.cyan());
    println!("Default Schema: {}", schema.cyan());

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create credentials and request
    let postgres_creds = PostgresCredentials {
        host,
        port,
        username,
        password,
        default_database: database.clone(),
        default_schema: Some(schema.clone()),
        jump_host: None,
        ssh_username: None,
        ssh_private_key: None,
    };
    let credential = Credential::Postgres(postgres_creds);
    let request = PostDataSourcesRequest {
        name: name.clone(),
        credential,
    };

    // Send to API using helper
    let client = BusterClient::new(buster_url, buster_api_key)?;
    create_data_source_with_progress(&client, request).await?;

    // If successful, proceed to create config file
    println!(
        "\nData source '{}' is now available for use with Buster.",
        name.cyan()
    );
    create_buster_config_file(config_path, &name, &database, Some(&schema))?;
    println!("You can now use this data source with other Buster commands.");

    Ok(())
}

async fn setup_bigquery(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
) -> Result<()> {
    println!("{}", "Setting up BigQuery connection...".bold().green());

    // Collect fields using helpers
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let project_id = prompt_required_text(
        "Enter the default Google Cloud project ID:",
        Some("Example: my-project-123456"),
    )?;
    let dataset_id = prompt_required_text("Enter the default BigQuery dataset ID:", None)?;

    // Collect credentials JSON (specific to BigQuery)
    println!(
        "\n{}",
        "BigQuery requires a service account credentials JSON file.".bold()
    );
    println!(
        "You can create one in the Google Cloud Console under IAM & Admin > Service Accounts."
    );

    let credentials_path_str = Text::new("Enter the path to your credentials JSON file:")
        .with_help_message("Example: /path/to/credentials.json")
        .with_validator(|input: &str| {
            let path = Path::new(input);
            if !path.exists() {
                Ok(Validation::Invalid("File does not exist".into()))
            } else if !path.is_file() {
                Ok(Validation::Invalid("Path is not a file".into()))
            } else {
                Ok(Validation::Valid)
            }
        })
        .prompt()?;

    // Read and parse credentials file
    let credentials_content = fs::read_to_string(&credentials_path_str).map_err(|e| {
        anyhow::anyhow!(
            "Failed to read credentials file '{}': {}",
            credentials_path_str,
            e
        )
    })?;
    let credentials_json: serde_json::Value =
        serde_json::from_str(&credentials_content).map_err(|e| {
            anyhow::anyhow!(
                "Invalid JSON in credentials file '{}': {}",
                credentials_path_str,
                e
            )
        })?;

    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Default Project ID: {}", project_id.cyan());
    println!("Default Dataset ID: {}", dataset_id.cyan());
    println!("Credentials: {}", credentials_path_str.cyan());

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create credentials and request
    let bigquery_creds = BigqueryCredentials {
        default_project_id: project_id.clone(),
        default_dataset_id: dataset_id.clone(),
        credentials_json,
    };
    let credential = Credential::Bigquery(bigquery_creds);
    let request = PostDataSourcesRequest {
        name: name.clone(),
        credential,
    };

    // Send to API using helper
    let client = BusterClient::new(buster_url, buster_api_key)?;
    create_data_source_with_progress(&client, request).await?;

    // If successful, proceed to create config file
    println!(
        "\nData source '{}' is now available for use with Buster.",
        name.cyan()
    );
    // Map project_id to database, dataset_id to schema for config
    create_buster_config_file(config_path, &name, &project_id, Some(&dataset_id))?;
    println!("You can now use this data source with other Buster commands.");

    Ok(())
}

async fn setup_mysql(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
) -> Result<()> {
    println!(
        "{}",
        "Setting up MySQL/MariaDB connection...".bold().green()
    );

    // Collect fields using helpers
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text(
        "Enter the MySQL/MariaDB host:",
        Some("Example: localhost or db.example.com"),
    )?;
    let port = prompt_u16_with_default(
        "Enter the MySQL/MariaDB port:",
        "3306",
        Some("Default MySQL/MariaDB port is 3306"),
    )?;
    let username = prompt_required_text("Enter the MySQL/MariaDB username:", None)?;
    let password = prompt_password("Enter the MySQL/MariaDB password:")?;
    let database = prompt_required_text("Enter the default MySQL/MariaDB database name:", None)?;
    // No schema for MySQL

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

    // Create credentials and request
    let mysql_creds = MySqlCredentials {
        host,
        port,
        username,
        password,
        default_database: database.clone(),
        jump_host: None,
        ssh_username: None,
        ssh_private_key: None,
    };
    let credential = Credential::MySql(mysql_creds);
    let request = PostDataSourcesRequest {
        name: name.clone(),
        credential,
    };

    // Send to API using helper
    let client = BusterClient::new(buster_url, buster_api_key)?;
    create_data_source_with_progress(&client, request).await?;

    // If successful, proceed to create config file
    println!(
        "\nData source '{}' is now available for use with Buster.",
        name.cyan()
    );
    create_buster_config_file(config_path, &name, &database, None)?;
    println!("You can now use this data source with other Buster commands.");

    Ok(())
}

async fn setup_sqlserver(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
) -> Result<()> {
    println!("{}", "Setting up SQL Server connection...".bold().green());

    // Collect fields using helpers
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text(
        "Enter the SQL Server host:",
        Some("Example: server.database.windows.net or localhost"),
    )?;
    let port = prompt_u16_with_default(
        "Enter the SQL Server port:",
        "1433",
        Some("Default SQL Server port is 1433"),
    )?;
    let username = prompt_required_text("Enter the SQL Server username:", None)?;
    let password = prompt_password("Enter the SQL Server password:")?;
    let database = prompt_required_text("Enter the default SQL Server database name:", None)?;
    let schema = prompt_required_text("Enter the default SQL Server schema:", None)?;

    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("Port: {}", port.to_string().cyan());
    println!("Username: {}", username.cyan());
    println!("Password: {}", "********".cyan());
    println!("Default Database: {}", database.cyan());
    println!("Default Schema: {}", schema.cyan());

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create credentials and request
    let sqlserver_creds = SqlServerCredentials {
        host,
        port,
        username,
        password,
        default_database: database.clone(),
        default_schema: Some(schema.clone()),
        jump_host: None,
        ssh_username: None,
        ssh_private_key: None,
    };
    let credential = Credential::SqlServer(sqlserver_creds);
    let request = PostDataSourcesRequest {
        name: name.clone(),
        credential,
    };

    // Send to API using helper
    let client = BusterClient::new(buster_url, buster_api_key)?;
    create_data_source_with_progress(&client, request).await?;

    // If successful, proceed to create config file
    println!(
        "\nData source '{}' is now available for use with Buster.",
        name.cyan()
    );
    create_buster_config_file(config_path, &name, &database, Some(&schema))?;
    println!("You can now use this data source with other Buster commands.");

    Ok(())
}

async fn setup_databricks(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
) -> Result<()> {
    println!("{}", "Setting up Databricks connection...".bold().green());

    // Collect fields using helpers
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text(
        "Enter the Databricks host:",
        Some("Example: adb-xxxxxxxxxxxx.xx.azuredatabricks.net"),
    )?;
    // Databricks uses API key and warehouse ID instead of user/pass/port
    let api_key = prompt_password("Enter the Databricks API key (Personal Access Token):")?;
    let warehouse_id = prompt_required_text(
        "Enter the Databricks SQL Warehouse HTTP Path:",
        Some("Example: /sql/1.0/warehouses/xxxxxxxxxxxx"),
    )?;
    let catalog = prompt_required_text("Enter the default Databricks catalog:", None)?;
    let schema = prompt_required_text("Enter the default Databricks schema:", None)?;

    // Show summary and confirm
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("API Key: {}", "********".cyan());
    println!("Warehouse ID: {}", warehouse_id.cyan());
    println!("Default Catalog: {}", catalog.cyan());
    println!("Default Schema: {}", schema.cyan());

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create credentials and request
    let databricks_creds = DatabricksCredentials {
        host,
        api_key,
        warehouse_id,
        default_catalog: catalog.clone(),
        default_schema: Some(schema.clone()),
    };
    let credential = Credential::Databricks(databricks_creds);
    let request = PostDataSourcesRequest {
        name: name.clone(),
        credential,
    };

    // Send to API using helper
    let client = BusterClient::new(buster_url, buster_api_key)?;
    create_data_source_with_progress(&client, request).await?;

    // If successful, proceed to create config file
    println!(
        "\nData source '{}' is now available for use with Buster.",
        name.cyan()
    );
    // Map catalog to database, schema to schema for buster.yml
    create_buster_config_file(config_path, &name, &catalog, Some(&schema))?;
    println!("You can now use this data source with other Buster commands.");

    Ok(())
}

async fn setup_snowflake(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
) -> Result<()> {
    println!("{}", "Setting up Snowflake connection...".bold().green());

    // Collect fields using helpers
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let account_id = prompt_required_text(
        "Enter the Snowflake account identifier:",
        Some("Example: xy12345.us-east-1"),
    )?;
    let warehouse_id = prompt_required_text(
        "Enter the Snowflake warehouse name:",
        Some("Example: COMPUTE_WH"),
    )?;
    let username = prompt_required_text("Enter the Snowflake username:", None)?;
    let password = prompt_password("Enter the Snowflake password:")?;
    // Role is optional for Snowflake - use standard Text prompt
    let role = Text::new("Enter the Snowflake role (optional):").prompt()?;
    let role_opt = if role.trim().is_empty() {
        None
    } else {
        Some(role)
    };
    let database = prompt_required_text("Enter the default Snowflake database name:", None)?;
    let schema = prompt_required_text("Enter the default Snowflake schema:", None)?;

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
    println!("Default Schema: {}", schema.cyan());

    let confirm = Confirm::new("Do you want to create this data source?")
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Data source creation cancelled.".yellow());
        return Ok(());
    }

    // Create credentials and request
    let snowflake_creds = SnowflakeCredentials {
        account_id,
        warehouse_id,
        username,
        password,
        role: role_opt.clone(),
        default_database: database.clone(),
        default_schema: Some(schema.clone()),
    };
    let credential = Credential::Snowflake(snowflake_creds);
    let request = PostDataSourcesRequest {
        name: name.clone(),
        credential,
    };

    // Send to API using helper
    let client = BusterClient::new(buster_url, buster_api_key)?;
    create_data_source_with_progress(&client, request).await?;

    // If successful, proceed to create config file
    println!(
        "\nData source '{}' is now available for use with Buster.",
        name.cyan()
    );
    create_buster_config_file(config_path, &name, &database, Some(&schema))?;
    println!("You can now use this data source with other Buster commands.");

    Ok(())
}

// --- Helper to suggest model paths from dbt_project.yml ---
fn suggest_model_paths_from_dbt(buster_config_dir: &Path) -> (Option<String>, String) {
    let mut suggested_model_paths_str = "".to_string();
    let mut log_message = "".to_string();

    let dbt_project_path = buster_config_dir.join("dbt_project.yml");
    if dbt_project_path.exists() && dbt_project_path.is_file() {
        match fs::read_to_string(&dbt_project_path) {
            Ok(content) => match serde_yaml::from_str::<DbtProject>(&content) {
                Ok(dbt_config) => {
                    let paths_to_suggest = dbt_config
                        .model_paths
                        .unwrap_or_else(|| vec!["models".to_string()]);
                    if !paths_to_suggest.is_empty() {
                        suggested_model_paths_str = paths_to_suggest.join(",");
                        log_message = format!(
                            "Found dbt_project.yml, suggesting model paths: {}",
                            suggested_model_paths_str.cyan()
                        );
                    }
                }
                Err(e) => {
                    log_message = format!(
                            "Warning: Failed to parse {}: {}. Proceeding without suggested model paths.",
                            dbt_project_path.display(), e
                        );
                }
            },
            Err(e) => {
                log_message = format!(
                    "Warning: Failed to read {}: {}. Proceeding without suggested model paths.",
                    dbt_project_path.display(),
                    e
                );
            }
        }
    }
    (Some(suggested_model_paths_str), log_message)
}

// Helper function to create buster.yml file
fn create_buster_config_file(
    path: &Path,
    data_source_name: &str,
    database: &str, // This represents 'database' for most, 'project_id' for BQ, 'catalog' for Databricks
    schema: Option<&str>, // Made optional again at signature level
) -> Result<()> {
    // --- Suggest model paths based on dbt_project.yml ---
    let (suggested_paths_opt, suggestion_log) = if let Some(parent_dir) = path.parent() {
        suggest_model_paths_from_dbt(parent_dir)
    } else {
        (None, "".to_string()) // Cannot determine parent dir
    };

    if !suggestion_log.is_empty() {
        if suggestion_log.starts_with("Warning") {
            eprintln!("{}", suggestion_log.yellow());
        } else {
            println!("{}", suggestion_log.dimmed());
        }
    }

    // Prompt for model paths (optional), now with potential initial input
    let model_paths_input =
        Text::new("Enter paths to your SQL models (optional, comma-separated):")
            .with_default(suggested_paths_opt.as_deref().unwrap_or("")) // Use with_default
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
