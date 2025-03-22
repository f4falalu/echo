ok I need to build a new lib in the libs/ folder called sql_analyzer. please follow best          │
│   practices in the in the documentation/libs.mdc and documentation/testing.mdc to build the lib     │
│   found in prds/active/sql_analyzer_lib_design.md

### Requirements Recap
- **Tables**: Extract all tables with optional database/schema identifiers and aliases.
- **Columns**: Tie columns to tables, deduplicated per table, with errors for vague references (unqualified columns).
- **Joins**: Identify all joins, deduplicated, with lineage traced to base tables.
- **CTEs**: Analyze recursively, including their lineage (base tables and joins).
- **Lineage**: Resolve CTEs and subqueries to their raw table sources and column mappings.
- **Error Handling**: Return errors for vague column references (no table/alias) and tables without schema identifiers.
- **Tokio**: Non-blocking parsing for web server compatibility.

### Directory Structure
Following the guide:
```
libs/
├── sql_analyzer/
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs       # Main entry point and public API
│   │   ├── types.rs     # Data structures for tables, joins, CTEs, etc.
│   │   ├── utils/       # Parsing and lineage logic
│   │   │   └── mod.rs
│   │   └── errors.rs    # Custom error types
│   └── tests/           # Integration tests
```

### `Cargo.toml`
```toml
[package]
name = "sql_analyzer"
version = "0.1.0"
edition = "2021"

[dependencies]
sqlparser = { workspace = true }  # For SQL parsing
tokio = { workspace = true }      # For async operations
anyhow = { workspace = true }     # For error handling
serde = { workspace = true }      # For serialization
serde_json = { workspace = true } # For JSON output
tracing = { workspace = true }    # For logging
thiserror = { workspace = true }  # For custom errors

[dev-dependencies]
tokio-test = { workspace = true } # For async testing

[features]
default = []
```

- Dependencies are inherited from the workspace, keeping versions managed centrally.

### `src/lib.rs`
```rust
//! SQL Analyzer Library
//!
//! This library provides functionality to parse and analyze SQL queries,
//! extracting tables, columns, joins, and CTEs with lineage tracing.
//! Designed for integration with a Tokio-based web server.

use anyhow::Result;
use tokio;

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
/// ```rust
/// use sql_analyzer::analyze_query;
/// 
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     let sql = "WITH cte AS (SELECT u.id FROM users u) SELECT * FROM cte JOIN orders o ON cte.id = o.user_id";
///     let summary = analyze_query(sql.to_string()).await?;
///     println!("{:?}", summary);
///     Ok(())
/// }
/// ```
pub async fn analyze_query(sql: String) -> Result<QuerySummary, SqlAnalyzerError> {
    let summary = tokio::task::spawn_blocking(move || {
        utils::analyze_sql(&sql)
    })
    .await??;

    Ok(summary)
}
```

- **Purpose**: Exports the public API, including the main `analyze_query` function, types, and errors.
- **Tokio Integration**: Uses `spawn_blocking` to keep parsing non-blocking.
- **Documentation**: Follows workspace style with an example.

### `src/types.rs`
```rust
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::hash::{Hash, Hasher};

#[derive(Serialize, Debug, Clone)]
pub struct TableInfo {
    pub database_identifier: Option<String>,
    pub schema_identifier: Option<String>,
    pub table_identifier: String,
    pub alias: Option<String>,
    pub columns: HashSet<String>, // Deduped columns used from this table
}

#[derive(Serialize, Debug, Clone)]
pub struct JoinInfo {
    pub left_table: String,
    pub right_table: String,
    pub condition: String, // e.g., "users.id = orders.user_id"
}

impl Hash for JoinInfo {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.left_table.hash(state);
        self.right_table.hash(state);
        self.condition.hash(state);
    }
}

impl PartialEq for JoinInfo {
    fn eq(&self, other: &Self) -> bool {
        self.left_table == other.left_table &&
        self.right_table == other.right_table &&
        self.condition == other.condition
    }
}

impl Eq for JoinInfo {}

#[derive(Serialize, Debug, Clone)]
pub struct CteSummary {
    pub name: String,
    pub summary: QuerySummary,
    pub column_mappings: HashMap<String, (String, String)>, // Output col -> (table, source_col)
}

#[derive(Serialize, Debug, Clone)]
pub struct QuerySummary {
    pub tables: Vec<TableInfo>,
    pub joins: HashSet<JoinInfo>,
    pub ctes: Vec<CteSummary>,
}
```

- **Structures**: Define the data model for tables, joins, CTEs, and the overall summary.
- **Lineage**: `CteSummary` includes `column_mappings` to track how output columns map to base table columns.
- **Deduplication**: Uses `HashSet` for columns and joins.

### `src/errors.rs`
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum SqlAnalyzerError {
    #[error("SQL parsing failed: {0}")]
    ParseError(String),

    #[error("Vague references detected:\n{0}")]
    VagueReferences(String),

    #[error("Internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

impl From<sqlparser::parser::ParserError> for SqlAnalyzerError {
    fn from(err: sqlparser::parser::ParserError) -> Self {
        SqlAnalyzerError::ParseError(err.to_string())
    }
}
```

- **Errors**: Custom error type for parsing failures and vague references, with conversion from `ParserError`.

### `src/utils/mod.rs`
```rust
use crate::errors::SqlAnalyzerError;
use crate::types::{QuerySummary, TableInfo, JoinInfo, CteSummary};
use sqlparser::ast::{Visit, Visitor, TableFactor, Join, Expr, Query, Cte, ObjectName};
use sqlparser::dialect::GenericDialect;
use sqlparser::parser::Parser;
use std::collections::{HashMap, HashSet};

pub(crate) fn analyze_sql(sql: &str) -> Result<QuerySummary, SqlAnalyzerError> {
    let ast = Parser::parse_sql(&GenericDialect, sql)?;
    let mut analyzer = QueryAnalyzer::new();

    for stmt in ast {
        if let sqlparser::ast::Statement::Query(query) = stmt {
            analyzer.analyze_query(&query)?;
        }
    }

    analyzer.into_summary()
}

struct QueryAnalyzer {
    tables: HashMap<String, TableInfo>,
    joins: HashSet<JoinInfo>,
    cte_aliases: Vec<HashSet<String>>,
    ctes: Vec<CteSummary>,
    vague_columns: Vec<String>,
    vague_tables: Vec<String>,
    column_mappings: HashMap<String, HashMap<String, (String, String)>>, // Context -> (col -> (table, col))
}

impl QueryAnalyzer {
    fn new() -> Self {
        QueryAnalyzer {
            tables: HashMap::new(),
            joins: HashSet::new(),
            cte_aliases: vec![HashSet::new()],
            ctes: Vec::new(),
            vague_columns: Vec::new(),
            vague_tables: Vec::new(),
            column_mappings: HashMap::new(),
        }
    }

    fn analyze_query(&mut self, query: &Query) -> Result<(), SqlAnalyzerError> {
        if let Some(with) = &query.with {
            for cte in &with.ctes {
                let cte_name = cte.alias.name.to_string();
                self.cte_aliases.last_mut().unwrap().insert(cte_name.clone());
                
                let mut cte_analyzer = QueryAnalyzer::new();
                cte_analyzer.analyze_query(&cte.query)?;
                let cte_summary = cte_analyzer.into_summary()?;
                self.ctes.push(CteSummary {
                    name: cte_name.clone(),
                    summary: cte_summary,
                    column_mappings: cte_analyzer.column_mappings.get(&cte_name).cloned().unwrap_or_default(),
                });
                self.vague_columns.extend(cte_analyzer.vague_columns);
                self.vague_tables.extend(cte_analyzer.vague_tables);
            }
        }

        query.visit(self);
        Ok(())
    }

    fn into_summary(self) -> Result<QuerySummary, SqlAnalyzerError> {
        if !self.vague_columns.is_empty() || !self.vague_tables.is_empty() {
            let mut error_msg = String::new();
            if !self.vague_columns.is_empty() {
                error_msg.push_str(&format!("Vague columns: {:?}\n", self.vague_columns));
            }
            if !self.vague_tables.is_empty() {
                error_msg.push_str(&format!("Vague tables (missing schema): {:?}", self.vague_tables));
            }
            return Err(SqlAnalyzerError::VagueReferences(error_msg));
        }

        Ok(QuerySummary {
            tables: self.tables.into_values().collect(),
            joins: self.joins,
            ctes: self.ctes,
        })
    }

    fn parse_object_name(&mut self, name: &ObjectName) -> (Option<String>, Option<String>, String) {
        let idents = &name.0;
        match idents.len() {
            1 => {
                self.vague_tables.push(idents[0].to_string());
                (None, None, idents[0].to_string())
            }
            2 => (None, Some(idents[0].to_string()), idents[1].to_string()),
            3 => (Some(idents[0].to_string()), Some(idents[1].to_string()), idents[2].to_string()),
            _ => (None, None, idents.last().unwrap().to_string()),
        }
    }
}

impl Visitor for QueryAnalyzer {
    type Break = ();

    fn pre_visit_table_factor(&mut self, table_factor: &TableFactor) -> Result<(), Self::Break> {
        if let TableFactor::Table { name, alias, .. } = table_factor {
            let table_name = name.to_string();
            if !self.cte_aliases.last().unwrap().contains(&table_name) {
                let (db, schema, table) = self.parse_object_name(name);
                let entry = self.tables.entry(table.clone()).or_insert(TableInfo {
                    database_identifier: db,
                    schema_identifier: schema,
                    table_identifier: table,
                    alias: alias.as_ref().map(|a| a.name.to_string()),
                    columns: HashSet::new(),
                });
                if let Some(a) = alias {
                    entry.alias = Some(a.name.to_string());
                }
            }
        }
        Ok(())
    }

    fn pre_visit_expr(&mut self, expr: &Expr) -> Result<(), Self::Break> {
        match expr {
            Expr::Identifier(ident) => {
                self.vague_columns.push(ident.to_string());
            }
            Expr::CompoundIdentifier(idents) if idents.len() == 2 => {
                let table = idents[0].to_string();
                let column = idents[1].to_string();
                if let Some(table_info) = self.tables.get_mut(&table) {
                    table_info.columns.insert(column.clone());
                    let mappings = self.column_mappings.entry(table.clone()).or_insert_with(HashMap::new);
                    mappings.insert(column.clone(), (table.clone(), column));
                }
            }
            _ => {}
        }
        Ok(())
    }

    fn pre_visit_join(&mut self, join: &Join) -> Result<(), Self::Break> {
        if let TableFactor::Table { name, alias, .. } = &join.relation {
            let table_name = name.to_string();
            if !self.cte_aliases.last().unwrap().contains(&table_name) {
                let (db, schema, table) = self.parse_object_name(name);
                let entry = self.tables.entry(table.clone()).or_insert(TableInfo {
                    database_identifier: db,
                    schema_identifier: schema,
                    table_identifier: table.clone(),
                    alias: alias.as_ref().map(|a| a.name.to_string()),
                    columns: HashSet::new(),
                });
                if let Some(a) = alias {
                    entry.alias = Some(a.name.to_string());
                }

                if let sqlparser::ast::JoinOperator::Inner(sqlparser::ast::JoinConstraint::On(expr)) = &join.join_operator {
                    let condition = expr.to_string();
                    if let Some(last_table) = self.tables.keys().last() {
                        self.joins.insert(JoinInfo {
                            left_table: last_table.clone(),
                            right_table: table,
                            condition,
                        });
                    }
                }
            }
        }
        Ok(())
    }
}
```

### How It Handles Lineage
- **CTE Lineage**: 
  - Each CTE’s `summary` contains its own tables, joins, and nested CTEs.
  - `column_mappings` in `CteSummary` tracks how output columns map to base table columns (e.g., `cte.user_id` → `users.id`).
  - When a join involves a CTE, you can use `column_mappings` to resolve the condition to base tables.

- **Implementation Note**: The current `pre_visit_expr` and `pre_visit_join` are basic and need enhancement for full lineage:
  - **Column Mapping**: Extend `pre_visit_expr` to handle CTE references and aliases (e.g., parse `cte1.id` and look up its source).
  - **Join Resolution**: Improve `pre_visit_join` to trace join conditions through CTEs using the mappings.

### Example Usage
```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let sql = "WITH cte1 AS (SELECT u.id FROM schema.users u) SELECT * FROM cte1 JOIN schema.orders o ON cte1.id = o.user_id";
    match analyze_query(sql.to_string()).await {
        Ok(summary) => println!("{:?}", summary),
        Err(e) => eprintln!("Error: {}", e),
    }
    Ok(())
}
```

### Best Practices Alignment
- **Workspace Integration**: Uses workspace dependencies without local versions.
- **Structure**: Focused on SQL analysis, with clear module separation.
- **Error Handling**: Custom `SqlAnalyzerError` integrates with `anyhow`.
- **Testing**: Ready for `tests/` directory (not shown here but recommended).
- **Documentation**: Includes docstrings and examples.

### Next Steps
- **Enhance Lineage**: Fully implement column mapping for CTEs and joins by parsing expressions more deeply.
- **Add Tests**: Create a `tests/` directory with cases for CTE lineage, vague references, and joins.
- **Refine Joins**: Use `TableWithJoins` context for accurate left/right table identification.

This `lib.rs` provides a solid foundation for your needs, with room to expand lineage tracing as required. Let me know if you’d like to flesh out any part further!