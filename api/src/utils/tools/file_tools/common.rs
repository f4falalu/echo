use anyhow::{anyhow, Result};
use tracing::debug;
use uuid::Uuid;

use crate::database_dep::{lib::get_pg_pool, schema::metric_files};
use crate::utils::query_engine::query_engine::query_engine;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;

/// Validates SQL query using existing query engine by attempting to run it
/// Returns Ok(()) if valid, Err with description if invalid
pub async fn validate_sql(sql: &str, dataset_id: &Uuid) -> Result<()> {
    debug!("Validating SQL query for dataset {}", dataset_id);

    if sql.trim().is_empty() {
        return Err(anyhow!("SQL query cannot be empty"));
    }

    // Try to execute the query using query_engine
    match query_engine(dataset_id, &sql.to_string()).await {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("SQL validation failed: {}", e)),
    }
}

/// Validates existence of metric IDs in database
/// Returns Result with list of missing IDs if any
pub async fn validate_metric_ids(ids: &[Uuid]) -> Result<Vec<Uuid>> {
    let mut conn = get_pg_pool().get().await?;

    // Query for existing IDs
    let existing_ids = metric_files::table
        .filter(metric_files::id.eq_any(ids))
        .filter(metric_files::deleted_at.is_null())
        .select(metric_files::id)
        .load::<Uuid>(&mut conn)
        .await?;

    // Find missing IDs by comparing with input IDs
    let missing_ids: Vec<Uuid> = ids
        .iter()
        .filter(|id| !existing_ids.contains(id))
        .cloned()
        .collect();

    Ok(missing_ids)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_validate_sql_empty() {
        let dataset_id = Uuid::new_v4();
        let result = validate_sql("", &dataset_id).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("cannot be empty"));
    }

    // Note: We'll need integration tests with a real database for testing actual SQL validation
    // Unit tests can only cover basic cases like empty SQL
}
