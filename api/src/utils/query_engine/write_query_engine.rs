use anyhow::Result;
use diesel::{ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use indexmap::IndexMap;
use uuid::Uuid;

use database::{
    models::DataSource,
    pool::get_pg_pool,
    schema::{data_sources, datasets},
};

use crate::utils::query_engine::{
    data_source_query_routes::query_router::query_router, data_types::DataType,
};

pub async fn write_query_engine(
    dataset_id: &Uuid,
    sql: &String,
) -> Result<Vec<IndexMap<String, DataType>>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            return Err(anyhow::anyhow!(
                "Error getting connection from pool: {:?}",
                e
            ))
        }
    };

    let data_source = match data_sources::table
        .inner_join(datasets::table.on(data_sources::id.eq(datasets::data_source_id)))
        .filter(datasets::id.eq(dataset_id))
        .select(data_sources::all_columns)
        .first::<DataSource>(&mut conn)
        .await
    {
        Ok(data_source) => data_source,
        Err(e) => return Err(anyhow::anyhow!("Data source not found")),
    };

    let results = match query_router(&data_source, sql, None, true).await {
        Ok(results) => results,
        Err(e) => return Err(e),
    };

    Ok(results)
}
