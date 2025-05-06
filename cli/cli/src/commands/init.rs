use anyhow::{anyhow, Result};
use colored::*;
use glob::{glob, Pattern, PatternError};
use indicatif::{ProgressBar, ProgressStyle};
use inquire::{validator::Validation, Confirm, Password, Select, Text};
use once_cell::sync::Lazy;
use query_engine::credentials::{
    BigqueryCredentials, Credential, DatabricksCredentials, MySqlCredentials, PostgresCredentials,
    RedshiftCredentials, SnowflakeCredentials, SqlServerCredentials,
};
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

// Import from dbt_utils for dbt catalog parsing
use dbt_utils::models::{DbtCatalog, DbtNode, DbtColumn, DbtNodeMetadata, DbtCatalogMetadata}; 
use dbt_utils::{run_dbt_docs_generate, load_and_parse_catalog}; 

// Imports for Buster specific utilities and config
use crate::utils::{
    buster::{BusterClient, PostDataSourcesRequest},
    file::buster_credentials::get_and_validate_buster_credentials,
    BusterConfig,
    ProjectContext,
};

// Yaml* structs remain here as they define the output structure for `buster init`
// and are also used by `buster generate` via `use crate::commands::init::{...}`.
// These are specific to the CLI's internal representation before becoming full semantic_layer::Model instances.

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct YamlSemanticLayerSpec {
    pub models: Vec<YamlModel>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct YamlModel {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_source_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub database: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub dimensions: Vec<YamlDimension>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub measures: Vec<YamlMeasure>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_file_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct YamlDimension {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub type_: Option<String>,
    #[serde(default, skip_serializing_if = "is_false")]
    pub searchable: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
pub struct YamlMeasure {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub type_: Option<String>,
}

// Helper for serde to skip serializing default false values for bool
pub fn is_false(val: &bool) -> bool {
    !*val
}

// Helper function to determine if a SQL type should be a measure
pub fn is_measure_type(sql_type: &str) -> bool {
    let lower_sql_type = sql_type.to_lowercase();
    lower_sql_type.contains("int") || 
    lower_sql_type.contains("numeric") ||
    lower_sql_type.contains("decimal") ||
    lower_sql_type.contains("real") || 
    lower_sql_type.contains("double") ||
    lower_sql_type.contains("float") ||
    lower_sql_type.contains("money") ||
    lower_sql_type.contains("number")
}

// Enum for Database Type selection (ensure only one definition, placed before use)
#[derive(Debug, Clone)]
enum DatabaseType {
    Redshift, Postgres, BigQuery, Snowflake, MySql, SqlServer, Databricks,
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

// --- Structs for parsing dbt_project.yml (local to init) ---
#[derive(Debug, Deserialize, Clone, Default)]
struct DbtModelGroupConfig {
    #[serde(rename = "+schema")]
    schema: Option<String>,
    #[serde(rename = "+database")]
    database: Option<String>,
    #[serde(flatten)]
    subgroups: HashMap<String, DbtModelGroupConfig>,
}

#[derive(Debug, Deserialize, Clone, Default)]
pub struct DbtProjectModelsBlock {
    #[serde(flatten)]
    project_configs: HashMap<String, DbtModelGroupConfig>,
}

#[derive(Debug, Deserialize, Clone, Default)]
pub struct DbtProjectFileContent {
    name: Option<String>,
    #[serde(rename = "model-paths", default = "default_model_paths")]
    pub model_paths: Vec<String>,
    #[serde(default)]
    models: Option<DbtProjectModelsBlock>,
}

fn default_model_paths() -> Vec<String> {
    vec!["models".to_string()]
}

// Helper function to parse dbt_project.yml if it exists
// Make this function public so it can be called from generate.rs
pub fn parse_dbt_project_file_content(base_dir: &Path) -> Result<Option<DbtProjectFileContent>> {
    let dbt_project_path = base_dir.join("dbt_project.yml");
    if dbt_project_path.exists() && dbt_project_path.is_file() {
        println!(
            "{}",
            format!(
                "Found {}, attempting to read config for model paths and schemas...",
                dbt_project_path.display()
            )
            .dimmed()
        );
        match fs::read_to_string(&dbt_project_path) {
            Ok(content) => {
                match serde_yaml::from_str::<DbtProjectFileContent>(&content) {
                    Ok(dbt_config) => Ok(Some(dbt_config)),
                    Err(e) => {
                        eprintln!(
                            "{}",
                            format!("Warning: Failed to parse {}: {}. Proceeding without dbt project info for advanced config.", dbt_project_path.display(), e).yellow()
                        );
                        Ok(None)
                    }
                }
            }
            Err(e) => {
                eprintln!(
                    "{}",
                    format!(
                        "Warning: Failed to read {}: {}. Proceeding without dbt project info for advanced config.",
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
            let error_message = e.to_string();
            println!("\nError: {}", error_message);
            // Check for the specific error string
            if error_message.contains("Data source already exists") {
                println!("{}", "A data source with this name already exists in Buster.".yellow());
            } else {
                 // Keep the generic message for other errors
                println!("Please check your credentials and network connection, then try again.");
            }
            Err(anyhow::anyhow!("Failed to create data source: {}", e))
        }
    }
}

// --- End API Interaction Helper ---

pub async fn init(destination_path: Option<&str>) -> Result<()> {
    println!("{}", "Initializing Buster...".bold().green());

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
            return Err(anyhow!("No valid Buster credentials found"));
        }
    };

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
    let mut existing_config_overwrite = false;

    if config_path.exists() {
        let overwrite = Confirm::new(&format!("A buster.yml file already exists at {}. Do you want to overwrite it?", config_path.display().to_string().cyan())).with_default(false).prompt()?;
        if !overwrite {
            println!("{}", "Keeping existing buster.yml file. Configuration will be skipped.".yellow());
            match BusterConfig::load(&config_path) {
                Ok(existing_cfg) => {
                    if Confirm::new("Do you want to attempt to generate a base semantic layer from your dbt project (using existing buster.yml)?").with_default(true).prompt()? {
                        let mut mutable_existing_cfg = existing_cfg.clone(); // Clone to make it mutable
                        generate_semantic_models_flow(&mut mutable_existing_cfg, &config_path, &dest_path).await?;
                    }
                    return Ok(());
                }
                Err(e) => { eprintln!("{}: {}. Proceeding to overwrite prevention message.", "Failed to load existing buster.yml".yellow(), e); return Ok(()); }
            }
        } else { existing_config_overwrite = true; }
    }

    // --- Try to parse dbt_project.yml ---
    let dbt_project_main_name_suggestion = parse_dbt_project_file_content(&dest_path)?
        .and_then(|parsed_content| parsed_content.name);

    if let Some(name) = &dbt_project_main_name_suggestion {
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
    db_types.sort_by_key(|db: &DatabaseType| db.to_string()); // Added type annotation for |db|

    let db_type = Select::new("Select your database type:", db_types).prompt()?;

    println!(
        "{}",
        format!("You selected: {}", db_type.to_string().cyan()).dimmed()
    );

    // --- Database specific setup --- (This section largely remains the same)
    // It will eventually call create_buster_config_file internally or return data for it.
    // For brevity, assuming it populates necessary details for BusterConfig.

    // Placeholder for the result of database setup, which should include
    // the data_source_name, database_name, and schema_name needed for BusterConfig.
    // In a real scenario, these would be returned by the setup_X functions.
    let (data_source_name_for_config, db_name_for_config, schema_name_for_config_opt) = match db_type {
        DatabaseType::Redshift => {
            setup_redshift(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
        DatabaseType::Postgres => {
            setup_postgres(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
        DatabaseType::BigQuery => {
            setup_bigquery(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
        DatabaseType::MySql => {
            setup_mysql(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
        DatabaseType::SqlServer => {
            setup_sqlserver(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
        DatabaseType::Databricks => {
            setup_databricks(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
        DatabaseType::Snowflake => {
            setup_snowflake(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                dbt_project_main_name_suggestion.as_deref(),
            )
            .await?
        }
    };

    // Create buster.yml using the gathered information
    create_buster_config_file(
        &config_path,
        &data_source_name_for_config,
        &db_name_for_config,
        schema_name_for_config_opt.as_deref(),
    )?;
    
    // If we overwrote, or if the file didn't exist, buster.yml was just created by one of the setup_X functions.
    // Now, load it to potentially add semantic_models_file.
    let mut current_buster_config = BusterConfig::load(&config_path).map_err(|e| {
        anyhow!("Failed to load buster.yml (path: {}): {}", config_path.display(), e)
    })?;

    // --- Semantic Model Generation --- 
    if Confirm::new("Do you want to attempt to generate a base semantic layer from your dbt project?")
        .with_default(true)
        .prompt()? 
    {
        // Default directory for semantic models: "" for side-by-side
        let default_semantic_models_dirs_str = current_buster_config.projects.as_ref()
            .and_then(|projs| projs.first())
            .and_then(|proj| proj.semantic_model_paths.as_ref())
            .filter(|paths| !paths.is_empty()) // Only join if paths exist and are not empty
            .map(|paths| paths.join(","))
            .unwrap_or_else(String::new); // Default to empty string for side-by-side

        let semantic_models_dirs_input_str = Text::new("Enter directory/directories for generated semantic model YAML files (comma-separated, leave empty for side-by-side with SQL files):")
            .with_default(&default_semantic_models_dirs_str)
            .with_help_message("Example: ./semantic_layer (for dedicated dir) or empty (for side-by-side)")
            .prompt()?;

        let semantic_model_paths_vec = semantic_models_dirs_input_str
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect::<Vec<String>>();

        // If semantic_model_paths_vec is empty, it implies side-by-side generation.
        // No error here, this is a valid configuration.

        if !semantic_model_paths_vec.is_empty() {
            // Only create primary output directory if a specific path is given (not side-by-side)
            let primary_semantic_models_dir_str = semantic_model_paths_vec.first().unwrap().clone(); // Must exist due to !is_empty()
            let primary_semantic_output_dir_abs = dest_path.join(&primary_semantic_models_dir_str);
            fs::create_dir_all(&primary_semantic_output_dir_abs).map_err(|e| {
                anyhow!("Failed to create primary directory for semantic models YAML '{}': {}", primary_semantic_output_dir_abs.display(), e)
            })?;
            println!("{} {}", "✓".green(), format!("Ensured primary semantic model directory exists: {}", primary_semantic_output_dir_abs.display()).dimmed());
        } else {
            println!("{}", "Semantic models will be generated side-by-side with their SQL counterparts.".dimmed());
        }


        // Store relative paths in the config
        let relative_semantic_model_paths = semantic_model_paths_vec.iter().map(|p_str| {
            let p_path = PathBuf::from(p_str);
            match pathdiff::diff_paths(&p_path, &dest_path) {
                Some(p) => p.to_string_lossy().into_owned(),
                None => {
                    eprintln!("{}", format!("Could not determine relative path for semantic model directory '{}'. Using path as is.", p_str).yellow());
                    p_str.clone()
                }
            }
        }).collect::<Vec<String>>();

        // Store in the first project context
        if let Some(projects) = current_buster_config.projects.as_mut() {
            if let Some(first_project) = projects.first_mut() {
                first_project.semantic_model_paths = Some(relative_semantic_model_paths.clone());
            } else {
                eprintln!("{}", "Warning: No project contexts found in buster.yml to store semantic_model_paths.".yellow());
            }
        } else {
             eprintln!("{}", "Warning: 'projects' array is None in buster.yml. Cannot store semantic_model_paths.".yellow());
        }
        
        current_buster_config.save(&config_path).map_err(|e| anyhow!("Failed to save buster.yml with semantic model paths: {}", e))?;
        println!("{} {} {}: {}", "✓".green(), "Updated buster.yml with".green(), "semantic_model_paths".cyan(), relative_semantic_model_paths.join(", ").cyan());

        generate_semantic_models_from_dbt_catalog(&current_buster_config, &config_path, &dest_path).await?;
    }

    println!("{}", "Buster initialization complete!".bold().green());
    Ok(())
}

// Helper function to manage the flow of semantic model generation
async fn generate_semantic_models_flow(buster_config: &mut BusterConfig, config_path: &Path, buster_config_dir: &Path) -> Result<()> {
    let default_dirs_str = String::new(); // Default to empty string for side-by-side

    // Try to get defaults from the first project context's semantic_model_paths
    let initial_dirs_str = buster_config.projects.as_ref()
        .and_then(|projs| projs.first())
        .and_then(|proj| proj.semantic_model_paths.as_ref())
        .filter(|paths| !paths.is_empty()) // Only join if paths exist and are not empty
        .map(|paths| paths.join(","))
        .unwrap_or(default_dirs_str);

    let semantic_models_dirs_input_str = Text::new("Enter directory/directories for generated semantic model YAML files (comma-separated, leave empty for side-by-side):")
        .with_default(&initial_dirs_str)
        .prompt()?;
    
    let semantic_model_paths_vec = semantic_models_dirs_input_str
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect::<Vec<String>>();

    // If semantic_model_paths_vec is empty, it implies side-by-side generation.
    // No error here.

    if !semantic_model_paths_vec.is_empty() {
        let primary_semantic_models_dir_str = semantic_model_paths_vec.first().unwrap().clone(); 
        let primary_semantic_output_dir_abs = buster_config_dir.join(&primary_semantic_models_dir_str);

        // Ensure the primary output directory exists
        fs::create_dir_all(&primary_semantic_output_dir_abs).map_err(|e| {
            anyhow!("Failed to create primary directory for semantic models YAML '{}': {}", primary_semantic_output_dir_abs.display(), e)
        })?;
        println!("{} {}", "✓".green(), format!("Ensured primary semantic model directory exists: {}", primary_semantic_output_dir_abs.display()).dimmed());
    } else {
        println!("{}", "Semantic models will be generated side-by-side with their SQL counterparts.".dimmed());
    }
    
    // Store relative paths in the config
    let relative_semantic_model_paths = semantic_model_paths_vec.iter().map(|p_str| {
        let p_path = PathBuf::from(p_str);
        match pathdiff::diff_paths(&p_path, buster_config_dir) {
            Some(p) => p.to_string_lossy().into_owned(),
            None => {
                eprintln!("{}", format!("Could not determine relative path for semantic model directory '{}' relative to '{}'. Using path as is.", p_path.display(), buster_config_dir.display()).yellow());
                p_str.clone()
            }
        }
    }).collect::<Vec<String>>();

    // Store in the first project context
    if let Some(projects) = buster_config.projects.as_mut() {
        if let Some(first_project) = projects.first_mut() {
            first_project.semantic_model_paths = Some(relative_semantic_model_paths.clone());
        } else {
            eprintln!("{}", "Warning: No project contexts found in buster.yml to update semantic_model_paths.".yellow());
        }
    } else {
        eprintln!("{}", "Warning: 'projects' array is None in buster.yml. Cannot update semantic_model_paths.".yellow());
    }

    buster_config.save(config_path).map_err(|e| anyhow!("Failed to save buster.yml with semantic model paths: {}", e))?;
    println!("{} {} {}: {}", "✓".green(), "Updated buster.yml with".green(), "semantic_model_paths".cyan(), relative_semantic_model_paths.join(", ").cyan());

    generate_semantic_models_from_dbt_catalog(buster_config, config_path, buster_config_dir).await
}


// Placeholder for the main logic function
async fn generate_semantic_models_from_dbt_catalog(
    buster_config: &BusterConfig,
    _config_path: &Path, // Path to buster.yml
    buster_config_dir: &Path, // Directory containing buster.yml, assumed dbt project root
) -> Result<()> {
    println!("{}", "Starting semantic model generation from dbt catalog...".dimmed());

    // Get the semantic model output configuration from the first project context
    let project_semantic_model_paths_config = buster_config.projects.as_ref()
        .and_then(|projs| projs.first())
        .and_then(|proj| proj.semantic_model_paths.as_ref());

    let is_side_by_side_generation = project_semantic_model_paths_config.map_or(true, |paths| paths.is_empty());

    let path_construction_base_dir: PathBuf; // Base directory for constructing output paths

    if is_side_by_side_generation {
        path_construction_base_dir = buster_config_dir.to_path_buf(); // Project root is the base for side-by-side
        println!("{}", format!("Semantic models will be generated side-by-side with SQL models (within '{}').", path_construction_base_dir.display()).dimmed());
    } else {
        // A specific directory (or directories) was configured for semantic models. Use the first one.
        let primary_path_str = project_semantic_model_paths_config.unwrap().first().unwrap(); // Safe due to map_or check
        path_construction_base_dir = buster_config_dir.join(primary_path_str);
        println!("{}", format!("Semantic models will be generated in/under: {}", path_construction_base_dir.display()).dimmed());
        // Ensure this specific output directory exists
        fs::create_dir_all(&path_construction_base_dir).map_err(|e| {
            anyhow!("Failed to create semantic models output directory '{}': {}", path_construction_base_dir.display(), e)
        })?;
    }
    
    // Get dbt model source roots (e.g., ["models", "my_other_models"])
    // These are paths relative to the dbt_project_path (buster_config_dir)
    let dbt_project_content = parse_dbt_project_file_content(buster_config_dir)?;
    let dbt_model_source_roots: Vec<PathBuf> = dbt_project_content.as_ref()
        .map(|content| content.model_paths.iter().map(PathBuf::from).collect())
        .unwrap_or_else(|| vec![PathBuf::from("models")]); // Default if not found

    // Get defaults from the primary project context for model properties
    let primary_project_context = buster_config.projects.as_ref().and_then(|p| p.first());
    let default_data_source_name = primary_project_context
        .and_then(|pc| pc.data_source_name.as_ref());
    let default_database = primary_project_context
        .and_then(|pc| pc.database.as_ref());
    let default_schema = primary_project_context
        .and_then(|pc| pc.schema.as_ref());

    let dbt_project_path = buster_config_dir;
    let catalog_json_path = dbt_project_path.join("target").join("catalog.json");

    if Confirm::new("Can Buster run 'dbt docs generate' to get the latest schema (catalog.json)?")
        .with_default(true)
        .prompt()?
    {
        match run_dbt_docs_generate(dbt_project_path).await {
            Ok(_) => { /* Success is logged by the helper function itself */ }
            Err(e) => {
                eprintln!("{}", format!("'dbt docs generate' (via dbt_utils) reported an error. Proceeding with existing catalog.json if available. Error: {}", e).yellow());
            }
        }
    } else {
        println!("{}", "Skipping 'dbt docs generate'. Will look for existing catalog.json.".dimmed());
    }

    if !catalog_json_path.exists() {
        eprintln!(
            "{}",
            format!("✗ catalog.json not found at {}.", catalog_json_path.display()).red()
        );
        println!("Please ensure 'dbt docs generate' has been run successfully in your dbt project.");
        println!("Skipping semantic model generation.");
        return Ok(());
    }

    println!(
        "{}",
        format!(
            "Attempting to load catalog.json from {}",
            catalog_json_path.display()
        )
        .dimmed()
    );
    let dbt_catalog = match load_and_parse_catalog(&catalog_json_path) {
        Ok(catalog) => {
            println!("{}", "✓ Successfully parsed catalog.json via dbt_utils.".green());
            catalog
        }
        Err(e) => {
            eprintln!("{}", format!("✗ Error loading/parsing catalog.json via dbt_utils: {}. Ensure catalog.json exists and is valid.", e).red());
            return Ok(()); 
        }
    };

    // --- Model Scoping Logic ---    
    let mut configured_model_path_patterns: Vec<Pattern> = Vec::new();
    if let Some(projects) = &buster_config.projects {
        for project_context in projects {
            if let Some(model_paths) = &project_context.model_paths {
                for path_str in model_paths {
                    // Construct absolute path for glob pattern relative to buster_config_dir
                    let path_to_glob = buster_config_dir.join(path_str);
                    // dbt model paths are often directories, so add a glob to match files within them.
                    // e.g., if path_str is "models", pattern becomes "<abs_path_to_models>/**/*.sql"
                    // If path_str already contains wildcards, use it as is more directly.
                    let pattern_str = if path_str.contains('*') || path_str.contains('?') || path_str.contains('[') {
                        path_to_glob.to_string_lossy().into_owned()
                    } else {
                        path_to_glob.join("**").join("*.sql").to_string_lossy().into_owned()
                    };

                    match Pattern::new(&pattern_str) {
                        Ok(p) => configured_model_path_patterns.push(p),
                        Err(e) => eprintln!(
                            "{}",
                            format!(
                                "Warning: Invalid glob pattern '{}' from buster.yml model_paths: {}",
                                pattern_str,
                                e
                            )
                            .yellow()
                        ),
                    }
                }
            }
        }
    }
    if configured_model_path_patterns.is_empty() {
        println!("{}", "No model_paths configured in buster.yml or patterns are invalid. Will process all models from catalog.json.".yellow());
    }
    // --- End Model Scoping Logic ---

    let mut yaml_models_generated_count = 0;

    for (_node_id, node) in dbt_catalog.nodes.iter().filter(|(_id, n)| {
        match &n.resource_type {
            Some(rt) => rt == "model",
            None => {
                eprintln!(
                    "{}",
                    format!(
                        "Warning: Skipping dbt node with unique_id: {} because it is missing 'resource_type' in catalog.json.",
                        n.unique_id
                    ).yellow()
                );
                false
            }
        }
    }) {
        let Some(ref original_file_path_str) = node.original_file_path else {
            eprintln!(
                "{}",
                format!(
                    "Warning: Skipping dbt model {} (unique_id: {}) because it is missing 'original_file_path' in catalog.json.", 
                    node.name.as_deref().unwrap_or("[unknown name]"), // Use derived node.name if available
                    node.unique_id
                ).yellow()
            );
            continue;
        };

        // Ensure metadata.name exists, as it's crucial for the semantic model name
        let Some(ref actual_model_name_from_metadata) = node.metadata.name else {
            eprintln!(
                "{}",
                format!(
                    "Warning: Skipping dbt model with unique_id: {} because its 'metadata.name' is missing in catalog.json.",
                    node.unique_id
                ).yellow()
            );
            continue;
        };
        let actual_model_name = actual_model_name_from_metadata.clone(); // Now safe to clone

        let original_file_path_abs = buster_config_dir.join(original_file_path_str);

        let in_scope = if configured_model_path_patterns.is_empty() {
            true // If no patterns, assume all models are in scope
        } else {
            configured_model_path_patterns
                .iter()
                .any(|pattern| pattern.matches_path(&original_file_path_abs))
        };

        if !in_scope {
            // Only log if verbose or similar, this can be noisy
            // println!("Skipping dbt model (not in configured model_paths): {}", node.unique_id.dimmed());
            continue;
        }
        
        println!("Processing dbt model for semantic layer: {}: {}", node.unique_id.cyan(), actual_model_name.cyan());

        let mut dimensions: Vec<YamlDimension> = Vec::new();
        let mut measures: Vec<YamlMeasure> = Vec::new();

        for (_col_name, col) in &node.columns {
            if is_measure_type(&col.column_type) {
                measures.push(YamlMeasure {
                    name: col.name.clone(),
                    description: col.comment.clone(),
                    type_: Some(col.column_type.clone()),
                });
            } else {
                dimensions.push(YamlDimension {
                    name: col.name.clone(),
                    description: col.comment.clone(),
                    type_: Some(col.column_type.clone()),
                    searchable: false, // Default to false, user can change
                    options: None,
                });
            }
        }

        let yaml_model = YamlModel {
            name: actual_model_name, // This should be the model's identifier name
            description: node.metadata.comment.clone(), // Use metadata.comment as the source for description
            data_source_name: default_data_source_name.cloned(),
            database: node.database.clone().or_else(|| default_database.cloned()),
            schema: node.schema.clone().or_else(|| default_schema.cloned()),
            dimensions,
            measures,
            original_file_path: Some(original_file_path_str.clone()), // Keep original dbt model path for reference
        };

        // Determine the output path for this individual YAML model
        let dbt_model_path = Path::new(original_file_path_str);
        let mut stripped_model_path_suffix = PathBuf::new(); // e.g. "marts/sales/revenue.sql" if original is "models/marts/sales/revenue.sql"
        let mut found_base_for_stripping = false;

        for dbt_source_root in &dbt_model_source_roots { // dbt_source_root is like "models"
            if let Ok(stripped_path) = dbt_model_path.strip_prefix(dbt_source_root) {
                stripped_model_path_suffix = stripped_path.to_path_buf();
                found_base_for_stripping = true;
                break;
            }
        }

        if !found_base_for_stripping {
            // Fallback: if original_file_path_str didn't start with any known dbt_model_source_roots,
            // (e.g. original_file_path_str is "marts/revenue.sql" and source_root is "models")
            // then use original_file_path_str as is for the suffix part.
            // This can happen if dbt_model_source_roots are not exhaustive or path is weird.
            // The resulting YAML structure will still be relative to path_construction_base_dir.
            stripped_model_path_suffix = dbt_model_path.to_path_buf();
            eprintln!("{}", format!(
                    "Warning: Could not strip a known dbt model source root ('{:?}') from dbt model path '{}'. Using full path for suffix: '{}'", 
                    dbt_model_source_roots, original_file_path_str, stripped_model_path_suffix.display()
                ).yellow()
            );
        }
        
        let output_yaml_path: PathBuf;
        if is_side_by_side_generation {
            // For side-by-side, output is next to the SQL file.
            // original_file_path_str is relative to buster_config_dir (e.g., "models/marts/sales/revenue.sql")
            // buster_config_dir is the dbt project root.
            output_yaml_path = buster_config_dir.join(original_file_path_str).with_extension("yml");
        } else {
            // For dedicated output directory:
            // path_construction_base_dir is the dedicated dir (e.g., "/path/to/project/buster_yamls")
            // stripped_model_path_suffix is the path part after dbt source root (e.g., "marts/sales/revenue.sql")
            let yaml_filename_with_subdir = stripped_model_path_suffix.with_extension("yml"); // e.g., "marts/sales/revenue.yml"
            output_yaml_path = path_construction_base_dir.join(yaml_filename_with_subdir);
        }

        if let Some(parent_dir) = output_yaml_path.parent() {
            fs::create_dir_all(parent_dir).map_err(|e| {
                anyhow!("Failed to create directory for semantic model YAML '{}': {}", parent_dir.display(), e)
            })?;
        }

        let yaml_string = serde_yaml::to_string(&yaml_model)
            .map_err(|e| anyhow!("Failed to serialize semantic model '{}' to YAML: {}", yaml_model.name, e))?;
        fs::write(&output_yaml_path, yaml_string)
            .map_err(|e| anyhow!("Failed to write semantic model YAML for '{}' to '{}': {}", yaml_model.name, output_yaml_path.display(), e))?;

        println!(
            "{} Generated semantic model: {}",
            "✓".green(),
            output_yaml_path.display().to_string().cyan()
        );
        yaml_models_generated_count += 1;
    }

    if yaml_models_generated_count == 0 {
        println!(
            "{}",
            "No dbt models found matching configured paths in catalog.json, or no models in catalog. No semantic model YAML files generated."
                .yellow()
        );
    } else {
        println!(
            "{}",
            format!("Successfully generated {} semantic model YAML file(s).", yaml_models_generated_count).bold().green()
        );
    }

    Ok(())
}

// Helper function to suggest model paths from dbt_project.yml
fn suggest_model_paths_from_dbt(buster_config_dir: &Path) -> (Option<String>, String) {
    let mut suggested_model_paths_str = "".to_string();
    let mut log_message = "".to_string();

    let dbt_project_path = buster_config_dir.join("dbt_project.yml");
    if dbt_project_path.exists() && dbt_project_path.is_file() {
        match fs::read_to_string(&dbt_project_path) {
            Ok(content) => match serde_yaml::from_str::<DbtProjectFileContent>(&content) {
                Ok(dbt_config) => {
                    let paths_to_suggest = dbt_config.model_paths.clone();
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
    data_source_name_cli: &str,
    database_cli: &str,
    schema_cli: Option<&str>,
) -> Result<()> {
    let buster_config_dir = path.parent().unwrap_or_else(|| Path::new("."));
    let dbt_project_content_opt = parse_dbt_project_file_content(buster_config_dir).ok().flatten();

    let mut project_contexts: Vec<ProjectContext> = Vec::new();

    if let Some(dbt_content) = dbt_project_content_opt {
        if let Some(models_block) = &dbt_content.models {
            for (dbt_project_key_name, top_level_config) in &models_block.project_configs {
                // dbt_project_key_name is usually the dbt project's name (e.g., "adventure_works")
                // dbt_content.model_paths are the base model directories (e.g., ["models"])
                
                build_contexts_recursive(
                    &mut project_contexts,
                    top_level_config,
                    Vec::new(), // Current path segments relative to a base dbt model path
                    &dbt_content.model_paths,
                    dbt_project_key_name, // Name of the dbt project e.g. "adventure_works"
                    data_source_name_cli,
                    database_cli,
                    schema_cli, // Top-level schema from CLI as initial default
                );
            }
        }
    }

    if project_contexts.is_empty() {
        println!("{}", "Could not derive project contexts from dbt_project.yml, or it's not configured for models. Falling back to manual prompt for model paths.".yellow());
        
        let mut suggested_model_paths_str = "models".to_string(); // Default suggestion
        if let Some(dbt_content) = parse_dbt_project_file_content(buster_config_dir).ok().flatten() {
            if !dbt_content.model_paths.is_empty() && dbt_content.model_paths != vec!["models"] { // if not default or empty
                 suggested_model_paths_str = dbt_content.model_paths.join(",");
                 println!("{}", format!("Suggesting model paths from dbt_project.yml: {}", suggested_model_paths_str.cyan()).dimmed());
            }
        }


        let model_paths_input = Text::new("Enter paths to your SQL models (comma-separated):")
            .with_default(&suggested_model_paths_str)
            .with_help_message("Example: ./models,./analytics/models or models (if relative to dbt project root)")
            .prompt()?;

        let model_paths_vec = if model_paths_input.trim().is_empty() {
            None
        } else {
            Some(
                model_paths_input
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .map(|s| { // Ensure paths are relative to project root for consistency
                        let p = Path::new(&s);
                        if p.is_absolute() {
                            eprintln!("{}", format!("Warning: Absolute path '{}' provided for models. Consider using relative paths from your project root.", s).yellow());
                            s
                        } else {
                            // Assuming paths like "models" or "./models" are intended to be relative to project root
                            s
                        }
                    })
                    .collect::<Vec<String>>(),
            )
        };
        
        let main_context_name = if let Some(dbt_proj_name) = parse_dbt_project_file_content(buster_config_dir).ok().flatten().and_then(|p| p.name) {
            format!("{}_default_config", dbt_proj_name)
        } else {
            "DefaultProject".to_string()
        };

        project_contexts.push(ProjectContext {
            name: Some(main_context_name),
            path: ".".to_string(), // Models paths are relative to project root (buster.yml location)
            data_source_name: Some(data_source_name_cli.to_string()),
            database: Some(database_cli.to_string()),
            schema: schema_cli.map(str::to_string),
            model_paths: model_paths_vec,
            exclude_files: None,
            exclude_tags: None,
            semantic_model_paths: None, // Initialized as None, will be set later if user opts in
        });
    }

    let config = BusterConfig {
        data_source_name: None, // Top-level fields are for fallback or specific global settings not tied to projects
        schema: None,
        database: None,
        exclude_files: None,
        exclude_tags: None,
        model_paths: None, // This top-level field is superseded by 'projects'
        projects: Some(project_contexts),
    };

    config.save(path)?;
    println!(
        "{} {}",
        "✓".green(),
        format!("Created/Updated buster.yml at {}", path.display()).green()
    );

    Ok(())
}

// Recursive helper for create_buster_config_file
fn build_contexts_recursive(
    contexts: &mut Vec<ProjectContext>,
    current_dbt_group_config: &DbtModelGroupConfig,
    current_path_segments: Vec<String>, // Segments relative to a base model path, e.g., ["staging"] or [] for top-level
    base_dbt_model_paths: &[String], // From dbt_project.yml model-paths, e.g., ["models", "analysis"]
    dbt_project_name: &str, // The name of the dbt project this config belongs to (e.g. "adventure_works")
    data_source_name_cli: &str,
    database_cli: &str,
    parent_schema_cli: Option<&str>, // Schema from parent dbt group or initial CLI schema
) {
    // Determine schema: dbt config for this group -> parent_schema_cli (could be from parent dbt group or original CLI)
    let current_schema = current_dbt_group_config.schema.as_deref().or(parent_schema_cli);
    // Determine database: dbt config for this group -> database_cli
    let current_database = current_dbt_group_config.database.as_deref().unwrap_or(database_cli);

    let mut model_globs_for_context: Vec<String> = Vec::new();
    for base_path_str in base_dbt_model_paths { // e.g., "models"
        let mut path_parts = vec![base_path_str.clone()];
        path_parts.extend_from_slice(&current_path_segments); // e.g., ["models", "staging"]
        
        let relative_model_group_path = PathBuf::from_iter(path_parts);
        
        // Add globs for .sql files in this directory and subdirectories
        model_globs_for_context.push(relative_model_group_path.join("**/*.sql").to_string_lossy().into_owned());
        // To also include models directly in the folder, e.g. models/staging.sql (though less common for dbt)
        // model_globs_for_context.push(relative_model_group_path.join("*.sql").to_string_lossy().into_owned());
    }
    model_globs_for_context.sort();
    model_globs_for_context.dedup();

    if model_globs_for_context.is_empty() && current_dbt_group_config.subgroups.is_empty() {
        // If a config block has no schema/db override, no subgroups, and results in no model paths,
        // it might be a passthrough config or an empty node. Don't create a context for it unless it has overrides.
        if current_dbt_group_config.schema.is_none() && current_dbt_group_config.database.is_none() {
             // Only recurse if it has subgroups, otherwise this path ends.
            if !current_dbt_group_config.subgroups.is_empty() {
                 println!("Skipping context for intermediate dbt config group: {}/{}", dbt_project_name, current_path_segments.join("/").dimmed());
            } else {
                // If no schema/db override AND no model paths AND no subgroups, then this config entry is likely not for Buster.
                // Unless it's the very top-level implicit one.
                // We always create a context for the top-level (current_path_segments.is_empty()) if it has schema/db settings or leads to models.
            }
        }
    }


    // Only create a ProjectContext if there are model paths OR if it's the root config of the dbt project
    // (even if empty, it provides default schema/db for children) or it has explicit schema/db overrides.
    if !model_globs_for_context.is_empty() || current_path_segments.is_empty() || current_dbt_group_config.schema.is_some() || current_dbt_group_config.database.is_some() {
        let context_name = if current_path_segments.is_empty() {
            format!("{}_base", dbt_project_name) // For the top-level config of the dbt project
        } else {
            format!("{}_{}", dbt_project_name, current_path_segments.join("_"))
        };

        contexts.push(ProjectContext {
            name: Some(context_name.clone()),
            path: ".".to_string(), // All model_paths are relative to buster.yml (project root)
            data_source_name: Some(data_source_name_cli.to_string()),
            database: Some(current_database.to_string()),
            schema: current_schema.map(str::to_string),
            model_paths: if model_globs_for_context.is_empty() { None } else { Some(model_globs_for_context) },
            exclude_files: None,
            exclude_tags: None,
            semantic_model_paths: None, // Initialized as None, will be set later if user opts in
        });
        println!("Generated project context: {} (Schema: {}, DB: {})", 
            context_name.cyan(), 
            current_schema.unwrap_or("Default").dimmed(), 
            current_database.dimmed()
        );
    }


    // Recurse for subgroups
    for (subgroup_name, subgroup_config) in &current_dbt_group_config.subgroups {
        let mut next_path_segments = current_path_segments.clone();
        next_path_segments.push(subgroup_name.clone());
        build_contexts_recursive(
            contexts,
            subgroup_config,
            next_path_segments,
            base_dbt_model_paths,
            dbt_project_name,
            data_source_name_cli,
            database_cli,
            current_schema, // Pass the current group's schema as the parent/default for the next level
        );
    }
}


// --- Functions for setting up specific database types ---
// Modified to return Result<(String, String, Option<String>)> for (data_source_name, database, schema)
// They no longer write to buster.yml directly.

async fn setup_redshift(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up Redshift connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text(
        "Enter the Redshift host:",
        Some("Example: my-cluster.abc123xyz789.us-west-2.redshift.amazonaws.com"),
    )?;
    let port = prompt_u16_with_default(
        "Enter the Redshift port:",
        "5439",
        Some("Default Redshift port is 5439"),
    )?;
    let username = prompt_required_text("Enter the Redshift username:", None)?;
    let password = prompt_password("Enter the Redshift password:")?;
    let database = prompt_required_text("Enter the default Redshift database:", None)?;
    let schema = prompt_required_text("Enter the default Redshift schema:", None)?;

    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("Port: {}", port.to_string().cyan());
    println!("Username: {}", username.cyan());
    println!("Password: {}", "********".cyan());
    println!("Default Database: {}", database.cyan());
    println!("Default Schema: {}", schema.cyan());

    if Confirm::new("Do you want to create this data source in Buster Cloud?")
        .with_default(true)
        .prompt()? 
    {
        let redshift_creds = RedshiftCredentials {
            host, port, username, password,
            default_database: database.clone(),
            default_schema: Some(schema.clone()),
        };
        let credential = Credential::Redshift(redshift_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request).await?;
    } else {
        println!("{}", "Skipping data source creation in Buster Cloud.".yellow());
    }
    
    Ok((name, database, Some(schema)))
}

async fn setup_postgres(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up PostgreSQL connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text("Enter the PostgreSQL host:", Some("Example: localhost or db.example.com"))?;
    let port = prompt_u16_with_default("Enter the PostgreSQL port:", "5432", Some("Default PostgreSQL port is 5432"))?;
    let username = prompt_required_text("Enter the PostgreSQL username:", None)?;
    let password = prompt_password("Enter the PostgreSQL password:")?;
    let database = prompt_required_text("Enter the default PostgreSQL database name:", None)?;
    let schema = prompt_required_text("Enter the default PostgreSQL schema:", None)?;

    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("Port: {}", port.to_string().cyan());
    println!("Username: {}", username.cyan());
    println!("Password: {}", "********".cyan());
    println!("Default Database: {}", database.cyan());
    println!("Default Schema: {}", schema.cyan());

    if Confirm::new("Do you want to create this data source in Buster Cloud?")
        .with_default(true)
        .prompt()? 
    {
        let postgres_creds = PostgresCredentials { host, port, username, password, default_database: database.clone(), default_schema: Some(schema.clone()), jump_host: None, ssh_username: None, ssh_private_key: None };
        let credential = Credential::Postgres(postgres_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request).await?;
    } else {
        println!("{}", "Skipping data source creation in Buster Cloud.".yellow());
    }

    Ok((name, database, Some(schema)))
}

async fn setup_bigquery(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up BigQuery connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let project_id = prompt_required_text("Enter the default Google Cloud project ID:", Some("Example: my-project-123456"))?;
    let dataset_id = prompt_required_text("Enter the default BigQuery dataset ID:", None)?;
    let credentials_path_str = Text::new("Enter the path to your credentials JSON file:")
        .with_help_message("Example: /path/to/credentials.json")
        .with_validator(|input: &str| {
            let path = Path::new(input);
            if !path.exists() { Ok(Validation::Invalid("File does not exist".into())) }
            else if !path.is_file() { Ok(Validation::Invalid("Path is not a file".into())) }
            else { Ok(Validation::Valid) }
        })
        .prompt()?;
    let credentials_content = fs::read_to_string(&credentials_path_str).map_err(|e| anyhow!("Failed to read credentials file '{}': {}", credentials_path_str, e))?;
    let credentials_json: serde_json::Value = serde_json::from_str(&credentials_content).map_err(|e| anyhow!("Invalid JSON in credentials file '{}': {}", credentials_path_str, e))?;
    
    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Default Project ID: {}", project_id.cyan());
    println!("Default Dataset ID: {}", dataset_id.cyan());
    println!("Credentials: {}", credentials_path_str.cyan());

    if Confirm::new("Do you want to create this data source in Buster Cloud?")
        .with_default(true)
        .prompt()? 
    {
        let bigquery_creds = BigqueryCredentials { default_project_id: project_id.clone(), default_dataset_id: dataset_id.clone(), credentials_json };
        let credential = Credential::Bigquery(bigquery_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request).await?;
    } else {
        println!("{}", "Skipping data source creation in Buster Cloud.".yellow());
    }

    Ok((name, project_id, Some(dataset_id))) // project_id is like 'database', dataset_id is like 'schema'
}

async fn setup_mysql(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up MySQL/MariaDB connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text("Enter the MySQL/MariaDB host:", Some("Example: localhost or db.example.com"))?;
    let port = prompt_u16_with_default("Enter the MySQL/MariaDB port:", "3306", Some("Default MySQL/MariaDB port is 3306"))?;
    let username = prompt_required_text("Enter the MySQL/MariaDB username:", None)?;
    let password = prompt_password("Enter the MySQL/MariaDB password:")?;
    let database = prompt_required_text("Enter the default MySQL/MariaDB database name:", None)?;
    // No schema for MySQL

    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("Port: {}", port.to_string().cyan());
    println!("Username: {}", username.cyan());
    println!("Password: {}", "********".cyan());
    println!("Default Database: {}", database.cyan());

    if Confirm::new("Do you want to create this data source in Buster Cloud?")
        .with_default(true)
        .prompt()? 
    {
        let mysql_creds = MySqlCredentials { host, port, username, password, default_database: database.clone(), jump_host: None, ssh_username: None, ssh_private_key: None };
        let credential = Credential::MySql(mysql_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request).await?;
    } else {
        println!("{}", "Skipping data source creation in Buster Cloud.".yellow());
    }
    
    Ok((name, database, None))
}

async fn setup_sqlserver(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up SQL Server connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text("Enter the SQL Server host:", Some("Example: server.database.windows.net or localhost"))?;
    let port = prompt_u16_with_default("Enter the SQL Server port:", "1433", Some("Default SQL Server port is 1433"))?;
    let username = prompt_required_text("Enter the SQL Server username:", None)?;
    let password = prompt_password("Enter the SQL Server password:")?;
    let database = prompt_required_text("Enter the default SQL Server database name:", None)?;
    let schema = prompt_required_text("Enter the default SQL Server schema:", None)?;

    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("Port: {}", port.to_string().cyan());
    println!("Username: {}", username.cyan());
    println!("Password: {}", "********".cyan());
    println!("Default Database: {}", database.cyan());
    println!("Default Schema: {}", schema.cyan());

    if Confirm::new("Do you want to create this data source in Buster Cloud?")
        .with_default(true)
        .prompt()? 
    {
        let sqlserver_creds = SqlServerCredentials { host, port, username, password, default_database: database.clone(), default_schema: Some(schema.clone()), jump_host: None, ssh_username: None, ssh_private_key: None };
        let credential = Credential::SqlServer(sqlserver_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request).await?;
    } else {
        println!("{}", "Skipping data source creation in Buster Cloud.".yellow());
    }

    Ok((name, database, Some(schema)))
}

async fn setup_databricks(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up Databricks connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let host = prompt_required_text("Enter the Databricks host:", Some("Example: adb-xxxxxxxxxxxx.xx.azuredatabricks.net"))?;
    let api_key_db = prompt_password("Enter the Databricks API key (Personal Access Token):")?;
    let warehouse_id = prompt_required_text("Enter the Databricks SQL Warehouse HTTP Path:", Some("Example: /sql/1.0/warehouses/xxxxxxxxxxxx"))?;
    let catalog = prompt_required_text("Enter the default Databricks catalog:", None)?;
    let schema = prompt_required_text("Enter the default Databricks schema:", None)?;

    println!("\n{}", "Connection Summary:".bold());
    println!("Name: {}", name.cyan());
    println!("Host: {}", host.cyan());
    println!("API Key: {}", "********".cyan());
    println!("Warehouse ID: {}", warehouse_id.cyan());
    println!("Default Catalog: {}", catalog.cyan());
    println!("Default Schema: {}", schema.cyan());

    if Confirm::new("Do you want to create this data source in Buster Cloud?")
        .with_default(true)
        .prompt()? 
    {
        let databricks_creds = DatabricksCredentials { host, api_key: api_key_db, warehouse_id, default_catalog: catalog.clone(), default_schema: Some(schema.clone()) };
        let credential = Credential::Databricks(databricks_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request).await?;
    } else {
        println!("{}", "Skipping data source creation in Buster Cloud.".yellow());
    }

    Ok((name, catalog, Some(schema)))
}

async fn setup_snowflake(
    buster_url: String,
    buster_api_key: String,
    suggested_name: Option<&str>,
) -> Result<(String, String, Option<String>)> {
    println!("{}", "Setting up Snowflake connection...".bold().green());
    let name = prompt_validated_name("Enter a unique name for this data source:", suggested_name)?;
    let account_id = prompt_required_text("Enter the Snowflake account identifier:", Some("Example: xy12345.us-east-1"))?;
    let warehouse_id = prompt_required_text("Enter the Snowflake warehouse name:", Some("Example: COMPUTE_WH"))?;
    let username = prompt_required_text("Enter the Snowflake username:", None)?;
    let password = prompt_password("Enter the Snowflake password:")?;
    let role_input = Text::new("Enter the Snowflake role (optional):").prompt()?;
    let role_opt = if role_input.trim().is_empty() { None } else { Some(role_input) };
    let database = prompt_required_text("Enter the default Snowflake database name:", None)?;
    let schema = prompt_required_text("Enter the default Snowflake schema:", None)?;

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

    if Confirm::new("Do you want to create this data source in Buster Cloud?")
        .with_default(true)
        .prompt()? 
    {
        let snowflake_creds = SnowflakeCredentials { account_id, warehouse_id, username, password, role: role_opt.clone(), default_database: database.clone(), default_schema: Some(schema.clone()) };
        let credential = Credential::Snowflake(snowflake_creds);
        let request = PostDataSourcesRequest { name: name.clone(), credential };
        let client = BusterClient::new(buster_url, buster_api_key)?;
        create_data_source_with_progress(&client, request).await?;
    } else {
        println!("{}", "Skipping data source creation in Buster Cloud.".yellow());
    }

    Ok((name, database, Some(schema)))
}
