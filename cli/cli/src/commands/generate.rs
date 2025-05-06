use anyhow::{anyhow, Context, Result};
use colored::*;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Duration;

use crate::utils::config::BusterConfig;
use crate::commands::init::{YamlModel, YamlSemanticLayerSpec, YamlDimension, YamlMeasure, is_measure_type};

use dbt_utils::models::{DbtCatalog, DbtNode, DbtColumn, DbtNodeMetadata, DbtCatalogMetadata};
use dbt_utils::{run_dbt_docs_generate, load_and_parse_catalog};

use indicatif::{ProgressBar, ProgressStyle};
use inquire::Confirm;
use glob::{Pattern};


pub async fn generate_semantic_models_command(
    path_arg: Option<String>,
    target_semantic_file_arg: Option<String>,
) -> Result<()> {
    println!(
        "{}",
        "Starting semantic model generation/update...".bold().blue()
    );

    // 1. Determine Buster configuration directory (where buster.yml is or should be)
    // For now, assume current directory. This might need to be more sophisticated if target_semantic_file_arg implies a different project.
    let buster_config_dir = std::env::current_dir().context("Failed to get current directory")?;

    // 2. Load BusterConfig
    let buster_config = match BusterConfig::load_from_dir(&buster_config_dir) {
        Ok(Some(cfg)) => cfg,
        Ok(None) => {
            return Err(anyhow!(
                "buster.yml not found in {}. Please run 'buster init' first or ensure buster.yml exists.",
                buster_config_dir.display()
            ));
        }
        Err(e) => {
            return Err(anyhow!("Failed to load buster.yml: {}. Please ensure it is correctly formatted.", e));
        }
    };

    // 3. Determine target semantic YAML file path
    let semantic_models_file_path_str = match target_semantic_file_arg {
        Some(path_str) => path_str,
        None => match buster_config.projects.as_ref().and_then(|projects| projects.first()) {
            Some(project) => project.semantic_models_file.clone().unwrap_or_else(|| "models.yml".to_string()),
            None => {
                return Err(anyhow!(
                    "No target semantic model file specified and 'semantic_models_file' not set in buster.yml. \nPlease use the --output-file option or configure buster.yml via 'buster init'."
                ));
            }
        }
    };
    // Resolve the path: if it's absolute, use it. If relative, resolve from buster_config_dir.
    let semantic_models_file_path = if Path::new(&semantic_models_file_path_str).is_absolute() {
        PathBuf::from(&semantic_models_file_path_str)
    } else {
        buster_config_dir.join(&semantic_models_file_path_str)
    };

    println!("Target semantic model file: {}", semantic_models_file_path.display().to_string().cyan());

    // 4. Load existing semantic models from the target file (if it exists)
    let mut existing_yaml_models_map: HashMap<String, YamlModel> = if semantic_models_file_path.exists() {
        println!("Loading existing semantic models from {}", semantic_models_file_path.display());
        let content = fs::read_to_string(&semantic_models_file_path)
            .with_context(|| format!("Failed to read existing semantic model file: {}", semantic_models_file_path.display()))?;
        
        if content.trim().is_empty() {
            println!("{}", "Existing semantic model file is empty.".yellow());
            HashMap::new()
        } else {
            let spec: YamlSemanticLayerSpec = serde_yaml::from_str(&content)
                .with_context(|| format!("Failed to parse existing semantic model file: {}. Ensure it is a valid YAML with a top-level 'models:' key.", semantic_models_file_path.display()))?;
            spec.models.into_iter().map(|m| (m.name.clone(), m)).collect()
        }
    } else {
        println!("{}", "No existing semantic model file found. Will generate a new one.".yellow());
        HashMap::new()
    };
    let initial_model_count = existing_yaml_models_map.len();

    // 5. Run dbt docs generate (similar to init.rs)
    let dbt_project_path = &buster_config_dir; // Assuming buster.yml is at the root of dbt project
    let catalog_json_path = dbt_project_path.join("target").join("catalog.json");

    if Confirm::new("Run 'dbt docs generate' to refresh dbt catalog (catalog.json)?")
        .with_default(true)
        .prompt()?
    {
        // Use the dbt_utils helper
        match run_dbt_docs_generate(dbt_project_path).await {
            Ok(_) => { /* Success is logged by the helper */ }
            Err(e) => {
                eprintln!("{}", format!("Failed to run 'dbt docs generate' via dbt_utils: {}. Proceeding with existing catalog.json if available.", e).yellow());
            }
        }
    } else {
         println!("{}", "Skipping 'dbt docs generate'. Will look for existing catalog.json.".dimmed());
    }

    // Load and parse catalog.json using dbt_utils helper
    let dbt_catalog = match load_and_parse_catalog(&catalog_json_path) {
        Ok(catalog) => {
            println!("{}", "✓ Successfully parsed catalog.json via dbt_utils.".green());
            catalog
        }
        Err(e) => {
             eprintln!("{}", format!("✗ Error loading/parsing catalog.json via dbt_utils: {}. Ensure catalog.json exists and is valid.", e).red());
            return Err(e.into()); // Propagate error if catalog loading fails
        }
    };

    // 7. Determine scope & reconcile
    // This is a placeholder for the detailed reconciliation logic
    // described in the plan (new models, updated models/columns, deleted models/columns)
    println!("{}", "Reconciling semantic models with dbt catalog...".yellow());

    // Collect model_paths from buster_config for scoping (similar to init.rs)
    let mut configured_model_path_patterns: Vec<Pattern> = Vec::new();
    if let Some(projects) = &buster_config.projects {
        for pc in projects {
            if let Some(model_paths) = &pc.model_paths {
                for path_str in model_paths {
                    let pattern_str = buster_config_dir.join(path_str).join("**").join("*.sql").to_string_lossy().into_owned();
                    match Pattern::new(&pattern_str) {
                        Ok(p) => configured_model_path_patterns.push(p),
                        Err(e) => eprintln!("{}", format!("Warning: Invalid glob pattern '{}': {}", pattern_str, e).yellow()),
                    }
                }
            }
        }
    }
    // Also consider top-level model_paths if no projects or for global scope
    if let Some(model_paths) = &buster_config.model_paths {
         for path_str in model_paths {
            let pattern_str = buster_config_dir.join(path_str).join("**").join("*.sql").to_string_lossy().into_owned();
            match Pattern::new(&pattern_str) {
                Ok(p) => configured_model_path_patterns.push(p),
                Err(e) => eprintln!("{}", format!("Warning: Invalid glob pattern '{}': {}", pattern_str, e).yellow()),
            }
        }
    }

    let mut dbt_models_processed_count = 0;
    let mut new_models_added_count = 0;
    let mut models_updated_count = 0;
    let mut columns_added_count = 0;
    let mut columns_updated_count = 0;
    let mut columns_removed_count = 0;

    let mut processed_dbt_model_names: HashSet<String> = HashSet::new();

    for (dbt_node_id, dbt_node) in dbt_catalog.nodes.iter().filter(|(_,n)| n.resource_type == "model") {
        let dbt_model_name = dbt_node.metadata.name.clone();
        processed_dbt_model_names.insert(dbt_model_name.clone());

        // --- Scoping logic --- Apply path_arg and configured_model_path_patterns ---
        let dbt_original_file_path_abs = buster_config_dir.join(&dbt_node.original_file_path);
        let is_in_configured_model_paths = configured_model_path_patterns.is_empty() || 
            configured_model_path_patterns.iter().any(|p| p.matches_path(&dbt_original_file_path_abs));

        let is_in_path_arg_scope = match &path_arg {
            Some(pa_str) => {
                let target_path_abs = buster_config_dir.join(pa_str);
                if target_path_abs.is_file() {
                    dbt_original_file_path_abs == target_path_abs
                } else { // Assume directory
                    dbt_original_file_path_abs.starts_with(&target_path_abs)
                }
            }
            None => true, // No path_arg, so all models (that match buster.yml model_paths) are in scope
        };

        if !is_in_configured_model_paths || !is_in_path_arg_scope {
            // println!("Skipping dbt model {} (not in scope of generate command or buster.yml model_paths)", dbt_model_name.dimmed());
            continue;
        }
        dbt_models_processed_count += 1;
        // --- End Scoping Logic ---

        match existing_yaml_models_map.get_mut(&dbt_model_name) {
            Some(mut existing_semantic_model) => {
                // Existing model: Update it
                let mut model_was_updated = false;
                println!("Updating existing semantic model: {}", dbt_model_name.cyan());

                // Update description if dbt comment exists and is different
                if let Some(dbt_comment) = &dbt_node.metadata.comment {
                    if existing_semantic_model.description.as_deref() != Some(dbt_comment.as_str()) {
                        println!("  Updating description for model {}", dbt_model_name);
                        existing_semantic_model.description = Some(dbt_comment.clone());
                        model_was_updated = true;
                    }
                } // If dbt_comment is None, we keep user's existing description

                // Update original_file_path
                if existing_semantic_model.original_file_path.as_deref() != Some(dbt_node.original_file_path.as_str()) {
                    existing_semantic_model.original_file_path = Some(dbt_node.original_file_path.clone());
                    model_was_updated = true;
                }

                // Update DB/Schema from dbt catalog if present
                // ... (add logic for database/schema update based on dbt_node.database/schema) ...

                // Reconcile columns
                let mut current_dims: Vec<YamlDimension> = Vec::new();
                let mut current_measures: Vec<YamlMeasure> = Vec::new();
                let mut dbt_columns_map: HashMap<String, &DbtColumn> = dbt_node.columns.values().map(|c| (c.name.clone(), c)).collect();

                // Process existing dimensions
                for existing_dim in std::mem::take(&mut existing_semantic_model.dimensions) {
                    if let Some(dbt_col) = dbt_columns_map.remove(&existing_dim.name) {
                        let mut updated_dim = existing_dim.clone();
                        let mut dim_updated = false;
                        if updated_dim.type_.as_deref() != Some(dbt_col.column_type.as_str()) {
                            updated_dim.type_ = Some(dbt_col.column_type.clone());
                            dim_updated = true; columns_updated_count +=1;
                        }
                        if let Some(dbt_col_comment) = &dbt_col.comment {
                            if updated_dim.description.as_deref() != Some(dbt_col_comment.as_str()) {
                                updated_dim.description = Some(dbt_col_comment.clone());
                                dim_updated = true; columns_updated_count +=1;
                            }
                        } // else keep user's existing_dim.description
                        current_dims.push(updated_dim);
                        if dim_updated { model_was_updated = true; }
                    } else {
                        println!("  Removing dimension '{}' from model '{}' (no longer in dbt model)", existing_dim.name.yellow(), dbt_model_name);
                        columns_removed_count += 1; model_was_updated = true;
                    }
                }
                // Process existing measures (similar logic)
                 for existing_measure in std::mem::take(&mut existing_semantic_model.measures) {
                    if let Some(dbt_col) = dbt_columns_map.remove(&existing_measure.name) {
                        let mut updated_measure = existing_measure.clone();
                        let mut measure_updated = false;
                        if updated_measure.type_.as_deref() != Some(dbt_col.column_type.as_str()) {
                            updated_measure.type_ = Some(dbt_col.column_type.clone());
                            measure_updated = true; columns_updated_count +=1;
                        }
                        if let Some(dbt_col_comment) = &dbt_col.comment {
                           if updated_measure.description.as_deref() != Some(dbt_col_comment.as_str()) {
                                updated_measure.description = Some(dbt_col_comment.clone());
                                measure_updated = true; columns_updated_count +=1;
                           }
                        } // else keep user's description
                        current_measures.push(updated_measure);
                        if measure_updated { model_was_updated = true; }
                    } else {
                        println!("  Removing measure '{}' from model '{}' (no longer in dbt model)", existing_measure.name.yellow(), dbt_model_name);
                        columns_removed_count += 1; model_was_updated = true;
                    }
                }

                // Add new columns from dbt_node not yet processed
                for (col_name, dbt_col) in dbt_columns_map {
                    println!("  Adding new column '{}' to model '{}'", col_name.green(), dbt_model_name);
                    if is_measure_type(&dbt_col.column_type) {
                        current_measures.push(YamlMeasure {
                            name: dbt_col.name.clone(),
                            description: dbt_col.comment.clone(),
                            type_: Some(dbt_col.column_type.clone()),
                        });
                    } else {
                        current_dims.push(YamlDimension {
                            name: dbt_col.name.clone(),
                            description: dbt_col.comment.clone(),
                            type_: Some(dbt_col.column_type.clone()),
                            searchable: false, // Default for new dimensions
                            options: None,
                        });
                    }
                    columns_added_count += 1; model_was_updated = true;
                }
                existing_semantic_model.dimensions = current_dims;
                existing_semantic_model.measures = current_measures;
                if model_was_updated { models_updated_count += 1; }
            }
            None => {
                // New model: Generate from scratch
                println!("Found new dbt model: {}. Generating semantic model definition.", dbt_model_name.green());
                let mut dimensions = Vec::new();
                let mut measures = Vec::new();
                for (_col_name, col) in &dbt_node.columns {
                    if is_measure_type(&col.column_type) {
                        measures.push(YamlMeasure { name: col.name.clone(), description: col.comment.clone(), type_: Some(col.column_type.clone()) });
                    } else {
                        dimensions.push(YamlDimension { name: col.name.clone(), description: col.comment.clone(), type_: Some(col.column_type.clone()), searchable: false, options: None });
                    }
                }
                let new_model = YamlModel {
                    name: dbt_model_name.clone(),
                    description: dbt_node.metadata.comment.clone(),
                    data_source_name: None, // Will be resolved by deploy or could use buster_config defaults
                    database: dbt_node.database.clone(),
                    schema: dbt_node.schema.clone(),
                    dimensions,
                    measures,
                    original_file_path: Some(dbt_node.original_file_path.clone()),
                };
                existing_yaml_models_map.insert(dbt_model_name, new_model);
                new_models_added_count += 1;
            }
        }
    }

    // Identify and remove models that are in semantic_models_file but no longer in dbt catalog (or not in scope)
    let mut removed_models_count = 0;
    existing_yaml_models_map.retain(|model_name: &String, _model: &mut YamlModel| {
        if processed_dbt_model_names.contains(model_name) {
            true
        } else {
            println!("Removing semantic model '{}' (no longer found in scoped dbt models or catalog.json)", model_name.red());
            removed_models_count += 1;
            false
        }
    });

    // 8. Save updated semantic models
    let final_models_vec: Vec<YamlModel> = existing_yaml_models_map.values().cloned().collect();
    let updated_spec = YamlSemanticLayerSpec { models: final_models_vec };
    
    let yaml_string = serde_yaml::to_string(&updated_spec).context("Failed to serialize updated semantic models to YAML")?;
    if let Some(parent_dir) = semantic_models_file_path.parent() {
        fs::create_dir_all(parent_dir).with_context(|| format!("Failed to create directory for semantic models file: {}", parent_dir.display()))?;
    }
    fs::write(&semantic_models_file_path, yaml_string).with_context(|| format!("Failed to write updated semantic models to {}", semantic_models_file_path.display()))?;

    println!("\n{}", "Semantic Model Generation Summary:".bold().green());
    println!("  Processed dbt models (in scope): {}", dbt_models_processed_count);
    println!("  Semantic models initially loaded: {}", initial_model_count);
    println!("  New semantic models added: {}", new_models_added_count.to_string().green());
    println!("  Existing semantic models updated: {}", models_updated_count.to_string().cyan());
    println!("  Semantic models removed (dbt model deleted/out of scope): {}", removed_models_count.to_string().red());
    println!("  Columns added: {}", columns_added_count.to_string().green());
    println!("  Columns updated (type/dbt_comment): {}", columns_updated_count.to_string().cyan());
    println!("  Columns removed: {}", columns_removed_count.to_string().red());
    println!("✓ Semantic models successfully updated at {}", semantic_models_file_path.display().to_string().green());

    Ok(())
} 