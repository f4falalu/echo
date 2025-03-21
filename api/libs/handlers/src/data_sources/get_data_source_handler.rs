use anyhow::{anyhow, Result};
use database::{
    enums::DataSourceType,
    models::{DataSource, Dataset, User},
    pool::get_pg_pool,
    schema::{data_sources, datasets, users},
    vault::read_secret,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct GetDataSourceRequest {
    pub id: Uuid,
}

#[derive(Serialize)]
pub struct DataSourceResponse {
    pub id: String,
    pub name: String,
    pub db_type: DataSourceType,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: CreatedByResponse,
    pub credentials: CredentialsResponse,
    pub data_sets: Vec<DatasetResponse>,
}

#[derive(Serialize)]
pub struct CreatedByResponse {
    pub email: String,
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct CredentialsResponse {
    pub database: String,
    pub host: String,
    pub jump_host: Option<String>,
    pub password: String,
    pub port: String,
    pub schemas: Option<Vec<String>>,
    pub ssh_private_key: Option<String>,
    pub ssh_username: Option<String>,
    pub username: String,
    pub project_id: Option<String>,
    pub dataset_ids: Option<Vec<String>>,
    pub credentials_json: Option<String>,
}

#[derive(Serialize)]
pub struct DatasetResponse {
    pub id: String,
    pub name: String,
}

pub async fn get_data_source_handler(
    request: GetDataSourceRequest,
    _user_id: &Uuid,
) -> Result<DataSourceResponse> {
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    // Get the data source
    let data_source: DataSource = data_sources::table
        .filter(data_sources::id.eq(request.id))
        .filter(data_sources::deleted_at.is_null())
        .first(&mut conn)
        .await
        .map_err(|_| anyhow!("Data source not found"))?;

    // Get the creator information
    let creator: User = users::table
        .filter(users::id.eq(data_source.created_by))
        .first(&mut conn)
        .await
        .map_err(|_| anyhow!("Creator not found"))?;

    // Get associated datasets
    let datasets_list: Vec<Dataset> = datasets::table
        .filter(datasets::data_source_id.eq(data_source.id))
        .filter(datasets::deleted_at.is_null())
        .load(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to load datasets: {}", e))?;

    // Get credentials from the vault
    let secret = read_secret(&data_source.secret_id).await?;
    let credentials: CredentialsResponse = serde_json::from_str(&secret)
        .map_err(|e| anyhow!("Failed to parse credentials: {}", e))?;

    // Convert datasets to response format
    let datasets_response: Vec<DatasetResponse> = datasets_list
        .into_iter()
        .map(|dataset| DatasetResponse {
            id: dataset.id.to_string(),
            name: dataset.name,
        })
        .collect();

    // Create response
    let response = DataSourceResponse {
        id: data_source.id.to_string(),
        name: data_source.name,
        db_type: data_source.type_,
        created_at: data_source.created_at.to_rfc3339(),
        updated_at: data_source.updated_at.to_rfc3339(),
        created_by: CreatedByResponse {
            email: creator.email,
            id: creator.id.to_string(),
            name: creator.name.unwrap_or_default(),
        },
        credentials,
        data_sets: datasets_response,
    };

    Ok(response)
}