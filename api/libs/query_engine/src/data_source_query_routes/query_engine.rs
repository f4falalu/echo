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
