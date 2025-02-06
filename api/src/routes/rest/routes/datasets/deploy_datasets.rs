use anyhow::{anyhow, Result};
use axum::{extract::Json, Extension};
use chrono::{DateTime, Utc};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl, SelectableHelper};
use diesel_async::RunQueryDsl;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::collections::HashSet;
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
            import_dataset_columns::retrieve_dataset_columns,
            write_query_engine::write_query_engine,
        },
        security::checks::is_user_workspace_admin_or_data_admin,
        stored_values::{process_stored_values_background, store_column_values, StoredValueColumn},
        user::user_info::get_user_organization_id,
        validation::{dataset_validation::validate_model, ValidationError, ValidationResult},
        ColumnUpdate,
    },
};

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum DeployDatasetsRequest {
    Full(Vec<FullDeployDatasetsRequest>),
    Simple { id: Uuid, sql: String, yml: String },
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
}

#[derive(Debug, Deserialize)]
pub struct BusterModel {
    pub version: i32,
    pub models: Vec<Model>,
}

#[derive(Debug, Deserialize)]
pub struct Model {
    pub name: String,
    pub data_source_name: String,
    pub schema: String,
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
}

#[derive(Debug, Deserialize)]
pub struct Measure {
    pub name: String,
    pub expr: String,
    pub agg: String,
    pub description: String,
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
    };

    let requests = match process_deploy_request(request).await {
        Ok(requests) => requests,
        Err(e) => {
            tracing::error!("Error processing deploy request: {:?}", e);
            return Err((StatusCode::BAD_REQUEST, e.to_string()));
        }
    };

    // Call the handler with processed requests
    match deploy_datasets_handler(&user.id, requests, is_simple).await {
        Ok(results) => Ok(ApiResponse::JsonData(DeployDatasetsResponse { results })),
        Err(e) => {
            tracing::error!("Error in deploy_datasets_handler: {:?}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
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

    // Get all data sources upfront to avoid multiple queries
    let data_sources = data_sources::table
        .filter(
            data_sources::name.eq_any(
                requests
                    .iter()
                    .map(|r| r.data_source_name.clone())
                    .collect::<Vec<String>>(),
            ),
        )
        .filter(
            data_sources::env.eq_any(
                requests
                    .iter()
                    .map(|r| r.env.clone())
                    .collect::<Vec<String>>(),
            ),
        )
        .filter(data_sources::organization_id.eq(organization_id))
        .filter(data_sources::deleted_at.is_null())
        .select(data_sources::all_columns)
        .load::<DataSource>(&mut conn)
        .await?;

    for req in requests {
        // Get data source for this request
        let data_source = match data_sources
            .iter()
            .find(|ds| ds.name == req.data_source_name && ds.env == req.env)
        {
            Some(ds) => ds,
            None => {
                let mut validation = ValidationResult::new(
                    req.name.clone(),
                    req.data_source_name.clone(),
                    req.schema.clone(),
                );
                validation.add_error(ValidationError::data_source_error(format!(
                    "Data source not found: {}",
                    req.data_source_name
                )));
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

        // Extract relationships for validation
        let relationships: Vec<(&str, &str, &str)> = req
            .entity_relationships
            .as_ref()
            .map(|rels| {
                rels.iter()
                    .map(|r| (r.name.as_str(), r.expr.as_str(), r.type_.as_str()))
                    .collect()
            })
            .unwrap_or_default();

        // Validate model
        let validation = match validate_model(
            &req.name,
            &req.name, // database name same as model name
            &req.schema,
            data_source,
            &columns,
            if expressions.is_empty() {
                None
            } else {
                Some(&expressions)
            },
            if relationships.is_empty() {
                None
            } else {
                Some(&relationships)
            },
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
                        stored_values: false,
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

                requests.push(FullDeployDatasetsRequest {
                    id: Some(id),
                    data_source_name: semantic_model.data_source_name,
                    env: semantic_model.env,
                    type_: semantic_model.type_,
                    name: semantic_model.name,
                    model: semantic_model.model,
                    schema: semantic_model.schema,
                    description: semantic_model.description,
                    sql_definition: Some(sql.clone()),
                    entity_relationships: Some(entity_relationships),
                    columns,
                    yml_file: Some(yml.clone()),
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
            });
        }
    }

    // Update columns in database
    update_dataset_columns(&dataset, source_columns).await?;

    Ok(())
}
