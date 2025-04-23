use anyhow::{Context, Result};
use sqlx::{Executor, FromRow, PgPool};
use tracing::debug;
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

/// Searches for values containing a specific substring within a data source's stored values table.
///
/// Allows optional filtering by database, schema, table, and column names stored
/// alongside the values. Results are ordered by id. Search is case-insensitive.
///
/// # Arguments
///
/// * `pool` - The `sqlx::PgPool` for database connections.
/// * `data_source_id` - The UUID of the data source, used to determine the schema name.
/// * `query` - The substring to search for within the `value` column.
/// * `limit` - The maximum number of results to return.
/// * `filter_database_name` - Optional filter for the source database name.
/// * `filter_schema_name` - Optional filter for the source schema name.
/// * `filter_table_name` - Optional filter for the source table name.
/// * `filter_column_name` - Optional filter for the source column name.
///
/// # Returns
///
/// A `Result` containing a `Vec` of `StoredValueResult` ordered by `id`.
pub async fn search_values_by_substring(
    pool: &PgPool,
    data_source_id: Uuid,
    query: String,
    limit: i64,
    filter_database_name: Option<String>,
    filter_schema_name: Option<String>,
    filter_table_name: Option<String>,
    filter_column_name: Option<String>,
) -> Result<Vec<StoredValueResult>> {
    let schema_name = format!("ds_{}", data_source_id.to_string().replace('-', "_"));

    // Construct the query with placeholders for filters and ordering
    // Uses ILIKE for case-insensitive substring matching.
    // Filters are applied using `($N::TEXT IS NULL OR column = $N)` pattern.
    let query_sql = format!(
        r#"
        SELECT
            id, value, database_name, column_name, table_name, schema_name, synced_at
        FROM
            "{schema_name}"."searchable_column_values"
        WHERE
            value ILIKE $1 -- Case-insensitive substring search
        AND ($2::TEXT IS NULL OR database_name = $2)
        AND ($3::TEXT IS NULL OR schema_name = $3)
        AND ($4::TEXT IS NULL OR table_name = $4)
        AND ($5::TEXT IS NULL OR column_name = $5)
        ORDER BY
            id -- Order by id instead of similarity
        LIMIT $6
        "#
    );

    debug!(
        %data_source_id,
        %schema_name,
        %query,
        ?filter_database_name,
        ?filter_schema_name,
        ?filter_table_name,
        ?filter_column_name,
        %limit,
        "Executing stored value substring search"
    );

    let results = sqlx::query_as::<_, StoredValueResult>(&query_sql)
        .bind(format!("%{}%", query))
        .bind(filter_database_name)
        .bind(filter_schema_name)
        .bind(filter_table_name)
        .bind(filter_column_name)
        .bind(limit)
        .fetch_all(pool)
        .await
        .with_context(|| format!("Failed to execute substring search query in schema '{}'", schema_name))?;

    Ok(results)
}

// Potential future tests would go here in a #[cfg(test)] mod tests { ... } block 