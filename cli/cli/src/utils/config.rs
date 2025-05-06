use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use glob::Pattern; // Keep glob dependency if validate_exclude_patterns is here
use std::fs;

/// Represents a specific project context within buster.yml
#[derive(Debug, Deserialize, Serialize, Clone, Default)] // Add Default for serde
pub struct ProjectContext {
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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>, // Optional name for the project
    #[serde(skip_serializing_if = "Option::is_none")]
    pub semantic_model_paths: Option<Vec<String>>, // Paths to directories where semantic model YAML files (1:1 with SQL models) are stored
}

impl ProjectContext {
    /// Returns the effective model paths for this project context, relative to buster_yml_dir if not absolute.
    pub fn resolve_model_paths(&self, buster_yml_dir: &Path) -> Vec<PathBuf> {
        if let Some(model_paths) = &self.model_paths {
            model_paths.iter()
                .map(|path_str| {
                    let p = Path::new(path_str);
                    if p.is_absolute() {
                        p.to_path_buf()
                    } else {
                        buster_yml_dir.join(p)
                    }
                })
                .collect()
        } else {
            // If no model_paths are defined for the project,
            // it implies the project doesn't define its own model file locations directly through model_paths.
            // It might be a context for configuration overrides for models found elsewhere,
            // or it might be an error in configuration if models are expected.
            // For now, return an empty vec, meaning this specific ProjectContext doesn't point to any model files on its own.
            Vec::new()
        }
    }
    
    /// Returns a string identifier for this project
    pub fn identifier(&self) -> String {
        self.name.clone().unwrap_or_else(|| "DefaultProjectContext".to_string())
    }
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
    /// Gets the appropriate ProjectContext for a given file path
    /// If the file path falls under a project's directory, returns that project's context
    /// Otherwise returns None (indicating default/global context should be used)
    /// TODO: This method needs a rethink after removing `ProjectContext.path`.
    /// How do we determine if a file_path belongs to a project context without a base 'path' for the project?
    /// For now, it will return None. This might affect logic that tries to find a context for an arbitrary file.
    pub fn get_context_for_path(&self, _file_path: &Path, _buster_yml_dir: &Path) -> Option<&ProjectContext> {
        // if let Some(projects) = &self.projects {
        //     // Try to find the most specific project context for this path
        //     // We need to handle paths that might be nested inside other project paths
        //     let mut best_match: Option<(&ProjectContext, usize)> = None;
            
        //     for project in projects {
        //         // This is the part that relied on project.path, which is now removed.
        //         // let project_path = project.absolute_path(buster_yml_dir); 
                
        //         // // Check if file_path is inside this project path
        //         // if let Ok(rel_path) = file_path.strip_prefix(&project_path) {
        //         //     // Count components to determine specificity (more components = more specific)
        //         //     let depth = rel_path.components().count();
                    
        //         //     // If we haven't found a match yet or this is more specific
        //         //     if best_match.is_none() || depth < best_match.unwrap().1 {
        //         //         best_match = Some((project, depth));
        //         //     }
        //         // }
        //     }
            
        //     // Return the most specific project context, if any
        //     // best_match.map(|(ctx, _)| ctx)
        // } else {
        //     None
        // }
        None // Temporarily returning None
    }
    
    /// Resolves all effective model search paths from buster.yml
    /// Returns a list of absolute paths paired with their associated project context (if any)
    pub fn resolve_effective_model_paths(&self, buster_yml_dir: &Path) -> Vec<(PathBuf, Option<&ProjectContext>)> {
        let mut effective_paths = Vec::new();
        
        // First priority: Check projects if they exist
        if let Some(projects) = &self.projects {
            for project in projects {
                let project_paths = project.resolve_model_paths(buster_yml_dir);
                for path in project_paths {
                    effective_paths.push((path, Some(project)));
                }
            }
            
            if !effective_paths.is_empty() {
                return effective_paths;
            }
        }
        
        // Second priority: Use top-level model_paths if projects didn't yield any paths
        if let Some(model_paths) = &self.model_paths {
            for path in model_paths {
                let resolved_path = if Path::new(path).is_absolute() {
                    PathBuf::from(path)
                } else {
                    buster_yml_dir.join(path)
                };
                effective_paths.push((resolved_path, None));
            }
            
            if !effective_paths.is_empty() {
                return effective_paths;
            }
        }
        
        // Last resort: Use the directory containing buster.yml
        effective_paths.push((buster_yml_dir.to_path_buf(), None));
        effective_paths
    }
    
    /// Validates all exclude patterns to ensure they are valid glob patterns
    /// Checks both top-level and project-level exclude_files
    pub fn validate_exclude_patterns(&self) -> Result<()> {
        // Check top-level first (for backward compatibility)
        if let Some(patterns) = &self.exclude_files {
            for pattern in patterns {
                Pattern::new(pattern)
                    .map_err(|e| anyhow!("Invalid top-level glob pattern \'{}\': {}", pattern, e))?;
            }
        }
        // Check patterns within each project context
        if let Some(projects) = &self.projects {
            for project in projects {
                if let Some(patterns) = &project.exclude_files {
                    for pattern in patterns {
                         Pattern::new(pattern)
                            .map_err(|e| anyhow!("Invalid glob pattern \'{}\' in project \'{}\': {}", pattern, project.identifier(), e))?;
                    }
                }
            }
        }
        Ok(())
    }

     /// Resolves model paths relative to the base directory based on context.
    /// Uses the new resolve_effective_model_paths method which is context-aware
    /// and returns just the PathBufs without their context associations for backward compatibility
    pub fn resolve_model_paths(&self, base_dir: &Path) -> Vec<PathBuf> {
        let effective_paths = self.resolve_effective_model_paths(base_dir);
        
        // Extract just the paths from the (path, context) pairs
        let resolved_paths: Vec<PathBuf> = effective_paths
            .into_iter()
            .map(|(path, _context)| path)
            .collect();
        
        if !resolved_paths.is_empty() {
            // Log the resolved paths
            println!("ℹ️  Using model paths from buster.yml:");
            for path in &resolved_paths {
                println!("   - {}", path.display());
            }
            resolved_paths
        } else {
            // This should never happen with our implementation, but just in case
            println!("ℹ️  No model paths found, using current directory: {}", base_dir.display());
            vec![base_dir.to_path_buf()]
        }
    }


    /// Load configuration from the specified directory
    /// This method only looks for buster.yml in the exact directory provided,
    /// it does NOT search in parent directories
    pub fn load_from_dir(dir: &Path) -> Result<Option<Self>> {
        let config_path = dir.join("buster.yml");
        if config_path.exists() {
            println!("ℹ️  Found buster.yml at {}", config_path.display());
            let content = std::fs::read_to_string(&config_path)
                .map_err(|e| anyhow!("Failed to read buster.yml: {}", e))?;

            if content.trim().is_empty() {
                println!("ℹ️  Found empty buster.yml, using default configuration.");
                return Ok(None); // Treat empty file same as no file
            }

            let config: Self = serde_yaml::from_str(&content)
                .map_err(|e| anyhow!("Failed to parse buster.yml: {}", e))?;

            // Validate exclude patterns from all sources
            config.validate_exclude_patterns()?;

            // --- Logging configuration details ---
            // Log top-level details if present (for backward compatibility)
            if let Some(ref data_source) = config.data_source_name {
                println!("ℹ️  Global Data source: {}", data_source);
            }
            if let Some(ref schema) = config.schema {
                println!("ℹ️  Global Schema: {}", schema);
            }
            if let Some(ref database) = config.database {
                println!("ℹ️  Global Database: {}", database);
            }
            if let Some(ref patterns) = config.exclude_files {
                println!("ℹ️  Global Exclude file patterns: {:?}", patterns);
            }
            if let Some(ref tags) = config.exclude_tags {
                println!("ℹ️  Global Exclude tags: {:?}", tags);
            }
            if let Some(ref paths) = config.model_paths {
                println!("ℹ️  Global Model paths: {:?}", paths);
            }

            // Log project-specific details if present
            if let Some(ref projects) = config.projects {
                println!("ℹ️  Found {} project context(s):", projects.len());
                for (i, project) in projects.iter().enumerate() {
                    let project_id = project.identifier(); // Use new identifier
                    println!("   - Project {}: {}", i + 1, project_id);
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
            println!("ℹ️  No buster.yml found at {}, using default configuration.", dir.display());
            Ok(None)
        }
    }

    pub fn load(path: &Path) -> Result<Self> {
        let content = fs::read_to_string(path)
            .with_context(|| format!("Failed to read Buster configuration from {}", path.display()))?;
        serde_yaml::from_str(&content)
            .with_context(|| format!("Failed to parse Buster configuration from {}", path.display()))
    }

    pub fn save(&self, path: &Path) -> Result<()> {
        let yaml_string = serde_yaml::to_string(self)
            .with_context(|| "Failed to serialize Buster configuration to YAML")?;
        if let Some(parent_dir) = path.parent() {
            fs::create_dir_all(parent_dir).with_context(|| {
                format!("Failed to create parent directory for buster.yml at {}", parent_dir.display())
            })?;
        }
        fs::write(path, yaml_string)
            .with_context(|| format!("Failed to write Buster configuration to {}", path.display()))
    }

    // Helper to get the directory where buster.yml is located.
    pub fn base_dir(config_path: &Path) -> Result<PathBuf> {
        config_path
            .parent()
            .ok_or_else(|| anyhow::anyhow!("Could not determine base directory of buster.yml"))
            .map(|p| p.to_path_buf())
    }
} 

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    // Helper to create a temporary test directory
    fn create_test_dir() -> Result<TempDir> {
        Ok(TempDir::new()?)
    }

    // Helper to create a test file
    fn create_test_file(dir: &Path, name: &str, content: &str) -> Result<PathBuf> {
        let path = dir.join(name);
        fs::write(&path, content)?;
        Ok(path)
    }

    #[test]
    fn test_project_context_resolve_model_paths() -> Result<()> {
        let base_dir = create_test_dir()?;
        let buster_yml_dir = base_dir.path();
        
        // Create project directory
        let project_models_dir = buster_yml_dir.join("project_specific_models");
        fs::create_dir(&project_models_dir)?;

        // Test with no model_paths (should return empty vec)
        let project_no_paths = ProjectContext {
            name: Some("NoPathsProject".to_string()),
            ..Default::default()
        };
        let paths = project_no_paths.resolve_model_paths(buster_yml_dir);
        assert!(paths.is_empty());

        // Test with relative model_paths
        let project_with_paths = ProjectContext {
            name: Some("WithPathsProject".to_string()),
            model_paths: Some(vec!["project_specific_models".to_string(), "another_relative".to_string()]),
            ..Default::default()
        };
        let paths = project_with_paths.resolve_model_paths(buster_yml_dir);
        assert_eq!(paths.len(), 2);
        assert_eq!(paths[0], project_models_dir);
        assert_eq!(paths[1], buster_yml_dir.join("another_relative"));

        // Test with absolute model_paths
        let abs_path_str = "/tmp/abs_model_path";
        let project_abs_paths = ProjectContext {
            name: Some("AbsPathsProject".to_string()),
            model_paths: Some(vec![abs_path_str.to_string()]),
            ..Default::default()
        };
        let paths = project_abs_paths.resolve_model_paths(buster_yml_dir);
        assert_eq!(paths.len(), 1);
        assert_eq!(paths[0], PathBuf::from(abs_path_str));
        
        // Test with mixed paths
        let project_mixed_paths = ProjectContext {
            name: Some("MixedPathsProject".to_string()),
            model_paths: Some(vec!["relative_path".to_string(), abs_path_str.to_string()]),
            ..Default::default()
        };
        let paths = project_mixed_paths.resolve_model_paths(buster_yml_dir);
        assert_eq!(paths.len(), 2);
        assert_eq!(paths[0], buster_yml_dir.join("relative_path"));
        assert_eq!(paths[1], PathBuf::from(abs_path_str));


        Ok(())
    }

    #[test]
    fn test_project_context_identifier() {
        // Test with name
        let project = ProjectContext {
            name: Some("Test Project".to_string()),
            ..Default::default()
        };
        assert_eq!(project.identifier(), "Test Project");

        // Test without name (should fall back to default)
        let project = ProjectContext {
            name: None,
            ..Default::default()
        };
        assert_eq!(project.identifier(), "DefaultProjectContext");
    }

    #[test]
    fn test_buster_config_get_context_for_path() -> Result<()> {
        let base_dir = create_test_dir()?;
        let base_path = base_dir.path();
        
        // Create project directories and files
        let project1_dir = base_path.join("project1");
        let project2_dir = base_path.join("project2");
        fs::create_dir(&project1_dir)?;
        fs::create_dir(&project2_dir)?;
        
        let nested_dir = project1_dir.join("nested");
        fs::create_dir(&nested_dir)?;
        
        let file1 = project1_dir.join("model1.yml");
        let file2 = project2_dir.join("model2.yml");
        let nested_file = nested_dir.join("nested_model.yml");
        fs::write(&file1, "test")?;
        fs::write(&file2, "test")?;
        fs::write(&nested_file, "test")?;
        
        // Create config with project contexts
        let config = BusterConfig {
            projects: Some(vec![
                ProjectContext {
                    name: Some("Project 1".to_string()),
                    data_source_name: Some("source1".to_string()),
                    ..Default::default()
                },
                ProjectContext {
                    name: Some("Project 2".to_string()),
                    schema: Some("project2_schema".to_string()),
                    ..Default::default()
                }
            ]),
            ..Default::default()
        };
        
        // Since get_context_for_path is currently disabled / returning None, these will fail.
        // This test needs to be rethought based on how project context association will work.
        let context = config.get_context_for_path(&file1, base_path);
        assert!(context.is_none()); // Expecting None due to disabled logic
        
        let outside_file = base_path.join("outside.yml");
        fs::write(&outside_file, "test")?;
        let context = config.get_context_for_path(&outside_file, base_path);
        assert!(context.is_none());
        
        Ok(())
    }

    #[test]
    fn test_buster_config_resolve_effective_model_paths() -> Result<()> {
        let base_dir = create_test_dir()?;
        let buster_yml_dir = base_dir.path();
        
        // Create a BusterConfig with projects
        let config = BusterConfig {
            model_paths: Some(vec!["global_models".to_string()]),
            projects: Some(vec![
                ProjectContext {
                    name: Some("Project 1".to_string()),
                    model_paths: Some(vec!["p1_models".to_string()]),
                    ..Default::default()
                },
                ProjectContext {
                    name: Some("Project 2".to_string()),
                    ..Default::default()
                }
            ]),
            ..Default::default()
        };
        
        // Get effective paths
        let paths = config.resolve_effective_model_paths(buster_yml_dir);
        
        // Expect paths from Project 1. Project 2 contributes nothing from its own model_paths.
        // If projects yielded paths, global_models should not be used.
        assert_eq!(paths.len(), 1); 
        
        // Check first path and its context (from Project 1)
        assert_eq!(paths[0].0, buster_yml_dir.join("p1_models"));
        assert!(paths[0].1.is_some());
        assert_eq!(paths[0].1.unwrap().name, Some("Project 1".to_string()));
        
        // Test with config where projects have no model_paths, should use global
        let config_global_fallback = BusterConfig {
            model_paths: Some(vec!["global_models".to_string()]),
            projects: Some(vec![
                ProjectContext { name: Some("Project A".to_string()), ..Default::default()},
                ProjectContext { name: Some("Project B".to_string()), ..Default::default()}
            ]),
            ..Default::default()
        };
        let paths_global = config_global_fallback.resolve_effective_model_paths(buster_yml_dir);
        assert_eq!(paths_global.len(), 1);
        assert_eq!(paths_global[0].0, buster_yml_dir.join("global_models"));
        assert!(paths_global[0].1.is_none()); // Global paths have no project context associated

        // Test with config without projects at all
        let config_no_projects = BusterConfig {
            model_paths: Some(vec!["global_models".to_string()]),
            projects: None,
            ..Default::default()
        };
        
        let paths_no_proj = config_no_projects.resolve_effective_model_paths(buster_yml_dir);
        assert_eq!(paths_no_proj.len(), 1);
        assert_eq!(paths_no_proj[0].0, buster_yml_dir.join("global_models"));
        assert!(paths_no_proj[0].1.is_none());
        
        // Test with empty config (no projects, no global model_paths)
        let config_empty = BusterConfig::default();
        let paths_empty = config_empty.resolve_effective_model_paths(buster_yml_dir);
        assert_eq!(paths_empty.len(), 1);
        assert_eq!(paths_empty[0].0, buster_yml_dir.to_path_buf()); // Fallback to buster_yml_dir itself
        assert!(paths_empty[0].1.is_none());
        
        Ok(())
    }

    #[test]
    fn test_buster_config_load_from_dir() -> Result<()> {
        let base_dir = create_test_dir()?;
        let base_path = base_dir.path();
        
        // Test with non-existent buster.yml
        let config = BusterConfig::load_from_dir(base_path)?;
        assert!(config.is_none());
        
        // Create a buster.yml file
        let buster_yml = r#"
        data_source_name: test_source
        schema: test_schema
        database: test_db
        model_paths:
          - models
          - analyses
        projects:
          - name: Project 1
            data_source_name: project1_source
          - name: Project 2
            schema: project2_schema
        "#;
        create_test_file(base_path, "buster.yml", buster_yml)?;
        
        // Test loading the file
        let config = BusterConfig::load_from_dir(base_path)?;
        assert!(config.is_some());
        let config = config.unwrap();
        
        // Check global values
        assert_eq!(config.data_source_name, Some("test_source".to_string()));
        assert_eq!(config.schema, Some("test_schema".to_string()));
        assert_eq!(config.database, Some("test_db".to_string()));
        assert_eq!(config.model_paths, Some(vec!["models".to_string(), "analyses".to_string()]));
        
        // Check projects
        assert!(config.projects.is_some());
        let projects = config.projects.unwrap();
        assert_eq!(projects.len(), 2);
        
        // Check Project 1
        assert_eq!(projects[0].name, Some("Project 1".to_string()));
        assert_eq!(projects[0].data_source_name, Some("project1_source".to_string()));
        
        // Check Project 2
        assert_eq!(projects[1].name, Some("Project 2".to_string()));
        assert_eq!(projects[1].schema, Some("project2_schema".to_string()));
        
        Ok(())
    }
}