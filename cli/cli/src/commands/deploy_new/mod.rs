use anyhow::{anyhow, Result};
use std::path::{Path, PathBuf};

use crate::utils::{find_yml_files, ExclusionManager, ProgressTracker};
use crate::utils::{
    buster::{BusterClient, DeployDatasetsResponse},
    config::{BusterConfig, ProjectContext},
    file::buster_credentials::get_and_validate_buster_credentials,
};
use super::auth::check_authentication;

// Import the semantic layer models
use semantic_layer::models::{Model, SemanticLayerSpec};

#[cfg(test)]
mod integration_tests;

#[derive(Debug, Default)]
pub struct DeployResult {
    success: Vec<(String, String, String)>, // (filename, model_name, data_source)
    failures: Vec<(String, String, Vec<String>)>, // (filename, model_name, errors)
}

// Track mapping between files and their models
#[derive(Debug)]
struct ModelMapping {
    file: String,
    model_name: String,
}

#[derive(Debug)]
struct DeployProgress {
    total_files: usize,
    processed: usize,
    excluded: usize,
    current_file: String,
    status: String,
}

impl DeployProgress {
    fn new(total_files: usize) -> Self {
        Self {
            total_files,
            processed: 0,
            excluded: 0,
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

    fn log_validating(&self, validation_data: (&str, &str, &str)) {
        println!("\n🔍 Validating {}", validation_data.0);
        println!("   Data Source: {}", validation_data.1);
        println!("   Schema: {}", validation_data.2);
    }

    fn log_excluded(&mut self, reason: &str) {
        self.excluded += 1;
        println!("⚠️  Skipping {} ({})", self.current_file, reason);
    }

    fn log_summary(&self, result: &DeployResult) {
        // Print final summary with more details
        println!("\n📊 Deployment Summary");
        println!("==================");
        println!("✅ Successfully deployed: {} models", result.success.len());
        if self.excluded > 0 {
            println!(
                "⛔ Excluded: {} models (due to patterns or tags)",
                self.excluded
            );
        }
        if !result.success.is_empty() {
            println!("\nSuccessful deployments:");
            for (file, model_name, data_source) in &result.success {
                println!(
                    "   - {} (Model: {}, Data Source: {})",
                    file, model_name, data_source
                );
            }
        }

        if !result.failures.is_empty() {
            println!("\n❌ Failed deployments: {} models", result.failures.len());
            println!("\nFailures:");
            for (file, model_name, errors) in &result.failures {
                println!(
                    "   - {} (Model: {}, Errors: {})",
                    file,
                    model_name,
                    errors.join(", ")
                );
            }
        }
    }
}

// Implement ProgressTracker trait for DeployProgress
impl ProgressTracker for DeployProgress {
    fn log_excluded_file(&mut self, path: &str, pattern: &str) {
        self.excluded += 1;
        println!("⛔ Excluding file: {} (matched pattern: {})", path, pattern);
    }

    fn log_excluded_tag(&mut self, path: &str, tag: &str) {
        self.excluded += 1;
        println!(
            "⛔ Excluding file: {} (matched excluded tag: {})",
            path, tag
        );
    }
}

/// Parse a YAML model file into semantic_layer::Model structs
fn parse_model_file(file_path: &Path) -> Result<Vec<Model>> {
    let yml_content = std::fs::read_to_string(file_path)?;
    
    // First try parsing as a SemanticLayerSpec (with top-level 'models' key)
    match serde_yaml::from_str::<SemanticLayerSpec>(&yml_content) {
        Ok(spec) => {
            Ok(spec.models)
        },
        Err(_) => {
            // If that fails, try parsing as a single Model
            match serde_yaml::from_str::<Model>(&yml_content) {
                Ok(model) => Ok(vec![model]),
                Err(e) => Err(anyhow!("Failed to parse model file {}: {}", file_path.display(), e))
            }
        }
    }
}

/// Resolve configurations for a model using the precedence:
/// 1. Values in the model itself
/// 2. Values from the project context
/// 3. Values from the global config
fn resolve_model_configurations(
    models_with_context: Vec<(Model, Option<&ProjectContext>)>,
    global_buster_config: &BusterConfig,
) -> Result<Vec<Model>> {
    let mut resolved_models = Vec::new();

    for (mut model, proj_config_opt) in models_with_context {
        // Resolve data_source_name
        let resolved_ds_name = model.data_source_name.clone()
            .or_else(|| proj_config_opt.and_then(|pc| pc.data_source_name.clone()))
            .or_else(|| global_buster_config.data_source_name.clone());

        // Resolve schema
        let resolved_schema = model.schema.clone()
            .or_else(|| proj_config_opt.and_then(|pc| pc.schema.clone()))
            .or_else(|| global_buster_config.schema.clone());

        // Resolve database
        let resolved_database = model.database.clone()
            .or_else(|| proj_config_opt.and_then(|pc| pc.database.clone()))
            .or_else(|| global_buster_config.database.clone());

        // Validation: schema and data_source_name are essential for API processing
        if resolved_ds_name.is_none() {
            return Err(anyhow!(
                "Model '{}': data_source_name could not be resolved.", model.name
            ));
        }
        if resolved_schema.is_none() {
            return Err(anyhow!(
                "Model '{}': schema could not be resolved.", model.name
            ));
        }

        model.data_source_name = resolved_ds_name;
        model.schema = resolved_schema;
        model.database = resolved_database;

        // CLI Validations
        if model.name.is_empty() {
            return Err(anyhow!("Found a model with an empty name."));
        }

        resolved_models.push(model);
    }
    Ok(resolved_models)
}

/// Check if a file should be excluded based on tags in SQL content
fn check_excluded_tags(
    sql_path: &Option<PathBuf>,
    exclude_tags: &[String],
) -> Result<bool> {
    if exclude_tags.is_empty() || sql_path.is_none() {
        return Ok(false);
    }

    let sql_path = sql_path.as_ref().unwrap();
    if !sql_path.exists() {
        return Ok(false);
    }

    let content = std::fs::read_to_string(sql_path)?;

    // Create temporary exclusion manager just for tag checking
    let mut temp_config = BusterConfig {
        data_source_name: None,
        schema: None,
        database: None,
        exclude_files: None,
        exclude_tags: Some(exclude_tags.to_vec()),
        model_paths: None,
        projects: None,
    };

    let manager = ExclusionManager::new(&temp_config)?;
    let (should_exclude, _) = manager.should_exclude_by_tags(&content);

    Ok(should_exclude)
}

/// Find the associated SQL file for a model
fn find_sql_file(yml_path: &Path) -> Option<PathBuf> {
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

/// Generate default SQL content for a model when no SQL file is found
fn generate_default_sql(model: &Model) -> String {
    format!(
        "select * from {}.{}",
        model.schema.as_ref().map(String::as_str).unwrap_or(""),
        model.name
    )
}

/// Get SQL content for a model, either from the associated SQL file or generate a default
fn get_sql_content(model: &Model, sql_path: &Option<PathBuf>) -> Result<String> {
    if let Some(ref sql_path) = sql_path {
        Ok(std::fs::read_to_string(sql_path)?)
    } else {
        Ok(generate_default_sql(model))
    }
}

/// Convert the semantic_layer::Model to BusterClient's DeployDatasetsRequest
fn to_deploy_request(model: &Model, sql_content: String) -> crate::utils::buster::DeployDatasetsRequest {
    use crate::utils::buster::{DeployDatasetsRequest, DeployDatasetsColumnsRequest, DeployDatasetsEntityRelationshipsRequest};
    
    let mut columns = Vec::new();

    // Convert dimensions to columns
    for dim in &model.dimensions {
        columns.push(DeployDatasetsColumnsRequest {
            name: dim.name.clone(),
            description: dim.description.clone().unwrap_or_default(),
            semantic_type: Some("dimension".to_string()),
            expr: None, // dimension.expr is missing in the semantic model
            type_: dim.type_.clone(),
            agg: None,
            searchable: dim.searchable,
        });
    }

    // Convert measures to columns
    for measure in &model.measures {
        columns.push(DeployDatasetsColumnsRequest {
            name: measure.name.clone(),
            description: measure.description.clone().unwrap_or_default(),
            semantic_type: Some("measure".to_string()),
            expr: None, // measure.expr is missing in the semantic model
            type_: measure.type_.clone(),
            agg: None, // measure.agg is missing in the semantic model
            searchable: false,
        });
    }

    // Convert entity relationships
    let entity_relationships = model
        .relationships
        .iter()
        .map(|rel| DeployDatasetsEntityRelationshipsRequest {
            name: rel.name.clone(),
            expr: rel.foreign_key.clone(), // Using foreign_key as expr
            type_: rel.type_.clone().unwrap_or_default(),
        })
        .collect();

    // Unwrap with error if missing - this should never happen since we validate earlier
    let data_source_name = model.data_source_name.clone().expect("data_source_name missing after validation");
    let schema = model.schema.clone().expect("schema missing after validation");

    // Serialize to YAML for yml_file field
    let yml_content = serde_yaml::to_string(&model).unwrap_or_default();

    DeployDatasetsRequest {
        id: None,
        data_source_name,
        env: "dev".to_string(),
        type_: "view".to_string(),
        name: model.name.clone(),
        model: None, // This seems to be optional in the API
        schema,
        database: model.database.clone(),
        description: model.description.clone().unwrap_or_default(),
        sql_definition: Some(sql_content),
        entity_relationships: Some(entity_relationships),
        columns,
        yml_file: Some(yml_content),
    }
}

pub async fn deploy(path: Option<&str>, dry_run: bool, recursive: bool) -> Result<()> {
    check_authentication().await?;

    let current_dir = std::env::current_dir()?;
    let target_path = path
        .map(|p| PathBuf::from(p))
        .unwrap_or_else(|| current_dir);
    let mut progress = DeployProgress::new(0);
    let mut result = DeployResult::default();

    // Only create client if not in dry-run mode
    let client = if !dry_run {
        // Create API client without explicit auth check
        let creds = get_and_validate_buster_credentials().await?;
        Some(BusterClient::new(creds.url, creds.api_key)?)
    } else {
        None
    };

    // Try to load buster.yml first
    progress.status = "Looking for buster.yml configuration...".to_string();
    progress.log_progress();

    let config = match BusterConfig::load_from_dir(&target_path) {
        Ok(Some(config)) => {
            println!("✅ Found buster.yml configuration");
            if let Some(ds) = &config.data_source_name {
                println!("   - Default data source: {}", ds);
            }
            if let Some(schema) = &config.schema {
                println!("   - Default schema: {}", schema);
            }
            if let Some(database) = &config.database {
                println!("   - Default database: {}", database);
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

    let exclusion_manager = if let Some(cfg) = &config {
        ExclusionManager::new(cfg)?
    } else {
        ExclusionManager::empty()
    };

    // Get model files based on config
    let yml_files = if let Some(cfg) = &config {
        // Get effective search paths with their project contexts
        let effective_paths = cfg.resolve_effective_model_paths(&target_path);
        
        if !effective_paths.is_empty() {
            // Log the paths we're going to search
            println!("ℹ️  Using effective model paths from buster.yml:");
            for (path, project_ctx) in &effective_paths {
                if let Some(project) = project_ctx {
                    println!("   - {} (from project: {})", path.display(), project.identifier());
                } else {
                    println!("   - {} (from global configuration)", path.display());
                }
            }
            
            // Find yml files in all paths
            let mut all_files = Vec::new();
            
            for (path, _project_ctx) in effective_paths {
                if path.is_dir() {
                    println!("   Scanning directory: {}", path.display());
                    let files = find_yml_files(&path, recursive, &exclusion_manager, Some(&mut progress))?;
                    println!("   Found {} model files in {}", files.len(), path.display());
                    all_files.extend(files);
                } else if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("yml") {
                    if path.file_name().and_then(|name| name.to_str()) != Some("buster.yml") {
                        println!("   Using direct model file: {}", path.display());
                        all_files.push(path);
                    }
                } else {
                    println!("   Path not found or not a valid directory/file: {}", path.display());
                }
            }
            
            all_files
        } else {
            // Fallback to target path
            println!("No model paths found in buster.yml configuration, using target path");
            find_yml_files(&target_path, recursive, &exclusion_manager, Some(&mut progress))?
        }
    } else {
        // No config, use target path
        println!("No buster.yml found, searching in target path");
        find_yml_files(&target_path, recursive, &exclusion_manager, Some(&mut progress))?
    };

    println!(
        "Found {} model files in {}",
        yml_files.len(),
        target_path.display()
    );
    progress.total_files = yml_files.len();

    // Initialize vectors to store processed models and their mappings
    let mut deploy_requests = Vec::new();
    let mut model_mappings = Vec::new();

    // Process each file
    for yml_path in yml_files {
        progress.processed += 1;
        progress.current_file = yml_path
            .strip_prefix(&target_path)
            .unwrap_or(&yml_path)
            .to_string_lossy()
            .to_string();

        progress.status = "Loading model file...".to_string();
        progress.log_progress();

        // Parse the model file
        let parsed_models = match parse_model_file(&yml_path) {
            Ok(models) => models,
            Err(e) => {
                progress.log_error(&format!("Failed to parse model file: {}", e));
                result.failures.push((
                    progress.current_file.clone(),
                    "unknown".to_string(),
                    vec![format!("Failed to parse model file: {}", e)],
                ));
                continue;
            }
        };

        // Find the associated SQL file
        let sql_path = find_sql_file(&yml_path);

        // Check for excluded tags if we have SQL content
        if let Some(ref cfg) = config {
            if let Some(ref exclude_tags) = cfg.exclude_tags {
                if !exclude_tags.is_empty() {
                    match check_excluded_tags(&sql_path, exclude_tags) {
                        Ok(true) => {
                            // Model has excluded tag, skip it
                            let tag_info = exclude_tags.join(", ");
                            progress.log_excluded(&format!(
                                "Skipping model due to excluded tag(s): {}",
                                tag_info
                            ));
                            continue;
                        }
                        Err(e) => {
                            progress.log_error(&format!("Error checking tags: {}", e));
                        }
                        _ => {}
                    }
                }
            }
        }

        // Determine project context for this file
        let project_context = if let Some(ref cfg) = config {
            if let Some(yml_dir) = yml_path.parent() {
                cfg.get_context_for_path(&yml_path, yml_dir)
            } else {
                None
            }
        } else {
            None
        };

        // Resolve configurations for each model
        let mut models_with_context = Vec::new();
        for model in parsed_models {
            models_with_context.push((model, project_context));
        }

        let resolved_models = match resolve_model_configurations(
            models_with_context, 
            config.as_ref().unwrap_or(&BusterConfig::default())
        ) {
            Ok(models) => models,
            Err(e) => {
                progress.log_error(&format!("Configuration resolution failed: {}", e));
                result.failures.push((
                    progress.current_file.clone(),
                    "multiple".to_string(),
                    vec![format!("Configuration resolution failed: {}", e)],
                ));
                continue;
            }
        };

        // Process each resolved model
        for model in resolved_models {
            // Get SQL content
            let sql_content = match get_sql_content(&model, &sql_path) {
                Ok(content) => content,
                Err(e) => {
                    progress.log_error(&format!("Failed to read SQL content: {}", e));
                    result.failures.push((
                        progress.current_file.clone(),
                        model.name.clone(),
                        vec![format!("Failed to read SQL content: {}", e)],
                    ));
                    continue;
                }
            };

            // Track model mapping
            model_mappings.push(ModelMapping {
                file: progress.current_file.clone(),
                model_name: model.name.clone(),
            });

            // Create deploy request
            deploy_requests.push(to_deploy_request(&model, sql_content));
        }

        progress.log_success();
    }

    // Deploy to API if we have valid models and not in dry-run mode
    if !deploy_requests.is_empty() {
        if dry_run {
            println!("\n🔍 Dry run mode - validation successful!");
            println!("\n📦 Would deploy {} models:", deploy_requests.len());
            for request in &deploy_requests {
                println!("   - Model: {} ", request.name);
                println!(
                    "     Data Source: {} (env: {})",
                    request.data_source_name, request.env
                );
                println!("     Schema: {}", request.schema);
                if let Some(database) = &request.database {
                    println!("     Database: {}", database);
                }
                println!("     Columns: {}", request.columns.len());
                if let Some(rels) = &request.entity_relationships {
                    println!("     Relationships: {}", rels.len());
                }
            }
            return Ok(());
        }

        let client =
            client.expect("BusterClient should be initialized for non-dry-run deployments");
        progress.status = "Deploying models to Buster...".to_string();
        progress.log_progress();

        // Store data source name for error messages
        let data_source_name = deploy_requests[0].data_source_name.clone();

        // Log what we're trying to deploy
        println!("\n📦 Deploying {} models:", deploy_requests.len());
        for request in &deploy_requests {
            println!("   - Model: {} ", request.name);
            println!(
                "     Data Source: {} (env: {})",
                request.data_source_name, request.env
            );
            println!("     Schema: {}", request.schema);
            if let Some(database) = &request.database {
                println!("     Database: {}", database);
            }
            println!("     Columns: {}", request.columns.len());
            if let Some(rels) = &request.entity_relationships {
                println!("     Relationships: {}", rels.len());
            }
        }

        match client.deploy_datasets(deploy_requests).await {
            Ok(response) => handle_deploy_response(&response, &mut result, &model_mappings, &progress),
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
                return Err(anyhow!(
                    "Failed to deploy models to Buster: {}",
                    e
                ));
            }
        }
    }

    // Report deployment results and return
    progress.log_summary(&result);

    if !result.failures.is_empty() {
        return Err(anyhow!("Some models failed to deploy"));
    }

    Ok(())
}

/// Helper function to handle the deployment response
fn handle_deploy_response(
    response: &DeployDatasetsResponse,
    result: &mut DeployResult,
    model_mappings: &[ModelMapping],
    progress: &DeployProgress,
) {
    let mut has_validation_errors = false;

    // Process validation results
    for validation in &response.results {
        // Find corresponding file from model mapping
        let file = model_mappings
            .iter()
            .find(|m| m.model_name == validation.model_name)
            .map(|m| m.file.clone())
            .unwrap_or_else(|| "unknown".to_string());

        if validation.success {
            progress.log_validating((&validation.model_name, &validation.data_source_name, &validation.schema));
            println!("\n✅ Validation passed for {}", validation.model_name);
            println!("   Data Source: {}", validation.data_source_name);
            println!("   Schema: {}", validation.schema);
            
            result.success.push((
                file,
                validation.model_name.clone(),
                validation.data_source_name.clone(),
            ));
        } else {
            has_validation_errors = true;
            
            println!("\n❌ Validation failed for {}", validation.model_name);
            println!("   Data Source: {}", validation.data_source_name);
            println!("   Schema: {}", validation.schema);

            if !validation.errors.is_empty() {
                println!("\nErrors:");
                for error in &validation.errors {
                    println!("   - {:?}: {}", error.error_type, error.message);
                    if let Some(col) = &error.column_name {
                        println!("     Column: {}", col);
                    }
                }

                // Print suggestions if any
                let suggestions: Vec<_> = validation
                    .errors
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

            // Collect all error messages
            let error_messages: Vec<String> = validation
                .errors
                .iter()
                .map(|e| e.message.clone())
                .collect();

            result
                .failures
                .push((file, validation.model_name.clone(), error_messages));
        }
    }

    if has_validation_errors {
        println!("\n❌ Deployment failed due to validation errors!");
        println!("\n💡 Troubleshooting:");
        println!("1. Check data source");
        println!("2. Check model definitions");
        println!("3. Check relationships");
    } else {
        println!("\n✅ All models deployed successfully!");
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

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

    #[test]
    fn test_parse_model_file() -> Result<()> {
        let temp_dir = TempDir::new()?;
        
        // Test single model YAML
        let single_model_yml = r#"
name: test_model
description: "Test model"
dimensions:
  - name: dim1
    description: "First dimension"
    type: "string"
measures:
  - name: measure1
    description: "First measure"
    type: "number"
        "#;
        
        let single_model_path = temp_dir.path().join("single_model.yml");
        fs::write(&single_model_path, single_model_yml)?;
        
        let models = parse_model_file(&single_model_path)?;
        assert_eq!(models.len(), 1);
        assert_eq!(models[0].name, "test_model");
        
        // Test multi-model YAML
        let multi_model_yml = r#"
models:
  - name: model1
    description: "First model"
    dimensions:
      - name: dim1
        description: "First dimension"
        type: "string"
  - name: model2
    description: "Second model"
    measures:
      - name: measure1
        description: "First measure"
        type: "number"
        "#;
        
        let multi_model_path = temp_dir.path().join("multi_model.yml");
        fs::write(&multi_model_path, multi_model_yml)?;
        
        let models = parse_model_file(&multi_model_path)?;
        assert_eq!(models.len(), 2);
        assert_eq!(models[0].name, "model1");
        assert_eq!(models[1].name, "model2");
        
        Ok(())
    }

    #[test]
    fn test_resolve_model_configurations() -> Result<()> {
        // Create test models
        let model1 = Model {
            name: "model1".to_string(),
            description: Some("Model 1".to_string()),
            data_source_name: Some("model1_ds".to_string()),
            database: None,
            schema: None,
            dimensions: vec![],
            measures: vec![],
            metrics: vec![],
            filters: vec![],
            relationships: vec![],
        };
        
        let model2 = Model {
            name: "model2".to_string(),
            description: Some("Model 2".to_string()),
            data_source_name: None,
            database: Some("model2_db".to_string()),
            schema: None,
            dimensions: vec![],
            measures: vec![],
            metrics: vec![],
            filters: vec![],
            relationships: vec![],
        };
        
        let model3 = Model {
            name: "model3".to_string(),
            description: Some("Model 3".to_string()),
            data_source_name: None,
            database: None,
            schema: None,
            dimensions: vec![],
            measures: vec![],
            metrics: vec![],
            filters: vec![],
            relationships: vec![],
        };
        
        // Create project context
        let project_context = ProjectContext {
            path: "project".to_string(),
            data_source_name: Some("project_ds".to_string()),
            schema: Some("project_schema".to_string()),
            database: None,
            exclude_files: None,
            exclude_tags: None,
            model_paths: None,
            name: Some("Test Project".to_string()),
        };
        
        // Create global config
        let global_config = BusterConfig {
            data_source_name: Some("global_ds".to_string()),
            schema: Some("global_schema".to_string()),
            database: Some("global_db".to_string()),
            exclude_files: None,
            exclude_tags: None,
            model_paths: None,
            projects: None,
        };
        
        // Test resolution
        let models_with_context = vec![
            (model1, Some(&project_context)),
            (model2, Some(&project_context)),
            (model3, None),
        ];
        
        let resolved_models = resolve_model_configurations(models_with_context, &global_config)?;
        
        // Verify model1 keeps its own data_source_name but inherits schema from project
        assert_eq!(resolved_models[0].data_source_name, Some("model1_ds".to_string()));
        assert_eq!(resolved_models[0].schema, Some("project_schema".to_string()));
        assert_eq!(resolved_models[0].database, Some("global_db".to_string()));
        
        // Verify model2 inherits data_source_name from project but keeps its own database
        assert_eq!(resolved_models[1].data_source_name, Some("project_ds".to_string()));
        assert_eq!(resolved_models[1].schema, Some("project_schema".to_string()));
        assert_eq!(resolved_models[1].database, Some("model2_db".to_string()));
        
        // Verify model3 inherits everything from global config
        assert_eq!(resolved_models[2].data_source_name, Some("global_ds".to_string()));
        assert_eq!(resolved_models[2].schema, Some("global_schema".to_string()));
        assert_eq!(resolved_models[2].database, Some("global_db".to_string()));
        
        Ok(())
    }

    #[test]
    fn test_to_deploy_request() -> Result<()> {
        let model = Model {
            name: "test_model".to_string(),
            description: Some("Test model".to_string()),
            data_source_name: Some("test_source".to_string()),
            database: Some("test_db".to_string()),
            schema: Some("test_schema".to_string()),
            dimensions: vec![
                semantic_layer::models::Dimension {
                    name: "dim1".to_string(),
                    description: Some("First dimension".to_string()),
                    type_: Some("string".to_string()),
                    searchable: false,
                    options: None,
                }
            ],
            measures: vec![
                semantic_layer::models::Measure {
                    name: "measure1".to_string(),
                    description: Some("First measure".to_string()),
                    type_: Some("number".to_string()),
                }
            ],
            metrics: vec![],
            filters: vec![],
            relationships: vec![
                semantic_layer::models::Relationship {
                    name: "related_model".to_string(),
                    primary_key: "id".to_string(),
                    foreign_key: "related_id".to_string(),
                    type_: Some("LEFT".to_string()),
                    cardinality: Some("one-to-many".to_string()),
                    description: Some("Relationship to another model".to_string()),
                }
            ],
        };
        
        let sql_content = "SELECT * FROM test_schema.test_model";
        
        let request = to_deploy_request(&model, sql_content.to_string());
        
        // Verify request fields
        assert_eq!(request.name, "test_model");
        assert_eq!(request.data_source_name, "test_source");
        assert_eq!(request.schema, "test_schema");
        assert_eq!(request.database, Some("test_db".to_string()));
        assert_eq!(request.description, "Test model");
        assert_eq!(request.sql_definition, Some(sql_content.to_string()));
        
        // Verify columns
        assert_eq!(request.columns.len(), 2);
        assert_eq!(request.columns[0].name, "dim1");
        assert_eq!(request.columns[0].semantic_type, Some("dimension".to_string()));
        assert_eq!(request.columns[0].type_, Some("string".to_string()));
        
        assert_eq!(request.columns[1].name, "measure1");
        assert_eq!(request.columns[1].semantic_type, Some("measure".to_string()));
        assert_eq!(request.columns[1].type_, Some("number".to_string()));
        
        // Verify relationships
        assert!(request.entity_relationships.is_some());
        let rels = request.entity_relationships.as_ref().unwrap();
        assert_eq!(rels.len(), 1);
        assert_eq!(rels[0].name, "related_model");
        assert_eq!(rels[0].expr, "related_id");
        assert_eq!(rels[0].type_, "LEFT");
        
        Ok(())
    }
}