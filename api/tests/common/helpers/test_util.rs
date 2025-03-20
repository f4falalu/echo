use anyhow::Result;
use database::pool::get_pg_pool;
use diesel::{Connection, ConnectionResult, PgConnection, QueryResult, RunQueryDsl, Table};
use diesel_async::{AsyncPgConnection, RunQueryDsl as AsyncRunQueryDsl};
use std::fmt::Debug;

/// Helper function to temporarily drop and recreate tables for testing
pub async fn with_table_dropped<T>(tables: &[&T]) -> Result<()>
where
    T: Table + Debug,
    T::AllColumns: diesel::QueryId,
{
    let mut conn = get_pg_pool().get().await?;
    
    // Delete all data from tables
    for table in tables {
        diesel::delete(table)
            .execute(&mut conn)
            .await
            .unwrap_or_default();
    }
    
    Ok(())
}