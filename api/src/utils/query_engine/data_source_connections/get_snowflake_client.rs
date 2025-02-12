use anyhow::{anyhow, Error};
use snowflake_api::SnowflakeApi;

use crate::utils::query_engine::credentials::SnowflakeCredentials;

pub async fn get_snowflake_client(
    credentials: &SnowflakeCredentials,
    database: Option<String>,
) -> Result<SnowflakeApi, Error> {
    let snowflake_client = match SnowflakeApi::with_password_auth(
        &credentials.account_id,
        Some(credentials.warehouse_id.as_str()),
        database.as_deref(),
        None,
        &credentials.username,
        credentials.role.as_deref(),
        &credentials.password,
    ) {
        Ok(snowflake) => snowflake,
        Err(e) => {
            tracing::error!("Error creating SnowflakeApi: {}", e);
            return Err(anyhow!(e));
        }
    };

    Ok(snowflake_client)
}
