use sqlparser::dialect::{
    GenericDialect, SnowflakeDialect, PostgreSqlDialect, MySqlDialect, 
    BigQueryDialect, MsSqlDialect, DatabricksDialect, SQLiteDialect,
    AnsiDialect, Dialect
};
use sqlparser::parser::Parser;
use sqlparser::ast::{Statement, SetExpr, Query};

/// Helper function to get the appropriate SQL dialect based on data source type
fn get_dialect(data_source_type: &str) -> Box<dyn Dialect> {
    match data_source_type.to_lowercase().as_str() {
        "bigquery" => Box::new(BigQueryDialect {}),
        "databricks" => Box::new(DatabricksDialect {}),
        "mysql" | "mariadb" => Box::new(MySqlDialect {}),
        "postgres" | "postgresql" | "redshift" | "supabase" => Box::new(PostgreSqlDialect {}),
        "snowflake" => Box::new(SnowflakeDialect {}),
        "sqlserver" | "mssql" => Box::new(MsSqlDialect {}),
        "sqlite" => Box::new(SQLiteDialect {}),
        "ansi" => Box::new(AnsiDialect {}),
        _ => Box::new(GenericDialect {}),
    }
}

/// Checks if a SQL query is safe to execute by parsing it and ensuring it only contains
/// SELECT statements.
///
/// Returns None if the query is safe, or Some(error_message) if it's not allowed.
pub async fn query_safety_filter(sql: String) -> Option<String> {
    query_safety_filter_with_dialect(sql, "generic").await
}

/// Checks if a SQL query is safe to execute by parsing it with the appropriate dialect
/// and ensuring it only contains SELECT statements.
///
/// Returns None if the query is safe, or Some(error_message) if it's not allowed.
pub async fn query_safety_filter_with_dialect(sql: String, data_source_type: &str) -> Option<String> {
    // Parse the SQL query
    let dialect = get_dialect(data_source_type);
    let ast = match Parser::parse_sql(dialect.as_ref(), &sql) {
        Ok(ast) => ast,
        Err(e) => {
            return Some(format!("Failed to parse SQL query: {}", e));
        }
    };

    // Check each statement in the query
    for stmt in ast {
        match stmt {
            // Only allow SELECT statements
            Statement::Query(query) => {
                // Check if the query body is a SELECT statement
                if !is_safe_query(&query) {
                    return Some("Only simple SELECT queries are allowed.".to_string());
                }
            },
            // Block all other statement types
            Statement::Insert { .. } => {
                return Some("INSERT statements are not allowed.".to_string());
            },
            Statement::Update { .. } => {
                return Some("UPDATE statements are not allowed.".to_string());
            },
            Statement::Delete { .. } => {
                return Some("DELETE statements are not allowed.".to_string());
            },
            Statement::CreateTable { .. } => {
                return Some("CREATE TABLE statements are not allowed.".to_string());
            },
            Statement::AlterTable { .. } => {
                return Some("ALTER TABLE statements are not allowed.".to_string());
            },
            Statement::Drop { .. } => {
                return Some("DROP statements are not allowed.".to_string());
            },
            Statement::CreateView { .. } => {
                return Some("CREATE VIEW statements are not allowed in read queries.".to_string());
            },
            Statement::CreateIndex { .. } => {
                return Some("CREATE INDEX statements are not allowed.".to_string());
            },
            Statement::Grant { .. } => {
                return Some("GRANT statements are not allowed.".to_string());
            },
            Statement::Revoke { .. } => {
                return Some("REVOKE statements are not allowed.".to_string());
            },
            _ => {
                return Some("Only SELECT statements are allowed.".to_string());
            }
        }
    }

    // If we get here, all statements are safe
    None
}

/// Checks if a query is safe (only contains SELECT statements)
fn is_safe_query(query: &Query) -> bool {
    match &*query.body {
        SetExpr::Select(_) => true,
        SetExpr::Query(subquery) => is_safe_query(subquery),
        SetExpr::SetOperation { left, right, .. } => {
            is_safe_query_expr(left) && is_safe_query_expr(right)
        },
        _ => false,
    }
}

/// Helper function to check if a SetExpr is safe
fn is_safe_query_expr(expr: &SetExpr) -> bool {
    match expr {
        SetExpr::Select(_) => true,
        SetExpr::Query(subquery) => is_safe_query(subquery),
        SetExpr::SetOperation { left, right, .. } => {
            is_safe_query_expr(left) && is_safe_query_expr(right)
        },
        _ => false,
    }
}

/// Checks if a SQL query is safe for write operations, allowing only view-related operations.
///
/// Returns None if the query is safe, or Some(error_message) if it's not allowed.
#[allow(dead_code)]
pub async fn write_query_safety_filter(sql: String) -> Option<String> {
    // Parse the SQL query
    let dialect = GenericDialect {}; // Generic SQL dialect
    let ast = match Parser::parse_sql(&dialect, &sql) {
        Ok(ast) => ast,
        Err(e) => {
            return Some(format!("Failed to parse SQL query: {}", e));
        }
    };

    // Check each statement in the query
    for stmt in ast {
        match stmt {
            // Allow only view-related operations
            Statement::CreateView { .. } => {
                // CreateView is allowed
            },
            Statement::Drop { object_type, if_exists, .. } => {
                // Only allow DROP VIEW IF EXISTS
                match object_type {
                    sqlparser::ast::ObjectType::View => {
                        if !if_exists {
                            return Some("Only 'DROP VIEW IF EXISTS' is allowed.".to_string());
                        }
                    },
                    _ => {
                        return Some("Only 'DROP VIEW IF EXISTS' is allowed.".to_string());
                    }
                }
            },
            // Block all other statement types
            Statement::Query(_) => {
                return Some("SELECT statements should use the query endpoint, not the write endpoint.".to_string());
            },
            Statement::Insert { .. } => {
                return Some("INSERT statements are not allowed.".to_string());
            },
            Statement::Update { .. } => {
                return Some("UPDATE statements are not allowed.".to_string());
            },
            Statement::Delete { .. } => {
                return Some("DELETE statements are not allowed.".to_string());
            },
            Statement::CreateTable { .. } => {
                return Some("CREATE TABLE statements are not allowed.".to_string());
            },
            Statement::AlterTable { .. } => {
                return Some("ALTER TABLE statements are not allowed.".to_string());
            },
            Statement::CreateIndex { .. } => {
                return Some("CREATE INDEX statements are not allowed.".to_string());
            },
            Statement::Grant { .. } => {
                return Some("GRANT statements are not allowed.".to_string());
            },
            Statement::Revoke { .. } => {
                return Some("REVOKE statements are not allowed.".to_string());
            },
            _ => {
                return Some("Only view-related operations are allowed.".to_string());
            }
        }
    }

    // If we get here, all statements are safe
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_safe_select_query() {
        let query = "SELECT segment_recent_update AS segment, COUNT(first_name) AS customer_count 
                    FROM sem.entity_person 
                    GROUP BY segment_recent_update 
                    ORDER BY customer_count DESC";
        
        let result = query_safety_filter(query.to_string()).await;
        assert!(result.is_none(), "Safe SELECT query was rejected: {:?}", result);
    }

    #[tokio::test]
    async fn test_unsafe_update_query() {
        let query = "UPDATE users SET name = 'John' WHERE id = 1";
        
        let result = query_safety_filter(query.to_string()).await;
        assert!(result.is_some(), "Unsafe UPDATE query was allowed");
    }

    #[tokio::test]
    async fn test_unsafe_delete_query() {
        let query = "DELETE FROM users WHERE id = 1";
        
        let result = query_safety_filter(query.to_string()).await;
        assert!(result.is_some(), "Unsafe DELETE query was allowed");
    }

    #[tokio::test]
    async fn test_complex_select_query() {
        let query = "SELECT u.name, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count 
                    FROM users u 
                    WHERE u.created_at > '2023-01-01'";
        
        let result = query_safety_filter(query.to_string()).await;
        assert!(result.is_none(), "Safe complex SELECT query was rejected: {:?}", result);
    }

    #[tokio::test]
    async fn test_union_query() {
        let query = "SELECT name FROM users UNION SELECT name FROM customers";
        
        let result = query_safety_filter(query.to_string()).await;
        assert!(result.is_none(), "Safe UNION query was rejected: {:?}", result);
    }

    #[tokio::test]
    async fn test_snowflake_complex_case_expression() {
        // This is the exact query that fails in production
        let query = r#"select
    date_trunc('month', r.createdat) as month,
    count(distinct rtd.tracking_number) as return_labels
from staging.mongodb.stg_returns r
join staging.mongodb.stg_return_tracking_details rtd on r._id = rtd.return_id
join dbt.general.teams t on r.team = t.team_id
where r.status = 'complete'
    and case
        when coalesce(
            r.shipment:_shipment:is_return::boolean,
            r.shipment:_shipment:tracker:is_return::boolean,
            r.shipment:_shipment:from_address:name like any ('%(REFUND)%', '%(STORE CREDIT)%', '%(EXCHANGE)%'),
            false
        )
        then r.shipment:_shipment:to_address:country::text
        else r.shipment:_shipment:from_address:country::text
    end in ('GB', 'BE', 'EL', 'LT', 'PT', 'BG', 'ES', 'LU', 'RO', 'CZ', 'FR', 'HU', 'SI', 'DK', 'HR', 'MT', 'SK', 'DE', 'IT', 'NL', 'FI', 'EE', 'CY', 'AT', 'SE', 'IE', 'LV', 'PL')
group by all
order by month desc"#;
        
        let result = query_safety_filter(query.to_string()).await;
        
        // This test currently fails with the error:
        // "Failed to parse SQL query: sql parser error: Expected: end of statement, found: when at Line: 9, Column: 9"
        assert!(result.is_some(), "Expected parsing error for Snowflake-specific syntax");
        assert!(result.unwrap().contains("Failed to parse SQL query"), "Should fail with parsing error");
    }

    #[tokio::test]
    async fn test_snowflake_query_with_dialect_parameter() {
        // Test the same query using the new dialect-aware function
        let query = r#"select
    date_trunc('month', r.createdat) as month,
    count(distinct rtd.tracking_number) as return_labels
from staging.mongodb.stg_returns r
join staging.mongodb.stg_return_tracking_details rtd on r._id = rtd.return_id
join dbt.general.teams t on r.team = t.team_id
where r.status = 'complete'
    and case
        when coalesce(
            r.shipment:_shipment:is_return::boolean,
            r.shipment:_shipment:tracker:is_return::boolean,
            r.shipment:_shipment:from_address:name like any ('%(REFUND)%', '%(STORE CREDIT)%', '%(EXCHANGE)%'),
            false
        )
        then r.shipment:_shipment:to_address:country::text
        else r.shipment:_shipment:from_address:country::text
    end in ('GB', 'BE', 'EL', 'LT', 'PT', 'BG', 'ES', 'LU', 'RO', 'CZ', 'FR', 'HU', 'SI', 'DK', 'HR', 'MT', 'SK', 'DE', 'IT', 'NL', 'FI', 'EE', 'CY', 'AT', 'SE', 'IE', 'LV', 'PL')
group by all
order by month desc"#;
        
        // Try with the new dialect-aware function
        let result = query_safety_filter_with_dialect(query.to_string(), "snowflake").await;
        
        // Should pass with Snowflake dialect
        assert!(result.is_none(), "Snowflake query should be accepted with Snowflake dialect: {:?}", result);
    }

    #[tokio::test]
    async fn test_snowflake_query_with_snowflake_dialect() {
        // Test the same query but with SnowflakeDialect directly
        let query = r#"select
    date_trunc('month', r.createdat) as month,
    count(distinct rtd.tracking_number) as return_labels
from staging.mongodb.stg_returns r
join staging.mongodb.stg_return_tracking_details rtd on r._id = rtd.return_id
join dbt.general.teams t on r.team = t.team_id
where r.status = 'complete'
    and case
        when coalesce(
            r.shipment:_shipment:is_return::boolean,
            r.shipment:_shipment:tracker:is_return::boolean,
            r.shipment:_shipment:from_address:name like any ('%(REFUND)%', '%(STORE CREDIT)%', '%(EXCHANGE)%'),
            false
        )
        then r.shipment:_shipment:to_address:country::text
        else r.shipment:_shipment:from_address:country::text
    end in ('GB', 'BE', 'EL', 'LT', 'PT', 'BG', 'ES', 'LU', 'RO', 'CZ', 'FR', 'HU', 'SI', 'DK', 'HR', 'MT', 'SK', 'DE', 'IT', 'NL', 'FI', 'EE', 'CY', 'AT', 'SE', 'IE', 'LV', 'PL')
group by all
order by month desc"#;
        
        // Try parsing with SnowflakeDialect
        let dialect = SnowflakeDialect {};
        let parse_result = Parser::parse_sql(&dialect, query);
        
        // Check if SnowflakeDialect can parse this query
        match parse_result {
            Ok(_) => {
                println!("SnowflakeDialect successfully parsed the query!");
                // If it parses, it would still be rejected as a SELECT query by our filter
            },
            Err(e) => {
                println!("SnowflakeDialect also failed to parse: {}", e);
                // Even SnowflakeDialect might have issues with this syntax
            }
        }
    }
}
