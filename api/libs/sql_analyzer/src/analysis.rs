use anyhow::Result;
use crate::{
    types::QuerySummary,
    errors::SqlAnalyzerError,
    utils,
};

/// Analyzes a SQL query and returns a summary with lineage information.
///
/// (Original documentation and examples included here)
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