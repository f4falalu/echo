use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use glob::Pattern; // Keep glob dependency if validate_exclude_patterns is here

/// Represents a specific project context within buster.yml
#[derive(Debug, Deserialize, Serialize, Clone, Default)] // Add Default for serde
pub struct ProjectContext {
    pub path: String, // The directory prefix for this context
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_source_name: Option<String>,
    #[serde(alias = "dataset_id", skip_serializing_if = "Option::is_none")]
    pub schema: Option<String>,
    #[serde(alias = "project_id", skip_serializing_if = "Option::is_none")]
    pub database: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exclude_files: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exclude_tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_paths: Option<Vec<String>>,
}

/// Unified BusterConfig structure for configuration across all commands
#[derive(Debug, Deserialize, Serialize, Clone, Default)] // Add Default for serde
pub struct BusterConfig {
    // --- Top-level fields for backwards compatibility ---
    #[serde(default, skip_serializing_if = "Option::is_none")] // Ensure this field is optional during deserialization AND serialization
    pub data_source_name: Option<String>,
    #[serde(alias = "dataset_id", default, skip_serializing_if = "Option::is_none")] // Ensure this field is optional
    pub schema: Option<String>, // For SQL DBs: schema, For BigQuery: dataset ID
    #[serde(alias = "project_id", default, skip_serializing_if = "Option::is_none")] // Ensure this field is optional
    pub database: Option<String>, // For SQL DBs: database, For BigQuery: project ID
    #[serde(default, skip_serializing_if = "Option::is_none")] // Ensure this field is optional
    pub exclude_files: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")] // Ensure this field is optional
    pub exclude_tags: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")] // Ensure this field is optional
    pub model_paths: Option<Vec<String>>, // Paths to SQL model files/directories

    // --- New multi-project structure ---
    #[serde(default, skip_serializing_if = "Option::is_none")] // Allows files without 'projects' key to parse and skips serializing if None
    pub projects: Option<Vec<ProjectContext>>,
}

impl BusterConfig {
    /// Validates all exclude patterns to ensure they are valid glob patterns
    /// Checks both top-level and project-level exclude_files
    pub fn validate_exclude_patterns(&self) -> Result<()> {
        // Check top-level first (for backward compatibility)
        if let Some(patterns) = &self.exclude_files {
            for pattern in patterns {
                Pattern::new(pattern)
                    .map_err(|e| anyhow!("Invalid top-level glob pattern '{}': {}", pattern, e))?;
            }
        }
        // Check patterns within each project context
        if let Some(projects) = &self.projects {
            for project in projects {
                if let Some(patterns) = &project.exclude_files {
                    for pattern in patterns {
                         Pattern::new(pattern)
                            .map_err(|e| anyhow!("Invalid glob pattern '{}' in project '{}': {}", pattern, project.path, e))?;
                    }
                }
            }
        }
        Ok(())
    }

     /// Resolves model paths relative to the base directory based on context.
    /// TODO: This needs to be context-aware based on the file being processed.
    /// For now, it primarily uses the top-level `model_paths` for compatibility
    /// or the paths from the first project context if `projects` is used.
    /// A more sophisticated approach is needed later.
    pub fn resolve_model_paths(&self, base_dir: &Path) -> Vec<PathBuf> {
        let paths_to_resolve = self.model_paths.as_ref().or_else(|| {
            self.projects.as_ref().and_then(|p| p.first()).and_then(|ctx| ctx.model_paths.as_ref())
        });

        if let Some(model_paths) = paths_to_resolve {
            let resolved_paths: Vec<PathBuf> = model_paths.iter()
                .map(|path| {
                    if Path::new(path).is_absolute() {
                        PathBuf::from(path)
                    } else {
                        base_dir.join(path)
                    }
                })
                .collect();

            // Log the resolved paths
            println!("ℹ️  Using model paths from buster.yml:");
            for (i, path) in resolved_paths.iter().enumerate() {
                println!("   - {} (resolved to: {})", model_paths[i], path.display());
            }

            resolved_paths
        } else {
            // If no model_paths specified anywhere, use the base directory
            println!("ℹ️  No model_paths specified, using current directory: {}", base_dir.display());
            vec![base_dir.to_path_buf()]
        }
    }


    /// Load configuration from the specified directory
    pub fn load_from_dir(dir: &Path) -> Result<Option<Self>> {
        let config_path = dir.join("buster.yml");
        if config_path.exists() {
            let content = std::fs::read_to_string(&config_path)
                .map_err(|e| anyhow!("Failed to read buster.yml: {}", e))?;

            if content.trim().is_empty() {
                println!("ℹ️ Found empty buster.yml, using default configuration.");
                return Ok(None); // Treat empty file same as no file
            }

            let config: Self = serde_yaml::from_str(&content)
                .map_err(|e| anyhow!("Failed to parse buster.yml: {}", e))?;

            // Validate exclude patterns from all sources
            config.validate_exclude_patterns()?;

            // --- Logging (needs update for multi-project) ---
            // Log top-level details if present (for backward compatibility)
             if let Some(ref data_source) = config.data_source_name {
                 println!("ℹ️  Default Data source: {}", data_source);
             }
             if let Some(ref schema) = config.schema {
                 println!("ℹ️  Default Schema: {}", schema);
             }
             if let Some(ref database) = config.database {
                 println!("ℹ️  Default Database: {}", database);
             }
             if let Some(ref patterns) = config.exclude_files {
                 println!("ℹ️  Default Exclude file patterns: {:?}", patterns);
             }
            if let Some(ref tags) = config.exclude_tags {
                println!("ℹ️  Default Exclude tags: {:?}", tags);
            }
            if let Some(ref paths) = config.model_paths {
                 println!("ℹ️  Default Model paths: {:?}", paths);
             }

            // Log project-specific details if present
            if let Some(ref projects) = config.projects {
                println!("ℹ️  Found {} project context(s):", projects.len());
                for (i, project) in projects.iter().enumerate() {
                     println!("   - Project {}: Path='{}'", i + 1, project.path);
                     if let Some(ref ds) = project.data_source_name { println!("     Data Source: {}", ds); }
                     if let Some(ref db) = project.database { println!("     Database: {}", db); }
                     if let Some(ref sc) = project.schema { println!("     Schema: {}", sc); }
                     if let Some(ref mp) = project.model_paths { println!("     Model Paths: {:?}", mp); }
                     if let Some(ref ef) = project.exclude_files { println!("     Exclude Files: {:?}", ef); }
                     if let Some(ref et) = project.exclude_tags { println!("     Exclude Tags: {:?}", et); }
                }
            }
            // --- End Logging ---

            Ok(Some(config))
        } else {
             println!("ℹ️ No buster.yml found, using default configuration.");
            Ok(None)
        }
    }

     // TODO: Add a method like `get_context_for_path(&self, file_path: &Path) -> ProjectContext`
     // This method would determine the most specific project context that applies to a given file path,
     // falling back to top-level defaults if no project context matches or if a specific setting
     // is missing in the matched context. This will be crucial for commands like `analyze`, `sync`, etc.
} 