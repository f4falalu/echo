use anyhow::{anyhow, Context, Result};
use colored::*;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
// use std::time::Duration; // Duration seems unused here now

use crate::utils::config::BusterConfig;
use crate::commands::init::{YamlModel, YamlDimension, YamlMeasure, is_measure_type};

// Use new struct names from dbt_utils
use dbt_utils::models::{DbtCatalog, CatalogNode, ColumnMetadata, TableMetadata}; // CatalogMetadata might not be directly used here
use dbt_utils::{run_dbt_docs_generate, load_and_parse_catalog};

use indicatif::{ProgressBar, ProgressStyle}; // Keep for progress spinners if any remain or are added
use inquire::Confirm;
use glob::{glob, Pattern};


pub async fn generate_semantic_models_command(
    path_arg: Option<String>,
    target_output_dir_arg: Option<String>, // This argument determines the *base* output dir if specified
) -> Result<()> {
    println!("{}", "🚀 Starting semantic model generation/update...".bold().blue());

    let buster_config_dir = std::env::current_dir().context("Failed to get current directory")?;
    let buster_config = BusterConfig::load_from_dir(&buster_config_dir)?.ok_or_else(|| {
        anyhow!("❌ buster.yml not found in {}. Please run 'buster init' first.", buster_config_dir.display())
    })?;

    // --- 1. Load Catalog & Build Lookup Map ---
    println!("\n{}", "🔍 Loading dbt catalog...".dimmed());
    let catalog_json_path = buster_config_dir.join("target").join("catalog.json");
    if Confirm::new("Run 'dbt docs generate' to refresh dbt catalog (catalog.json)?")
        .with_default(true)
        .prompt()?
    {
        match run_dbt_docs_generate(&buster_config_dir).await {
            Ok(_) => {},
            Err(e) => eprintln!("{}", format!("⚠️ 'dbt docs generate' error. Proceeding with existing catalog. Error: {}", e).yellow()),
        }
    } else {
        println!("{}", "ℹ️ Skipping 'dbt docs generate'. Using existing catalog.json.".dimmed());
    }

    if !catalog_json_path.exists() {
        eprintln!("{}", format!("❌ catalog.json not found at {}. Cannot generate/update models.", catalog_json_path.display()).red());
        return Ok(());
    }
    let dbt_catalog = match load_and_parse_catalog(&catalog_json_path) {
        Ok(catalog) => {
            println!("{}", "✅ Successfully parsed catalog.json.".green());
            catalog
        }
        Err(e) => {
            eprintln!("{}", format!("❌ Error loading/parsing catalog.json: {}. Cannot generate/update.", e).red());
            return Ok(());
        }
    };

    // Enhance catalog node lookup to use path information from unique_id
let mut catalog_nodes_lookup: HashMap<String, &CatalogNode> = HashMap::new();

// Function to extract path components from unique_id
fn extract_path_components(unique_id: &str) -> Option<(String, String, String)> {
    let parts: Vec<&str> = unique_id.split('.').collect();
    // Format: model.project_name.directory_path.model_name
    // Or: source.project_name.schema.table
    if parts.len() >= 4 {
        let resource_type = parts[0].to_string();
        let project_name = parts[1].to_string();

        // For models, combine all middle parts as directory path
        // For sources, use the schema
        let schema_or_path = if resource_type == "model" && parts.len() > 4 {
            parts[2..parts.len()-1].join(".")
        } else {
            parts[2].to_string()
        };

        // Last part is always the model/table name
        let name = parts[parts.len()-1].to_string();

        return Some((project_name, schema_or_path, name));
    }
    None
}

// Populate the lookup table with multiple keys for each node
for (unique_id, node) in &dbt_catalog.nodes {
    // Always include the full unique_id as a lookup key
    catalog_nodes_lookup.insert(unique_id.clone(), node);

    if let Some((project, path_or_schema, name)) = extract_path_components(unique_id) {
        // Add project.path.name as a lookup key
        let project_path_key = format!("{}.{}.{}", project, path_or_schema, name);
        catalog_nodes_lookup.insert(project_path_key, node);

        // Add project.name as a lookup key
        let project_name_key = format!("{}.{}", project, name);
        catalog_nodes_lookup.insert(project_name_key, node);

        // Add path.name as a lookup key
        let path_name_key = format!("{}.{}", path_or_schema, name);
        catalog_nodes_lookup.insert(path_name_key, node);
    }

    // For backward compatibility, also index by simple name
    if let Some(derived_name) = &node.derived_model_name_from_file {
        // Check if this name already exists in the lookup to avoid collisions
        if !catalog_nodes_lookup.contains_key(derived_name) {
            catalog_nodes_lookup.insert(derived_name.clone(), node);
        } else {
            println!("{}", format!("⚠️ Warning: Multiple models with name '{}' found in catalog. Using path information for disambiguation.", derived_name).yellow());
        }
    }
}

    if catalog_nodes_lookup.is_empty() {
        println!("{}", "ℹ️ No models found in dbt catalog. Nothing to generate/update.".yellow());
        return Ok(());
    }

    // Helper function to extract path components from SQL file paths
    fn extract_sql_file_path_components(
        sql_file_path: &Path,
        project_root: &Path,
        model_roots: &[PathBuf]
    ) -> Vec<String> {
        // First try to strip the project root to get a relative path
        if let Ok(rel_path) = sql_file_path.strip_prefix(project_root) {
            // Now try to strip any of the model roots to find the most specific path
            for model_root in model_roots {
                // Handle both absolute and relative model roots
                let abs_model_root = if model_root.is_absolute() {
                    model_root.clone()
                } else {
                    project_root.join(model_root)
                };

                // Try to strip the model root from the SQL file path
                if let Ok(path_from_model_root) = rel_path.strip_prefix(&model_root) {
                    // Split the remaining path into components
                    let components: Vec<String> = path_from_model_root
                        .parent()
                        .map(|p| p.components().map(|c| c.as_os_str().to_string_lossy().into_owned()).collect())
                        .unwrap_or_default();

                    // If we found components, add the model name (filename without extension)
                    let mut result = components;
                    if let Some(file_name) = sql_file_path.file_stem() {
                        result.push(file_name.to_string_lossy().into_owned());
                    }
                    return result;
                }

                // Try with absolute model root as well
                if let Ok(path_from_abs_model_root) = sql_file_path.strip_prefix(&abs_model_root) {
                    let components: Vec<String> = path_from_abs_model_root
                        .parent()
                        .map(|p| p.components().map(|c| c.as_os_str().to_string_lossy().into_owned()).collect())
                        .unwrap_or_default();

                    let mut result = components;
                    if let Some(file_name) = sql_file_path.file_stem() {
                        result.push(file_name.to_string_lossy().into_owned());
                    }
                    return result;
                }
            }
        }

        // Fallback: Just return the file name without extension
        sql_file_path.file_stem()
            .map(|s| vec![s.to_string_lossy().into_owned()])
            .unwrap_or_default()
    }

    // --- 2. Determine SQL Files to Process (based on path_arg or buster.yml model_paths) ---
    println!("\n{}", "⚙️ Determining SQL files to process...".dimmed());
    let mut sql_files_to_process: HashSet<PathBuf> = HashSet::new();
    let dbt_project_model_roots_for_stripping = crate::commands::init::parse_dbt_project_file_content(&buster_config_dir)?.as_ref()
        .map(|c| c.model_paths.iter().map(PathBuf::from).collect::<Vec<PathBuf>>())
        .unwrap_or_else(|| vec![PathBuf::from("models")]);

    if let Some(pa_str) = &path_arg {
        let target_path = buster_config_dir.join(pa_str);
        if target_path.is_file() && target_path.extension().map_or(false, |ext| ext == "sql") {
            sql_files_to_process.insert(target_path);
        } else if target_path.is_dir() {
            let glob_pattern = target_path.join("**/*.sql");
            match glob(&glob_pattern.to_string_lossy()) {
                Ok(paths) => paths.for_each(|entry| if let Ok(path) = entry { if path.is_file() { sql_files_to_process.insert(path); } }),
                Err(e) => eprintln!("{}", format!("Error globbing '{}': {}", glob_pattern.display(), e).yellow()),
            }
        } else {
            eprintln!("{}", format!("⚠️ Warning: path_arg '{}' is not a valid SQL file or directory. Processing all configured models.", pa_str).yellow());
            // Fall through to buster.yml model_paths if path_arg is invalid
        }
    }
    
    if sql_files_to_process.is_empty() { // If path_arg didn't yield files, or wasn't provided, use buster.yml config
        let mut processed_via_buster_yml_paths = false;
        if let Some(projects) = &buster_config.projects {
            if let Some(first_project) = projects.first() {
                if let Some(config_model_paths) = &first_project.model_paths { // Vec<String>
                    if !config_model_paths.is_empty() { // Check if there are paths to process
                        println!("{}", format!("ℹ️ No SQL files from path_arg. Scanning based on buster.yml model_paths: {:?}", config_model_paths).dimmed());
                        for path_entry_from_config in config_model_paths {
                            if path_entry_from_config.trim().is_empty() {
                                continue; // Skip empty path strings
                            }
                            let final_glob_pattern_str: String;
                            let path_is_absolute = Path::new(path_entry_from_config).is_absolute();

                            let base_path_for_glob = if path_is_absolute {
                                PathBuf::from(path_entry_from_config)
                            } else {
                                buster_config_dir.join(path_entry_from_config)
                            };

                            if path_entry_from_config.contains('*') || path_entry_from_config.contains('?') || path_entry_from_config.contains('[') {
                                final_glob_pattern_str = base_path_for_glob.to_string_lossy().into_owned();
                            } else {
                                final_glob_pattern_str = base_path_for_glob.join("**/*.sql").to_string_lossy().into_owned();
                            }

                            match glob(&final_glob_pattern_str) {
                                Ok(paths) => paths.for_each(|entry| {
                                    if let Ok(p) = entry {
                                        if p.is_file() && p.extension().map_or(false, |e| e == "sql") {
                                            sql_files_to_process.insert(p);
                                        }
                                    }
                                }),
                                Err(e) => eprintln!("{}", format!("Glob pattern error for buster.yml path '{}': {}", final_glob_pattern_str, e).yellow()),
                            }
                        }
                        // If config_model_paths had at least one non-empty string, consider this path taken
                        if config_model_paths.iter().any(|s| !s.trim().is_empty()) {
                             processed_via_buster_yml_paths = true;
                        }
                    }
                }
            }
        }

        if !processed_via_buster_yml_paths {
            // Fallback to dbt_project.yml defaults
            println!("{}", "ℹ️ No SQL files from path_arg, and no model_paths in buster.yml (or they were empty). Using dbt_project.yml model-paths as fallback.".dimmed());
            for dbt_root_rel in &dbt_project_model_roots_for_stripping {
                let glob_pattern = buster_config_dir.join(dbt_root_rel).join("**/*.sql");
                match glob(&glob_pattern.to_string_lossy()) {
                    Ok(paths) => paths.for_each(|entry| if let Ok(p) = entry { if p.is_file() {sql_files_to_process.insert(p);}}),
                    Err(e) => eprintln!("{}", format!("Error globbing default dbt path '{}': {}",glob_pattern.display(),e).yellow()),
                }
            }
        }
    }

    if sql_files_to_process.is_empty() {
        println!("{}", "ℹ️ No SQL model files found to process/update based on configuration.".yellow());
        return Ok(());
    }
    println!("{}", format!("✅ Found {} SQL model file(s) for potential generation/update.", sql_files_to_process.len()).dimmed());

    // --- 3. Determine Output Base Directory for Semantic Models ---
    println!("\n{}", "⚙️ Determining output directory for semantic models...".dimmed());
    let semantic_models_base_dir_path_str = target_output_dir_arg.or_else(|| 
        buster_config.projects.as_ref()
            .and_then(|p| p.first())
            .and_then(|proj| proj.semantic_model_paths.as_ref())
            .and_then(|paths| paths.first().cloned())
    ).unwrap_or_else(|| 
        // Default to side-by-side (empty string means relative to SQL file later)
        String::new()
    );

    let (is_side_by_side_generation, semantic_output_base_abs_dir) = if semantic_models_base_dir_path_str.is_empty() {
        println!("{}", "ℹ️ Semantic models output set to side-by-side with SQL files.".dimmed());
        (true, buster_config_dir.clone()) // Base for side-by-side is project root
    } else {
        let abs_path = if Path::new(&semantic_models_base_dir_path_str).is_absolute() {
            PathBuf::from(&semantic_models_base_dir_path_str)
        } else {
            buster_config_dir.join(&semantic_models_base_dir_path_str)
        };
        println!("{}", format!("➡️ Semantic models output base directory: {}", abs_path.display()).cyan());
        fs::create_dir_all(&abs_path).context(format!("Failed to create semantic models output dir: {}", abs_path.display()))?;
        (false, abs_path)
    };
    
    // --- 4. Iterate SQL Files, Match to Catalog, Generate/Update YamlModels ---
    println!("\n{}", "✨ Processing SQL files and generating/updating YAML models...".dimmed());
    let mut models_generated_count = 0;
    let mut models_updated_count = 0;
    let mut columns_added_count = 0;
    let mut columns_updated_count = 0;
    let mut columns_removed_count = 0;
    let mut sql_models_successfully_processed_from_catalog_count = 0; // New counter

    // Get project defaults for comparison
    let proj_default_ds_name = buster_config.projects.as_ref()
        .and_then(|p| p.first()).and_then(|pc| pc.data_source_name.as_deref());
    let proj_default_database = buster_config.projects.as_ref()
        .and_then(|p| p.first()).and_then(|pc| pc.database.as_deref());
    let proj_default_schema = buster_config.projects.as_ref()
        .and_then(|p| p.first()).and_then(|pc| pc.schema.as_deref());

    // Helper function to find the best matching catalog node
    fn find_matching_catalog_node<'a>(
        lookup: &'a HashMap<String, &'a CatalogNode>,
        project_name: &str,
        path_components: &[String],
        model_name: &str
    ) -> Option<(&'a CatalogNode, String, String)> {
        // If path components are available, try increasingly specific lookups
        if !path_components.is_empty() {
            // Try most specific lookup first: full path with project
            // Format: project.path1.path2.name
            if path_components.len() > 1 {
                let path_without_name = &path_components[0..path_components.len()-1];
                let path_str = path_without_name.join(".");
                let full_key = format!("{}.{}.{}", project_name, path_str, model_name);
                if let Some(node) = lookup.get(&full_key) {
                    return Some((node, "full path".to_string(), full_key));
                }

                // Try with just the path and name (no project prefix)
                let path_name_key = format!("{}.{}", path_str, model_name);
                if let Some(node) = lookup.get(&path_name_key) {
                    return Some((node, "path and name".to_string(), path_name_key));
                }
            }

            // Try with direct parent directory and name
            if path_components.len() > 1 {
                let direct_parent = &path_components[path_components.len()-2];
                let parent_name_key = format!("{}.{}", direct_parent, model_name);
                if let Some(node) = lookup.get(&parent_name_key) {
                    return Some((node, "parent directory and name".to_string(), parent_name_key));
                }
            }

            // Try project and name without middle path
            let project_name_key = format!("{}.{}", project_name, model_name);
            if let Some(node) = lookup.get(&project_name_key) {
                return Some((node, "project and name".to_string(), project_name_key));
            }
        }

        // Fallback to simple name lookup
        lookup.get(model_name).map(|&node|
            (node, "simple name".to_string(), model_name.to_string())
        )
    }

    for sql_file_abs_path in sql_files_to_process {
        let model_name_from_filename = sql_file_abs_path.file_stem().map_or_else(String::new, |s| s.to_string_lossy().into_owned());
        if model_name_from_filename.is_empty() {
            eprintln!("{}", format!("⚠️ Warning: Could not get model name from file {}. Skipping.", sql_file_abs_path.display()).yellow());
            continue;
        }

        // Extract path components from SQL file path
        let path_components = extract_sql_file_path_components(
            &sql_file_abs_path,
            &buster_config_dir,
            &dbt_project_model_roots_for_stripping
        );

        // Get the first project name from configs, defaulting to "default" if not found
        let project_name = buster_config.projects.as_ref()
            .and_then(|p| p.first())
            .and_then(|p| p.name.as_ref())
            .map_or(String::from("default"), |v| v.clone());

        // Try to find the matching catalog node using a prioritized approach
        let catalog_node = match find_matching_catalog_node(
            &catalog_nodes_lookup,
            &project_name,
            &path_components,
            &model_name_from_filename
        ) {
            Some((node, match_type, key)) => {
                node
            },
            None => {
                eprintln!("{}", format!("ℹ️ Info: SQL model file '{}' found, but no corresponding entry in dbt catalog. Skipping.\nTried looking up with components: {:?}",
                    sql_file_abs_path.display(), path_components).dimmed());
                continue;
            }
        };

        let Some(ref table_meta) = catalog_node.metadata else {
            eprintln!("{}", format!("⚠️ Warning: Catalog entry for '{}' (file: {}) is missing metadata. Skipping.", model_name_from_filename, sql_file_abs_path.display()).yellow());
            continue;
        };
        // actual_model_name_in_yaml is from catalog metadata.name
        let actual_model_name_in_yaml = table_meta.name.clone(); 

        sql_models_successfully_processed_from_catalog_count += 1; // Increment here
        
        let relative_sql_path_str = pathdiff::diff_paths(&sql_file_abs_path, &buster_config_dir)
            .map(|p| p.to_string_lossy().into_owned())
            .unwrap_or_else(|| sql_file_abs_path.to_string_lossy().into_owned());

        let individual_semantic_yaml_path: PathBuf = if is_side_by_side_generation {
            sql_file_abs_path.with_extension("yml")
        } else {
            let mut stripped_suffix_for_yaml: Option<PathBuf> = None;
            for dbt_root in &dbt_project_model_roots_for_stripping {
                let abs_dbt_root = buster_config_dir.join(dbt_root);
                if let Ok(stripped) = sql_file_abs_path.strip_prefix(&abs_dbt_root) {
                    stripped_suffix_for_yaml = Some(stripped.with_extension("yml"));
                    break;
                }
            }
            let final_suffix_from_stripping = stripped_suffix_for_yaml.unwrap_or_else(|| PathBuf::from(&model_name_from_filename).with_extension("yml"));

            let mut actual_suffix_to_join = final_suffix_from_stripping.clone();
            // Check if the semantic_output_base_abs_dir might already imply the first part of the stripped suffix.
            // e.g., base_dir = ".../models/mart", suffix_from_stripping = "mart/model.yml" -> actual_suffix_to_join = "model.yml"
            // e.g., base_dir = ".../output", suffix_from_stripping = "mart/model.yml" -> actual_suffix_to_join = "mart/model.yml"
            if let Some(first_component_in_suffix) = final_suffix_from_stripping.components().next() {
                if semantic_output_base_abs_dir.ends_with(first_component_in_suffix.as_os_str()) {
                    // If the base output directory ends with the first path component of our stripped suffix
                    // (e.g., base is ".../mart", suffix starts with "mart/"),
                    // we should attempt to use the remainder of the suffix.
                    if final_suffix_from_stripping.components().count() > 1 {
                        // Only strip if there's more than one component in final_suffix_from_stripping.
                        // e.g., if suffix is "mart/model.yml", first_component_in_suffix is "mart".
                        // candidate_shorter_suffix becomes "model.yml". This is what we want.
                        // If suffix was "model.yml", first_component_in_suffix is "model.yml".
                        // semantic_output_base_abs_dir might end with "model.yml" (unlikely for a dir, but for robustness).
                        // components().count() would be 1. We would not strip, correctly joining "model.yml".
                        if let Ok(candidate_shorter_suffix) = final_suffix_from_stripping.strip_prefix(first_component_in_suffix.as_os_str()) {
                           actual_suffix_to_join = candidate_shorter_suffix.to_path_buf();
                        }
                    }
                }
            }
            semantic_output_base_abs_dir.join(actual_suffix_to_join)
        };
        if let Some(p) = individual_semantic_yaml_path.parent() { fs::create_dir_all(p)?; }

        // --- Reconciliation Logic (Create or Update) ---
        let existing_yaml_model_opt: Option<YamlModel> = if individual_semantic_yaml_path.exists() {
            fs::read_to_string(&individual_semantic_yaml_path)
                .ok()
                .and_then(|content| serde_yaml::from_str::<YamlModel>(&content).ok())
        } else { None };

        match existing_yaml_model_opt {
            Some(mut existing_model) => {
                // --- Reconciliation Logic for Existing Model ---
                let mut model_updated = false;
                let original_dim_count = existing_model.dimensions.len();
                let original_measure_count = existing_model.measures.len();

                // Get the set of column names from the dbt catalog for this model
                let catalog_column_names: HashSet<String> = catalog_node.columns
                    .keys()
                    .cloned()
                    .collect();

                // Remove dimensions that are no longer in the catalog
                existing_model.dimensions.retain(|dim| {
                    let keep = catalog_column_names.contains(&dim.name);
                    if !keep {
                        columns_removed_count += 1;
                        model_updated = true;
                        println!("    - Removing dimension '{}' (not in catalog)", dim.name.yellow());
                    }
                    keep
                });

                // Remove measures that are no longer in the catalog
                existing_model.measures.retain(|measure| {
                    let keep = catalog_column_names.contains(&measure.name);
                    if !keep {
                        columns_removed_count += 1;
                        model_updated = true;
                        println!("    - Removing measure '{}' (not in catalog)", measure.name.yellow());
                    }
                    keep
                });

                // Note: We do NOT remove metrics, filters, or relationships automatically
                // as they might represent derived logic or explicitly defined connections
                // not directly tied 1:1 with current physical columns.

                // TODO: Add logic here to ADD new columns from the catalog as dimensions/measures
                // if they don't already exist in the existing_model.

                if model_updated {
                    let yaml_string = serde_yaml::to_string(&existing_model)?;
                    fs::write(&individual_semantic_yaml_path, yaml_string)?;
                    models_updated_count += 1;
                    println!("   {} Updated existing semantic model: {}", "🔄".cyan(), individual_semantic_yaml_path.display().to_string().cyan());
                } else {
                    // If no columns were removed, maybe check if columns need *adding* later?
                    // For now, just indicate no changes needed based on removal.
                    // println!("   {} No column removals needed for: {}", "✅".dimmed(), individual_semantic_yaml_path.display().to_string().dimmed());
                }
            }
            None => { // New semantic model
                let mut dimensions = Vec::new();
                let mut measures = Vec::new();
                for (_col_name, col_meta) in &catalog_node.columns {
                    if crate::commands::init::is_measure_type(&col_meta.type_) { // type_ is String
                        measures.push(YamlMeasure { 
                            name: col_meta.name.clone(), 
                            description: col_meta.comment.as_ref().filter(|s| !s.is_empty()).cloned().or_else(|| Some("{DESCRIPTION_NEEDED}.".to_string())), 
                            type_: Some(col_meta.type_.clone()) 
                        });
                    } else {
                        dimensions.push(YamlDimension { 
                            name: col_meta.name.clone(), 
                            description: col_meta.comment.as_ref().filter(|s| !s.is_empty()).cloned().or_else(|| Some("{DESCRIPTION_NEEDED}.".to_string())), 
                            type_: Some(col_meta.type_.clone()), 
                            searchable: false, // Ensure searchable is false
                            options: None 
                        });
                    }
                }
                let new_model = YamlModel {
                    name: actual_model_name_in_yaml,
                    description: table_meta.comment.clone(),
                    data_source_name: None, // Per user request, dbt catalog doesn't provide this, so imply project default for new models
                    database: {
                        let model_db_from_catalog = &table_meta.database; // Option<String>
                        model_db_from_catalog.as_ref()
                            .filter(|catalog_db_str_ref| proj_default_database != Some(catalog_db_str_ref.as_str()))
                            .cloned()
                    },
                    schema: {
                        let model_schema_from_catalog = &table_meta.schema; // String
                        if proj_default_schema.as_deref() == Some(model_schema_from_catalog.as_str()) {
                            None
                        } else {
                            Some(model_schema_from_catalog.clone())
                        }
                    },
                    dimensions,
                    measures,
                };
                let yaml_string = serde_yaml::to_string(&new_model)?;
                fs::write(&individual_semantic_yaml_path, yaml_string)?;
                models_generated_count += 1;
                println!("   {} Generated new semantic model: {}", "✨".green(), individual_semantic_yaml_path.display().to_string().green());
            }
        }
    }

    println!("\n{}", "📊 Semantic Model Generation/Update Summary:".bold().green());
    println!("  --------------------------------------------------");
    println!("  SQL models processed with catalog entry: {}", sql_models_successfully_processed_from_catalog_count.to_string().cyan()); 
    println!("  New semantic models generated        : {}", models_generated_count.to_string().green());
    println!("  Existing semantic models updated     : {}", models_updated_count.to_string().cyan());
    println!("  Columns added to existing models     : {}", columns_added_count.to_string().green());
    println!("  Columns updated in existing models   : {}", columns_updated_count.to_string().cyan());
    println!("  Columns removed from existing models : {}", columns_removed_count.to_string().red());
    println!("  --------------------------------------------------");
    if sql_models_successfully_processed_from_catalog_count == 0 && models_generated_count == 0 && models_updated_count == 0 {
        println!("{}", "ℹ️ No models were generated or updated.".yellow());
    } else {
        println!("🎉 Semantic model generation/update complete.");
    }

    Ok(())
} 