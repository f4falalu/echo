// This file will contain the new dataset deployment handler logic. 

use anyhow::Result;
use chrono::{DateTime, Utc};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::Deserialize; // Added for DeployDatasetsRequest if it's moved or redefined here
use std::collections::{HashMap, HashSet};
use uuid::Uuid;
use tracing::{error, info, warn};

// Types from this crate's parent (handlers) -> Corrected to super
use super::types::{ValidationError, ValidationResult, DeployDatasetsRequest}; // Added DeployDatasetsRequest

// Corrected to use the `database` crate directly as per Cargo.toml
use database::{{
    enums::DatasetType,
    models::{{DataSource, Dataset}},
    pool::get_pg_pool,
    schema::{{data_sources, datasets}},
}};

// TODO: Define or import necessary structs like DeployDatasetsRequest, DataSource, Dataset, etc.
// For now, let's assume DeployDatasetsRequest will be passed in.
// The actual database models (DataSource, Dataset) will need to be accessible.
// This might involve adding `database` features to this handler crate or using fully qualified paths.

// Local definition of DeployDatasetsRequest removed, it is now imported from super::types

// Simplified handler function
pub async fn deploy_datasets_handler_core(
    user_id: &Uuid,
    organization_id: Uuid, // Pass organization_id directly
    requests: Vec<DeployDatasetsRequest>, // This now uses the imported DeployDatasetsRequest
    // conn: &mut AsyncPgConnection, // Or get a connection from a pool passed in/accessible globally
) -> Result<Vec<ValidationResult>> {
    // Temporary: Get a connection. This needs to be replaced with proper DB connection management.
    let mut conn = database::pool::get_pg_pool().get().await?; // This path is incorrect from here

    let mut results = Vec::new();

    let mut data_source_groups: HashMap<
        (String, String, Option<String>),
        Vec<&DeployDatasetsRequest>,
    > = HashMap::new();
    for req in &requests {
        data_source_groups
            .entry((
                req.data_source_name.clone(),
                req.env.clone(),
                req.database.clone(),
            ))
            .or_default()
            .push(req);
    }

    for ((data_source_name, env, _database), group) in data_source_groups {
        // Get data source
        let data_source = match database::schema::data_sources::table // Incorrect path
            .filter(database::schema::data_sources::name.eq(&data_source_name))
            .filter(database::schema::data_sources::env.eq(&env))
            .filter(database::schema::data_sources::organization_id.eq(&organization_id))
            .filter(database::schema::data_sources::deleted_at.is_null())
            .select(database::schema::data_sources::all_columns)
            .first::<database::models::DataSource>(&mut conn) // Incorrect path
            .await
        {
            Ok(ds) => ds,
            Err(e) => {
                error!(
                    "Data source '{}' not found for env '{}': {}",
                    data_source_name, env, e
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
                continue;
            }
        };

        let request_db_names: Vec<String> = group.iter().map(|req| req.name.clone()).collect();
        let existing_dataset_ids: HashMap<String, Uuid> = match database::schema::datasets::table // Incorrect path
            .filter(database::schema::datasets::data_source_id.eq(data_source.id))
            .filter(database::schema::datasets::database_name.eq_any(&request_db_names))
            .select((database::schema::datasets::database_name, database::schema::datasets::id))
            .load::<(String, Uuid)>(&mut conn)
            .await
        {
            Ok(ids) => ids.into_iter().collect(),
            Err(e) => {
                error!("Failed to retrieve existing dataset IDs for data source '{}': {}", data_source_name, e);
                return Err(anyhow::anyhow!("Failed to retrieve existing dataset IDs: {}", e));
            }
        };

        let mut datasets_to_upsert_map: HashMap<(String, Uuid), database::models::Dataset> = HashMap::new(); // Incorrect path

        for req in group.clone() {
            let mut validation = ValidationResult::new(
                req.name.clone(),
                req.data_source_name.clone(),
                req.schema.clone(),
            );
            validation.success = true;
            results.push(validation); // Add to results early

            let now = Utc::now();
            let dataset_id = existing_dataset_ids.get(&req.name).copied().unwrap_or_else(|| req.id.unwrap_or_else(Uuid::new_v4));

            let dataset = database::models::Dataset { // Incorrect path
                id: dataset_id,
                name: req.name.clone(),
                data_source_id: data_source.id,
                created_at: now,
                updated_at: now,
                database_name: req.name.clone(),
                when_to_use: Some(req.description.clone()),
                when_not_to_use: None,
                type_: database::enums::DatasetType::View, // Incorrect path
                definition: req.sql_definition.clone().unwrap_or_default(), // Still keeping SQL definition
                schema: req.schema.clone(),
                enabled: true,
                created_by: *user_id,
                updated_by: *user_id,
                deleted_at: None,
                imported: false,
                organization_id: organization_id,
                model: req.model.clone(),
                yml_file: req.yml_file.clone(), // Ensure yml_file is included
                database_identifier: req.database_identifier.clone(), // This was req.database before, ensure it's correct
            };
            datasets_to_upsert_map.insert((req.name.clone(), data_source.id), dataset);
        }

        let datasets_to_upsert: Vec<database::models::Dataset> = datasets_to_upsert_map.into_values().collect(); // Incorrect path

        if !datasets_to_upsert.is_empty() {
            let now = Utc::now();
            match diesel::insert_into(database::schema::datasets::table) // Incorrect path
                .values(&datasets_to_upsert)
                .on_conflict((database::schema::datasets::database_name, database::schema::datasets::data_source_id)) // Incorrect path
                .do_update()
                .set((
                    database::schema::datasets::name.eq(excluded(database::schema::datasets::name)),
                    database::schema::datasets::updated_at.eq(now),
                    database::schema::datasets::updated_by.eq(excluded(database::schema::datasets::updated_by)),
                    database::schema::datasets::definition.eq(excluded(database::schema::datasets::definition)),
                    database::schema::datasets::when_to_use.eq(excluded(database::schema::datasets::when_to_use)),
                    database::schema::datasets::model.eq(excluded(database::schema::datasets::model)),
                    database::schema::datasets::yml_file.eq(excluded(database::schema::datasets::yml_file)), // Upsert yml_file
                    database::schema::datasets::schema.eq(excluded(database::schema::datasets::schema)),
                    database::schema::datasets::database_identifier.eq(excluded(database::schema::datasets::database_identifier)),
                    database::schema::datasets::enabled.eq(excluded(database::schema::datasets::enabled)),
                    database::schema::datasets::deleted_at.eq(None::<DateTime<Utc>>),
                ))
                .execute(&mut conn)
                .await
            {
                Ok(_) => info!("Successfully upserted {} datasets for data source '{}'", datasets_to_upsert.len(), data_source_name),
                Err(e) => {
                    error!("Failed to bulk upsert datasets for data source '{}': {}", data_source_name, e);
                    // Mark all results for this group as failed
                    for req_in_group in group {
                         if let Some(validation_result) = results.iter_mut().find(|r| r.model_name == req_in_group.name && r.data_source_name == req_in_group.data_source_name) {
                            validation_result.add_error(ValidationError::internal_error(format!("Failed to upsert dataset: {}", e)));
                        }
                    }
                    // Optionally, you might want to return early here or collect errors and continue
                    // For now, let's just log and the results will reflect the failure.
                }
            };
            // Column processing is skipped as per requirements.
            // Stored values sync job logic is also skipped as it depends on columns.
        } else {
            info!("No datasets to upsert for data source '{}'", data_source_name);
        }
    }

    Ok(results)
}

// IMPORTANT: The database interaction parts (marked with // Incorrect path)
// need to be resolved. This handler needs access to:
// 1. A database connection pool (e.g., `get_pg_pool()`).
// 2. Database models (`DataSource`, `Dataset`).
// 3. Diesel schema (`data_sources`, `datasets`).
// 4. Enums (`DatasetType`).

// This likely means the `handlers` crate needs a "database" or "models" feature flag,
// or these types need to be passed in or accessed via a shared context/crate.
// For example, `database::pool::get_pg_pool()` would need to be changed to something like `shared_db::pool::get()`.
// Similarly for models like `database::models::Dataset` -> `shared_db::models::Dataset`.
// And schema `database::schema::datasets::table` -> `shared_db::schema::datasets::table`. 