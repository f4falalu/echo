use crate::pool::get_pg_pool;
use anyhow::{anyhow, Result};
use diesel::{deserialize::QueryableByName, sql_types::Text};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

pub async fn create_secret(data_source_id: &Uuid, secret_value: &String) -> Result<()> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting client from pool: {}", e)),
    };

    match diesel::sql_query("INSERT INTO vault.secrets (id, secret) VALUES ($1, $2)")
        .bind::<diesel::sql_types::Uuid, _>(data_source_id)
        .bind::<diesel::sql_types::Text, _>(secret_value)
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("Error inserting secret: {}", e)),
    }
}

#[derive(QueryableByName)]
struct Secret {
    #[diesel(sql_type = Text)]
    decrypted_secret: String,
}

pub async fn read_secret(secret_id: &Uuid) -> Result<String> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting client from pool: {}", e)),
    };

    let secret = match diesel::sql_query(
        "SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = $1 LIMIT 1",
    )
    .bind::<diesel::sql_types::Uuid, _>(secret_id)
    .get_result::<Secret>(&mut conn)
    .await
    {
        Ok(row) => row.decrypted_secret,
        Err(e) => {
            tracing::error!("Unable to read secret from database: {:?}", e);
            return Err(anyhow!("Unable to read secret from database: {}", e));
        }
    };

    Ok(secret)
}

pub async fn update_secret(secret_id: &Uuid, secret_value: &String) -> Result<()> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting client from pool: {}", e)),
    };

    match diesel::sql_query("UPDATE vault.secrets SET secret = $1 WHERE id = $2")
        .bind::<diesel::sql_types::Text, _>(secret_value)
        .bind::<diesel::sql_types::Uuid, _>(secret_id)
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("Error updating secret: {}", e)),
    }
}

pub async fn delete_secret(secret_id: &Uuid) -> Result<()> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting client from pool: {}", e)),
    };

    match diesel::sql_query("DELETE FROM vault.secrets WHERE id = $1")
        .bind::<diesel::sql_types::Uuid, _>(secret_id)
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("Error deleting secret: {}", e)),
    }
}
