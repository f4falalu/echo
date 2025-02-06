use crate::database::{lib::get_pg_pool, models::DatasetColumn, schema::dataset_columns};

use super::{
    credentials::{
        BigqueryCredentials, Credential, MySqlCredentials, PostgresCredentials,
        SnowflakeCredentials,
    },
    data_source_connections::{
        get_bigquery_client::get_bigquery_client, get_mysql_connection::get_mysql_connection,
        get_postgres_connection::get_postgres_connection,
        get_snowflake_client::get_snowflake_client,
    },
};
use anyhow::{anyhow, Result};
use arrow::array::Array;
use chrono::Utc;
use diesel::{insert_into, upsert::excluded, ExpressionMethods};
use diesel_async::RunQueryDsl;
use gcp_bigquery_client::model::query_request::QueryRequest;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(FromRow, Debug)]
pub struct DatasetColumnRecord {
    pub name: String,
    pub type_: String,
    pub nullable: bool,
    pub comment: Option<String>,
    pub source_type: String,
}

pub async fn import_dataset_columns(
    dataset_id: &Uuid,
    dataset_database_name: &String,
    dataset_schema_name: &String,
    credentials: &Credential,
) -> Result<()> {
    let cols =
        match retrieve_dataset_columns(&dataset_database_name, &dataset_schema_name, credentials)
            .await
        {
            Ok(cols) => cols,
            Err(e) => return Err(e),
        };

    match create_dataset_columns(&dataset_id, &cols).await {
        Ok(_) => (),
        Err(e) => return Err(e),
    }

    Ok(())
}

async fn create_dataset_columns(dataset_id: &Uuid, cols: &Vec<DatasetColumnRecord>) -> Result<()> {
    // Deduplicate columns by name before creating DatasetColumn records
    let mut seen = std::collections::HashSet::new();
    let dataset_columns: Vec<DatasetColumn> = cols
        .iter()
        .filter(|col| seen.insert(col.name.clone()))
        .map(|col| DatasetColumn {
            id: uuid::Uuid::new_v4(),
            dataset_id: dataset_id.clone(),
            name: col.name.clone(),
            type_: col.type_.clone(),
            description: col.comment.clone().filter(|s| !s.is_empty()),
            nullable: col.nullable,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            stored_values: None,
            stored_values_status: None,
            stored_values_error: None,
            stored_values_count: None,
            stored_values_last_synced: None,
            semantic_type: None,
            dim_type: None,
            expr: None,
        })
        .collect();

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    match insert_into(dataset_columns::table)
        .values(&dataset_columns)
        .on_conflict((dataset_columns::dataset_id, dataset_columns::name))
        .do_update()
        .set((
            dataset_columns::type_.eq(excluded(dataset_columns::type_)),
            dataset_columns::nullable.eq(excluded(dataset_columns::nullable)),
            dataset_columns::updated_at.eq(Utc::now()),
            dataset_columns::deleted_at.eq::<Option<chrono::NaiveDateTime>>(None),
        ))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error inserting dataset columns: {:?}", e)),
    }

    Ok(())
}

pub async fn retrieve_dataset_columns(
    dataset_name: &String,
    schema_name: &String,
    credentials: &Credential,
) -> Result<Vec<DatasetColumnRecord>> {
    let cols = match credentials {
        Credential::Postgres(credentials) => {
            match get_postgres_columns(dataset_name, schema_name, credentials).await {
                Ok(cols) => cols,
                Err(e) => return Err(e),
            }
        }
        Credential::MySQL(credentials) => {
            match get_mysql_columns(dataset_name, credentials).await {
                Ok(cols) => cols,
                Err(e) => return Err(e),
            }
        }
        Credential::Bigquery(credentials) => {
            match get_bigquery_columns(dataset_name, credentials).await {
                Ok(cols) => cols,
                Err(e) => return Err(e),
            }
        }
        Credential::Snowflake(credentials) => {
            match get_snowflake_columns(dataset_name, credentials).await {
                Ok(cols) => cols,
                Err(e) => return Err(e),
            }
        }
        _ => return Err(anyhow!("Unsupported data source type")),
    };

    Ok(cols)
}

async fn get_postgres_columns(
    dataset_name: &String,
    schema_name: &String,
    credentials: &PostgresCredentials,
) -> Result<Vec<DatasetColumnRecord>> {
    let (postgres_conn, child_process, tempfile) = match get_postgres_connection(credentials).await {
        Ok(conn) => conn,
        Err(e) => return Err(e),
    };

    // Query for tables and views
    let regular_sql = format!(
        "SELECT
            c.column_name as name,
            c.data_type as type_,
            CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END as nullable,
            pgd.description AS comment,
            t.table_type as source_type
        FROM
            information_schema.columns c
        JOIN
            information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
        LEFT JOIN
            pg_catalog.pg_statio_all_tables as st on c.table_schema = st.schemaname and c.table_name = st.relname
        LEFT JOIN
            pg_catalog.pg_description pgd on pgd.objoid = st.relid and pgd.objsubid = c.ordinal_position
        WHERE
            c.table_name = '{dataset_name}'
            AND c.table_schema = '{schema_name}'
            AND t.table_type IN ('BASE TABLE', 'VIEW')
        ORDER BY
            c.ordinal_position;"
    );

    // Query for materialized views
    let mv_sql = format!(
        "SELECT 
            a.attname as name,
            format_type(a.atttypid, a.atttypmod) as type_,
            NOT a.attnotnull as nullable,
            d.description as comment,
            'MATERIALIZED_VIEW' as source_type
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid
        LEFT JOIN pg_description d ON d.objoid = c.oid AND d.objsubid = a.attnum
        WHERE c.relkind = 'm'
        AND n.nspname = '{schema_name}'
        AND c.relname = '{dataset_name}'
        AND a.attnum > 0
        AND NOT a.attisdropped
        ORDER BY a.attnum;"
    );

    let mut cols = Vec::new();

    // Get regular tables and views
    let regular_cols = match sqlx::query_as::<_, DatasetColumnRecord>(&regular_sql)
        .fetch_all(&postgres_conn)
        .await
    {
        Ok(c) => c,
        Err(e) => return Err(anyhow!("Error fetching regular columns: {:?}", e)),
    };
    cols.extend(regular_cols);

    // Get materialized view columns
    let mv_cols = match sqlx::query_as::<_, DatasetColumnRecord>(&mv_sql)
        .fetch_all(&postgres_conn)
        .await
    {
        Ok(c) => c,
        Err(e) => return Err(anyhow!("Error fetching materialized view columns: {:?}", e)),
    };
    cols.extend(mv_cols);

    if let (Some(mut child_process), Some(tempfile)) = (child_process, tempfile) {
        child_process.kill()?;
        for file in tempfile {
            file.close()?;
        }
    }

    Ok(cols)
}

async fn get_mysql_columns(
    dataset_name: &String,
    credentials: &MySqlCredentials,
) -> Result<Vec<DatasetColumnRecord>> {
    let (mysql_conn, child_process, tempfile) = match get_mysql_connection(credentials).await {
        Ok(conn) => conn,
        Err(e) => return Err(e),
    };

    let sql = format!(
        "SELECT
            CAST(c.COLUMN_NAME AS CHAR) as name,
            CAST(c.DATA_TYPE AS CHAR) as type_,
            CASE WHEN c.IS_NULLABLE = 'YES' THEN true ELSE false END as nullable,
            CAST(c.COLUMN_COMMENT AS CHAR) as comment,
            CAST(t.TABLE_TYPE AS CHAR) as source_type
        FROM
            INFORMATION_SCHEMA.COLUMNS c
        JOIN
            INFORMATION_SCHEMA.TABLES t ON c.TABLE_NAME = t.TABLE_NAME AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
        WHERE
            c.TABLE_NAME = '{}'
        ORDER BY
            c.ORDINAL_POSITION;",
        dataset_name
    );

    let cols = sqlx::query_as::<_, DatasetColumnRecord>(&sql)
        .fetch_all(&mysql_conn)
        .await
        .map_err(|e| anyhow!("Error fetching columns: {:?}", e))?;

    if let (Some(mut child_process), Some(tempfile)) = (child_process, tempfile) {
        child_process.kill()?;
        for file in tempfile {
            file.close()?;
        }
    }

    Ok(cols)
}

async fn get_bigquery_columns(
    dataset_name: &String,
    credentials: &BigqueryCredentials,
) -> Result<Vec<DatasetColumnRecord>> {
    let (bigquery_client, project_id) = get_bigquery_client(credentials).await?;

    let sql = format!(
        r#"
        WITH all_columns AS (
            -- Regular tables and views
            SELECT
                column_name AS name,
                data_type AS type_,
                is_nullable = 'YES' AS nullable,
                NULL as comment,
                table_type as source_type
            FROM `region-us`.INFORMATION_SCHEMA.COLUMNS c
            JOIN `region-us`.INFORMATION_SCHEMA.TABLES t 
                USING(table_name, table_schema)
            WHERE table_name = '{dataset_name}'
            
            UNION ALL
            
            -- Materialized views specific metadata if needed
            SELECT
                column_name AS name,
                data_type AS type_,
                is_nullable = 'YES' AS nullable,
                NULL as comment,
                'MATERIALIZED_VIEW' as source_type
            FROM `region-us`.INFORMATION_SCHEMA.MATERIALIZED_VIEWS mv
            JOIN `region-us`.INFORMATION_SCHEMA.COLUMNS c 
                USING(table_name, table_schema)
            WHERE mv.table_name = '{dataset_name}'
        )
        SELECT * FROM all_columns
        "#,
    );

    let query_request = QueryRequest {
        query: sql,
        max_results: Some(500),
        timeout_ms: Some(120000),
        use_legacy_sql: false,
        ..Default::default()
    };

    let result = bigquery_client
        .job()
        .query(&project_id, query_request)
        .await
        .map_err(|e| anyhow!("Error fetching columns: {:?}", e))?;

    let mut columns = Vec::new();

    if let Some(rows) = result.rows {
        for row in rows {
            if let Some(cols) = row.columns {
                let name = cols[0]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Missing column name"))?
                    .to_string();

                let type_ = cols[1]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Missing column type"))?
                    .to_string();

                let nullable = cols[2]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Missing nullable value"))?
                    .parse::<bool>()?;

                let comment = cols[3]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let source_type = cols[4]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Missing source type"))?
                    .to_string();

                columns.push(DatasetColumnRecord {
                    name,
                    type_,
                    nullable,
                    comment,
                    source_type,
                });
            }
        }
    }

    Ok(columns)
}

async fn get_snowflake_columns(
    dataset_name: &String,
    credentials: &SnowflakeCredentials,
) -> Result<Vec<DatasetColumnRecord>> {
    let snowflake_client = get_snowflake_client(credentials).await?;

    let uppercase_dataset_name = dataset_name.to_uppercase();

    let sql = format!(
        "WITH all_objects AS (
            -- Regular tables and views
            SELECT
                c.COLUMN_NAME AS name,
                c.DATA_TYPE AS type_,
                CASE WHEN c.IS_NULLABLE = 'YES' THEN true ELSE false END AS nullable,
                c.COMMENT AS comment,
                t.TABLE_TYPE as source_type
            FROM
                INFORMATION_SCHEMA.COLUMNS c
            JOIN 
                INFORMATION_SCHEMA.TABLES t 
                ON c.TABLE_NAME = t.TABLE_NAME 
                AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
            WHERE
                c.TABLE_NAME = '{uppercase_dataset_name}'
            
            UNION ALL
            
            -- Materialized views
            SELECT
                c.COLUMN_NAME AS name,
                c.DATA_TYPE AS type_,
                CASE WHEN c.IS_NULLABLE = 'YES' THEN true ELSE false END AS nullable,
                c.COMMENT AS comment,
                'MATERIALIZED_VIEW' as source_type
            FROM
                INFORMATION_SCHEMA.COLUMNS c
            JOIN 
                INFORMATION_SCHEMA.VIEWS v
                ON c.TABLE_NAME = v.TABLE_NAME 
                AND c.TABLE_SCHEMA = v.TABLE_SCHEMA
            WHERE
                c.TABLE_NAME = '{uppercase_dataset_name}'
                AND v.IS_MATERIALIZED = 'YES'
        )
        SELECT * FROM all_objects
        ORDER BY name;",
    );

    // Execute the query using the Snowflake client
    let results = snowflake_client
        .exec(&sql)
        .await
        .map_err(|e| anyhow!("Error executing query: {:?}", e))?;

    let mut columns = Vec::new();

    if let snowflake_api::QueryResult::Arrow(record_batches) = results {
        for batch in &record_batches {
            let schema = batch.schema();

            let name_index = schema
                .index_of("NAME")
                .map_err(|e| anyhow!("Error getting index for NAME: {:?}", e))?;
            let type_index = schema
                .index_of("TYPE_")
                .map_err(|e| anyhow!("Error getting index for TYPE_: {:?}", e))?;
            let nullable_index = schema
                .index_of("NULLABLE")
                .map_err(|e| anyhow!("Error getting index for NULLABLE: {:?}", e))?;
            let comment_index = schema
                .index_of("COMMENT")
                .map_err(|e| anyhow!("Error getting index for COMMENT: {:?}", e))?;

            let name_column = batch.column(name_index);
            let type_column = batch.column(type_index);
            let nullable_column = batch.column(nullable_index);
            let comment_column = batch.column(comment_index);

            let name_array = name_column
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for NAME"))?;

            let type_array = type_column
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for SCHEMA"))?;

            let nullable_array = nullable_column
                .as_any()
                .downcast_ref::<arrow::array::BooleanArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for TYPE_"))?;

            let comment_array = comment_column
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for COMMENT"))?;

            for i in 0..batch.num_rows() {
                let name = name_array.value(i).to_string();
                let type_ = type_array.value(i).to_string();
                let nullable = nullable_array.value(i);
                let comment = if comment_array.is_null(i) {
                    None
                } else {
                    Some(comment_array.value(i).to_string())
                };

                columns.push(DatasetColumnRecord {
                    name,
                    type_,
                    nullable,
                    comment,
                    source_type: "TABLE".to_string(),
                });
            }
        }
    } else {
        return Err(anyhow!("Unexpected query result format"));
    }

    Ok(columns)
}
