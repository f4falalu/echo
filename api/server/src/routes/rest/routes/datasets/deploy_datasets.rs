#![allow(dead_code, unused_imports, unused_variables)]

use anyhow::Result;
use axum::{extract::Json, Extension};
use chrono::{DateTime, Utc};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::AuthenticatedUser;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

// Import from handlers library
use handlers::utils::user::user_info::get_user_organization_id;

use crate::{
    database::{
        enums::DatasetType,
        models::{DataSource, Dataset, DatasetColumn},
        pool::get_pg_pool,
        schema::{data_sources, dataset_columns, datasets},
    },
    routes::rest::ApiResponse,
    utils::security::checks::is_user_workspace_admin_or_data_admin,
};

#[derive(Debug, Deserialize)]
pub struct BusterConfig {
    pub data_source_name: Option<String>,
    pub schema: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DeployDatasetsRequest {
    pub id: Option<Uuid>,
    pub data_source_name: String,
    pub env: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub name: String,
    pub model: Option<String>,
    pub schema: String,
    pub database: Option<String>,
    pub description: String,
    pub sql_definition: Option<String>,
    pub entity_relationships: Option<Vec<DeployDatasetsEntityRelationshipsRequest>>,
    pub columns: Vec<DeployDatasetsColumnsRequest>,
    pub yml_file: Option<String>,
    pub database_identifier: Option<String>,
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
    pub database: Option<String>,
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

// Main API endpoint function
pub async fn deploy_datasets(
    Extension(user): Extension<AuthenticatedUser>,
    Json(request): Json<Vec<DeployDatasetsRequest>>,
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

    // Check permissions
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

    // Call handler function
    match handle_deploy_datasets(&user.id, request).await {
        Ok(result) => Ok(ApiResponse::JsonData(result)),
        Err(e) => {
            tracing::error!("Error in deploy_datasets: {:?}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
        }
    }
}

// Main handler function that contains all business logic
async fn handle_deploy_datasets(
    user_id: &Uuid,
    requests: Vec<DeployDatasetsRequest>,
) -> Result<DeployDatasetsResponse> {
    let results = deploy_datasets_handler(user_id, requests, false).await?;

    let successful_models = results.iter().filter(|r| r.success).count();
    let failed_models = results.iter().filter(|r| !r.success).count();

    let summary = DeploymentSummary {
        total_models: results.len(),
        successful_models,
        failed_models,
        successes: results
            .iter()
            .filter(|r| r.success)
            .map(|r| DeploymentSuccess {
                model_name: r.model_name.clone(),
                data_source_name: r.data_source_name.clone(),
                schema: r.schema.clone(),
            })
            .collect(),
        failures: results
            .iter()
            .filter(|r| !r.success)
            .map(|r| DeploymentFailure {
                model_name: r.model_name.clone(),
                data_source_name: r.data_source_name.clone(),
                schema: r.schema.clone(),
                errors: r.errors.clone(),
            })
            .collect(),
    };

    Ok(DeployDatasetsResponse { results, summary })
}

// Handler function that contains all the business logic
async fn deploy_datasets_handler(
    user_id: &Uuid,
    requests: Vec<DeployDatasetsRequest>,
    _is_simple: bool,
) -> Result<Vec<ValidationResult>> {
    let organization_id = get_user_organization_id(user_id).await?;
    let mut conn = get_pg_pool().get().await?;
    let mut results = Vec::new();

    // Group requests by data source and database for efficient processing
    let mut data_source_groups: HashMap<
        (String, String, Option<String>),
        Vec<&DeployDatasetsRequest>,
    > = HashMap::new();
    for req in &requests {
        // Group by data_source_name, env, and optional database
        data_source_groups
            .entry((
                req.data_source_name.clone(),
                req.env.clone(),
                req.database.clone(),
            ))
            .or_default()
            .push(req);
    }

    // Process each data source group
    for ((data_source_name, env, _database), group) in data_source_groups {
        // Get data source ID - still needed to link datasets
        let data_source = match data_sources::table
            .filter(data_sources::name.eq(&data_source_name))
            .filter(data_sources::env.eq(&env)) // Use env from group key
            .filter(data_sources::organization_id.eq(&organization_id))
            .filter(data_sources::deleted_at.is_null())
            .select(data_sources::all_columns) // Select needed columns, maybe just ID
            .first::<DataSource>(&mut conn)
            .await
        {
            Ok(ds) => ds,
            Err(e) => {
                tracing::error!(
                    "Data source '{}' not found for env '{}': {}",
                    data_source_name,
                    env,
                    e
                );
                for req in group {
                    let mut validation = ValidationResult::new(
                        req.name.clone(),
                        req.data_source_name.clone(),
                        req.schema.clone(),
                    );
                    validation.add_error(ValidationError::data_source_error(format!(
                        "Data source '{}' not found for environment '{}'",
                        data_source_name, env
                    )));
                    results.push(validation);
                }
                continue; // Skip this group if data source not found
            }
        };

        // Process all requests in the group directly
        let mut datasets_to_upsert_map: HashMap<(String, Uuid), Dataset> = HashMap::new();
        let mut columns_to_upsert_map: HashMap<String, Vec<DatasetColumn>> = HashMap::new();
        let mut dataset_req_map: HashMap<String, &DeployDatasetsRequest> = HashMap::new(); // To map back after upsert

        for req in group.clone() {
            // Assume success unless DB operations fail
            let mut validation = ValidationResult::new(
                req.name.clone(),
                req.data_source_name.clone(),
                req.schema.clone(),
            );
            validation.success = true; // Start as successful
            results.push(validation); // Add to results now

            let now = Utc::now();
            let dataset_id = req.id.unwrap_or_else(Uuid::new_v4);

            // Prepare Dataset for upsert
            let dataset = Dataset {
                id: dataset_id,
                name: req.name.clone(),
                data_source_id: data_source.id, // Use fetched data source ID
                created_at: now,
                updated_at: now,
                database_name: req.name.clone(), // Use model name as database_name
                when_to_use: Some(req.description.clone()),
                when_not_to_use: None,
                type_: DatasetType::View, // Assuming View, adjust if needed
                definition: req.sql_definition.clone().unwrap_or_default(),
                schema: req.schema.clone(),
                enabled: true,
                created_by: user_id.clone(),
                updated_by: user_id.clone(),
                deleted_at: None,
                imported: false, // Mark as not imported from source
                organization_id: organization_id.clone(),
                model: req.model.clone(),
                yml_file: req.yml_file.clone(),
                database_identifier: req.database.clone(),
            };
            // Use HashMap for deduplication before bulk insert
            datasets_to_upsert_map.insert((req.name.clone(), data_source.id), dataset);
            dataset_req_map.insert(req.name.clone(), req); // Store request for column processing later

            // Prepare Columns for this dataset
            let mut current_dataset_columns = Vec::new();
            let mut column_name_set = HashSet::new(); // For deduplication within request

            for col_req in &req.columns {
                // Deduplicate columns within the same request
                if column_name_set.insert(col_req.name.clone()) {
                    let dataset_column = DatasetColumn {
                        id: Uuid::new_v4(),
                        dataset_id: dataset_id, // Temporarily use generated/provided ID
                        name: col_req.name.clone(),
                        type_: col_req.type_.clone().unwrap_or_else(|| "text".to_string()),
                        description: Some(col_req.description.clone()),
                        nullable: true, // Assume nullable, source info not available
                        created_at: now,
                        updated_at: now,
                        deleted_at: None,
                        stored_values: None, // Fields related to stored values nullified
                        stored_values_status: None,
                        stored_values_error: None,
                        stored_values_count: None,
                        stored_values_last_synced: None,
                        semantic_type: col_req.semantic_type.clone(),
                        dim_type: col_req.type_.clone(), // Use type_ for dim_type? Adjust if needed
                        expr: col_req.expr.clone(),
                    };
                    current_dataset_columns.push(dataset_column);
                } else {
                    tracing::warn!(
                        "Duplicate column '{}' found in request for dataset '{}'. Skipping.",
                        col_req.name,
                        req.name
                    );
                }
            }
            columns_to_upsert_map.insert(req.name.clone(), current_dataset_columns);
        }

        // ---- BULK UPSERT DATA ----
        let datasets_to_upsert: Vec<Dataset> = datasets_to_upsert_map.into_values().collect();

        if !datasets_to_upsert.is_empty() {
            let now = Utc::now(); // Re-capture now for upsert timestamps

            // Log deduplication results
            if datasets_to_upsert.len() < group.len() {
                tracing::info!(
                    "Deduplicated {} dataset requests down to {} unique datasets for data source '{}'",
                    group.len(),
                    datasets_to_upsert.len(),
                    data_source_name
                );
            }

            // Bulk upsert datasets
            // Using ON CONFLICT (database_name, data_source_id)
            match diesel::insert_into(datasets::table)
                .values(&datasets_to_upsert)
                .on_conflict((datasets::database_name, datasets::data_source_id))
                .do_update()
                .set((
                    datasets::id.eq(excluded(datasets::id)), // Ensure ID is updated on conflict if new one generated
                    datasets::name.eq(excluded(datasets::name)),
                    datasets::updated_at.eq(now), // Use current time for update
                    datasets::updated_by.eq(excluded(datasets::updated_by)),
                    datasets::definition.eq(excluded(datasets::definition)),
                    datasets::when_to_use.eq(excluded(datasets::when_to_use)),
                    datasets::model.eq(excluded(datasets::model)),
                    datasets::yml_file.eq(excluded(datasets::yml_file)),
                    datasets::schema.eq(excluded(datasets::schema)),
                    datasets::database_identifier.eq(excluded(datasets::database_identifier)),
                    datasets::enabled.eq(excluded(datasets::enabled)), // Ensure enabled status is updated
                    datasets::deleted_at.eq(None::<DateTime<Utc>>), // Important: Undelete if re-deploying
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => (),
                Err(e) => {
                    tracing::error!(
                        "Failed to bulk upsert datasets for data source '{}': {}",
                        data_source_name,
                        e
                    );
                    // How to handle partial failures? Mark corresponding results as failed?
                    // For now, return a general error for the batch.
                    return Err(anyhow::anyhow!("Failed to upsert datasets: {}", e));
                }
            };

            // Get the final dataset IDs after upsert (using database_name and data_source_id)
            let upserted_dataset_names: Vec<String> = datasets_to_upsert
                .iter()
                .map(|d| d.database_name.clone())
                .collect();
            let final_dataset_ids: HashMap<String, Uuid> = match datasets::table
                .filter(datasets::data_source_id.eq(&data_source.id))
                .filter(datasets::database_name.eq_any(upserted_dataset_names))
                .filter(datasets::deleted_at.is_null())
                .select((datasets::database_name, datasets::id))
                .load::<(String, Uuid)>(&mut conn)
                .await
            {
                Ok(ids) => ids.into_iter().collect(),
                Err(e) => {
                    tracing::error!(
                        "Failed to retrieve dataset IDs after upsert for data source '{}': {}",
                        data_source_name,
                        e
                    );
                    return Err(anyhow::anyhow!(
                        "Failed to retrieve dataset IDs after upsert: {}",
                        e
                    ));
                }
            };

            // Bulk upsert columns for each dataset that was successfully upserted
            for (dataset_name, columns_for_dataset) in columns_to_upsert_map {
                let dataset_id = match final_dataset_ids.get(&dataset_name) {
                    Some(id) => *id,
                    None => {
                        tracing::error!(
                            "Dataset ID not found after upsert for dataset named '{}' in data source '{}'. Skipping column update.",
                            dataset_name, data_source_name
                        );
                        // Mark corresponding result as failed?
                        if let Some(validation) = results.iter_mut().find(|r| {
                            r.model_name == dataset_name && r.data_source_name == data_source_name
                        }) {
                            validation.success = false;
                            validation.add_error(ValidationError::internal_error(
                                "Dataset ID missing after upsert.".to_string(),
                            ));
                        }
                        continue; // Skip to next dataset's columns
                    }
                };

                // Update dataset_id in the prepared columns
                let final_columns: Vec<DatasetColumn> = columns_for_dataset
                    .into_iter()
                    .map(|mut col| {
                        col.dataset_id = dataset_id;
                        col
                    })
                    .collect();

                // Get current column names from DB for soft deletion logic
                let current_column_names: HashSet<String> = match dataset_columns::table
                    .filter(dataset_columns::dataset_id.eq(dataset_id))
                    .filter(dataset_columns::deleted_at.is_null())
                    .select(dataset_columns::name)
                    .load::<String>(&mut conn)
                    .await
                {
                    Ok(names) => names.into_iter().collect(),
                    Err(e) => {
                        tracing::error!(
                            "Failed to get current columns for dataset ID '{}': {}",
                            dataset_id,
                            e
                        );
                        // Mark corresponding result as failed?
                        if let Some(validation) = results.iter_mut().find(|r| {
                            r.model_name == dataset_name && r.data_source_name == data_source_name
                        }) {
                            validation.success = false;
                            validation.add_error(ValidationError::internal_error(format!(
                                "Failed to fetch current columns: {}",
                                e
                            )));
                        }
                        continue; // Skip column update for this dataset
                    }
                };

                // Get new column names from the request
                let new_column_names: HashSet<String> =
                    final_columns.iter().map(|c| c.name.clone()).collect();

                // Soft delete columns removed in the request
                let columns_to_delete: Vec<String> = current_column_names
                    .difference(&new_column_names)
                    .cloned()
                    .collect();

                if !columns_to_delete.is_empty() {
                    match diesel::update(dataset_columns::table)
                        .filter(dataset_columns::dataset_id.eq(dataset_id))
                        .filter(dataset_columns::name.eq_any(&columns_to_delete))
                        .filter(dataset_columns::deleted_at.is_null())
                        .set(dataset_columns::deleted_at.eq(now))
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => tracing::info!(
                            "Soft deleted {} columns for dataset ID '{}'",
                            columns_to_delete.len(),
                            dataset_id
                        ),
                        Err(e) => {
                            tracing::error!(
                                "Failed to soft delete columns for dataset ID '{}': {}",
                                dataset_id,
                                e
                            );
                            // Mark corresponding result as failed?
                            if let Some(validation) = results.iter_mut().find(|r| {
                                r.model_name == dataset_name
                                    && r.data_source_name == data_source_name
                            }) {
                                validation.success = false;
                                validation.add_error(ValidationError::internal_error(format!(
                                    "Failed to delete old columns: {}",
                                    e
                                )));
                            }
                            // Consider if we should continue or stop the whole process
                        }
                    };
                }

                // Bulk upsert columns
                if !final_columns.is_empty() {
                    match diesel::insert_into(dataset_columns::table)
                        .values(&final_columns)
                        .on_conflict((dataset_columns::dataset_id, dataset_columns::name))
                        .do_update()
                        .set((
                            dataset_columns::type_.eq(excluded(dataset_columns::type_)),
                            dataset_columns::description.eq(excluded(dataset_columns::description)),
                            dataset_columns::semantic_type
                                .eq(excluded(dataset_columns::semantic_type)),
                            dataset_columns::dim_type.eq(excluded(dataset_columns::dim_type)),
                            dataset_columns::expr.eq(excluded(dataset_columns::expr)),
                            dataset_columns::nullable.eq(excluded(dataset_columns::nullable)), // Update nullable status
                            dataset_columns::updated_at.eq(now), // Use current time for update
                            dataset_columns::deleted_at.eq(None::<DateTime<Utc>>), // Undelete if needed
                        ))
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => (),
                        Err(e) => {
                            tracing::error!(
                                "Failed to bulk upsert columns for dataset ID '{}': {}",
                                dataset_id,
                                e
                            );
                            // Mark corresponding result as failed?
                            if let Some(validation) = results.iter_mut().find(|r| {
                                r.model_name == dataset_name
                                    && r.data_source_name == data_source_name
                            }) {
                                validation.success = false;
                                validation.add_error(ValidationError::internal_error(format!(
                                    "Failed to upsert columns: {}",
                                    e
                                )));
                            }
                            // Consider if we should continue or stop the whole process
                        }
                    };
                }
            }
        } else {
            tracing::info!(
                "No datasets to upsert for data source '{}'",
                data_source_name
            );
        }
    } // End of loop through data_source_groups

    Ok(results)
}

// --- Local Struct Definitions --- (No import needed for these within this file)
#[derive(Debug, Serialize, Clone)] // Make Cloneable if needed by results.push(validation)
pub struct ValidationResult {
    pub model_name: String,
    pub data_source_name: String,
    pub schema: String,
    pub success: bool,
    pub errors: Vec<ValidationError>,
}

impl ValidationResult {
    fn new(model_name: String, data_source_name: String, schema: String) -> Self {
        Self {
            model_name,
            data_source_name,
            schema,
            success: true,
            errors: Vec::new(),
        }
    }

    fn add_error(&mut self, error: ValidationError) {
        self.success = false;
        self.errors.push(error);
    }
}

#[derive(Debug, Serialize, Clone)] // Make Cloneable if needed by errors.clone()
pub struct ValidationError {
    pub code: String,
    pub message: String,
    pub location: Option<String>, // e.g., "column: column_name"
}

impl ValidationError {
    fn data_source_error(message: String) -> Self {
        Self {
            code: "DATA_SOURCE_ERROR".to_string(),
            message,
            location: None,
        }
    }

     fn internal_error(message: String) -> Self {
        Self {
            code: "INTERNAL_ERROR".to_string(),
            message,
            location: None,
        }
    }

    // Add other factory methods if they were used (e.g., table_not_found, column_not_found)
    // fn table_not_found(table_name: &str) -> Self {
    //     Self {
    //         code: "TABLE_NOT_FOUND".to_string(),
    //         message: format!("Table '{}' not found in data source.", table_name),
    //         location: None,
    //     }
    // }
    // fn column_not_found(column_name: &str) -> Self {
    //     Self {
    //         code: "COLUMN_NOT_FOUND".to_string(),
    //         message: format!("Column '{}' not found in table.", column_name),
    //         location: Some(format!("column: {}", column_name)),
    //     }
    // }
}
// --- End Local Struct Definitions ---
