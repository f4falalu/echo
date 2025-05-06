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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>, // Optional name for the project
}

impl ProjectContext {
    /// Returns the absolute path for this project context, given the buster.yml directory
    pub fn absolute_path(&self, buster_yml_dir: &Path) -> PathBuf {
        if Path::new(&self.path).is_absolute() {
            PathBuf::from(&self.path)
        } else {
            buster_yml_dir.join(&self.path)
        }
    }

    /// Returns the effective model paths for this project context
    pub fn resolve_model_paths(&self, buster_yml_dir: &Path) -> Vec<PathBuf> {
        let project_base_dir = self.absolute_path(buster_yml_dir);

        if let Some(model_paths) = &self.model_paths {
            // If model_paths is defined for this project, use those paths relative to the project's path
            model_paths.iter()
                .map(|path| {
                    if Path::new(path).is_absolute() {
                        PathBuf::from(path)
                    } else {
                        project_base_dir.join(path)
                    }
                })
                .collect()
        } else {
            // If no model_paths defined, use the project directory itself
            vec![project_base_dir]
        }
    }
    
    /// Returns a string identifier for this project
    pub fn identifier(&self) -> String {
        self.name.clone().unwrap_or_else(|| self.path.clone())
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
    pub fn get_context_for_path(&self, file_path: &Path, buster_yml_dir: &Path) -> Option<&ProjectContext> {
        if let Some(projects) = &self.projects {
            // Try to find the most specific project context for this path
            // We need to handle paths that might be nested inside other project paths
            let mut best_match: Option<(&ProjectContext, usize)> = None;
            
            for project in projects {
                let project_path = project.absolute_path(buster_yml_dir);
                
                // Check if file_path is inside this project path
                if let Ok(rel_path) = file_path.strip_prefix(&project_path) {
                    // Count components to determine specificity (more components = more specific)
                    let depth = rel_path.components().count();
                    
                    // If we haven't found a match yet or this is more specific
                    if best_match.is_none() || depth < best_match.unwrap().1 {
                        best_match = Some((project, depth));
                    }
                }
            }
            
            // Return the most specific project context, if any
            best_match.map(|(ctx, _)| ctx)
        } else {
            None
        }
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
                    let project_id = project.name.as_deref().unwrap_or(&project.path);
                    println!("   - Project {}: {} (Path='{}')", i + 1, project_id, project.path);
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

     // Method get_context_for_path is implemented above
     // It determines the most specific project context that applies to a given file path,
     // falling back to top-level defaults if no project context matches or if a specific setting
     // is missing in the matched context. This will be crucial for commands like `analyze`, `sync`, etc.
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
    fn test_project_context_absolute_path() -> Result<()> {
        let base_dir = create_test_dir()?;
        let base_path = base_dir.path();

        // Test with relative path
        let project = ProjectContext {
            path: "models".to_string(),
            ..Default::default()
        };
        let expected_path = base_path.join("models");
        assert_eq!(project.absolute_path(base_path), expected_path);

        // Test with absolute path
        let abs_path = "/absolute/path/to/models".to_string();
        let project = ProjectContext {
            path: abs_path.clone(),
            ..Default::default()
        };
        assert_eq!(project.absolute_path(base_path), PathBuf::from(abs_path));

        Ok(())
    }

    #[test]
    fn test_project_context_resolve_model_paths() -> Result<()> {
        let base_dir = create_test_dir()?;
        let base_path = base_dir.path();
        
        // Create project directory
        let project_dir = base_path.join("project");
        fs::create_dir(&project_dir)?;

        // Test with no model_paths (should return project dir)
        let project = ProjectContext {
            path: "project".to_string(),
            ..Default::default()
        };
        let paths = project.resolve_model_paths(base_path);
        assert_eq!(paths.len(), 1);
        assert_eq!(paths[0], project_dir);

        // Test with model_paths
        let project = ProjectContext {
            path: "project".to_string(),
            model_paths: Some(vec!["subdir1".to_string(), "subdir2".to_string()]),
            ..Default::default()
        };
        let paths = project.resolve_model_paths(base_path);
        assert_eq!(paths.len(), 2);
        assert_eq!(paths[0], project_dir.join("subdir1"));
        assert_eq!(paths[1], project_dir.join("subdir2"));

        Ok(())
    }

    #[test]
    fn test_project_context_identifier() {
        // Test with name
        let project = ProjectContext {
            name: Some("Test Project".to_string()),
            path: "models".to_string(),
            ..Default::default()
        };
        assert_eq!(project.identifier(), "Test Project");

        // Test without name (should fall back to path)
        let project = ProjectContext {
            path: "models".to_string(),
            ..Default::default()
        };
        assert_eq!(project.identifier(), "models");
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
                    path: "project1".to_string(),
                    data_source_name: Some("source1".to_string()),
                    ..Default::default()
                },
                ProjectContext {
                    name: Some("Project 2".to_string()),
                    path: "project2".to_string(),
                    data_source_name: Some("source2".to_string()),
                    ..Default::default()
                }
            ]),
            ..Default::default()
        };
        
        // Test getting context for file1
        let context = config.get_context_for_path(&file1, base_path);
        assert!(context.is_some());
        assert_eq!(context.unwrap().name, Some("Project 1".to_string()));
        
        // Test getting context for file2
        let context = config.get_context_for_path(&file2, base_path);
        assert!(context.is_some());
        assert_eq!(context.unwrap().name, Some("Project 2".to_string()));
        
        // Test getting context for nested_file (should match project1)
        let context = config.get_context_for_path(&nested_file, base_path);
        assert!(context.is_some());
        assert_eq!(context.unwrap().name, Some("Project 1".to_string()));
        
        // Test getting context for file outside any project
        let outside_file = base_path.join("outside.yml");
        fs::write(&outside_file, "test")?;
        let context = config.get_context_for_path(&outside_file, base_path);
        assert!(context.is_none());
        
        Ok(())
    }

    #[test]
    fn test_buster_config_resolve_effective_model_paths() -> Result<()> {
        let base_dir = create_test_dir()?;
        let base_path = base_dir.path();
        
        // Create a BusterConfig with projects
        let config = BusterConfig {
            model_paths: Some(vec!["global_models".to_string()]),
            projects: Some(vec![
                ProjectContext {
                    name: Some("Project 1".to_string()),
                    path: "project1".to_string(),
                    model_paths: Some(vec!["models".to_string()]),
                    ..Default::default()
                },
                ProjectContext {
                    name: Some("Project 2".to_string()),
                    path: "project2".to_string(),
                    ..Default::default()
                }
            ]),
            ..Default::default()
        };
        
        // Get effective paths
        let paths = config.resolve_effective_model_paths(base_path);
        
        // Should return 3 paths:
        // 1. project1/models (with Project 1 context)
        // 2. project2 (with Project 2 context)
        assert_eq!(paths.len(), 2);
        
        // Check first path and its context
        assert_eq!(paths[0].0, base_path.join("project1").join("models"));
        assert!(paths[0].1.is_some());
        assert_eq!(paths[0].1.unwrap().name, Some("Project 1".to_string()));
        
        // Check second path and its context
        assert_eq!(paths[1].0, base_path.join("project2"));
        assert!(paths[1].1.is_some());
        assert_eq!(paths[1].1.unwrap().name, Some("Project 2".to_string()));
        
        // Test with config without projects
        let config = BusterConfig {
            model_paths: Some(vec!["global_models".to_string()]),
            projects: None,
            ..Default::default()
        };
        
        let paths = config.resolve_effective_model_paths(base_path);
        assert_eq!(paths.len(), 1);
        assert_eq!(paths[0].0, base_path.join("global_models"));
        assert!(paths[0].1.is_none());
        
        // Test with empty config
        let config = BusterConfig::default();
        let paths = config.resolve_effective_model_paths(base_path);
        assert_eq!(paths.len(), 1);
        assert_eq!(paths[0].0, base_path);
        assert!(paths[0].1.is_none());
        
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
            path: project1
            data_source_name: project1_source
          - name: Project 2
            path: project2
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
        assert_eq!(projects[0].path, "project1");
        assert_eq!(projects[0].data_source_name, Some("project1_source".to_string()));
        
        // Check Project 2
        assert_eq!(projects[1].name, Some("Project 2".to_string()));
        assert_eq!(projects[1].path, "project2");
        assert_eq!(projects[1].schema, Some("project2_schema".to_string()));
        
        Ok(())
    }
}