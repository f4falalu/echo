//! SQL Analyzer Library
//!
//! This library provides functionality to parse and analyze SQL queries,
//! extracting tables, columns, joins, and CTEs with lineage tracing.
//! Designed for integration with a Tokio-based web server.

use anyhow::Result;

pub mod types;
pub mod utils;
mod errors;

pub use errors::SqlAnalyzerError;
pub use types::{QuerySummary, TableInfo, JoinInfo, CteSummary};

/// Analyzes a SQL query and returns a summary with lineage information.
///
/// # Arguments
/// * `sql` - The SQL query string to analyze.
///
/// # Returns
/// A `Result` containing either a `QuerySummary` with detailed analysis
/// or a `SqlAnalyzerError` if parsing fails or vague references are found.
///
/// # Examples
/// ```no_run
/// use sql_analyzer::analyze_query;
/// 
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     let sql = "WITH cte AS (SELECT u.id FROM schema.users u) SELECT * FROM cte JOIN schema.orders o ON cte.id = o.user_id";
///     let summary = analyze_query(sql.to_string()).await?;
///     println!("{:?}", summary);
///     Ok(())
/// }
/// ```
pub async fn analyze_query(sql: String) -> Result<QuerySummary, SqlAnalyzerError> {
    let summary = tokio::task::spawn_blocking(move || {
        utils::analyze_sql(&sql)
    })
    .await
    .map_err(|e| SqlAnalyzerError::Internal(anyhow::anyhow!("Task join error: {}", e)))??;

    Ok(summary)
}