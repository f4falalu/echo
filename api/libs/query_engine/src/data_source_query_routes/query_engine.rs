use indexmap::IndexMap;

use anyhow::{anyhow, Result};
use uuid::Uuid;

use crate::{
    credentials::Credential,
    data_source_connections::{
        get_bigquery_client::get_bigquery_client, get_databricks_client::get_databricks_client,
        get_mysql_connection::get_mysql_connection,
        get_postgres_connection::get_postgres_connection,
        get_redshift_connection::get_redshift_connection,
        get_snowflake_client::get_snowflake_client,
        get_sql_server_connection::get_sql_server_connection, ssh_tunneling::kill_ssh_tunnel,
    },
    data_types::DataType,
};

use database::vault::read_secret;

use super::{
    bigquery_query::bigquery_query, databricks_query::databricks_query, mysql_query::mysql_query,
    postgres_query::postgres_query, redshift_query::redshift_query,
    security_utils::query_safety_filter, snowflake_query::snowflake_query,
    sql_server_query::sql_server_query,
};

pub async fn query_engine(
    data_source_id: &Uuid,
    sql: &str,
    limit: Option<i64>,
) -> Result<Vec<IndexMap<String, DataType>>> {
    let corrected_sql = sql.to_owned();

    let secure_sql = corrected_sql.clone();

    if let Some(warning) = query_safety_filter(secure_sql.clone()).await { return Err(anyhow!(warning)) };

    let results = match route_to_query(data_source_id, &secure_sql, limit).await {
        Ok(results) => results,
        Err(e) => {
            tracing::error!(
                "There was an issue while querying the parent data source: {}",
                e
            );
            return Err(anyhow!(e));
        }
    };

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::postgres::PgPoolOptions;
    use std::env;

    // Test that postgres_query properly applies the limit at the database level
    #[tokio::test]
    async fn test_postgres_query_with_limit() {
        use crate::data_source_query_routes::postgres_query::postgres_query;
        
        // Skip test if no test database is available
        let database_url = match env::var("TEST_DATABASE_URL") {
            Ok(url) => url,
            Err(_) => return, // Skip test if env var not available
        };
        
        // Create a pool with the test database
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await
            .expect("Failed to connect to Postgres");
            
        // Test with explicit limit
        let results = postgres_query(
            pool.clone(),
            "SELECT generate_series(1, 100) AS num".to_string(),
            Some(10),
        )
        .await
        .expect("Query should succeed");
        
        assert_eq!(results.len(), 10, "Should return exactly 10 rows with limit 10");
        
        // Test with default limit (5000)
        let results = postgres_query(
            pool.clone(),
            "SELECT generate_series(1, 6000) AS num".to_string(),
            None,
        )
        .await
        .expect("Query should succeed");
        
        assert_eq!(results.len(), 5000, "Should return exactly 5000 rows with default limit");
        
        // Test with limit greater than default
        let results = postgres_query(
            pool,
            "SELECT generate_series(1, 6000) AS num".to_string(),
            Some(6000),
        )
        .await
        .expect("Query should succeed");
        
        assert_eq!(results.len(), 6000, "Should return exactly 6000 rows with limit 6000");
    }
    
    // Test that mysql_query properly applies the limit at the database level
    #[tokio::test]
    async fn test_mysql_query_with_limit() {
        use crate::data_source_query_routes::mysql_query::mysql_query;
        use sqlx::mysql::MySqlPoolOptions;
        
        // Skip test if no test database is available
        let database_url = match env::var("TEST_MYSQL_URL") {
            Ok(url) => url,
            Err(_) => return, // Skip test if env var not available
        };
        
        // Create a pool with the test database
        let pool = MySqlPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await
            .expect("Failed to connect to MySQL");
            
        // Test with explicit limit
        let results = mysql_query(
            pool.clone(),
            "SELECT * FROM (SELECT 1 AS num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) AS t".to_string(),
            Some(5),
        )
        .await
        .expect("Query should succeed");
        
        assert_eq!(results.len(), 5, "Should return exactly 5 rows with limit 5");
    }
    
    // Test parsing functions in the bigquery connector
    #[test]
    fn test_bigquery_string_parsing() {
        use crate::data_source_query_routes::bigquery_query;
        
        // Test integer parsing
        match bigquery_query::parse_string_to_datatype("123") {
            DataType::Int4(Some(123)) => {}, // Success
            other => panic!("Expected Int4(123), got {:?}", other),
        }
        
        // Test boolean parsing
        match bigquery_query::parse_string_to_datatype("true") {
            DataType::Bool(Some(true)) => {}, // Success
            other => panic!("Expected Bool(true), got {:?}", other),
        }
        
        // Test date parsing
        match bigquery_query::parse_string_to_datatype("2023-01-01") {
            DataType::Date(Some(_)) => {}, // Success
            other => panic!("Expected Date, got {:?}", other),
        }
        
        // Test text fallback
        match bigquery_query::parse_string_to_datatype("hello world") {
            DataType::Text(Some(text)) if text == "hello world" => {}, // Success
            other => panic!("Expected Text(hello world), got {:?}", other),
        }
    }
}

async fn route_to_query(
    data_source_id: &Uuid,
    sql: &str,
    limit: Option<i64>,
) -> Result<Vec<IndexMap<String, DataType>>> {
    let credentials_string = match read_secret(data_source_id).await {
        Ok(credentials) => credentials,
        Err(e) => return Err(anyhow!(e)),
    };

    let credentials: Credential = match serde_json::from_str(&credentials_string) {
        Ok(credentials) => credentials,
        Err(e) => return Err(anyhow!(e)),
    };

    let results = match credentials {
        Credential::Postgres(credentials) => {
            let (pg_pool, ssh_tunnel, temp_files) = match get_postgres_connection(&credentials)
                .await
            {
                Ok(pg_pool) => pg_pool,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            let results = match postgres_query(pg_pool, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    return Err(anyhow!(e));
                }
            };

            if let (Some(mut ssh_tunnel), Some(temp_files)) = (ssh_tunnel, temp_files) {
                let _ = kill_ssh_tunnel(&mut ssh_tunnel, temp_files).await;
            };

            results
        }
        Credential::Redshift(credentials) => {
            let redshift_client = get_redshift_connection(&credentials).await?;

            

            match redshift_query(redshift_client, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            }
        }
        Credential::MySql(credentials) => {
            let (mysql_pool, ssh_tunnel, temp_files) = match get_mysql_connection(&credentials)
                .await
            {
                Ok(mysql_pool) => mysql_pool,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            let results = match mysql_query(mysql_pool, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            };

            if let (Some(mut ssh_tunnel), Some(temp_files)) = (ssh_tunnel, temp_files) {
                let _ = kill_ssh_tunnel(&mut ssh_tunnel, temp_files).await;
            };

            results
        }
        Credential::Bigquery(credentials) => {
            let (bq_client, project_id) = match get_bigquery_client(&credentials).await {
                Ok((bq_client, project_id)) => (bq_client, project_id),
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            

            match bigquery_query(bq_client, project_id, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            }
        }
        Credential::SqlServer(credentials) => {
            let (sql_server_pool, ssh_tunnel, temp_files) = match get_sql_server_connection(
                &credentials,
            )
            .await
            {
                Ok(sql_server_pool) => sql_server_pool,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            let results = match sql_server_query(sql_server_pool, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            };

            if let (Some(mut ssh_tunnel), Some(temp_files)) = (ssh_tunnel, temp_files) {
                let _ = kill_ssh_tunnel(&mut ssh_tunnel, temp_files).await;
            };

            results
        }
        Credential::Databricks(credentials) => {
            let databricks_client = match get_databricks_client(&credentials).await {
                Ok(databricks_client) => databricks_client,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            

            match databricks_query(databricks_client, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            }
        }
        Credential::Snowflake(credentials) => {
            let snowflake_client = match get_snowflake_client(&credentials).await {
                Ok(snowflake_client) => snowflake_client,
                Err(e) => {
                    tracing::error!("There was an issue while establishing a connection to the parent data source: {}", e);
                    return Err(anyhow!(e));
                }
            };

            

            match snowflake_query(snowflake_client, sql.to_owned(), limit).await {
                Ok(results) => results,
                Err(e) => {
                    tracing::error!("There was an issue while fetching the tables: {}", e);
                    return Err(anyhow!(e));
                }
            }
        }
    };

    Ok(results)
}
