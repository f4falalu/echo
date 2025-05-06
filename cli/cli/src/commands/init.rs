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

// --- Helper struct to parse dbt_project.yml (local to init) ---
#[derive(Debug, Deserialize)]
struct DbtProject { // This is distinct from dbt_utils::DbtProject (if one existed)
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
    let dbt_config_parsed = parse_dbt_project(&dest_path)?;
    let suggested_name = dbt_config_parsed.as_ref().and_then(|c| c.name.as_deref());
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
    let (data_source_name_for_config, db_name_for_config, schema_name_for_config) = match db_type {
        DatabaseType::Redshift => {
            setup_redshift(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                &config_path, // Pass config_path for context, setup_X will call create_buster_config_file
                suggested_name,
                !existing_config_overwrite, // If not overwriting, this is effectively a dry run for buster.yml content
            )
            .await?
        }
        DatabaseType::Postgres => {
            setup_postgres(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                &config_path,
                suggested_name,
                !existing_config_overwrite,
            )
            .await?
        }
        DatabaseType::BigQuery => {
            setup_bigquery(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                &config_path,
                suggested_name,
                !existing_config_overwrite,
            )
            .await?
        }
        DatabaseType::MySql => {
            setup_mysql(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                &config_path,
                suggested_name,
                !existing_config_overwrite,
            )
            .await?
        }
        DatabaseType::SqlServer => {
            setup_sqlserver(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                &config_path,
                suggested_name,
                !existing_config_overwrite,
            )
            .await?
        }
        DatabaseType::Databricks => {
            setup_databricks(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                &config_path,
                suggested_name,
                !existing_config_overwrite,
            )
            .await?
        }
        DatabaseType::Snowflake => {
            setup_snowflake(
                buster_creds.url.clone(),
                buster_creds.api_key.clone(),
                &config_path,
                suggested_name,
                !existing_config_overwrite,
            )
            .await?
        }
    };

    // If we overwrote, or if the file didn't exist, buster.yml was just created by one of the setup_X functions.
    // Now, load it to potentially add semantic_models_file.
    let mut current_buster_config = BusterConfig::load(&config_path).map_err(|e| {
        anyhow!("Failed to load buster.yml after database setup (path: {}): {}. Ensure setup functions create it.", config_path.display(), e)
    })?;

    // --- Semantic Model Generation --- 
    if Confirm::new("Do you want to attempt to generate a base semantic layer from your dbt project?")
        .with_default(true)
        .prompt()? 
    {
        let semantic_models_dir_str = Text::new("Enter directory for generated semantic model YAML files:")
            .with_default("./buster_semantic_models")
            .with_help_message("Example: ./semantic_layer or ./models_config")
            .prompt()?;
        let semantic_models_filename_str = Text::new("Enter filename for the main semantic models YAML file:")
            .with_default("models.yml")
            .with_help_message("Example: main_spec.yml or buster_models.yml")
            .prompt()?;
        
        let semantic_output_path = PathBuf::from(&semantic_models_dir_str).join(&semantic_models_filename_str);
        // Ensure path is relative to buster.yml location for portability
        let relative_semantic_path = match pathdiff::diff_paths(&semantic_output_path, &dest_path) {
            Some(p) => p.to_string_lossy().into_owned(),
            None => { 
                // If paths are on different prefixes (e.g. Windows C: vs D:), or one is not prefix of other.
                // Default to the absolute path in this rare case, or use semantic_output_path directly.
                eprintln!("{}", "Could not determine relative path for semantic models file. Using absolute path.".yellow());
                semantic_output_path.to_string_lossy().into_owned()
            }
        };

        current_buster_config.semantic_models_file = Some(relative_semantic_path);
        current_buster_config.save(&config_path).map_err(|e| anyhow!("Failed to save buster.yml with semantic model path: {}", e))?;
        println!("{} {} {}", "✓".green(), "Updated buster.yml with semantic_models_file path:".green(), current_buster_config.semantic_models_file.as_ref().unwrap().cyan());

        generate_semantic_models_from_dbt_catalog(&current_buster_config, &config_path, &dest_path).await?;
    }

    println!("{}", "Buster initialization complete!".bold().green());
    Ok(())
}

// Helper function to manage the flow of semantic model generation
async fn generate_semantic_models_flow(buster_config: &mut BusterConfig, config_path: &Path, buster_config_dir: &Path) -> Result<()> {
    let default_dir = "./buster_semantic_models";
    let default_file = "models.yml";

    let semantic_models_dir_str = Text::new("Enter directory for generated semantic model YAML files:")
        .with_default(buster_config.semantic_models_file.as_ref().and_then(|p| Path::new(p).parent().and_then(|pp| pp.to_str())).unwrap_or(default_dir))
        .prompt()?;
    let semantic_models_filename_str = Text::new("Enter filename for the main semantic models YAML file:")
        .with_default(buster_config.semantic_models_file.as_ref().and_then(|p| Path::new(p).file_name().and_then(|f| f.to_str())).unwrap_or(default_file))
        .prompt()?;
    
    let semantic_output_path = PathBuf::from(&semantic_models_dir_str).join(&semantic_models_filename_str);
    let relative_semantic_path = match pathdiff::diff_paths(&semantic_output_path, buster_config_dir) {
        Some(p) => p.to_string_lossy().into_owned(),
        None => {
            eprintln!("{}", "Could not determine relative path for semantic models file. Using absolute path.".yellow());
            semantic_output_path.to_string_lossy().into_owned()
        }
    };

    buster_config.semantic_models_file = Some(relative_semantic_path);
    buster_config.save(config_path).map_err(|e| anyhow!("Failed to save buster.yml with semantic model path: {}", e))?;
    println!("{} {} {}", "✓".green(), "Updated buster.yml with semantic_models_file path:".green(), buster_config.semantic_models_file.as_ref().unwrap().cyan());

    generate_semantic_models_from_dbt_catalog(buster_config, config_path, buster_config_dir).await
}


// Placeholder for the main logic function
async fn generate_semantic_models_from_dbt_catalog(
    buster_config: &BusterConfig,
    config_path: &Path, // Path to buster.yml
    buster_config_dir: &Path, // Directory containing buster.yml, assumed dbt project root
) -> Result<()> {
    println!("{}", "Starting semantic model generation from dbt catalog...".dimmed());

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

    let mut yaml_models: Vec<YamlModel> = Vec::new();
    let primary_project_context = buster_config.projects.as_ref().and_then(|p| p.first());
    let default_data_source_name = primary_project_context
        .and_then(|pc| pc.data_source_name.as_ref())
        .or(buster_config.data_source_name.as_ref());
    let default_database = primary_project_context
        .and_then(|pc| pc.database.as_ref())
        .or(buster_config.database.as_ref());
    let default_schema = primary_project_context
        .and_then(|pc| pc.schema.as_ref())
        .or(buster_config.schema.as_ref());

    for (_node_id, node) in dbt_catalog.nodes.iter().filter(|(_id, n)| n.resource_type == "model") {
        let original_file_path_abs = buster_config_dir.join(&node.original_file_path);

        let in_scope = if configured_model_path_patterns.is_empty() {
            true // If no patterns, assume all models are in scope (or handle as error/warning)
        } else {
            configured_model_path_patterns
                .iter()
                .any(|pattern| pattern.matches_path(&original_file_path_abs))
        };

        if !in_scope {
            println!("Skipping dbt model (not in configured model_paths): {}", node.unique_id.dimmed());
            continue;
        }
        
        println!("Processing dbt model: {}", node.unique_id.cyan());

        let actual_model_name = node.metadata.name.clone();
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
                    searchable: false,
                    options: None,
                });
            }
        }

        let yaml_model = YamlModel {
            name: actual_model_name,
            description: node.metadata.comment.clone(),
            data_source_name: default_data_source_name.cloned(),
            database: node.database.clone().or_else(|| default_database.cloned()),
            schema: node.schema.clone().or_else(|| default_schema.cloned()),
            dimensions,
            measures,
            original_file_path: Some(node.original_file_path.clone()),
        };
        yaml_models.push(yaml_model);
    }

    if yaml_models.is_empty() {
        println!(
            "{}",
            "No dbt models found matching configured paths in catalog.json. Skipping YAML file creation."
                .yellow()
        );
        return Ok(());
    }

    let semantic_spec = YamlSemanticLayerSpec { models: yaml_models };
    let yaml_output_path_str = buster_config
        .semantic_models_file
        .as_ref()
        .ok_or_else(|| anyhow!("Semantic models file path not set in BusterConfig"))?;
    let semantic_output_path = buster_config_dir.join(yaml_output_path_str);

    if let Some(parent_dir) = semantic_output_path.parent() {
        fs::create_dir_all(parent_dir).map_err(|e| {
            anyhow!("Failed to create directory for semantic models YAML: {}", e)
        })?;
    }

    let yaml_string = serde_yaml::to_string(&semantic_spec)
        .map_err(|e| anyhow!("Failed to serialize semantic models to YAML: {}", e))?;
    fs::write(&semantic_output_path, yaml_string)
        .map_err(|e| anyhow!("Failed to write semantic models YAML file: {}", e))?;

    println!(
        "{} {}",
        "✓ Successfully generated semantic layer YAML at:".green(),
        semantic_output_path.display().to_string().cyan()
    );

    Ok(())
}

// Helper function to suggest model paths from dbt_project.yml
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
        name: Some("Main Project".to_string()), // Add a default name for the main project
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
        semantic_models_file: None, // Initially None
    };

    config.save(path)?; // Use the save method
    println!(
        "{} {}",
        "✓".green(),
        format!("Created buster.yml at {}", path.display()).green()
    );

    Ok(())
}

// --- Functions for setting up specific database types ---
// Modified to return Result<(String, String, Option<String>)> for (data_source_name, database, schema)
// And to take a 'dry_run_config' flag.
// The actual creation of buster.yml is now deferred or handled conditionally.

async fn setup_redshift(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path, // For context, not direct write unless it's the final step
    suggested_name: Option<&str>,
    skip_config_write: bool, // If true, don't write buster.yml here
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
    
    if !skip_config_write {
         create_buster_config_file(config_path, &name, &database, Some(&schema))?;
    }
    Ok((name, database, Some(schema)))
}

async fn setup_postgres(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
    skip_config_write: bool,
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

    if !skip_config_write {
        create_buster_config_file(config_path, &name, &database, Some(&schema))?;
    }
    Ok((name, database, Some(schema)))
}

async fn setup_bigquery(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
    skip_config_write: bool,
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

    if !skip_config_write {
        create_buster_config_file(config_path, &name, &project_id, Some(&dataset_id))?;
    }
    Ok((name, project_id, Some(dataset_id))) // project_id is like 'database', dataset_id is like 'schema'
}

async fn setup_mysql(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
    skip_config_write: bool,
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
    
    if !skip_config_write {
        create_buster_config_file(config_path, &name, &database, None)?;
    }
    Ok((name, database, None))
}

async fn setup_sqlserver(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
    skip_config_write: bool,
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

    if !skip_config_write {
        create_buster_config_file(config_path, &name, &database, Some(&schema))?;
    }
    Ok((name, database, Some(schema)))
}

async fn setup_databricks(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
    skip_config_write: bool,
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

    if !skip_config_write {
        create_buster_config_file(config_path, &name, &catalog, Some(&schema))?; // catalog is 'database'
    }
    Ok((name, catalog, Some(schema)))
}

async fn setup_snowflake(
    buster_url: String,
    buster_api_key: String,
    config_path: &Path,
    suggested_name: Option<&str>,
    skip_config_write: bool,
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

    if !skip_config_write {
        create_buster_config_file(config_path, &name, &database, Some(&schema))?;
    }
    Ok((name, database, Some(schema)))
}
