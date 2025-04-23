use anyhow::{anyhow, Context, Result};
use sqlx::{Executor, FromRow, PgPool};
use tracing::{debug, warn};
use uuid::Uuid;

/// Represents a single search result from the searchable_column_values table.
#[derive(FromRow, Debug, Clone)]
pub struct StoredValueResult {
    pub id: Uuid,
    pub value: String,
    pub database_name: String,
    pub column_name: String,
    pub table_name: String,
    pub schema_name: String, // This is the schema within the source DB, not the Postgres schema
    pub synced_at: Option<chrono::DateTime<chrono::Utc>>,
}

// Constants for embedding
const EMBEDDING_MODEL: &str = "text-embedding-3-small"; // Or configure this

/// Searches for values based on semantic similarity using embeddings.
///
/// Assumes the target table has an `embedding` column of type `vector`.
/// Filters by source metadata and returns results ordered by similarity.
///
/// # Arguments
///
/// * `pool` - The `sqlx::PgPool` for database connections.
/// * `data_source_id` - UUID of the data source to construct the schema name.
/// * `query_embedding` - The pre-computed embedding slice for the query.
/// * `limit` - The maximum number of results.
/// * `filter_database_name` - Optional filter for the source database name.
/// * `filter_schema_name` - Optional filter for the source schema name.
/// * `filter_table_name` - Optional filter for the source table name.
/// * `filter_column_name` - Optional filter for the source column name.
/// * `similarity_threshold` - Minimum similarity score (1.0 - cosine distance). Values closer to 1.0 are more similar.
///
/// # Returns
///
/// A `Result` containing a `Vec` of `StoredValueResult` ordered by similarity.
pub async fn search_values_by_embedding(
    pool: &PgPool,
    data_source_id: Uuid,
    query_embedding: &[f32],
    limit: i64,
    filter_database_name: Option<String>,
    filter_schema_name: Option<String>,
    filter_table_name: Option<String>,
    filter_column_name: Option<String>,
    similarity_threshold: f32,
) -> Result<Vec<StoredValueResult>> {
    let schema_name = format!("ds_{}", data_source_id.to_string().replace('-', "_"));

    // 1. Validate embedding
    if query_embedding.is_empty() {
        warn!(%data_source_id, "search_values_by_embedding called with an empty embedding vector.");
        return Ok(vec![]); // Or return an error if appropriate
    }

    // 2. Format Vec<f32> into a PostgreSQL vector literal string: '[f1, f2, ..., fn]'
    let query_embedding_string = format!(
        "[{}]",
        query_embedding
            .iter()
            .map(|f| f.to_string())
            .collect::<Vec<String>>()
            .join(",")
    );

    // 3. Construct the Vector Search Query using raw string and explicit cast
    let query_sql = format!(
        r#"
        SELECT
            id, value, database_name, column_name, table_name, schema_name, synced_at
            -- Optionally select distance: , embedding <=> $1::vector AS distance
        FROM
            "{schema_name}"."searchable_column_values"
        WHERE
            embedding <=> $1::vector < $2 -- Use placeholder for string, cast to vector in SQL
        AND ($3::TEXT IS NULL OR database_name = $3)
        AND ($4::TEXT IS NULL OR schema_name = $4)
        AND ($5::TEXT IS NULL OR table_name = $5)
        AND ($6::TEXT IS NULL OR column_name = $6)
        ORDER BY
            embedding <=> $1::vector ASC -- Use placeholder for string, cast to vector in SQL
        LIMIT $7
        "#
    );

    let distance_threshold = 1.0 - similarity_threshold;

    debug!(
        %data_source_id,
        %schema_name,
        embedding_len = query_embedding.len(),
        %similarity_threshold,
        %distance_threshold,
        %query_embedding_string,
        ?filter_database_name,
        ?filter_schema_name,
        ?filter_table_name,
        ?filter_column_name,
        %limit,
        "Executing stored value embedding search with pre-computed embedding"
    );

    // 4. Execute the Query binding the string representation
    let results = sqlx::query_as::<_, StoredValueResult>(&query_sql)
        .bind(&query_embedding_string)
        .bind(distance_threshold)
        .bind(filter_database_name)
        .bind(filter_schema_name)
        .bind(filter_table_name)
        .bind(filter_column_name)
        .bind(limit)
        .fetch_all(pool)
        .await
        .with_context(|| {
            format!(
                "Failed to execute embedding search query in schema '{}' using raw string",
                schema_name
            )
        })?;

    Ok(results)
}

// Rename the original function or remove it if no longer needed
// pub async fn search_values_by_substring(...) -> Result<Vec<StoredValueResult>> { ... } 

// Tests would need updating to handle embeddings and mocks for LiteLLM 