use anyhow::Result;
use std::path::PathBuf;
use std::collections::HashMap;
use regex::Regex;
use lazy_static::lazy_static;
use std::ffi::OsStr;
use serde::{Deserialize, Serialize};
use std::fs;
use std::fmt;
use inquire::{Text, required};

#[derive(Debug)]
pub struct GenerateCommand {
    source_path: PathBuf,
    destination_path: PathBuf,
    data_source_name: Option<String>,
    schema: Option<String>,
    database: Option<String>,
}

#[derive(Debug)]
struct ModelName {
    name: String,
    source_file: PathBuf,
    is_from_alias: bool,
}

#[derive(Debug)]
struct GenerateResult {
    successes: Vec<ModelName>,
    errors: Vec<GenerateError>,
}

#[derive(Debug)]
enum GenerateError {
    DuplicateModelName {
        name: String,
        first_occurrence: PathBuf,
        duplicate_occurrence: PathBuf,
    },
    MissingBusterYmlField {
        field: String,
    },
    FileAccessError {
        path: PathBuf,
        error: std::io::Error,
    },
}

impl fmt::Display for GenerateError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            GenerateError::DuplicateModelName { name, first_occurrence, duplicate_occurrence } => {
                write!(f, "Duplicate model name '{}' found. First occurrence: {}, Duplicate: {}", 
                    name, first_occurrence.display(), duplicate_occurrence.display())
            }
            GenerateError::MissingBusterYmlField { field } => {
                write!(f, "Missing required field in buster.yml: {}", field)
            }
            GenerateError::FileAccessError { path, error } => {
                write!(f, "Failed to access file {}: {}", path.display(), error)
            }
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BusterConfig {
    pub data_source_name: Option<String>,
    pub schema: Option<String>,
    pub database: Option<String>,
}

struct GenerateProgress {
    total_files: usize,
    processed: usize,
    current_file: String,
    status: String,
}

impl GenerateProgress {
    fn new(total_files: usize) -> Self {
        Self {
            total_files,
            processed: 0,
            current_file: String::new(),
            status: String::new(),
        }
    }

    fn log_progress(&self) {
        println!(
            "\n[{}/{}] Processing: {}",
            self.processed, self.total_files, self.current_file
        );
        println!("Status: {}", self.status);
    }

    fn log_error(&self, error: &str) {
        eprintln!("❌ Error processing {}: {}", self.current_file, error);
    }

    fn log_success(&self) {
        println!("✅ Successfully processed: {}", self.current_file);
    }

    fn log_warning(&self, warning: &str) {
        println!("⚠️  Warning for {}: {}", self.current_file, warning);
    }

    fn log_info(&self, info: &str) {
        println!("ℹ️  {}: {}", self.current_file, info);
    }
}

impl GenerateCommand {
    pub fn new(
        source_path: PathBuf,
        destination_path: PathBuf,
        data_source_name: Option<String>,
        schema: Option<String>,
        database: Option<String>,
    ) -> Self {
        Self {
            source_path,
            destination_path,
            data_source_name,
            schema,
            database,
        }
    }

    pub async fn execute(&self) -> Result<()> {
        let mut progress = GenerateProgress::new(0);
        
        // First handle buster.yml
        progress.status = "Checking buster.yml configuration...".to_string();
        progress.log_progress();
        
        self.handle_buster_yml().await?;

        progress.status = "Scanning source directory...".to_string();
        progress.log_progress();

        let model_names = self.process_sql_files(&mut progress).await?;
        
        // Print results
        println!("\n✅ Successfully processed all files");
        println!("\nFound {} model names:", model_names.len());
        for model in model_names {
            println!("  - {} ({})", model.name, 
                if model.is_from_alias { "from alias" } else { "from filename" });
        }
        
        Ok(())
    }

    async fn handle_buster_yml(&self) -> Result<BusterConfig> {
        let buster_yml_path = self.destination_path.join("buster.yml");

        if buster_yml_path.exists() {
            println!("✅ Found existing buster.yml");
            let content = fs::read_to_string(&buster_yml_path)?;
            let config: BusterConfig = serde_yaml::from_str(&content)?;
            
            // Validate required fields
            let mut missing_fields = Vec::new();
            if config.data_source_name.is_none() {
                missing_fields.push("data_source_name");
            }
            if config.schema.is_none() {
                missing_fields.push("schema");
            }

            if !missing_fields.is_empty() {
                return Err(anyhow::anyhow!(
                    "Existing buster.yml is missing required fields: {}",
                    missing_fields.join(", ")
                ));
            }

            Ok(config)
        } else {
            println!("ℹ️  No buster.yml found, creating new configuration");
            
            // Use command line args if provided, otherwise prompt
            let data_source_name = self.data_source_name.clone().unwrap_or_else(|| {
                Text::new("Enter data source name:")
                    .with_validator(required!())
                    .prompt()
                    .unwrap_or_else(|_| String::new())
            });

            let schema = self.schema.clone().unwrap_or_else(|| {
                Text::new("Enter schema name:")
                    .with_validator(required!())
                    .prompt()
                    .unwrap_or_else(|_| String::new())
            });

            let database = self.database.clone().or_else(|| {
                let input = Text::new("Enter database name (optional):")
                    .prompt()
                    .unwrap_or_else(|_| String::new());
                if input.is_empty() { None } else { Some(input) }
            });

            let config = BusterConfig {
                data_source_name: Some(data_source_name),
                schema: Some(schema),
                database,
            };

            // Write the config to file
            let yaml = serde_yaml::to_string(&config)?;
            fs::write(&buster_yml_path, yaml)?;
            
            println!("✅ Created new buster.yml configuration");
            Ok(config)
        }
    }

    async fn process_sql_files(&self, progress: &mut GenerateProgress) -> Result<Vec<ModelName>> {
        let mut names = Vec::new();
        let mut seen_names: HashMap<String, PathBuf> = HashMap::new();
        let mut errors = Vec::new();

        // Get list of SQL files first to set total
        let sql_files: Vec<_> = fs::read_dir(&self.source_path)?
            .filter_map(|entry| entry.ok())
            .filter(|entry| {
                entry.path().extension()
                    .and_then(|ext| ext.to_str())
                    .map(|ext| ext.to_lowercase() == "sql")
                    .unwrap_or(false)
            })
            .collect();

        progress.total_files = sql_files.len();
        progress.status = format!("Found {} SQL files to process", sql_files.len());
        progress.log_progress();

        for entry in sql_files {
            progress.processed += 1;
            progress.current_file = entry
                .file_name()
                .to_str()
                .unwrap_or("unknown")
                .to_string();
            progress.status = "Processing file...".to_string();
            progress.log_progress();

            match self.process_single_sql_file(&entry.path()).await {
                Ok(model_name) => {
                    // Check for duplicates
                    if let Some(existing) = seen_names.get(&model_name.name) {
                        errors.push(GenerateError::DuplicateModelName {
                            name: model_name.name,
                            first_occurrence: existing.clone(),
                            duplicate_occurrence: entry.path(),
                        });
                    } else {
                        progress.log_info(&format!(
                            "Found model name: {} ({})",
                            model_name.name,
                            if model_name.is_from_alias { "from alias" } else { "from filename" }
                        ));
                        seen_names.insert(model_name.name.clone(), entry.path());
                        names.push(model_name);
                    }
                }
                Err(e) => {
                    progress.log_error(&format!("Failed to process file: {}", e));
                    errors.push(e);
                }
            }
        }

        if !errors.is_empty() {
            // Log all errors
            println!("\n❌ Encountered errors during processing:");
            for error in &errors {
                match error {
                    GenerateError::DuplicateModelName { name, first_occurrence, duplicate_occurrence } => {
                        println!("  - Duplicate model name '{}' found:", name);
                        println!("    First occurrence: {}", first_occurrence.display());
                        println!("    Duplicate: {}", duplicate_occurrence.display());
                    }
                    GenerateError::FileAccessError { path, error } => {
                        println!("  - Failed to access file {}: {}", path.display(), error);
                    }
                    GenerateError::MissingBusterYmlField { field } => {
                        println!("  - Missing required field in buster.yml: {}", field);
                    }
                }
            }
            return Err(anyhow::anyhow!("Failed to process all SQL files"));
        }

        Ok(names)
    }

    async fn process_single_sql_file(&self, path: &PathBuf) -> Result<ModelName, GenerateError> {
        // Read file content
        let content = fs::read_to_string(path)
            .map_err(|e| GenerateError::FileAccessError {
                path: path.clone(),
                error: e,
            })?;

        // Try to find alias in content
        if let Some(alias) = self.extract_alias(&content) {
            Ok(ModelName {
                name: alias,
                source_file: path.clone(),
                is_from_alias: true,
            })
        } else {
            // Use filename without extension
            let name = path
                .file_stem()
                .and_then(|s| s.to_str())
                .map(|s| s.to_string())
                .ok_or_else(|| GenerateError::FileAccessError {
                    path: path.clone(),
                    error: std::io::Error::new(
                        std::io::ErrorKind::InvalidData,
                        "Invalid filename",
                    ),
                })?;

            Ok(ModelName {
                name,
                source_file: path.clone(),
                is_from_alias: false,
            })
        }
    }

    fn extract_alias(&self, content: &str) -> Option<String> {
        lazy_static! {
            static ref ALIAS_RE: Regex = Regex::new(
                r#"(?i)alias\s*=\s*['"]([^'"]+)['"]"#
            ).unwrap();
        }
        
        ALIAS_RE.captures(content)
            .map(|cap| cap[1].to_string())
    }
}

pub async fn generate() -> Result<()> {
    Ok(())
}
