use anyhow::{Result, anyhow};
use std::path::{Path, PathBuf};
use colored::*;

use crate::utils::{
    config::{BusterConfig, ProjectContext},
    find_yml_files, ExclusionManager,
    // Assuming ProgressTracker might be useful for logging, similar to deploy
    // If not, it can be removed.
    ProgressTracker,
};
use crate::commands::deploy::deploy::{parse_model_file, resolve_model_configurations};
use semantic_layer::models::Model;

// A simple progress tracker for the parse command
#[derive(Debug, Default)]
struct ParseProgress {
    total_files: usize,
    processed_files: usize,
    excluded_files: usize,
    current_file: String,
    errors: Vec<(String, String, Vec<String>)>, // file, model_name, errors
    successes: Vec<(String, String)>, // file, model_name
}

impl ParseProgress {
    fn new() -> Self {
        Default::default()
    }

    fn log_status(&self) {
        if !self.current_file.is_empty() {
            println!("Processing [{} / {}]: {}", self.processed_files, self.total_files, self.current_file);
        }
    }

    fn log_summary(&self) {
        println!("\n--- Parse Summary ---");
        println!("Total files processed: {}", self.processed_files);
        println!("Total files excluded: {}", self.excluded_files);
        println!("Models successfully parsed & validated: {}", self.successes.len());
        println!("Models with errors: {}", self.errors.len());

        if !self.successes.is_empty() {
            println!("\nSuccessfully parsed models:");
            for (file, model_name) in &self.successes {
                println!("  - {} (in file: {})", model_name.green(), file.dimmed());
            }
        }

        if !self.errors.is_empty() {
            println!("\nModels with errors:");
            for (file, model_name, errors) in &self.errors {
                println!("  - {} (in file: {}):", model_name.red(), file.dimmed());
                for error in errors {
                    println!("    - {}", error);
                }
            }
        }
        println!("---------------------");
    }
}

impl ProgressTracker for ParseProgress {
    fn log_excluded_file(&mut self, path: &str, pattern: &str) {
        self.excluded_files += 1;
        println!("Excluding file: {} (matched pattern: {})", path, pattern);
    }

    fn log_excluded_tag(&mut self, path: &str, tag: &str) {
        self.excluded_files += 1;
        println!(
            "Excluding file: {} (matched excluded tag: {})",
            path,
            tag
        );
    }
}

pub async fn parse_models_command(path_arg: Option<String>) -> Result<()> {
    let current_dir = std::env::current_dir()?;
    let buster_config_load_dir = path_arg.as_ref().map(PathBuf::from).unwrap_or_else(|| current_dir.clone());

    let mut progress = ParseProgress::new();

    println!("Looking for buster.yml configuration...");
    let buster_config = match BusterConfig::load_from_dir(&buster_config_load_dir) {
        Ok(Some(cfg)) => {
            println!("Found buster.yml configuration at {}", buster_config_load_dir.join("buster.yml").display());
            Some(cfg)
        }
        Ok(None) => {
            println!("No buster.yml found in {}, will parse files directly or use defaults.", buster_config_load_dir.display());
            None
        }
        Err(e) => {
            println!("Warning: Error reading buster.yml: {}. Proceeding without it.", e);
            None
        }
    };

    let effective_buster_config_dir = BusterConfig::base_dir(&buster_config_load_dir.join("buster.yml")).unwrap_or(buster_config_load_dir.clone());
    
    let exclusion_manager = if let Some(cfg) = &buster_config {
        ExclusionManager::new(cfg)?
    } else {
        ExclusionManager::empty()
    };

    // Determine search paths
    let mut files_to_parse_with_context: Vec<(PathBuf, Option<&ProjectContext>)> = Vec::new();

    if let Some(p_str) = &path_arg {
        // If a specific path is given, use it directly.
        // It could be a file or a directory.
        let specific_path = effective_buster_config_dir.join(p_str);
        println!("Processing specified path: {}", specific_path.display());
        if specific_path.is_dir() {
            match find_yml_files(&specific_path, true, &exclusion_manager, Some(&mut progress)) { // Assuming recursive
                Ok(files_in_dir) => {
                    for f in files_in_dir {
                         // For direct path, we don't have a specific project context from buster.yml easily
                        files_to_parse_with_context.push((f, None));
                    }
                },
                Err(e) => eprintln!("Error finding YML files in {}: {}", specific_path.display(), format!("{}", e).red()),
            }
        } else if specific_path.is_file() && specific_path.extension().and_then(|ext| ext.to_str()) == Some("yml") {
            if specific_path.file_name().and_then(|name| name.to_str()) != Some("buster.yml") {
                files_to_parse_with_context.push((specific_path, None));
            }
        } else if !specific_path.exists() {
            return Err(anyhow!("Specified path does not exist: {}", specific_path.display()));
        } else {
            return Err(anyhow!("Specified path is not a valid .yml file or directory: {}", specific_path.display()));
        }
    } else {
        // No specific path, use buster_config (if available) or current directory
        if let Some(cfg) = &buster_config {
            let effective_paths_with_contexts = cfg.resolve_effective_model_paths(&effective_buster_config_dir);
            if !effective_paths_with_contexts.is_empty() {
                println!("Using effective model paths from buster.yml:");
                for (path, project_ctx_opt) in effective_paths_with_contexts {
                    let context_identifier = project_ctx_opt.map_or_else(|| "Global/Default".to_string(), |ctx| ctx.identifier());
                     println!("  - Path: {}, Context: {}", path.display(), context_identifier.dimmed());
                    if path.is_dir() {
                        match find_yml_files(&path, true, &exclusion_manager, Some(&mut progress)) { // Assuming recursive
                            Ok(files_in_dir) => {
                                for f in files_in_dir {
                                    files_to_parse_with_context.push((f, project_ctx_opt));
                                }
                            },
                            Err(e) => eprintln!("Error finding YML files in {}: {}", path.display(), format!("{}", e).red()),
                        }
                    } else if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("yml") {
                         if path.file_name().and_then(|name| name.to_str()) != Some("buster.yml") {
                            files_to_parse_with_context.push((path.clone(), project_ctx_opt));
                        }
                    }
                }
            } else {
                 println!("No model_paths specified in buster.yml, scanning current directory: {}", effective_buster_config_dir.display());
                 match find_yml_files(&effective_buster_config_dir, true, &exclusion_manager, Some(&mut progress)) {
                    Ok(files_in_dir) => {
                        for f in files_in_dir {
                            files_to_parse_with_context.push((f, None)); // No specific project context for CWD scan unless we enhance this
                        }
                    },
                    Err(e) => eprintln!("Error finding YML files in {}: {}", effective_buster_config_dir.display(), format!("{}", e).red()),
                }
            }
        } else {
            // No buster.yml and no path_arg, scan current directory.
            println!("No buster.yml found and no specific path provided. Scanning current directory: {}", effective_buster_config_dir.display());
            match find_yml_files(&effective_buster_config_dir, true, &exclusion_manager, Some(&mut progress)) {
                Ok(files_in_dir) => {
                    for f in files_in_dir {
                        files_to_parse_with_context.push((f, None));
                    }
                },
                Err(e) => eprintln!("Error finding YML files in {}: {}", effective_buster_config_dir.display(), format!("{}", e).red()),
            }
        }
    }

    progress.total_files = files_to_parse_with_context.len();
    println!("Found {} model .yml file(s) to parse.", progress.total_files);

    if files_to_parse_with_context.is_empty() {
        println!("No model files found to parse.");
        progress.log_summary();
        return Ok(());
    }

    let default_cfg_storage;
    let global_config_for_resolution = match buster_config.as_ref() {
        Some(cfg) => cfg,
        None => {
            default_cfg_storage = BusterConfig::default();
            &default_cfg_storage
        }
    };

    for (yml_path, project_ctx_opt) in files_to_parse_with_context {
        progress.processed_files += 1;
        progress.current_file = yml_path.strip_prefix(&effective_buster_config_dir).unwrap_or(&yml_path).to_string_lossy().into_owned();
        progress.log_status();

        let parsed_models_result = parse_model_file(&yml_path);
        
        match parsed_models_result {
            Ok(parsed_models) => {
                let models_with_context: Vec<(Model, Option<&ProjectContext>)> = parsed_models.into_iter()
                    .map(|m| (m, project_ctx_opt))
                    .collect();

                match resolve_model_configurations(models_with_context, global_config_for_resolution) {
                    Ok(resolved_models) => {
                        if resolved_models.is_empty() && !yml_path.to_string_lossy().contains("empty_test") { // Guard against empty files unless for specific tests
                             println!("Warning: No models found in file: {}", yml_path.display());
                             // Potentially add to errors if this is unexpected
                        }
                        for model in resolved_models {
                            // Basic validation: model name should not be empty
                            if model.name.is_empty() {
                                progress.errors.push((
                                    progress.current_file.clone(),
                                    "<Unnamed Model>".to_string(),
                                    vec!["Model name is empty.".to_string()],
                                ));
                                continue;
                            }
                            // Further validation could be added here, e.g., checking for data_source_name and schema after resolution
                            if model.data_source_name.is_none() {
                                progress.errors.push((
                                    progress.current_file.clone(),
                                    model.name.clone(),
                                    vec!["data_source_name could not be resolved.".to_string()],
                                ));
                            }
                            if model.schema.is_none() {
                                progress.errors.push((
                                    progress.current_file.clone(),
                                    model.name.clone(),
                                    vec!["schema could not be resolved.".to_string()],
                                ));
                            }

                            // If previous checks created errors for this model, don't mark as success.
                            // Check if current_file and model.name combination is already in errors.
                            let is_error = progress.errors.iter().any(|(f, m, _)| f == &progress.current_file && m == &model.name);
                            if !is_error {
                                println!("  Successfully parsed and resolved model: {}", model.name.green());
                                progress.successes.push((progress.current_file.clone(), model.name.clone()));
                            }
                        }
                    }
                    Err(e) => {
                        println!("  Error resolving configurations for models in {}: {}", yml_path.display(), e.to_string().red());
                        // Attempt to identify model names if possible, otherwise use file name
                        // This part is tricky as parsing might have succeeded but resolution failed for all.
                        // For now, associating error with the file.
                        progress.errors.push((
                            progress.current_file.clone(),
                            format!("File-level resolution error"), 
                            vec![e.to_string()]
                        ));
                    }
                }
            }
            Err(e) => {
                println!("  Error parsing model file {}: {}", yml_path.display(), e.to_string().red());
                progress.errors.push((
                    progress.current_file.clone(),
                    "<Parse Error>".to_string(),
                    vec![e.to_string()],
                ));
            }
        }
    }

    progress.log_summary();

    if !progress.errors.is_empty() {
        return Err(anyhow!("Found errors during parsing and validation. Please check the output above."));
    }

    Ok(())
} 