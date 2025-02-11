use anyhow::{anyhow, Result};
use axum::{extract::Json, Extension};
use chrono::{DateTime, Utc};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl, SelectableHelper};
use diesel_async::RunQueryDsl;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::collections::{HashSet, HashMap};
use uuid::Uuid;

use crate::{
    database::{
        enums::DatasetType,
        lib::get_pg_pool,
        models::{DataSource, Dataset, DatasetColumn, EntityRelationship, User},
        schema::{data_sources, dataset_columns, datasets, entity_relationship},
    },
    routes::rest::ApiResponse,
    utils::{
        dataset::column_management::{get_column_types, update_dataset_columns},
        query_engine::{
            credentials::get_data_source_credentials,
            import_dataset_columns::{retrieve_dataset_columns, retrieve_dataset_columns_batch},
            write_query_engine::write_query_engine,
        },
        security::checks::is_user_workspace_admin_or_data_admin,
        stored_values::{process_stored_values_background, store_column_values, StoredValueColumn},
        user::user_info::get_user_organization_id,
        validation::{dataset_validation::validate_model, ValidationError, ValidationResult},
        ColumnUpdate, ValidationErrorType,
    },
};

#[derive(Debug, Deserialize)]
pub struct BusterConfig {
    pub data_source_name: Option<String>,
    pub schema: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum DeployDatasetsRequest {
    Full(Vec<FullDeployDatasetsRequest>),
    Simple { id: Uuid, sql: String, yml: String },
    Batch(BatchValidationRequest),
}

#[derive(Debug, Deserialize)]
pub struct FullDeployDatasetsRequest {
    pub id: Option<Uuid>,
    pub data_source_name: String,
    pub env: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub name: String,
    pub model: Option<String>,
    pub schema: String,
    pub description: String,
    pub sql_definition: Option<String>,
    pub entity_relationships: Option<Vec<DeployDatasetsEntityRelationshipsRequest>>,
    pub columns: Vec<DeployDatasetsColumnsRequest>,
    pub yml_file: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DeployDatasetsColumnsRequest {
    pub name: String,
    pub description: String,
    pub semantic_type: Option<String>,
    pub expr: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub agg: Option<String>,
    #[serde(default)]
    pub stored_values: bool,
}

#[derive(Debug, Deserialize)]
pub struct DeployDatasetsEntityRelationshipsRequest {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub type_: String,
}

#[derive(Serialize)]
pub struct DeployDatasetsResponse {
    pub results: Vec<ValidationResult>,
    pub summary: DeploymentSummary,
}

#[derive(Serialize)]
pub struct DeploymentSummary {
    pub total_models: usize,
    pub successful_models: usize,
    pub failed_models: usize,
    pub successes: Vec<DeploymentSuccess>,
    pub failures: Vec<DeploymentFailure>,
}

#[derive(Serialize)]
pub struct DeploymentSuccess {
    pub model_name: String,
    pub data_source_name: String,
    pub schema: String,
}

#[derive(Serialize)]
pub struct DeploymentFailure {
    pub model_name: String,
    pub data_source_name: String,
    pub schema: String,
    pub errors: Vec<ValidationError>,
}

#[derive(Debug, Deserialize)]
pub struct BusterModel {
    pub version: i32,
    pub models: Vec<Model>,
}

#[derive(Debug, Deserialize)]
pub struct Model {
    pub name: String,
    pub data_source_name: Option<String>,
    pub schema: Option<String>,
    pub env: String,
    pub description: String,
    pub model: Option<String>,
    #[serde(rename = "type")]
    pub type_: String,
    pub entities: Vec<Entity>,
    pub dimensions: Vec<Dimension>,
    pub measures: Vec<Measure>,
}

#[derive(Debug, Deserialize)]
pub struct Entity {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub entity_type: String,
}

#[derive(Debug, Deserialize)]
pub struct Dimension {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub dimension_type: String,
    pub description: String,
    pub searchable: bool,
}

#[derive(Debug, Deserialize)]
pub struct Measure {
    pub name: String,
    pub expr: String,
    pub agg: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
pub struct BatchValidationRequest {
    pub datasets: Vec<DatasetValidationRequest>,
}

#[derive(Debug, Deserialize)]
pub struct DatasetValidationRequest {
    pub dataset_id: Option<Uuid>,
    pub name: String,
    pub schema: String,
    pub data_source_name: String,
    pub columns: Vec<DeployDatasetsColumnsRequest>,
}

#[derive(Debug, Serialize)]
pub struct BatchValidationResult {
    pub successes: Vec<DatasetValidationSuccess>,
    pub failures: Vec<DatasetValidationFailure>,
}

#[derive(Debug, Serialize)]
pub struct DatasetValidationSuccess {
    pub dataset_id: Uuid,
    pub name: String,
    pub schema: String,
    pub data_source_name: String,
}

#[derive(Debug, Serialize)]
pub struct DatasetValidationFailure {
    pub dataset_id: Option<Uuid>,
    pub name: String,
    pub schema: String,
    pub data_source_name: String,
    pub errors: Vec<ValidationError>,
}

pub async fn deploy_datasets(
    Extension(user): Extension<User>,
    Json(request): Json<DeployDatasetsRequest>,
) -> Result<ApiResponse<DeployDatasetsResponse>, (StatusCode, String)> {
    let organization_id = match get_user_organization_id(&user.id).await {
        Ok(id) => id,
        Err(e) => {
            tracing::error!("Error getting user organization id: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error getting user organization id".to_string(),
            ));
        }
    };

    match is_user_workspace_admin_or_data_admin(&user, &organization_id).await {
        Ok(true) => (),
        Ok(false) => {
            return Err((
                StatusCode::FORBIDDEN,
                "Insufficient permissions".to_string(),
            ))
        }
        Err(e) => {
            tracing::error!("Error checking user permissions: {:?}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    }

    let is_simple = match request {
        DeployDatasetsRequest::Full(_) => false,
        DeployDatasetsRequest::Simple { .. } => true,
        DeployDatasetsRequest::Batch(_) => false,
    };

    match request {
        DeployDatasetsRequest::Batch(batch_request) => {
            let batch_result = batch_validate_datasets(&user.id, batch_request.datasets).await?;
            
            // Convert batch result to deployment response format
            let results = batch_result
                .successes
                .iter()
                .map(|s| ValidationResult {
                    success: true,
                    model_name: s.name.clone(),
                    data_source_name: s.data_source_name.clone(),
                    schema: s.schema.clone(),
                    errors: vec![],
                })
                .chain(batch_result.failures.iter().map(|f| ValidationResult {
                    success: false,
                    model_name: f.name.clone(),
                    data_source_name: f.data_source_name.clone(),
                    schema: f.schema.clone(),
                    errors: f.errors.clone(),
                }))
                .collect();

            Ok(ApiResponse::JsonData(DeployDatasetsResponse {
                results,
                summary: DeploymentSummary {
                    total_models: batch_result.successes.len() + batch_result.failures.len(),
                    successful_models: batch_result.successes.len(),
                    failed_models: batch_result.failures.len(),
                    successes: batch_result
                        .successes
                        .iter()
                        .map(|s| DeploymentSuccess {
                            model_name: s.name.clone(),
                            data_source_name: s.data_source_name.clone(),
                            schema: s.schema.clone(),
                        })
                        .collect(),
                    failures: batch_result
                        .failures
                        .iter()
                        .map(|f| DeploymentFailure {
                            model_name: f.name.clone(),
                            data_source_name: f.data_source_name.clone(),
                            schema: f.schema.clone(),
                            errors: f.errors.clone(),
                        })
                        .collect(),
                },
            }))
        }
        _ => {
            let requests = process_deploy_request(request).await?;
            let results = deploy_datasets_handler(&user.id, requests, is_simple).await?;

            let successful_models = results.iter().filter(|r| r.success).count();
            let failed_models = results.iter().filter(|r| !r.success).count();

            let successes = results
                .iter()
                .filter(|r| r.success)
                .map(|r| DeploymentSuccess {
                    model_name: r.model_name.clone(),
                    data_source_name: r.data_source_name.clone(),
                    schema: r.schema.clone(),
                })
                .collect();

            let failures = results
                .iter()
                .filter(|r| !r.success)
                .map(|r| DeploymentFailure {
                    model_name: r.model_name.clone(),
                    data_source_name: r.data_source_name.clone(),
                    schema: r.schema.clone(),
                    errors: r.errors.clone(),
                })
                .collect();

            Ok(ApiResponse::JsonData(DeployDatasetsResponse {
                results,
                summary: DeploymentSummary {
                    total_models: results.len(),
                    successful_models,
                    failed_models,
                    successes,
                    failures,
                },
            }))
        }
    }
}

// Handler function that contains all the business logic
async fn deploy_datasets_handler(
    user_id: &Uuid,
    requests: Vec<FullDeployDatasetsRequest>,
    is_simple: bool,
) -> Result<Vec<ValidationResult>> {
    let organization_id = get_user_organization_id(user_id).await?;
    let mut conn = get_pg_pool().get().await?;
    let mut results = Vec::new();

    // Validate required fields for all requests first
    for req in &requests {
        let mut validation = ValidationResult::new(
            req.name.clone(),
            req.data_source_name.clone(),
            req.schema.clone(),
        );

        // Validate required fields
        if req.name.is_empty() {
            validation.add_error(ValidationError {
                error_type: ValidationErrorType::RequiredFieldMissing,
                message: "Model name is required".to_string(),
                column_name: None,
                suggestion: Some("Add a name field to your model definition".to_string()),
            });
        }

        if req.data_source_name.is_empty() {
            validation.add_error(ValidationError {
                error_type: ValidationErrorType::RequiredFieldMissing,
                message: "Data source name is required".to_string(),
                column_name: None,
                suggestion: Some("Add data_source_name to your model or buster.yml".to_string()),
            });
        }

        if req.schema.is_empty() {
            validation.add_error(ValidationError {
                error_type: ValidationErrorType::RequiredFieldMissing,
                message: "Schema is required".to_string(),
                column_name: None,
                suggestion: Some("Add schema to your model or buster.yml".to_string()),
            });
        }

        if req.columns.is_empty() {
            validation.add_error(ValidationError {
                error_type: ValidationErrorType::RequiredFieldMissing,
                message: "At least one column is required".to_string(),
                column_name: None,
                suggestion: Some("Add dimensions or measures to your model".to_string()),
            });
        }

        // If validation failed, add to results and continue to next request
        if !validation.success {
            results.push(validation);
            continue;
        }

        // Get data source for this request
        let data_source = match data_sources::table
            .filter(data_sources::name.eq(&req.data_source_name))
            .filter(data_sources::env.eq(&req.env))
            .filter(data_sources::organization_id.eq(organization_id))
            .filter(data_sources::deleted_at.is_null())
            .select(data_sources::all_columns)
            .first::<DataSource>(&mut conn)
            .await
        {
            Ok(ds) => ds,
            Err(_) => {
                validation.add_error(ValidationError {
                    error_type: ValidationErrorType::DataSourceNotFound,
                    message: format!("Data source '{}' not found", req.data_source_name),
                    column_name: None,
                    suggestion: Some(format!(
                        "Verify that data source '{}' exists and you have access to it",
                        req.data_source_name
                    )),
                });
                results.push(validation);
                continue;
            }
        };

        // Extract columns for validation
        let columns: Vec<(&str, &str)> = req
            .columns
            .iter()
            .map(|c| (c.name.as_str(), c.type_.as_deref().unwrap_or("text")))
            .collect();

        // Extract expressions for validation
        let expressions: Vec<(&str, &str)> = req
            .columns
            .iter()
            .filter_map(|c| c.expr.as_ref().map(|expr| (c.name.as_str(), expr.as_str())))
            .collect();

        // Validate model
        let validation = match validate_model(
            &req.name,
            &req.name,
            &req.schema,
            &data_source,
            &columns,
            if expressions.is_empty() {
                None
            } else {
                Some(&expressions)
            },
            None, // Skip relationship validation
        )
        .await
        {
            Ok(v) => v,
            Err(e) => {
                let mut validation = ValidationResult::new(
                    req.name.clone(),
                    req.data_source_name.clone(),
                    req.schema.clone(),
                );
                validation.add_error(ValidationError::data_source_error(format!(
                    "Error validating model: {}",
                    e
                )));
                validation
            }
        };

        results.push(validation.clone());

        // Only deploy if validation passed
        if validation.success {
            if let Err(e) = deploy_single_model(&req, &organization_id, user_id).await {
                let mut failed_validation = validation;
                failed_validation.success = false;
                failed_validation.add_error(ValidationError::data_source_error(e.to_string()));
                results.pop();
                results.push(failed_validation);
            }
        }
    }

    Ok(results)
}

async fn process_deploy_request(
    request: DeployDatasetsRequest,
) -> Result<Vec<FullDeployDatasetsRequest>> {
    match request {
        DeployDatasetsRequest::Full(requests) => Ok(requests),
        DeployDatasetsRequest::Simple { id, sql, yml } => {
            let model: BusterModel = serde_yaml::from_str(&yml)?;
            let mut requests = Vec::new();

            // Try to parse buster.yml config from the yml content
            let config: Option<BusterConfig> = if let Ok(cfg) = serde_yaml::from_str(&yml) {
                Some(cfg)
            } else {
                None
            };

            for semantic_model in model.models {
                // Create the view in the data source
                let mut columns = Vec::new();

                // Process dimensions
                for dim in semantic_model.dimensions {
                    columns.push(DeployDatasetsColumnsRequest {
                        name: dim.name,
                        description: dim.description,
                        semantic_type: Some(String::from("dimension")),
                        expr: Some(dim.expr),
                        type_: Some(dim.dimension_type),
                        agg: None,
                        stored_values: dim.searchable,
                    });
                }

                // Process measures
                for measure in semantic_model.measures {
                    columns.push(DeployDatasetsColumnsRequest {
                        name: measure.name,
                        description: measure.description,
                        semantic_type: Some(String::from("measure")),
                        expr: Some(measure.expr),
                        type_: None,
                        agg: Some(measure.agg),
                        stored_values: false,
                    });
                }

                // Process entity relationships
                let entity_relationships = semantic_model
                    .entities
                    .into_iter()
                    .map(|entity| DeployDatasetsEntityRelationshipsRequest {
                        name: entity.name,
                        expr: entity.expr,
                        type_: entity.entity_type,
                    })
                    .collect();

                // Resolve data source name and schema from model or config
                let data_source_name = semantic_model
                    .data_source_name
                    .or_else(|| config.as_ref().and_then(|c| c.data_source_name.clone()))
                    .ok_or_else(|| {
                        anyhow!("data_source_name is required in model or buster.yml")
                    })?;

                let schema = semantic_model
                    .schema
                    .or_else(|| config.as_ref().and_then(|c| c.schema.clone()))
                    .ok_or_else(|| anyhow!("schema is required in model or buster.yml"))?;

                requests.push(FullDeployDatasetsRequest {
                    id: Some(id),
                    data_source_name,
                    env: semantic_model.env,
                    type_: semantic_model.type_,
                    name: semantic_model.name,
                    model: semantic_model.model,
                    schema,
                    description: semantic_model.description,
                    sql_definition: Some(sql.clone()),
                    entity_relationships: Some(entity_relationships),
                    columns,
                    yml_file: Some(yml.clone()),
                });
            }

            Ok(requests)
        }
        DeployDatasetsRequest::Batch(batch_request) => {
            let mut requests = Vec::new();
            for request in batch_request.datasets {
                let mut columns = Vec::new();
                for col in request.columns {
                    columns.push(col);
                }
                requests.push(FullDeployDatasetsRequest {
                    id: request.dataset_id,
                    data_source_name: request.data_source_name,
                    env: "batch".to_string(),
                    type_: "batch".to_string(),
                    name: request.name,
                    model: None,
                    schema: request.schema,
                    description: "batch".to_string(),
                    sql_definition: None,
                    entity_relationships: None,
                    columns,
                    yml_file: None,
                });
            }
            Ok(requests)
        }
    }
}

async fn deploy_single_model(
    req: &FullDeployDatasetsRequest,
    organization_id: &Uuid,
    user_id: &Uuid,
) -> Result<()> {
    let mut conn = get_pg_pool().get().await?;
    let database_name = req.name.replace(" ", "_");

    // Get data source
    let data_source = data_sources::table
        .filter(data_sources::name.eq(&req.data_source_name))
        .filter(data_sources::env.eq(&req.env))
        .filter(data_sources::organization_id.eq(organization_id))
        .select(data_sources::all_columns)
        .first::<DataSource>(&mut conn)
        .await?;

    // Create or update dataset
    let dataset = Dataset {
        id: req.id.unwrap_or_else(|| Uuid::new_v4()),
        name: req.name.clone(),
        data_source_id: data_source.id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        database_name,
        when_to_use: Some(req.description.clone()),
        when_not_to_use: None,
        type_: DatasetType::View,
        definition: req.sql_definition.clone().unwrap_or_default(),
        schema: req.schema.clone(),
        enabled: true,
        created_by: user_id.to_owned(),
        updated_by: user_id.to_owned(),
        deleted_at: None,
        imported: false,
        organization_id: organization_id.to_owned(),
        model: req.model.clone(),
        yml_file: req.yml_file.clone(),
    };

    // Insert or update dataset
    let dataset = diesel::insert_into(datasets::table)
        .values(&dataset)
        .on_conflict(datasets::id)
        .do_update()
        .set(&dataset)
        .returning(Dataset::as_select())
        .get_result(&mut conn)
        .await?;

    // Get column types from data source
    let mut source_columns = get_column_types(&dataset, &data_source).await?;

    // Update columns with request information
    for col in &mut source_columns {
        if let Some(req_col) = req.columns.iter().find(|c| c.name == col.name) {
            col.description = Some(req_col.description.clone());
            col.semantic_type = req_col.semantic_type.clone();
            col.dim_type = req_col.type_.clone();
            col.expr = req_col.expr.clone();
            col.searchable = req_col.stored_values;
        }
    }

    // Add relationship columns
    if let Some(relationships) = &req.entity_relationships {
        for rel in relationships {
            source_columns.push(ColumnUpdate {
                name: rel.expr.clone(),
                description: None,
                semantic_type: None,
                type_: "text".to_string(), // Default type for relationship columns
                nullable: true,
                dim_type: Some(rel.type_.clone()),
                expr: Some(rel.expr.clone()),
                searchable: false,
            });
        }
    }

    // Update columns in database
    update_dataset_columns(&dataset, source_columns).await?;

    Ok(())
}

async fn batch_validate_datasets(
    user_id: &Uuid,
    requests: Vec<DatasetValidationRequest>,
) -> Result<BatchValidationResult> {
    let mut successes = Vec::new();
    let mut failures = Vec::new();
    let organization_id = get_user_organization_id(user_id).await?;

    // Group requests by data source for efficient validation
    let mut data_source_groups: HashMap<String, Vec<(&DatasetValidationRequest, Vec<(&str, &str)>)>> = HashMap::new();
    
    for request in &requests {
        let columns: Vec<(&str, &str)> = request
            .columns
            .iter()
            .map(|c| (c.name.as_str(), c.type_.as_deref().unwrap_or("text")))
            .collect();

        data_source_groups
            .entry(request.data_source_name.clone())
            .or_default()
            .push((request, columns));
    }

    // Process each data source group
    for (data_source_name, group) in data_source_groups {
        // Get data source
        let data_source = match get_data_source_by_name(&data_source_name, &organization_id).await {
            Ok(ds) => ds,
            Err(e) => {
                for (request, _) in group {
                    failures.push(DatasetValidationFailure {
                        dataset_id: request.dataset_id,
                        name: request.name.clone(),
                        schema: request.schema.clone(),
                        data_source_name: request.data_source_name.clone(),
                        errors: vec![ValidationError::data_source_not_found(
                            format!("Data source not found: {}", e),
                        )],
                    });
                }
                continue;
            }
        };

        // Prepare tables for batch validation
        let tables_to_validate: Vec<(String, String)> = group
            .iter()
            .map(|(req, _)| (req.name.clone(), req.schema.clone()))
            .collect();

        // Get credentials
        let credentials = match get_data_source_credentials(
            &data_source.secret_id,
            &data_source.type_,
            false,
        )
        .await
        {
            Ok(creds) => creds,
            Err(e) => {
                for (request, _) in group {
                    failures.push(DatasetValidationFailure {
                        dataset_id: request.dataset_id,
                        name: request.name.clone(),
                        schema: request.schema.clone(),
                        data_source_name: request.data_source_name.clone(),
                        errors: vec![ValidationError::data_source_error(
                            format!("Failed to get data source credentials: {}", e),
                        )],
                    });
                }
                continue;
            }
        };

        // Get all columns in one batch
        let ds_columns = match retrieve_dataset_columns_batch(&tables_to_validate, &credentials).await {
            Ok(cols) => cols,
            Err(e) => {
                for (request, _) in group {
                    failures.push(DatasetValidationFailure {
                        dataset_id: request.dataset_id,
                        name: request.name.clone(),
                        schema: request.schema.clone(),
                        data_source_name: request.data_source_name.clone(),
                        errors: vec![ValidationError::data_source_error(
                            format!("Failed to get columns from data source: {}", e),
                        )],
                    });
                }
                continue;
            }
        };

        // Validate each dataset in the group
        for (request, columns) in group {
            let mut validation_errors = Vec::new();

            // Filter columns for this dataset
            let dataset_columns: Vec<_> = ds_columns
                .iter()
                .filter(|col| col.dataset_name == request.name && col.schema_name == request.schema)
                .collect();

            if dataset_columns.is_empty() {
                validation_errors.push(ValidationError::table_not_found(&request.name));
            } else {
                // Validate each column exists
                for (col_name, _) in &columns {
                    if !dataset_columns.iter().any(|c| c.name == *col_name) {
                        validation_errors.push(ValidationError::column_not_found(col_name));
                    }
                }
            }

            if validation_errors.is_empty() {
                // Create or update dataset
                match create_or_update_dataset(request, &organization_id, user_id).await {
                    Ok(dataset_id) => {
                        successes.push(DatasetValidationSuccess {
                            dataset_id,
                            name: request.name.clone(),
                            schema: request.schema.clone(),
                            data_source_name: request.data_source_name.clone(),
                        });
                    }
                    Err(e) => {
                        failures.push(DatasetValidationFailure {
                            dataset_id: request.dataset_id,
                            name: request.name.clone(),
                            schema: request.schema.clone(),
                            data_source_name: request.data_source_name.clone(),
                            errors: vec![ValidationError::data_source_error(
                                format!("Failed to create/update dataset: {}", e),
                            )],
                        });
                    }
                }
            } else {
                failures.push(DatasetValidationFailure {
                    dataset_id: request.dataset_id,
                    name: request.name.clone(),
                    schema: request.schema.clone(),
                    data_source_name: request.data_source_name.clone(),
                    errors: validation_errors,
                });
            }
        }
    }

    Ok(BatchValidationResult {
        successes,
        failures,
    })
}

async fn create_or_update_dataset(
    request: &DatasetValidationRequest,
    organization_id: &Uuid,
    user_id: &Uuid,
) -> Result<Uuid> {
    let mut conn = get_pg_pool().get().await?;
    let now = Utc::now();

    // Start transaction
    let mut tx = conn.begin().await?;

    let dataset_id = match request.dataset_id {
        Some(id) => {
            // Update existing dataset
            diesel::update(datasets::table)
                .filter(datasets::id.eq(id))
                .set((
                    datasets::name.eq(&request.name),
                    datasets::updated_at.eq(now),
                    datasets::updated_by.eq(user_id),
                ))
                .execute(&mut tx)
                .await?;
            id
        }
        None => {
            // Create new dataset
            let dataset = Dataset {
                id: Uuid::new_v4(),
                name: request.name.clone(),
                data_source_id: Uuid::new_v4(), // This needs to be set correctly
                created_at: now,
                updated_at: now,
                database_name: request.name.clone(),
                when_to_use: None,
                when_not_to_use: None,
                type_: DatasetType::View,
                definition: String::new(),
                schema: request.schema.clone(),
                enabled: false,
                created_by: user_id.clone(),
                updated_by: user_id.clone(),
                deleted_at: None,
                imported: false,
                organization_id: organization_id.clone(),
                yml_file: None,
                model: None,
            };

            diesel::insert_into(datasets::table)
                .values(&dataset)
                .execute(&mut tx)
                .await?;

            dataset.id
        }
    };

    // Update columns
    let columns: Vec<DatasetColumn> = request
        .columns
        .iter()
        .map(|col| DatasetColumn {
            id: Uuid::new_v4(),
            dataset_id,
            name: col.name.clone(),
            type_: col.type_.clone().unwrap_or_else(|| "text".to_string()),
            description: Some(col.description.clone()),
            nullable: true, // This should be determined from the source
            created_at: now,
            updated_at: now,
            deleted_at: None,
            stored_values: None,
            stored_values_status: None,
            stored_values_error: None,
            stored_values_count: None,
            stored_values_last_synced: None,
            semantic_type: col.semantic_type.clone(),
            dim_type: None,
            expr: col.expr.clone(),
        })
        .collect();

    // Delete existing columns not in the new set
    diesel::delete(dataset_columns::table)
        .filter(dataset_columns::dataset_id.eq(dataset_id))
        .execute(&mut tx)
        .await?;

    // Insert new columns
    diesel::insert_into(dataset_columns::table)
        .values(&columns)
        .execute(&mut tx)
        .await?;

    // Commit transaction
    tx.commit().await?;

    Ok(dataset_id)
}
