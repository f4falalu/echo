use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

use crate::utils::{
    BusterClient, DeployDatasetsRequest, DeployDatasetsColumnsRequest, DeployDatasetsEntityRelationshipsRequest,
    buster_credentials::get_and_validate_buster_credentials, ValidationResult, ValidationError, ValidationErrorType,
};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct BusterConfig {
    pub data_source_name: Option<String>,
    pub schema: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BusterModel {
    #[serde(default)]
    version: i32,  // Optional, only used for DBT models
    models: Vec<Model>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Model {
    name: String,
    data_source_name: Option<String>,
    schema: Option<String>,
    description: String,
    model: Option<String>,
    entities: Vec<Entity>,
    dimensions: Vec<Dimension>,
    measures: Vec<Measure>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Entity {
    name: String,
    expr: String,
    #[serde(rename = "type")]
    entity_type: String,
    description: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Dimension {
    name: String,
    expr: String,
    #[serde(rename = "type")]
    dimension_type: String,
    description: String,
    #[serde(default = "bool::default")]
    stored_values: bool,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Measure {
    name: String,
    expr: String,
    agg: String,
    description: String,
}

#[derive(Debug)]
struct ModelFile {
    yml_path: PathBuf,
    sql_path: Option<PathBuf>,
    model: BusterModel,
    config: Option<BusterConfig>,  // Store the global config
}

#[derive(Debug, Default)]
pub struct DeployResult {
    success: Vec<String>,
    failures: Vec<(String, String)>, // (filename, error)
}

#[derive(Debug)]
struct DeployProgress {
    total_files: usize,
    processed: usize,
    current_file: String,
    status: String,
}

impl DeployProgress {
    fn new(total_files: usize) -> Self {
        Self {
            total_files,
            processed: 0,
            current_file: String::new(),
            status: String::new(),
        }
    }

    fn log_progress(&self) {
        println!("\n[{}/{}] Processing: {}", self.processed, self.total_files, self.current_file);
        println!("Status: {}", self.status);
    }
    
    fn log_error(&self, error: &str) {
        eprintln!("❌ Error processing {}: {}", self.current_file, error);
    }
    
    fn log_success(&self) {
        println!("✅ Successfully deployed: {}", self.current_file);
    }

    fn log_warning(&self, warning: &str) {
        println!("⚠️  Warning for {}: {}", self.current_file, warning);
    }

    fn log_info(&self, info: &str) {
        println!("ℹ️  {}: {}", self.current_file, info);
    }

    fn log_validation_start(&self, model_name: &str) {
        println!("🔍 Validating model '{}'...", model_name);
    }

    fn log_sql_info(&self, model_name: &str, sql_path: Option<&PathBuf>) {
        match sql_path {
            Some(path) => println!("📄 Found SQL file for '{}' at: {}", model_name, path.display()),
            None => println!("⚠️  No SQL file found for '{}', using default SELECT", model_name),
        }
    }

    pub fn log_validation_error(&self, validation: &ValidationResult) {
        if !validation.success {
            println!("\n❌ Validation failed for {}", validation.model_name);
            println!("   Data Source: {}", validation.data_source_name);
            println!("   Schema: {}", validation.schema);
            
            // Group errors by type
            let mut table_errors = Vec::new();
            let mut column_errors = Vec::new();
            let mut type_errors = Vec::new();
            let mut other_errors = Vec::new();
            
            for error in &validation.errors {
                match error.error_type {
                    ValidationErrorType::TableNotFound => table_errors.push(error),
                    ValidationErrorType::ColumnNotFound => column_errors.push(error),
                    ValidationErrorType::TypeMismatch => type_errors.push(error),
                    ValidationErrorType::DataSourceError => other_errors.push(error),
                }
            }
            
            // Print grouped errors
            if !table_errors.is_empty() {
                println!("\n   Table/View Errors:");
                for error in table_errors {
                    println!("   - {}", error.message);
                }
            }
            
            if !column_errors.is_empty() {
                println!("\n   Column Errors:");
                for error in column_errors {
                    if let Some(col) = &error.column_name {
                        println!("   - Column '{}': {}", col, error.message);
                    }
                }
            }
            
            if !type_errors.is_empty() {
                println!("\n   Type Mismatch Errors:");
                for error in type_errors {
                    if let Some(col) = &error.column_name {
                        println!("   - Column '{}': {}", col, error.message);
                    }
                }
            }
            
            if !other_errors.is_empty() {
                println!("\n   Other Errors:");
                for error in other_errors {
                    println!("   - {}", error.message);
                }
            }
            
            // Print suggestions if any
            let suggestions: Vec<_> = validation.errors
                .iter()
                .filter_map(|e| e.suggestion.as_ref())
                .collect();
            
            if !suggestions.is_empty() {
                println!("\n💡 Suggestions:");
                for suggestion in suggestions {
                    println!("   - {}", suggestion);
                }
            }
        }
    }

    pub fn log_validation_success(&self, validation: &ValidationResult) {
        println!("\n✅ Validation passed for {}", validation.model_name);
        println!("   Data Source: {}", validation.data_source_name);
        println!("   Schema: {}", validation.schema);
    }
}

impl ModelFile {
    fn new(yml_path: PathBuf, config: Option<BusterConfig>) -> Result<Self> {
        let yml_content = std::fs::read_to_string(&yml_path)?;
        let model: BusterModel = serde_yaml::from_str(&yml_content)?;
        
        Ok(Self {
            yml_path: yml_path.clone(),
            sql_path: Self::find_sql(&yml_path),
            model,
            config,
        })
    }

    fn find_sql(yml_path: &Path) -> Option<PathBuf> {
        // Get the file stem (name without extension)
        let file_stem = yml_path.file_stem()?;
        
        // Look one directory up
        let parent_dir = yml_path.parent()?.parent()?;
        let sql_path = parent_dir.join(format!("{}.sql", file_stem.to_str()?));
        
        if sql_path.exists() {
            Some(sql_path)
        } else {
            None
        }
    }
    
    fn get_config(dir: &Path) -> Result<Option<BusterConfig>> {
        let config_path = dir.join("buster.yml");
        if config_path.exists() {
            let content = std::fs::read_to_string(&config_path)
                .map_err(|e| anyhow::anyhow!("Failed to read buster.yml: {}", e))?;
            
            if content.trim().is_empty() {
                return Ok(None);
            }
            
            serde_yaml::from_str(&content)
                .map(Some)
                .map_err(|e| anyhow::anyhow!("Failed to parse buster.yml: {}", e))
        } else {
            Ok(None)
        }
    }

    fn validate(&self, config: Option<&BusterConfig>) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        let mut model_names = std::collections::HashSet::new();
        
        // Required fields
        if self.model.models.is_empty() {
            errors.push("At least one model is required".to_string());
            return Err(errors);
        }
        
        for model in &self.model.models {
            // Check for duplicate model names
            if !model_names.insert(&model.name) {
                errors.push(format!("Duplicate model name: {}", model.name));
                continue;
            }

            let (data_source_name, schema) = self.resolve_model_config(model, config);
            
            // Critical errors
            if data_source_name.is_none() {
                errors.push(format!(
                    "data_source_name is required for model '{}' (not found in model or buster.yml)",
                    model.name
                ));
            }
            if schema.is_none() {
                errors.push(format!(
                    "schema is required for model '{}' (not found in model or buster.yml)",
                    model.name
                ));
            }
            if model.name.is_empty() {
                errors.push("model name is required".to_string());
            }

            // Warnings
            if model.description.is_empty() {
                warnings.push(format!("Model '{}' has no description", model.name));
            }
            if model.dimensions.is_empty() && model.measures.is_empty() {
                warnings.push(format!("Model '{}' has no dimensions or measures", model.name));
            }
            
            // Relationship validation
            for entity in &model.entities {
                if entity.entity_type == "foreign" {
                    // Check if referenced model exists
                    let referenced_yml = self.yml_path.parent()
                        .map(|p| p.join(format!("{}.yml", entity.name)));
                    
                    if let Some(ref_path) = referenced_yml {
                        if !ref_path.exists() {
                            errors.push(format!(
                                "Referenced model '{}' not found for relationship in '{}' (expected at: {})", 
                                entity.name, 
                                model.name,
                                ref_path.display()
                            ));
                        }
                    }
                }
            }
        }

        // Log warnings but don't fail validation
        if !warnings.is_empty() {
            println!("\n⚠️  Validation warnings:");
            for warning in warnings {
                println!("   - {}", warning);
            }
        }
        
        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }

    fn generate_default_sql(&self, model: &Model) -> String {
        format!("select * from {}.{}", 
            model.schema.as_ref().map(String::as_str).unwrap_or(""), 
            model.name
        )
    }

    fn get_sql_content(&self, model: &Model) -> Result<String> {
        if let Some(ref sql_path) = self.sql_path {
            Ok(std::fs::read_to_string(sql_path)?)
        } else {
            Ok(self.generate_default_sql(model))
        }
    }

    fn resolve_model_config(&self, model: &Model, config: Option<&BusterConfig>) -> (Option<String>, Option<String>) {
        let data_source_name = model.data_source_name.clone()
            .or_else(|| config.and_then(|c| c.data_source_name.clone()));
        
        let schema = model.schema.clone()
            .or_else(|| config.and_then(|c| c.schema.clone()));

        (data_source_name, schema)
    }

    fn to_deploy_request(&self, model: &Model, sql_content: String) -> DeployDatasetsRequest {
        let mut columns = Vec::new();

        // Convert dimensions to columns
        for dim in &model.dimensions {
            columns.push(DeployDatasetsColumnsRequest {
                name: dim.name.clone(),
                description: dim.description.clone(),
                semantic_type: Some("dimension".to_string()),
                expr: Some(dim.expr.clone()),
                type_: Some(dim.dimension_type.clone()),
                agg: None,
            });
        }

        // Convert measures to columns
        for measure in &model.measures {
            columns.push(DeployDatasetsColumnsRequest {
                name: measure.name.clone(),
                description: measure.description.clone(),
                semantic_type: Some("measure".to_string()),
                expr: Some(measure.expr.clone()),
                type_: None,
                agg: Some(measure.agg.clone()),
            });
        }

        // Convert entity relationships
        let entity_relationships = model.entities.iter()
            .map(|entity| DeployDatasetsEntityRelationshipsRequest {
                name: entity.name.clone(),
                expr: entity.expr.clone(),
                type_: entity.entity_type.clone(),
            })
            .collect();

        // Resolve configuration with global config
        let (data_source_name, schema) = self.resolve_model_config(model, self.config.as_ref());

        // Unwrap with error if missing - this should never happen since we validate earlier
        let data_source_name = data_source_name.expect("data_source_name missing after validation");
        let schema = schema.expect("schema missing after validation");

        DeployDatasetsRequest {
            id: None,
            data_source_name,
            env: "dev".to_string(),
            type_: "view".to_string(),
            name: model.name.clone(),
            model: model.model.clone(),
            schema,
            description: model.description.clone(),
            sql_definition: Some(sql_content),
            entity_relationships: Some(entity_relationships),
            columns,
            yml_file: Some(serde_yaml::to_string(&self.model).unwrap_or_default()),
        }
    }
}

pub async fn deploy_v2(path: Option<&str>) -> Result<()> {
    let target_path = PathBuf::from(path.unwrap_or("."));
    let mut progress = DeployProgress::new(0);
    let mut result = DeployResult::default();

    // Get Buster credentials
    progress.status = "Checking Buster credentials...".to_string();
    progress.log_progress();

    let creds = match get_and_validate_buster_credentials().await {
        Ok(creds) => {
            println!("✅ Successfully authenticated with Buster");
            creds
        }
        Err(e) => {
            println!("❌ Authentication failed");
            return Err(anyhow::anyhow!("Failed to get Buster credentials. Please run 'buster auth' first: {}", e));
        }
    };

    // Create API client
    let client = BusterClient::new(creds.url, creds.api_key)?;

    // Try to load buster.yml first
    progress.status = "Looking for buster.yml configuration...".to_string();
    progress.log_progress();

    let config = match ModelFile::get_config(&target_path) {
        Ok(Some(config)) => {
            println!("✅ Found buster.yml configuration");
            if let Some(ds) = &config.data_source_name {
                println!("   - Default data source: {}", ds);
            }
            if let Some(schema) = &config.schema {
                println!("   - Default schema: {}", schema);
            }
            Some(config)
        }
        Ok(None) => {
            println!("ℹ️  No buster.yml found, will require configuration in model files");
            None
        }
        Err(e) => {
            println!("⚠️  Error reading buster.yml: {}", e);
            None
        }
    };

    // Find all .yml files
    progress.status = "Discovering model files...".to_string();
    progress.log_progress();

    let yml_files: Vec<PathBuf> = if target_path.is_file() {
        vec![target_path.clone()]
    } else {
        std::fs::read_dir(&target_path)?
            .filter_map(|entry| entry.ok())
            .filter(|entry| {
                let path = entry.path();
                path.extension()
                    .and_then(|ext| ext.to_str())
                    .map(|ext| ext == "yml")
                    .unwrap_or(false)
                    && path.file_name()
                        .and_then(|name| name.to_str())
                        .map(|name| name != "buster.yml")
                        .unwrap_or(false)
            })
            .map(|entry| entry.path())
            .collect()
    };

    println!("Found {} model files in {}", yml_files.len(), target_path.display());
    progress.total_files = yml_files.len();

    let mut deploy_requests = Vec::new();

    // Process each file
    for yml_path in yml_files {
        progress.processed += 1;
        progress.current_file = yml_path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();
        
        progress.status = "Loading model file...".to_string();
        progress.log_progress();

        // Load and validate model
        let model_file = match ModelFile::new(yml_path.clone(), config.clone()) {
            Ok(mf) => mf,
            Err(e) => {
                progress.log_error(&format!("Failed to load model: {}", e));
                result.failures.push((progress.current_file.clone(), format!("Failed to load model: {}", e)));
                continue;
            }
        };

        progress.status = "Validating model...".to_string();
        progress.log_progress();

        if let Err(errors) = model_file.validate(config.as_ref()) {
            for error in &errors {
                progress.log_error(error);
            }
            result.failures.push((progress.current_file.clone(), errors.join(", ")));
            continue;
        }

        // Process each model in the file
        for model in &model_file.model.models {
            let (data_source_name, schema) = model_file.resolve_model_config(model, config.as_ref());
            
            if data_source_name.is_none() {
                progress.log_error(&format!(
                    "data_source_name is required for model {} (not found in model or buster.yml)",
                    model.name
                ));
                result.failures.push((
                    progress.current_file.clone(),
                    format!("Missing data_source_name for model {}", model.name)
                ));
                continue;
            }

            if schema.is_none() {
                progress.log_error(&format!(
                    "schema is required for model {} (not found in model or buster.yml)",
                    model.name
                ));
                result.failures.push((
                    progress.current_file.clone(),
                    format!("Missing schema for model {}", model.name)
                ));
                continue;
            }

            // Get SQL content
            let sql_content = match model_file.get_sql_content(model) {
                Ok(content) => content,
                Err(e) => {
                    progress.log_error(&format!("Failed to read SQL content: {}", e));
                    result.failures.push((
                        progress.current_file.clone(),
                        format!("Failed to read SQL content: {}", e)
                    ));
                    continue;
                }
            };

            // Create deploy request
            deploy_requests.push(model_file.to_deploy_request(model, sql_content));
        }

        progress.log_success();
        result.success.push(progress.current_file.clone());
    }

    // Deploy to API if we have valid models
    if !deploy_requests.is_empty() {
        progress.status = "Deploying models to Buster...".to_string();
        progress.log_progress();

        // Log what we're trying to deploy
        println!("\n📦 Deploying {} models:", deploy_requests.len());
        for request in &deploy_requests {
            println!("   - Model: {} ", request.name);
            println!("     Data Source: {} (env: {})", request.data_source_name, request.env);
            println!("     Schema: {}", request.schema);
            println!("     Columns: {}", request.columns.len());
            if let Some(rels) = &request.entity_relationships {
                println!("     Relationships: {}", rels.len());
            }
        }

        let data_source_name = deploy_requests[0].data_source_name.clone();
        match client.deploy_datasets(deploy_requests).await {
            Ok(response) => {
                let mut has_validation_errors = false;

                // Process validation results
                for validation in &response.results {
                    if validation.success {
                        progress.log_validation_success(validation);
                    } else {
                        has_validation_errors = true;
                        progress.log_validation_error(validation);
                    }
                }

                if has_validation_errors {
                    println!("\n❌ Deployment failed due to validation errors!");
                    println!("\n💡 Troubleshooting:");
                    println!("1. Check data source:");
                    println!("   - Verify '{}' exists in Buster", data_source_name);
                    println!("   - Confirm it has env='dev'");
                    println!("   - Check your access permissions");
                    println!("2. Check model definitions:");
                    println!("   - Validate SQL syntax");
                    println!("   - Verify column names match");
                    println!("3. Check relationships:");
                    println!("   - Ensure referenced models exist");
                    println!("   - Verify relationship types");
                    return Err(anyhow::anyhow!("Deployment failed due to validation errors"));
                }

                println!("\n✅ All models deployed successfully!");
            }
            Err(e) => {
                println!("\n❌ Deployment failed!");
                println!("Error: {}", e);
                println!("\n💡 Troubleshooting:");
                println!("1. Check data source:");
                println!("   - Verify '{}' exists in Buster", data_source_name);
                println!("   - Confirm it has env='dev'");
                println!("   - Check your access permissions");
                println!("2. Check model definitions:");
                println!("   - Validate SQL syntax");
                println!("   - Verify column names match");
                println!("3. Check relationships:");
                println!("   - Ensure referenced models exist");
                println!("   - Verify relationship types");
                return Err(anyhow::anyhow!("Failed to deploy models to Buster: {}", e));
            }
        }
    }

    // Print final summary with more details
    println!("\n📊 Deployment Summary");
    println!("==================");
    println!("✅ Successfully deployed: {} models", result.success.len());
    if !result.success.is_empty() {
        println!("\nSuccessful deployments:");
        for success in &result.success {
            println!("   - {}", success);
        }
    }

    if !result.failures.is_empty() {
        println!("\n❌ Failed deployments: {} models", result.failures.len());
        println!("\nFailures:");
        for (file, error) in &result.failures {
            println!("   - {}", file);
            println!("     Error: {}", error);
        }
        return Err(anyhow::anyhow!("Some models failed to deploy"));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;
    use anyhow::Result;

    // Helper function to create a temporary directory with test files
    async fn setup_test_dir() -> Result<TempDir> {
        let temp_dir = TempDir::new()?;
        Ok(temp_dir)
    }

    // Helper to create a test YAML file
    async fn create_test_yaml(dir: &Path, name: &str, content: &str) -> Result<PathBuf> {
        let path = dir.join(name);
        fs::write(&path, content)?;
        Ok(path)
    }

    // Helper to create a test SQL file
    async fn create_test_sql(dir: &Path, name: &str, content: &str) -> Result<PathBuf> {
        let path = dir.join(name);
        fs::write(&path, content)?;
        Ok(path)
    }

    // Model File Tests
    #[tokio::test]
    async fn test_model_file_new_valid() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                description: "Test model"
                data_source_name: "test_source"
                schema: "test_schema"
                entities: []
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        assert_eq!(model_file.model.models[0].name, "test_model");
        assert_eq!(model_file.model.models[0].data_source_name.as_ref().unwrap(), "test_source");
        Ok(())
    }

    #[tokio::test]
    async fn test_model_file_new_missing_file() {
        let temp_dir = setup_test_dir().await.unwrap();
        let non_existent = temp_dir.path().join("does_not_exist.yml");
        
        let result = ModelFile::new(non_existent, None);
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_model_file_new_invalid_yaml() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let invalid_yaml = "this is not valid yaml";
        let yaml_path = create_test_yaml(temp_dir.path(), "invalid.yml", invalid_yaml).await?;
        
        let result = ModelFile::new(yaml_path, None);
        assert!(result.is_err());
        Ok(())
    }

    #[tokio::test]
    async fn test_model_file_new_empty_yaml() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_path = create_test_yaml(temp_dir.path(), "empty.yml", "").await?;
        
        let result = ModelFile::new(yaml_path, None);
        assert!(result.is_err());
        Ok(())
    }

    // Config Resolution Tests
    #[tokio::test]
    async fn test_resolve_model_config_model_specific() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                data_source_name: "model_source"
                schema: "model_schema"
                description: "Test"
                entities: []
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let global_config = BusterConfig {
            data_source_name: Some("global_source".to_string()),
            schema: Some("global_schema".to_string()),
        };
        
        let model_file = ModelFile::new(yaml_path, Some(global_config))?;
        let model = &model_file.model.models[0];
        let (data_source, schema) = model_file.resolve_model_config(model, model_file.config.as_ref());
        
        assert_eq!(data_source.unwrap(), "model_source");
        assert_eq!(schema.unwrap(), "model_schema");
        Ok(())
    }

    #[tokio::test]
    async fn test_resolve_model_config_fallback() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                description: "Test"
                entities: []
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let global_config = BusterConfig {
            data_source_name: Some("global_source".to_string()),
            schema: Some("global_schema".to_string()),
        };
        
        let model_file = ModelFile::new(yaml_path, Some(global_config))?;
        let model = &model_file.model.models[0];
        let (data_source, schema) = model_file.resolve_model_config(model, model_file.config.as_ref());
        
        assert_eq!(data_source.unwrap(), "global_source");
        assert_eq!(schema.unwrap(), "global_schema");
        Ok(())
    }

    #[tokio::test]
    async fn test_resolve_model_config_no_config() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                description: "Test"
                entities: []
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let model = &model_file.model.models[0];
        let (data_source, schema) = model_file.resolve_model_config(model, None);
        
        assert!(data_source.is_none());
        assert!(schema.is_none());
        Ok(())
    }

    #[tokio::test]
    async fn test_get_config_empty() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let config_content = "";
        create_test_yaml(temp_dir.path(), "buster.yml", config_content).await?;
        
        let result = ModelFile::get_config(temp_dir.path())?;
        assert!(result.is_none());
        Ok(())
    }

    #[tokio::test]
    async fn test_get_config_malformed() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let config_content = "this: is: not: valid: yaml:";
        create_test_yaml(temp_dir.path(), "buster.yml", config_content).await?;
        
        let result = ModelFile::get_config(temp_dir.path());
        assert!(result.is_err());
        Ok(())
    }

    // SQL File Discovery Tests
    #[tokio::test]
    async fn test_find_sql_exists() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        
        // Create models directory
        let models_dir = temp_dir.path().join("models");
        fs::create_dir(&models_dir)?;
        
        // Create test.yml in models directory
        let yaml_path = create_test_yaml(&models_dir, "test.yml", "").await?;
        
        // Create test.sql in parent directory
        let sql_content = "SELECT * FROM test";
        create_test_sql(temp_dir.path(), "test.sql", sql_content).await?;
        
        let sql_path = ModelFile::find_sql(&yaml_path);
        assert!(sql_path.is_some());
        assert_eq!(
            sql_path.unwrap().file_name().unwrap().to_str().unwrap(),
            "test.sql"
        );
        Ok(())
    }

    #[tokio::test]
    async fn test_find_sql_missing() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let models_dir = temp_dir.path().join("models");
        fs::create_dir(&models_dir)?;
        
        let yaml_path = create_test_yaml(&models_dir, "test.yml", "").await?;
        let sql_path = ModelFile::find_sql(&yaml_path);
        
        assert!(sql_path.is_none());
        Ok(())
    }

    #[tokio::test]
    async fn test_find_sql_special_chars() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let models_dir = temp_dir.path().join("models");
        fs::create_dir(&models_dir)?;
        
        // Create YAML and SQL files with special characters
        let yaml_path = create_test_yaml(&models_dir, "test-file_123.yml", "").await?;
        create_test_sql(temp_dir.path(), "test-file_123.sql", "SELECT 1").await?;
        
        let sql_path = ModelFile::find_sql(&yaml_path);
        assert!(sql_path.is_some());
        assert_eq!(
            sql_path.unwrap().file_name().unwrap().to_str().unwrap(),
            "test-file_123.sql"
        );
        Ok(())
    }

    // Model Validation Tests
    #[tokio::test]
    async fn test_validate_required_fields() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                description: "Test model"
                entities: []
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let validation = model_file.validate(None);
        
        assert!(validation.is_err());
        let errors = validation.unwrap_err();
        assert!(errors.iter().any(|e| e.contains("data_source_name is required")));
        assert!(errors.iter().any(|e| e.contains("schema is required")));
        Ok(())
    }

    #[tokio::test]
    async fn test_validate_with_global_config() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                description: "Test model"
                entities: []
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let global_config = BusterConfig {
            data_source_name: Some("global_source".to_string()),
            schema: Some("global_schema".to_string()),
        };
        
        let model_file = ModelFile::new(yaml_path, Some(global_config))?;
        let validation = model_file.validate(model_file.config.as_ref());
        
        assert!(validation.is_ok());
        Ok(())
    }

    #[tokio::test]
    async fn test_validate_empty_models() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let validation = model_file.validate(None);
        
        assert!(validation.is_err());
        let errors = validation.unwrap_err();
        assert!(errors.iter().any(|e| e.contains("At least one model is required")));
        Ok(())
    }

    #[tokio::test]
    async fn test_validate_duplicate_model_names() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                data_source_name: "source1"
                schema: "schema1"
                description: "Test model 1"
                entities: []
                dimensions: []
                measures: []
              - name: test_model
                data_source_name: "source2"
                schema: "schema2"
                description: "Test model 2"
                entities: []
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let validation = model_file.validate(None);
        
        assert!(validation.is_err());
        let errors = validation.unwrap_err();
        assert!(errors.iter().any(|e| e.contains("Duplicate model name")));
        Ok(())
    }

    #[tokio::test]
    async fn test_validate_entity_relationships() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        
        // Create models directory
        let models_dir = temp_dir.path().join("models");
        fs::create_dir(&models_dir)?;
        
        // Create referenced model first
        let customer_yaml = r#"
            version: 1
            models:
              - name: customers
                data_source_name: "source"
                schema: "schema"
                description: "Customer model"
                entities:
                  - name: customer_id
                    expr: "id"
                    type: "primary"
                    description: "Primary key"
                dimensions: []
                measures: []
        "#;
        create_test_yaml(&models_dir, "customers.yml", customer_yaml).await?;
        
        // Create model with relationship
        let orders_yaml = r#"
            version: 1
            models:
              - name: orders
                data_source_name: "source"
                schema: "schema"
                description: "Orders model"
                entities:
                  - name: customers
                    expr: "customer_id"
                    type: "foreign"
                    description: "Foreign key to customers"
                dimensions: []
                measures: []
        "#;
        let orders_path = create_test_yaml(&models_dir, "orders.yml", orders_yaml).await?;
        
        let model_file = ModelFile::new(orders_path, None)?;
        let validation = model_file.validate(None);
        
        assert!(validation.is_ok());
        Ok(())
    }

    #[tokio::test]
    async fn test_validate_missing_relationship() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: orders
                data_source_name: "source"
                schema: "schema"
                description: "Orders model"
                entities:
                  - name: non_existent
                    expr: "customer_id"
                    type: "foreign"
                    description: "Foreign key to non-existent model"
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "orders.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let validation = model_file.validate(None);
        
        assert!(validation.is_err());
        let errors = validation.unwrap_err();
        assert!(errors.iter().any(|e| e.contains("Referenced model 'non_existent' not found")));
        Ok(())
    }

    // Request Mapping Tests
    #[tokio::test]
    async fn test_to_deploy_request_simple() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                data_source_name: "test_source"
                schema: "test_schema"
                description: "Test model"
                entities: []
                dimensions:
                  - name: dim1
                    expr: "col1"
                    type: "string"
                    description: "First dimension"
                measures:
                  - name: measure1
                    expr: "col2"
                    agg: "sum"
                    description: "First measure"
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let model = &model_file.model.models[0];
        let request = model_file.to_deploy_request(model, "SELECT 1".to_string());
        
        assert_eq!(request.name, "test_model");
        assert_eq!(request.data_source_name, "test_source");
        assert_eq!(request.schema, "test_schema");
        assert_eq!(request.description, "Test model");
        assert_eq!(request.sql_definition.unwrap(), "SELECT 1");
        
        // Check dimensions
        let columns = request.columns;
        assert_eq!(columns.len(), 2); // 1 dimension + 1 measure
        
        let dim = columns.iter().find(|c| c.name == "dim1").unwrap();
        assert_eq!(dim.semantic_type.as_ref().unwrap(), "dimension");
        assert_eq!(dim.expr.as_ref().unwrap(), "col1");
        assert_eq!(dim.type_.as_ref().unwrap(), "string");
        
        // Check measures
        let measure = columns.iter().find(|c| c.name == "measure1").unwrap();
        assert_eq!(measure.semantic_type.as_ref().unwrap(), "measure");
        assert_eq!(measure.expr.as_ref().unwrap(), "col2");
        assert_eq!(measure.agg.as_ref().unwrap(), "sum");
        
        Ok(())
    }

    #[tokio::test]
    async fn test_to_deploy_request_with_relationships() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: orders
                data_source_name: "test_source"
                schema: "test_schema"
                description: "Orders model"
                entities:
                  - name: customers
                    expr: "customer_id"
                    type: "foreign"
                    description: "Foreign key to customers"
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let model = &model_file.model.models[0];
        let request = model_file.to_deploy_request(model, "SELECT 1".to_string());
        
        let relationships = request.entity_relationships.unwrap();
        assert_eq!(relationships.len(), 1);
        assert_eq!(relationships[0].name, "customers");
        assert_eq!(relationships[0].expr, "customer_id");
        assert_eq!(relationships[0].type_, "foreign");
        
        Ok(())
    }

    #[tokio::test]
    async fn test_to_deploy_request_with_stored_values() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                data_source_name: "test_source"
                schema: "test_schema"
                description: "Test model"
                entities: []
                dimensions:
                  - name: country
                    expr: "country_code"
                    type: "string"
                    description: "Country code"
                    stored_values: true
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let model = &model_file.model.models[0];
        let request = model_file.to_deploy_request(model, "SELECT 1".to_string());
        
        let columns = request.columns;
        assert_eq!(columns.len(), 1);
        
        let dim = &columns[0];
        assert_eq!(dim.name, "country");
        assert_eq!(dim.expr.as_ref().unwrap(), "country_code");
        assert_eq!(dim.type_.as_ref().unwrap(), "string");
        
        Ok(())
    }

    #[tokio::test]
    async fn test_to_deploy_request_preserves_types() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                data_source_name: "test_source"
                schema: "test_schema"
                description: "Test model"
                entities: []
                dimensions:
                  - name: string_dim
                    expr: "col1"
                    type: "string"
                    description: "String dimension"
                  - name: number_dim
                    expr: "col2"
                    type: "number"
                    description: "Number dimension"
                  - name: date_dim
                    expr: "col3"
                    type: "date"
                    description: "Date dimension"
                measures:
                  - name: sum_measure
                    expr: "col4"
                    agg: "sum"
                    description: "Sum measure"
                  - name: avg_measure
                    expr: "col5"
                    agg: "avg"
                    description: "Average measure"
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let model = &model_file.model.models[0];
        let request = model_file.to_deploy_request(model, "SELECT 1".to_string());
        
        let columns = request.columns;
        assert_eq!(columns.len(), 5);
        
        // Check dimension types
        let string_dim = columns.iter().find(|c| c.name == "string_dim").unwrap();
        assert_eq!(string_dim.type_.as_ref().unwrap(), "string");
        
        let number_dim = columns.iter().find(|c| c.name == "number_dim").unwrap();
        assert_eq!(number_dim.type_.as_ref().unwrap(), "number");
        
        let date_dim = columns.iter().find(|c| c.name == "date_dim").unwrap();
        assert_eq!(date_dim.type_.as_ref().unwrap(), "date");
        
        // Check measure aggregations
        let sum_measure = columns.iter().find(|c| c.name == "sum_measure").unwrap();
        assert_eq!(sum_measure.agg.as_ref().unwrap(), "sum");
        
        let avg_measure = columns.iter().find(|c| c.name == "avg_measure").unwrap();
        assert_eq!(avg_measure.agg.as_ref().unwrap(), "avg");
        
        Ok(())
    }

    // Default SQL Generation Tests
    #[tokio::test]
    async fn test_generate_default_sql_basic() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                schema: "test_schema"
                description: "Test model"
                entities: []
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let model = &model_file.model.models[0];
        let sql = model_file.generate_default_sql(model);
        
        assert_eq!(sql, "select * from test_schema.test_model");
        Ok(())
    }

    #[tokio::test]
    async fn test_generate_default_sql_missing_schema() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                description: "Test model"
                entities: []
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let model = &model_file.model.models[0];
        let sql = model_file.generate_default_sql(model);
        
        assert_eq!(sql, "select * from .test_model");
        Ok(())
    }

    #[tokio::test]
    async fn test_generate_default_sql_special_chars() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: "test-model_123"
                schema: "test-schema_123"
                description: "Test model"
                entities: []
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let model = &model_file.model.models[0];
        let sql = model_file.generate_default_sql(model);
        
        assert_eq!(sql, "select * from test-schema_123.test-model_123");
        Ok(())
    }

    #[tokio::test]
    async fn test_get_sql_content_with_file() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        
        // Create models directory
        let models_dir = temp_dir.path().join("models");
        fs::create_dir(&models_dir)?;
        
        // Create test.yml in models directory
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                schema: "test_schema"
                description: "Test model"
                entities: []
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(&models_dir, "test.yml", yaml_content).await?;
        
        // Create test.sql in parent directory
        let sql_content = "SELECT id, name FROM test_table";
        create_test_sql(temp_dir.path(), "test.sql", sql_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let model = &model_file.model.models[0];
        let content = model_file.get_sql_content(model)?;
        
        assert_eq!(content, sql_content);
        Ok(())
    }

    #[tokio::test]
    async fn test_get_sql_content_fallback() -> Result<()> {
        let temp_dir = setup_test_dir().await?;
        let yaml_content = r#"
            version: 1
            models:
              - name: test_model
                schema: "test_schema"
                description: "Test model"
                entities: []
                dimensions: []
                measures: []
        "#;
        let yaml_path = create_test_yaml(temp_dir.path(), "test.yml", yaml_content).await?;
        
        let model_file = ModelFile::new(yaml_path, None)?;
        let model = &model_file.model.models[0];
        let content = model_file.get_sql_content(model)?;
        
        assert_eq!(content, "select * from test_schema.test_model");
        Ok(())
    }
} 