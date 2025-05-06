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
    target_output_dir_arg: Option<String>,
) -> Result<()> {
    println!(
        "{}",
        "Starting semantic model generation/update...".bold().blue()
    );

    // 1. Determine Buster configuration directory (where buster.yml is or should be)
    // For now, assume current directory. This might need to be more sophisticated if target_output_dir_arg implies a different project.
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

    // 3. Determine target semantic YAML base directory and generation mode
    let mut is_side_by_side_generation = false;
    let effective_semantic_models_base_dir: PathBuf; // Base for path construction

    if let Some(path_str) = target_output_dir_arg {
        // User specified an output directory via CLI arg. Not side-by-side.
        effective_semantic_models_base_dir = if Path::new(&path_str).is_absolute() { 
            PathBuf::from(path_str) 
        } else { 
            buster_config_dir.join(path_str) 
        };
        println!("Target semantic models base directory (from CLI arg): {}", effective_semantic_models_base_dir.display().to_string().cyan());
        fs::create_dir_all(&effective_semantic_models_base_dir).with_context(|| format!("Failed to create semantic models base directory: {}", effective_semantic_models_base_dir.display()))?;
    } else {
        // No CLI arg, check buster.yml config
        let configured_semantic_paths = buster_config.projects.as_ref()
            .and_then(|projs| projs.first())
            .and_then(|proj| proj.semantic_model_paths.as_ref());

        if configured_semantic_paths.map_or(true, |paths| paths.is_empty()) { // Default to side-by-side if None or empty list
            is_side_by_side_generation = true;
            effective_semantic_models_base_dir = buster_config_dir.clone(); // Project root is the base for side-by-side
            println!("Semantic models will be generated side-by-side with SQL models (base: {}).", effective_semantic_models_base_dir.display().to_string().cyan());
            // No specific single base directory to create for all YAMLs in this mode.
        } else {
            // Configured path(s) exist, use the first one. Not side-by-side.
            let first_path_str = configured_semantic_paths.unwrap().first().unwrap(); // Safe due to map_or and is_empty checks
            effective_semantic_models_base_dir = if Path::new(first_path_str).is_absolute() { 
                PathBuf::from(first_path_str) 
            } else { 
                buster_config_dir.join(first_path_str) 
            };
            println!("Target semantic models base directory (from buster.yml): {}", effective_semantic_models_base_dir.display().to_string().cyan());
            fs::create_dir_all(&effective_semantic_models_base_dir).with_context(|| format!("Failed to create semantic models base directory: {}", effective_semantic_models_base_dir.display()))?;
        }
    }

    // 4. Load existing semantic models - THIS LOGIC WILL CHANGE SIGNIFICANTLY.
    // For now, we clear it as we load 1-to-1.
    let mut existing_yaml_models_map: HashMap<String, YamlModel> = HashMap::new();

    let initial_model_count = 0; // This will be re-evaluated based on files found

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

    let mut processed_dbt_model_unique_ids: HashSet<String> = HashSet::new(); // Using unique_id for tracking

    // Get dbt model source roots for path stripping (similar to init.rs)
    let dbt_project_file_content_for_paths = crate::commands::init::parse_dbt_project_file_content(&buster_config_dir)?;
    let dbt_model_source_roots: Vec<PathBuf> = dbt_project_file_content_for_paths.as_ref()
        .map(|content| content.model_paths.iter().map(PathBuf::from).collect())
        .unwrap_or_else(|| vec![PathBuf::from("models")]);

    for (dbt_node_id, dbt_node) in dbt_catalog.nodes.iter().filter(|(_,n)| {
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
        // Path construction for individual YAML
        let Some(ref dbt_original_file_path_str) = dbt_node.original_file_path else {
            eprintln!("{}", format!("Warning: Skipping dbt model {} due to missing 'original_file_path'.", dbt_node.unique_id).yellow());
            continue;
        };

        let dbt_model_path_obj = Path::new(dbt_original_file_path_str);
        let mut relative_to_dbt_model_root = PathBuf::new();
        let mut found_base_for_stripping = false;
        for dbt_source_root in &dbt_model_source_roots { // dbt_source_root is e.g. "models"
            if let Ok(stripped_path) = dbt_model_path_obj.strip_prefix(dbt_source_root) {
                relative_to_dbt_model_root = stripped_path.to_path_buf(); // e.g. "marts/sales/revenue.sql"
                found_base_for_stripping = true;
                break;
            }
        }
        if !found_base_for_stripping {
            // Fallback: if original_file_path_str didn't start with any known dbt_model_source_roots,
            // then use original_file_path_str as is for the suffix part for dedicated dir mode.
            // For side-by-side, the full original path is used anyway.
            relative_to_dbt_model_root = dbt_model_path_obj.to_path_buf();
            eprintln!("{}", format!(
                    "Warning: Could not strip a known dbt model source root ('{:?}') from dbt model path '{}'. Using full path for suffix calculation: '{}'", 
                    dbt_model_source_roots, dbt_original_file_path_str, relative_to_dbt_model_root.display()
                ).yellow()
            );
        }
        
        let individual_semantic_yaml_path: PathBuf;
        if is_side_by_side_generation {
            // Side-by-side: YAML is next to SQL. dbt_original_file_path_str is relative to buster_config_dir.
            individual_semantic_yaml_path = buster_config_dir.join(dbt_original_file_path_str).with_extension("yml");
        } else {
            // Dedicated output directory (effective_semantic_models_base_dir)
            // relative_to_dbt_model_root is the path part after the dbt model source root (e.g. "marts/sales/revenue.sql")
            let yaml_filename_with_subdir = relative_to_dbt_model_root.with_extension("yml"); // e.g. "marts/sales/revenue.yml"
            individual_semantic_yaml_path = effective_semantic_models_base_dir.join(yaml_filename_with_subdir);
        }

        processed_dbt_model_unique_ids.insert(dbt_node.unique_id.clone()); // Store unique_id

        // --- Scoping logic (remains similar, but applied before file load) ---
        let dbt_original_file_path_abs = buster_config_dir.join(dbt_original_file_path_str);
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
            None => true, 
        };

        if !is_in_configured_model_paths || !is_in_path_arg_scope {
            continue;
        }

        // Ensure metadata.name exists, as it's crucial for the semantic model name
        let Some(ref dbt_model_name_for_yaml_from_metadata) = dbt_node.metadata.name else {
            eprintln!(
                "{}",
                format!(
                    "Warning: Skipping dbt model with unique_id: {} because its 'metadata.name' is missing in catalog.json.",
                    dbt_node.unique_id
                ).yellow()
            );
            continue;
        };
        let dbt_model_name_for_yaml = dbt_model_name_for_yaml_from_metadata.clone(); // Now safe to clone

        dbt_models_processed_count += 1;
        // --- End Scoping Logic ---

        let existing_semantic_model_opt: Option<YamlModel> = if individual_semantic_yaml_path.exists() {
            match fs::read_to_string(&individual_semantic_yaml_path) {
                Ok(content) => {
                    match serde_yaml::from_str::<YamlModel>(&content) {
                        Ok(model) => Some(model),
                        Err(e) => {
                            eprintln!("{}", format!("Warning: Failed to parse existing semantic YAML '{}': {}. Will attempt to overwrite.", individual_semantic_yaml_path.display(), e).yellow());
                            None
                        }
                    }
                }
                Err(e) => {
                    eprintln!("{}", format!("Warning: Failed to read existing semantic YAML '{}': {}. Will attempt to create anew.", individual_semantic_yaml_path.display(), e).yellow());
                    None
                }
            }
        } else {
            None
        };

        match existing_semantic_model_opt {
            Some(mut existing_model) => {
                // Existing model: Update it
                let mut model_was_updated = false;
                println!("Updating existing semantic model: {} at {}", dbt_model_name_for_yaml.cyan(), individual_semantic_yaml_path.display());

                if existing_model.name != dbt_model_name_for_yaml {
                    // This might happen if filename and inner model name differ. We prioritize dbt_model_name_for_yaml.
                    // Or if user manually changed name in YML. For now, dbt catalog is source of truth for name.
                    println!("  Aligning name in YAML from '{}' to '{}'", existing_model.name, dbt_model_name_for_yaml);
                    existing_model.name = dbt_model_name_for_yaml.clone();
                    model_was_updated = true;
                }

                if let Some(dbt_comment) = &dbt_node.metadata.comment {
                    if existing_model.description.as_deref() != Some(dbt_comment.as_str()) {
                        existing_model.description = Some(dbt_comment.clone());
                        model_was_updated = true;
                    }
                } // Consider if dbt_comment=None should clear existing_model.description

                if existing_model.original_file_path.as_deref() != Some(dbt_original_file_path_str.as_str()) {
                    existing_model.original_file_path = Some(dbt_original_file_path_str.clone());
                    model_was_updated = true;
                }
                // Update DB/Schema if different - dbt catalog is source of truth
                if existing_model.database != dbt_node.database {
                    existing_model.database = dbt_node.database.clone();
                    model_was_updated = true;
                }
                if existing_model.schema != dbt_node.schema {
                    existing_model.schema = dbt_node.schema.clone();
                    model_was_updated = true;
                }

                // Reconcile columns
                let mut current_dims: Vec<YamlDimension> = Vec::new();
                let mut current_measures: Vec<YamlMeasure> = Vec::new();
                let mut dbt_columns_map: HashMap<String, &DbtColumn> = dbt_node.columns.values().map(|c| (c.name.clone(), c)).collect();

                for existing_dim_col in std::mem::take(&mut existing_model.dimensions) {
                    if let Some(dbt_col) = dbt_columns_map.remove(&existing_dim_col.name) {
                        let mut updated_dim = existing_dim_col.clone();
                        let mut dim_col_updated = false;
                        if updated_dim.type_.as_deref() != Some(dbt_col.column_type.as_str()) {
                            updated_dim.type_ = Some(dbt_col.column_type.clone());
                            dim_col_updated = true; columns_updated_count +=1;
                        }
                        if let Some(dbt_col_comment) = &dbt_col.comment {
                            if updated_dim.description.as_deref() != Some(dbt_col_comment.as_str()) {
                                updated_dim.description = Some(dbt_col_comment.clone());
                                dim_col_updated = true; columns_updated_count +=1;
                            }
                        } // else keep user's existing_dim.description
                        current_dims.push(updated_dim);
                        if dim_col_updated { model_was_updated = true; }
                    } else {
                        println!("  Removing dimension '{}' from semantic model '{}' (no longer in dbt model)", existing_dim_col.name.yellow(), dbt_model_name_for_yaml);
                        columns_removed_count += 1; model_was_updated = true;
                    }
                }
                for existing_measure_col in std::mem::take(&mut existing_model.measures) {
                    if let Some(dbt_col) = dbt_columns_map.remove(&existing_measure_col.name) {
                        let mut updated_measure = existing_measure_col.clone();
                        let mut measure_col_updated = false;
                        if updated_measure.type_.as_deref() != Some(dbt_col.column_type.as_str()) {
                            updated_measure.type_ = Some(dbt_col.column_type.clone());
                            measure_col_updated = true; columns_updated_count +=1;
                        }
                        if let Some(dbt_col_comment) = &dbt_col.comment {
                           if updated_measure.description.as_deref() != Some(dbt_col_comment.as_str()) {
                                updated_measure.description = Some(dbt_col_comment.clone());
                                measure_col_updated = true; columns_updated_count +=1;
                           }
                        } // else keep user's description
                        current_measures.push(updated_measure);
                        if measure_col_updated { model_was_updated = true; }
                    } else {
                        println!("  Removing measure '{}' from semantic model '{}' (no longer in dbt model)", existing_measure_col.name.yellow(), dbt_model_name_for_yaml);
                        columns_removed_count += 1; model_was_updated = true;
                    }
                }

                for (col_name, dbt_col) in dbt_columns_map {
                    println!("  Adding new column '{}' to semantic model '{}'", col_name.green(), dbt_model_name_for_yaml);
                    if is_measure_type(&dbt_col.column_type) {
                        current_measures.push(YamlMeasure { name: dbt_col.name.clone(), description: dbt_col.comment.clone(), type_: Some(dbt_col.column_type.clone()) });
                    } else {
                        current_dims.push(YamlDimension { name: dbt_col.name.clone(), description: dbt_col.comment.clone(), type_: Some(dbt_col.column_type.clone()), searchable: false, options: None });
                    }
                    columns_added_count += 1; model_was_updated = true;
                }
                existing_model.dimensions = current_dims;
                existing_model.measures = current_measures;
                
                if model_was_updated {
                    models_updated_count += 1;
                    let yaml_string = serde_yaml::to_string(&existing_model).context(format!("Failed to serialize updated semantic model {} to YAML", existing_model.name))?;
                    if let Some(parent_dir) = individual_semantic_yaml_path.parent() { fs::create_dir_all(parent_dir)?; }
                    fs::write(&individual_semantic_yaml_path, yaml_string).context(format!("Failed to write updated semantic model to {}", individual_semantic_yaml_path.display()))?;
                } else {
                    println!("  No changes detected for semantic model: {}", dbt_model_name_for_yaml);
                }
            }
            None => {
                // New semantic model: Generate from scratch
                println!("Generating new semantic model: {} at {}", dbt_model_name_for_yaml.green(), individual_semantic_yaml_path.display());
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
                    name: dbt_model_name_for_yaml.clone(),
                    description: dbt_node.metadata.comment.clone(),
                    data_source_name: buster_config.projects.as_ref().and_then(|p|p.first()).and_then(|pc|pc.data_source_name.clone()), // Default from first project context
                    database: dbt_node.database.clone(),
                    schema: dbt_node.schema.clone(),
                    dimensions,
                    measures,
                    original_file_path: Some(dbt_original_file_path_str.clone()),
                };
                let yaml_string = serde_yaml::to_string(&new_model).context(format!("Failed to serialize new semantic model {} to YAML", new_model.name))?;
                if let Some(parent_dir) = individual_semantic_yaml_path.parent() { fs::create_dir_all(parent_dir)?; }
                fs::write(&individual_semantic_yaml_path, yaml_string).context(format!("Failed to write new semantic model to {}", individual_semantic_yaml_path.display()))?;
                new_models_added_count += 1;
            }
        }
    }

    // Remove or comment out the old logic for handling removed models from a single spec file
    /*
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
    */

    // Remove the final save logic for the aggregated spec file
    // let final_models_vec: Vec<YamlModel> = existing_yaml_models_map.values().cloned().collect();
    // let updated_spec = YamlSemanticLayerSpec { models: final_models_vec };
    // let yaml_string = serde_yaml::to_string(&updated_spec).context("Failed to serialize updated semantic models to YAML")?;
    // fs::write(&semantic_models_base_dir_path, yaml_string).context(format!("Failed to write updated semantic models to {}", semantic_models_base_dir_path.display()))?;
    // Note: The above fs::write was to semantic_models_base_dir_path which is a directory, this was an error in previous diff. It should have been semantic_models_file_path.
    // Since we save per file, this block is removed.

    println!("\n{}", "Semantic Model Generation Summary:".bold().green());
    println!("  Processed dbt models (in scope): {}", dbt_models_processed_count);
    println!("  Semantic models initially loaded: {}", initial_model_count);
    println!("  New semantic models added: {}", new_models_added_count.to_string().green());
    println!("  Existing semantic models updated: {}", models_updated_count.to_string().cyan());
    println!("  Semantic models removed (dbt model deleted/out of scope): {}", columns_removed_count.to_string().red());
    println!("  Columns added: {}", columns_added_count.to_string().green());
    println!("  Columns updated (type/dbt_comment): {}", columns_updated_count.to_string().cyan());
    println!("  Columns removed: {}", columns_removed_count.to_string().red());
    
    if is_side_by_side_generation {
        println!("✓ Semantic models successfully updated (side-by-side with SQL models, base directory: {}).", effective_semantic_models_base_dir.display().to_string().green());
    } else {
        println!("✓ Semantic models successfully updated in {}.", effective_semantic_models_base_dir.display().to_string().green());
    }

    Ok(())
} 