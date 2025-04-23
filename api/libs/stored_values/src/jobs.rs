// libs/stored_values/src/jobs.rs
use anyhow::{anyhow, Context, Result};
use chrono::Utc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use query_engine::data_source_query_routes::query_engine::query_engine;
use tracing::{error, info, warn};
use uuid::Uuid;
use litellm::{EmbeddingRequest, LiteLLMClient};
use sqlx::QueryBuilder;

use database::{
    models::StoredValuesSyncJob,
    pool::{get_pg_pool, get_sqlx_pool},
    schema::stored_values_sync_jobs,
};

// query_engine imports
use query_engine::data_types::DataType;

const SYNC_CHUNK_LIMIT: i64 = 1000;

/// Sets up a new sync job record for a specific column in the `stored_values_sync_jobs` table.
///
/// Initializes the job with a 'pending' status and null `last_synced_at`.
pub async fn setup_sync_job(
    data_source_id: Uuid,
    database_name: String,
    schema_name: String,
    table_name: String,
    column_name: String,
) -> Result<()> {
    info!(
        %data_source_id,
        %database_name,
        %schema_name,
        %table_name,
        %column_name,
        "Setting up new stored values sync job"
    );

    let pool = get_pg_pool();
    let mut conn = pool
        .get()
        .await
        .context("Failed to get DB connection for setting up sync job")?;

    let new_job = StoredValuesSyncJob {
        id: Uuid::new_v4(),
        data_source_id,
        database_name,
        schema_name,
        table_name,
        column_name,
        last_synced_at: None,
        created_at: Utc::now(),
        status: "pending".to_string(),
        error_message: None,
    };

    diesel::insert_into(stored_values_sync_jobs::table)
        .values(&new_job)
        .execute(&mut conn)
        .await
        .context("Failed to insert new stored values sync job")?;

    info!(job_id = %new_job.id, "Successfully set up sync job");
    Ok(())
}

/// Fetches distinct values in chunks using query_engine, generates embeddings,
/// and inserts both into the corresponding searchable_column_values table.
///
/// It iterates through all distinct values by repeatedly querying with LIMIT and OFFSET.
/// It also updates the corresponding `stored_values_sync_jobs` record with status
/// (`in_progress`, `success`, `error`) and `last_synced_at` timestamps.
///
/// WARNING: Identifier quoting used is basic and may not be safe for all DBs/names.
pub async fn sync_distinct_values_chunk(
    data_source_id: Uuid,
    database_name: String,
    schema_name: String,
    table_name: String,
    column_name: String,
) -> Result<usize> {
    let job_id = {
        let pool = get_pg_pool();
        let mut conn = pool
            .get()
            .await
            .context("Failed to get DB connection for finding job ID")?;
        stored_values_sync_jobs::table
            .filter(stored_values_sync_jobs::data_source_id.eq(data_source_id))
            .filter(stored_values_sync_jobs::database_name.eq(&database_name))
            .filter(stored_values_sync_jobs::schema_name.eq(&schema_name))
            .filter(stored_values_sync_jobs::table_name.eq(&table_name))
            .filter(stored_values_sync_jobs::column_name.eq(&column_name))
            .filter(stored_values_sync_jobs::status.eq("pending")) // Only pick up pending jobs
            .select(stored_values_sync_jobs::id)
            .order(stored_values_sync_jobs::created_at.desc()) // Get the most recent pending one
            .get_result::<Uuid>(&mut conn)
            .await
            .with_context(|| {
                format!(
                    "No pending sync job found for data_source_id={}, database={}, schema={}, table={}, column={}",
                    data_source_id,
                    database_name,
                    schema_name,
                    table_name,
                    column_name
                )
            })?
    };

    info!(
        %job_id,
        %data_source_id,
        %database_name,
        %schema_name,
        %table_name,
        %column_name,
        chunk_limit = SYNC_CHUNK_LIMIT,
        "Starting full sync of distinct values and embeddings for job"
    );

    // Set status to in_progress immediately
    if let Err(e) = update_job_status(job_id, "in_progress", None).await {
        error!(%job_id, "Failed to set job status to in_progress: {}. Aborting sync.", e);
        return Err(e); // Propagate the error
    }

    // Instantiate the LiteLLM Client
    let litellm_client = LiteLLMClient::default();

    // Wrap the core sync logic in a closure or block to handle errors centrally
    let sync_result: Result<usize, anyhow::Error> = async {
        let quote = "\"";
        let escape = format!("{0}{0}", quote);
        let q = |s: &str| s.replace(quote, &escape);

        let app_db_pool = get_sqlx_pool();
        let target_schema_name = format!("ds_{}", data_source_id.to_string().replace('-', "_"));
        let target_table_name = "searchable_column_values".to_string(); // Define target table name

        let mut offset: i64 = 0;
        let mut total_inserted_count: usize = 0;

        loop {
            let distinct_sql = format!(
                "SELECT DISTINCT {q}{col}{q} FROM {q}{schema}{q}.{q}{table}{q} ORDER BY 1 NULLS LAST LIMIT {limit} OFFSET {offset}",
                q = quote,
                col = q(&column_name),
                schema = q(&schema_name),
                table = q(&table_name),
                limit = SYNC_CHUNK_LIMIT,
                offset = offset
            );

            info!(%job_id, current_offset = offset, "Executing distinct query chunk via query_engine: {}", distinct_sql);
            let query_result = query_engine(&data_source_id, &distinct_sql, None)
                .await
                .with_context(|| {
                    format!(
                        "query_engine failed for distinct query chunk on {}.{}.{} at offset {}",
                        schema_name, table_name, column_name, offset
                    )
                })?;

            let fetched_count = query_result.data.len();
            if fetched_count == 0 {
                info!(%job_id, "Fetched 0 rows at offset {}, assuming end of data.", offset);
                break; // No more data
            }

            let mut values_to_process: Vec<String> = Vec::with_capacity(fetched_count);
            let result_column_name = q(&column_name);
            for row_map in query_result.data {
                if let Some(value_opt) = row_map.get(&result_column_name).and_then(|dt| match dt {
                    DataType::Text(Some(v)) => Some(v.clone()),
                    DataType::Int2(Some(v)) => Some(v.to_string()),
                    DataType::Int4(Some(v)) => Some(v.to_string()),
                    DataType::Int8(Some(v)) => Some(v.to_string()),
                    DataType::Float4(Some(v)) => Some(v.to_string()),
                    DataType::Float8(Some(v)) => Some(v.to_string()),
                    DataType::Bool(Some(v)) => Some(v.to_string()),
                    DataType::Date(Some(v)) => Some(v.to_string()),
                    DataType::Timestamp(Some(v)) => Some(v.to_string()),
                    DataType::Timestamptz(Some(v)) => Some(v.to_string()),
                    DataType::Json(Some(v)) => Some(v.to_string()),
                    DataType::Uuid(Some(v)) => Some(v.to_string()),
                    DataType::Decimal(Some(v)) => Some(v.to_string()),
                    DataType::Time(Some(v)) => Some(v.to_string()),
                    _ => None,
                }) {
                    if !value_opt.trim().is_empty() {
                        values_to_process.push(value_opt);
                    } else {
                        warn!(%job_id, "Skipping empty or whitespace-only string value.");
                    }
                } else {
                    warn!(%job_id, ?row_map, "Could not extract valid string value from row, skipping.");
                }
            }

            if values_to_process.is_empty() {
                info!(%job_id, fetched = fetched_count, "No non-null, non-empty string values extracted in this chunk at offset {}. Moving to next chunk.", offset);
                if (fetched_count as i64) < SYNC_CHUNK_LIMIT {
                    info!(%job_id, "Fetched less than limit ({}) at offset {}, assuming end of data.", fetched_count, offset);
                    break;
                }
                offset += SYNC_CHUNK_LIMIT;
                continue;
            }

            info!(%job_id, count = values_to_process.len(), "Generating embeddings for chunk...");
            let embedding_request = EmbeddingRequest {
                model: "text-embedding-3-small".to_string(),
                input: values_to_process.clone(), // Clone the values for the request
                dimensions: Some(1536),
                encoding_format: Some("float".to_string()),
                user: None, // Optional: Add user identifier if needed
            };

            let embedding_response = litellm_client
                .generate_embeddings(embedding_request)
                .await
                .context("Failed to generate embeddings via LiteLLMClient")?;

            if values_to_process.len() != embedding_response.data.len() {
                warn!(
                    %job_id,
                    input_count = values_to_process.len(),
                    output_count = embedding_response.data.len(),
                    "Mismatch between input count and embedding count for chunk. Skipping insertion for this chunk."
                );
                if (fetched_count as i64) < SYNC_CHUNK_LIMIT {
                    info!(%job_id, "Fetched less than limit ({}) at offset {}, assuming end of data.", fetched_count, offset);
                    break;
                }
                offset += SYNC_CHUNK_LIMIT;
                continue;
            }

            let values_with_formatted_embeddings: Vec<(String, String)> = values_to_process
                .into_iter()
                .zip(embedding_response.data.into_iter())
                .map(|(value, embedding_data)| {
                    let embedding_str = format!(
                        "[{}]",
                        embedding_data
                            .embedding
                            .iter()
                            .map(|f| f.to_string())
                            .collect::<Vec<String>>()
                            .join(",")
                    );
                    (value, embedding_str)
                })
                .collect();

            let mut query_builder: QueryBuilder<sqlx::Postgres> = QueryBuilder::new(format!(
                r#"INSERT INTO "{}"."{}" (value, database_name, schema_name, table_name, column_name, synced_at, embedding) VALUES "#,
                target_schema_name, target_table_name
            ));

            let mut first_row = true;
            for (value, embedding_str) in values_with_formatted_embeddings.iter() {
                if !first_row {
                    query_builder.push(", "); // Add comma between value rows
                }
                query_builder.push("("); // Start row values
                query_builder.push_bind(value);
                query_builder.push(", ");
                query_builder.push_bind(&database_name);
                query_builder.push(", ");
                query_builder.push_bind(&schema_name);
                query_builder.push(", ");
                query_builder.push_bind(&table_name);
                query_builder.push(", ");
                query_builder.push_bind(&column_name);
                query_builder.push(", ");
                query_builder.push_bind(Utc::now());
                query_builder.push(", ");
                // Explicitly cast the bound text parameter to halfvec
                query_builder.push("CAST(");
                query_builder.push_bind(embedding_str); // Bind the string
                query_builder.push(" AS halfvec)"); // Cast it to halfvec
                query_builder.push(")"); // End row values
                first_row = false;
            }

            query_builder.push(" ON CONFLICT DO NOTHING"); // Keep the conflict handling

            let query = query_builder.build();

            info!(%job_id, "Executing batch insert with embeddings...");
            match query.execute(app_db_pool).await {
                Ok(rows_affected) => {
                    let current_chunk_inserted = rows_affected.rows_affected() as usize;
                    total_inserted_count += current_chunk_inserted;
                    info!(
                        %job_id,
                        inserted_in_chunk = current_chunk_inserted,
                        total_inserted = total_inserted_count,
                        fetched_in_chunk = fetched_count, // Note: fetched_count includes rows that might have been skipped
                        current_offset = offset,
                        target_table = format!("{}.{}", target_schema_name, target_table_name),
                        "Processed distinct values chunk with embeddings"
                    );
                }
                Err(e) => {
                    error!(%job_id, "Database insert failed: {:?}", e);
                    return Err(anyhow::Error::new(e).context(format!(
                        "Failed to insert distinct values chunk with embeddings into {}.{}",
                        target_schema_name, target_table_name
                    )));
                }
            }

            if (fetched_count as i64) < SYNC_CHUNK_LIMIT {
                info!(%job_id, "Fetched less than limit ({}) at offset {}, assuming end of data.", fetched_count, offset);
                break;
            }

            offset += SYNC_CHUNK_LIMIT;
        }

        Ok(total_inserted_count)
    }.await;

    // Update status based on the result of the sync logic
    match sync_result {
        Ok(count) => {
            info!(%job_id, total_inserted_count = count, "Finished syncing distinct values and embeddings successfully.");
            // Update status to success
            if let Err(e) = update_job_status(job_id, "success", None).await {
                error!(%job_id, "Failed to set job status to success: {}", e);
                // Even though sync succeeded, we failed to update status, return error
                Err(e)
            } else {
                Ok(count)
            }
        }
        Err(e) => {
            error!(%job_id, "Syncing distinct values and embeddings failed: {}", e);
            // Update status to error and store the message
            let error_message = e.to_string();
            if let Err(update_err) = update_job_status(job_id, "error", Some(error_message)).await {
                error!(%job_id, "Additionally failed to set job status to error: {}", update_err);
                // Log both errors, but return the original sync error
                Err(anyhow!(
                    "Sync failed: {}. Also failed to update job status: {}",
                    e,
                    update_err
                ))
            } else {
                // Return the original sync error
                Err(e)
            }
        }
    }
}

/// Updates the status, last_synced_at, and optional error message for a sync job.
async fn update_job_status(
    job_id: Uuid,
    status: &str,
    error_message: Option<String>,
) -> Result<()> {
    info!(%job_id, %status, ?error_message, "Updating sync job status");

    let pool = get_pg_pool();
    let mut conn = pool
        .get()
        .await
        .context("Failed to get DB connection for updating sync job status")?;

    let current_time = Utc::now();

    diesel::update(stored_values_sync_jobs::table.find(job_id))
        .set((
            stored_values_sync_jobs::status.eq(status.to_string()),
            stored_values_sync_jobs::last_synced_at.eq(Some(current_time)),
            stored_values_sync_jobs::error_message.eq(error_message),
        ))
        .execute(&mut conn)
        .await
        .with_context(|| format!("Failed to update sync job status for job_id: {}", job_id))?;

    info!(%job_id, %status, "Successfully updated sync job status");
    Ok(())
}

/// Scans for sync jobs that are pending or haven't been successfully synced in the last 24 hours,
/// and triggers the sync process for each identified job in a separate background task.
pub async fn trigger_stale_sync_jobs() -> Result<()> {
    info!("Scanning for stale or pending stored values sync jobs...");

    let pool = get_pg_pool();
    let mut conn = pool
        .get()
        .await
        .context("Failed to get DB connection for scanning stale jobs")?;

    let twenty_four_hours_ago = Utc::now() - chrono::Duration::hours(24);

    // Find jobs that are pending OR were last synced > 24h ago (successfully or with error)
    let jobs_to_sync = stored_values_sync_jobs::table
        .filter(
            stored_values_sync_jobs::status.eq("pending").or(
                stored_values_sync_jobs::last_synced_at
                    .lt(twenty_four_hours_ago)
                    .and(stored_values_sync_jobs::status.ne("in_progress")), // Avoid re-triggering already running jobs
            ),
        )
        .load::<StoredValuesSyncJob>(&mut conn)
        .await
        .context("Failed to load sync jobs from database")?;

    let count = jobs_to_sync.len();
    info!("Found {} jobs to potentially sync.", count);

    for job in jobs_to_sync {
        info!(job_id = %job.id, status = %job.status, last_synced_at = ?job.last_synced_at, "Spawning sync task for job");

        // Clone the necessary data for the async task
        let ds_id = job.data_source_id;
        let db_name = job.database_name.clone();
        let sch_name = job.schema_name.clone();
        let tbl_name = job.table_name.clone();
        let col_name = job.column_name.clone();
        let job_id_for_task = job.id; // Capture job_id for logging inside task

        tokio::spawn(async move {
            info!(%job_id_for_task, "Background sync task started.");
            match sync_distinct_values_chunk(ds_id, db_name, sch_name, tbl_name, col_name).await {
                Ok(inserted_count) => {
                    info!(%job_id_for_task, %inserted_count, "Background sync task completed successfully.");
                }
                Err(e) => {
                    error!(%job_id_for_task, "Background sync task failed: {}", e);
                    // Note: sync_distinct_values_chunk already updates the job status to 'error'
                }
            }
        });
    }

    info!("Finished spawning {} sync tasks.", count);
    Ok(())
}

// Potential future functions:
// pub async fn get_pending_sync_jobs(...) -> Result<Vec<StoredValuesSyncJob>> { ... }
