//! SQL Analyzer Library
//!
//! This library provides functionality to parse and analyze SQL queries,
//! extracting tables, columns, joins, and CTEs with lineage tracing.
//! It also includes semantic layer validation and substitution capabilities
//! to support querying with predefined metrics and filters.
//! Designed for integration with a Tokio-based web server.

use anyhow::Result;
use std::collections::HashMap;

pub mod types;
pub mod utils;
mod errors;

pub use errors::SqlAnalyzerError;
pub use types::{
    QuerySummary, TableInfo, JoinInfo, CteSummary, 
    SemanticLayer, ValidationMode, Metric, Filter, 
    Parameter, ParameterType, Relationship
};
pub use utils::semantic;

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

/// Validates a SQL query against semantic layer rules.
///
/// # Arguments
/// * `sql` - The SQL query string to validate.
/// * `semantic_layer` - The semantic layer metadata containing tables, metrics, filters, and relationships.
/// * `mode` - The validation mode (Strict or Flexible).
///
/// # Returns
/// A `Result` that is Ok if validation passes, or an Error with validation issues.
///
/// # Examples
/// ```no_run
/// use sql_analyzer::{validate_semantic_query, SemanticLayer, ValidationMode};
/// 
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     let sql = "SELECT u.id, metric_UserSpending FROM users u JOIN orders o ON u.id = o.user_id";
///     let semantic_layer = SemanticLayer::new();
///     // Add tables, metrics, filters, and relationships to semantic_layer...
///     
///     let result = validate_semantic_query(sql.to_string(), semantic_layer, ValidationMode::Strict).await;
///     match result {
///         Ok(_) => println!("Query is valid according to semantic layer rules"),
///         Err(e) => println!("Validation failed: {}", e),
///     }
///     Ok(())
/// }
/// ```
pub async fn validate_semantic_query(
    sql: String,
    semantic_layer: SemanticLayer,
    mode: ValidationMode,
) -> Result<(), SqlAnalyzerError> {
    tokio::task::spawn_blocking(move || {
        semantic::validate_query(&sql, &semantic_layer, mode)
    })
    .await
    .map_err(|e| SqlAnalyzerError::Internal(anyhow::anyhow!("Task join error: {}", e)))??;

    Ok(())
}

/// Substitutes metrics and filters in a SQL query with their expressions.
///
/// # Arguments
/// * `sql` - The SQL query string with metrics and filters to substitute.
/// * `semantic_layer` - The semantic layer metadata containing metric and filter definitions.
///
/// # Returns
/// A `Result` containing the substituted SQL query or an error.
///
/// # Examples
/// ```no_run
/// use sql_analyzer::{substitute_semantic_query, SemanticLayer};
/// 
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     let sql = "SELECT u.id, metric_UserSpending FROM users u JOIN orders o ON u.id = o.user_id";
///     let semantic_layer = SemanticLayer::new();
///     // Add tables, metrics, filters, and relationships to semantic_layer...
///     
///     let substituted_sql = substitute_semantic_query(sql.to_string(), semantic_layer).await?;
///     println!("Substituted SQL: {}", substituted_sql);
///     Ok(())
/// }
/// ```
pub async fn substitute_semantic_query(
    sql: String,
    semantic_layer: SemanticLayer,
) -> Result<String, SqlAnalyzerError> {
    let substituted = tokio::task::spawn_blocking(move || {
        semantic::substitute_query(&sql, &semantic_layer)
    })
    .await
    .map_err(|e| SqlAnalyzerError::Internal(anyhow::anyhow!("Task join error: {}", e)))??;

    Ok(substituted)
}

/// Validates and substitutes a SQL query using semantic layer rules.
///
/// This function first validates the query against semantic layer rules
/// and then substitutes metrics and filters with their expressions.
///
/// # Arguments
/// * `sql` - The SQL query string to validate and substitute.
/// * `semantic_layer` - The semantic layer metadata.
/// * `mode` - The validation mode (Strict or Flexible).
///
/// # Returns
/// A `Result` containing the substituted SQL query or an error.
///
/// # Examples
/// ```no_run
/// use sql_analyzer::{validate_and_substitute_semantic_query, SemanticLayer, ValidationMode};
/// 
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     let sql = "SELECT u.id, metric_UserSpending FROM users u JOIN orders o ON u.id = o.user_id";
///     let semantic_layer = SemanticLayer::new();
///     // Add tables, metrics, filters, and relationships to semantic_layer...
///     
///     let result = validate_and_substitute_semantic_query(
///         sql.to_string(), 
///         semantic_layer, 
///         ValidationMode::Flexible
///     ).await;
///     
///     match result {
///         Ok(query) => println!("Substituted SQL: {}", query),
///         Err(e) => println!("Validation or substitution failed: {}", e),
///     }
///     Ok(())
/// }
/// ```
pub async fn validate_and_substitute_semantic_query(
    sql: String,
    semantic_layer: SemanticLayer,
    mode: ValidationMode,
) -> Result<String, SqlAnalyzerError> {
    let result = tokio::task::spawn_blocking(move || {
        semantic::validate_and_substitute(&sql, &semantic_layer, mode)
    })
    .await
    .map_err(|e| SqlAnalyzerError::Internal(anyhow::anyhow!("Task join error: {}", e)))??;

    Ok(result)
}

/// Applies row-level filters to a SQL query by replacing table references with filtered CTEs.
///
/// This function takes a SQL query and a map of table names to filter expressions,
/// and rewrites the query to apply the filters at the table level using CTEs.
///
/// # Arguments
/// * `sql` - The SQL query string to rewrite.
/// * `table_filters` - A map where keys are table names and values are filter expressions (WHERE clauses).
///
/// # Returns
/// A `Result` containing the rewritten SQL query or an error.
///
/// # Examples
/// ```no_run
/// use sql_analyzer::apply_row_level_filters;
/// use std::collections::HashMap;
///
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     let sql = "SELECT u.id, o.amount FROM users u JOIN orders o ON u.id = o.user_id";
///     let mut filters = HashMap::new();
///     filters.insert("users".to_string(), "tenant_id = 123".to_string());
///     filters.insert("orders".to_string(), "created_at > '2023-01-01'".to_string());
///
///     let filtered_sql = apply_row_level_filters(sql.to_string(), filters).await?;
///     println!("Filtered SQL: {}", filtered_sql);
///     Ok(())
/// }
/// ```
pub async fn apply_row_level_filters(
    sql: String,
    table_filters: HashMap<String, String>,
) -> Result<String, SqlAnalyzerError> {
    let result = tokio::task::spawn_blocking(move || {
        semantic::apply_row_level_filters(&sql, table_filters)
    })
    .await
    .map_err(|e| SqlAnalyzerError::Internal(anyhow::anyhow!("Task join error: {}", e)))??;

    Ok(result)
}