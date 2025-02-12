use anyhow::{anyhow, Result};
use axum::{extract::Json, Extension};
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::collections::HashMap;
use uuid::Uuid;

use crate::{
    database::{
        lib::get_pg_pool,
        models::{Dataset, DataSource, User},
        schema::{data_sources, datasets},
    },
    routes::rest::ApiResponse,
    utils::{
        security::checks::is_user_workspace_admin_or_data_admin,
        user::user_info::get_user_organization_id,
        query_engine::{
            credentials::get_data_source_credentials,
            import_dataset_columns::{retrieve_dataset_columns_batch, DatasetColumnRecord},
        },
    },
};

#[derive(Debug, Deserialize)]
pub struct GenerateDatasetRequest {
    pub data_source_name: String,
    pub schema: String,
    pub database: Option<String>,
    pub model_names: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct GenerateDatasetResponse {
    pub yml_contents: HashMap<String, String>,
    pub errors: HashMap<String, String>,
}

#[derive(Debug, Serialize)]
struct ModelConfig {
    models: Vec<Model>,
}

#[derive(Debug, Serialize)]
struct Model {
    name: String,
    description: String,
    dimensions: Vec<Dimension>,
}

#[derive(Debug, Serialize)]
struct Dimension {
    name: String,
    expr: String,
    #[serde(rename = "type")]
    type_: String,
    description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    searchable: Option<bool>,
}

pub async fn generate_datasets(
    Extension(user): Extension<User>,
    Json(request): Json<GenerateDatasetRequest>,
) -> Result<ApiResponse<GenerateDatasetResponse>, (StatusCode, String)> {
    // Check if user is workspace admin or data admin
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
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error checking user permissions".to_string(),
            ));
        }
    }

    match generate_datasets_handler(&request, &organization_id).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error generating datasets: {:?}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error generating datasets".to_string(),
            ))
        }
    }
}

async fn generate_datasets_handler(
    request: &GenerateDatasetRequest,
    organization_id: &Uuid,
) -> Result<GenerateDatasetResponse> {
    let mut conn = get_pg_pool().get().await?;

    // Get data source
    let data_source = match data_sources::table
        .filter(data_sources::name.eq(&request.data_source_name))
        .filter(data_sources::organization_id.eq(organization_id))
        .filter(data_sources::deleted_at.is_null())
        .first::<DataSource>(&mut conn)
        .await
    {
        Ok(ds) => ds,
        Err(e) => return Err(anyhow!("Data source not found: {}", e)),
    };

    // Get credentials
    let credentials = get_data_source_credentials(&data_source.secret_id, &data_source.type_, false).await?;

    // Prepare tables for batch validation
    let tables_to_validate: Vec<(String, String)> = request
        .model_names
        .iter()
        .map(|name| (name.clone(), request.schema.clone()))
        .collect();

    // Get all columns in one batch
    let ds_columns = match retrieve_dataset_columns_batch(&tables_to_validate, &credentials, request.database.clone()).await {
        Ok(cols) => cols,
        Err(e) => return Err(anyhow!("Failed to get columns from data source: {}", e)),
    };

    // Check for existing datasets (just for logging/info purposes)
    let existing_datasets: HashMap<String, Dataset> = datasets::table
        .filter(datasets::data_source_id.eq(&data_source.id))
        .filter(datasets::deleted_at.is_null())
        .load::<Dataset>(&mut conn)
        .await?
        .into_iter()
        .map(|d| (d.name.clone(), d))
        .collect();

    let mut yml_contents = HashMap::new();
    let mut errors = HashMap::new();

    // Process each model
    for model_name in &request.model_names {
        // Log if dataset already exists
        if existing_datasets.contains_key(model_name) {
            tracing::info!("Dataset {} already exists", model_name);
        }

        match generate_model_yaml(model_name, &ds_columns, &request.schema).await {
            Ok(yaml) => {
                yml_contents.insert(model_name.clone(), yaml);
            }
            Err(e) => {
                errors.insert(model_name.clone(), e.to_string());
            }
        }
    }

    Ok(GenerateDatasetResponse {
        yml_contents,
        errors,
    })
}

async fn generate_model_yaml(
    model_name: &str,
    ds_columns: &[DatasetColumnRecord],
    schema: &str,
) -> Result<String> {
    // Filter columns for this model
    let model_columns: Vec<_> = ds_columns
        .iter()
        .filter(|col| {
            col.dataset_name.to_lowercase() == model_name.to_lowercase()
                && col.schema_name.to_lowercase() == schema.to_lowercase()
        })
        .collect();

    if model_columns.is_empty() {
        return Err(anyhow!("No columns found for model"));
    }

    // Create dimensions from columns
    let dimensions: Vec<Dimension> = model_columns
        .iter()
        .map(|col| Dimension {
            name: col.name.clone(),
            expr: col.name.clone(),
            type_: col.type_.clone(),
            description: format!("Column {} from {}", col.name, model_name),
            searchable: Some(false),
        })
        .collect();

    let model = Model {
        name: model_name.to_string(),
        description: format!("Generated model for {}", model_name),
        dimensions,
    };

    let config = ModelConfig {
        models: vec![model],
    };

    let yaml = serde_yaml::to_string(&config)?;
    
    Ok(yaml)
} 