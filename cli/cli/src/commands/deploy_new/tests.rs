use super::*;
use std::fs;
use tempfile::TempDir;
use tokio::runtime::Runtime;

// Helper function to create a temporary directory with test files
fn setup_test_dir() -> Result<TempDir> {
    let temp_dir = TempDir::new()?;
    Ok(temp_dir)
}

// Helper to create a test YAML file
fn create_test_yaml(dir: &Path, name: &str, content: &str) -> Result<PathBuf> {
    let path = dir.join(name);
    fs::write(&path, content)?;
    Ok(path)
}

// Helper to create a test SQL file
fn create_test_sql(dir: &Path, name: &str, content: &str) -> Result<PathBuf> {
    let path = dir.join(name);
    fs::write(&path, content)?;
    Ok(path)
}

#[test]
fn test_parse_model_file() -> Result<()> {
    let temp_dir = setup_test_dir()?;
    
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
    assert_eq!(models[0].dimensions.len(), 1);
    assert_eq!(models[0].dimensions[0].name, "dim1");
    assert_eq!(models[0].measures.len(), 1);
    assert_eq!(models[0].measures[0].name, "measure1");
    
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
    
    // Test invalid YAML
    let invalid_yml = "this is not valid yaml: : : :";
    let invalid_path = temp_dir.path().join("invalid.yml");
    fs::write(&invalid_path, invalid_yml)?;
    
    let result = parse_model_file(&invalid_path);
    assert!(result.is_err());
    
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
    
    // Test error case: missing data_source_name
    let model_missing_ds = Model {
        name: "missing_ds".to_string(),
        description: Some("Missing DS".to_string()),
        data_source_name: None,
        database: None,
        schema: None,
        dimensions: vec![],
        measures: vec![],
        metrics: vec![],
        filters: vec![],
        relationships: vec![],
    };
    
    let config_no_ds = BusterConfig::default();
    
    let result = resolve_model_configurations(vec![(model_missing_ds, None)], &config_no_ds);
    assert!(result.is_err());
    
    // Test error case: missing schema
    let model_missing_schema = Model {
        name: "missing_schema".to_string(),
        description: Some("Missing Schema".to_string()),
        data_source_name: Some("test_ds".to_string()),
        database: None,
        schema: None,
        dimensions: vec![],
        measures: vec![],
        metrics: vec![],
        filters: vec![],
        relationships: vec![],
    };
    
    let config_no_schema = BusterConfig {
        data_source_name: Some("global_ds".to_string()),
        schema: None,
        database: None,
        exclude_files: None,
        exclude_tags: None,
        model_paths: None,
        projects: None,
    };
    
    let result = resolve_model_configurations(vec![(model_missing_schema, None)], &config_no_schema);
    assert!(result.is_err());
    
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

#[test]
fn test_find_sql_file() -> Result<()> {
    let temp_dir = setup_test_dir()?;
    
    // Create a models directory
    let models_dir = temp_dir.path().join("models");
    fs::create_dir(&models_dir)?;
    
    // Create a SQL file in the parent directory
    let sql_content = "SELECT * FROM test_schema.test_model";
    let sql_path = temp_dir.path().join("test_model.sql");
    fs::write(&sql_path, sql_content)?;
    
    // Create a YML file in the models directory
    let yml_content = r#"
name: test_model
description: "Test model"
    "#;
    let yml_path = models_dir.join("test_model.yml");
    fs::write(&yml_path, yml_content)?;
    
    // Test find_sql_file
    let found_sql = find_sql_file(&yml_path);
    assert!(found_sql.is_some());
    assert_eq!(found_sql.unwrap(), sql_path);
    
    // Test with non-existent SQL file
    let non_existent_path = models_dir.join("non_existent.yml");
    fs::write(&non_existent_path, yml_content)?;
    
    let found_sql = find_sql_file(&non_existent_path);
    assert!(found_sql.is_none());
    
    Ok(())
}

#[test]
fn test_generate_default_sql() {
    let model = Model {
        name: "test_model".to_string(),
        description: Some("Test model".to_string()),
        data_source_name: Some("test_source".to_string()),
        database: None,
        schema: Some("test_schema".to_string()),
        dimensions: vec![],
        measures: vec![],
        metrics: vec![],
        filters: vec![],
        relationships: vec![],
    };
    
    let sql = generate_default_sql(&model);
    assert_eq!(sql, "select * from test_schema.test_model");
    
    // Test with missing schema
    let model_no_schema = Model {
        name: "test_model".to_string(),
        description: Some("Test model".to_string()),
        data_source_name: Some("test_source".to_string()),
        database: None,
        schema: None,
        dimensions: vec![],
        measures: vec![],
        metrics: vec![],
        filters: vec![],
        relationships: vec![],
    };
    
    let sql = generate_default_sql(&model_no_schema);
    assert_eq!(sql, "select * from .test_model");
}

#[test]
fn test_get_sql_content() -> Result<()> {
    let temp_dir = setup_test_dir()?;
    
    // Create a SQL file
    let sql_content = "SELECT * FROM test_schema.test_model";
    let sql_path = temp_dir.path().join("test_model.sql");
    fs::write(&sql_path, sql_content)?;
    
    let model = Model {
        name: "test_model".to_string(),
        description: Some("Test model".to_string()),
        data_source_name: Some("test_source".to_string()),
        database: None,
        schema: Some("test_schema".to_string()),
        dimensions: vec![],
        measures: vec![],
        metrics: vec![],
        filters: vec![],
        relationships: vec![],
    };
    
    // Test with SQL file
    let result = get_sql_content(&model, &Some(sql_path.clone()))?;
    assert_eq!(result, sql_content);
    
    // Test without SQL file (should generate default)
    let result = get_sql_content(&model, &None)?;
    assert_eq!(result, "select * from test_schema.test_model");
    
    // Test with non-existent file (should error)
    let non_existent = temp_dir.path().join("non_existent.sql");
    let result = get_sql_content(&model, &Some(non_existent));
    assert!(result.is_err());
    
    Ok(())
}

// Integration-like tests for deploy function
#[test]
fn test_deploy_with_valid_project() -> Result<()> {
    let rt = Runtime::new()?;
    let temp_dir = setup_test_dir()?;
    
    // Create buster.yml
    let buster_yml = r#"
data_source_name: "test_source"
schema: "test_schema"
database: "test_db"
    "#;
    create_test_yaml(temp_dir.path(), "buster.yml", buster_yml)?;
    
    // Create a valid model file
    let model_yml = r#"
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
    create_test_yaml(temp_dir.path(), "test_model.yml", model_yml)?;
    
    // Test dry run
    let result = rt.block_on(deploy(Some(temp_dir.path().to_str().unwrap()), true, false));
    assert!(result.is_ok());
    
    Ok(())
}

#[test]
fn test_deploy_with_project_structure() -> Result<()> {
    let rt = Runtime::new()?;
    let temp_dir = setup_test_dir()?;
    
    // Create main buster.yml with projects structure
    let main_buster_yml = r#"
data_source_name: "default_source"
schema: "default_schema"
database: "default_db"
projects:
  - name: "Project 1"
    path: "project1"
    data_source_name: "project1_source"
  - name: "Project 2"
    path: "project2"
    schema: "project2_schema"
    "#;
    create_test_yaml(temp_dir.path(), "buster.yml", main_buster_yml)?;
    
    // Create project directories
    let proj1_dir = temp_dir.path().join("project1");
    let proj2_dir = temp_dir.path().join("project2");
    fs::create_dir(&proj1_dir)?;
    fs::create_dir(&proj2_dir)?;
    
    // Create model files in each project
    let model1_yml = r#"
name: model1
description: "Model in Project 1"
dimensions:
  - name: dim1
    description: "Dimension 1"
    type: "string"
schema: "model1_schema"
    "#;
    create_test_yaml(&proj1_dir, "model1.yml", model1_yml)?;
    
    let model2_yml = r#"
name: model2
description: "Model in Project 2"
dimensions:
  - name: dim2
    description: "Dimension 2"
    type: "number"
database: "model2_db"
    "#;
    create_test_yaml(&proj2_dir, "model2.yml", model2_yml)?;
    
    // Test dry run
    let result = rt.block_on(deploy(Some(temp_dir.path().to_str().unwrap()), true, true));
    assert!(result.is_ok());
    
    Ok(())
}

#[test]
fn test_deploy_with_missing_config() -> Result<()> {
    let rt = Runtime::new()?;
    let temp_dir = setup_test_dir()?;
    
    // Create a model file without required configurations
    let model_yml = r#"
name: incomplete_model
description: "Model missing configuration"
dimensions:
  - name: dim1
    description: "Dimension 1"
    type: "string"
    "#;
    create_test_yaml(temp_dir.path(), "incomplete_model.yml", model_yml)?;
    
    // Test dry run - should fail due to missing configurations
    let result = rt.block_on(deploy(Some(temp_dir.path().to_str().unwrap()), true, false));
    assert!(result.is_err());
    
    Ok(())
}