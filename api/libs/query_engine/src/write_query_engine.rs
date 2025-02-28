use anyhow::Result;
use indexmap::IndexMap;
use uuid::Uuid;

use database::models::DataSource;

use super::data_source_query_routes::query_router::query_router;
use super::data_types::DataType;

pub async fn write_query_engine(
    data_source_id: Option<&Uuid>,
    dataset_id: Option<&Uuid>,
    sql: &String,
) -> Result<Vec<IndexMap<String, DataType>>> {
    if data_source_id.is_some() && dataset_id.is_some() {
        return Err(anyhow::anyhow!("Cannot specify both data_source_id and dataset_id"));
    }

    let data_source = if let Some(dataset_id) = dataset_id {
        match DataSource::find_by_dataset_id(dataset_id).await? {
            Some(data_source) => data_source,
            None => return Err(anyhow::anyhow!("Data source not found")),
        }
    } else if let Some(data_source_id) = data_source_id {
        match DataSource::find(data_source_id).await? {
            Some(data_source) => data_source,
            None => return Err(anyhow::anyhow!("Data source not found")),
        }
    } else {
        return Err(anyhow::anyhow!("Must specify either data_source_id or dataset_id"));
    };

    let results = match query_router(&data_source, sql, None, true).await {
        Ok(results) => results,
        Err(e) => return Err(e),
    };

    Ok(results)
}
