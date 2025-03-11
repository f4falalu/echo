use anyhow::Result;
use uuid::Uuid;

/// Removes a sharing record
pub async fn remove_share(
    conn: &mut diesel_async::AsyncPgConnection,
    shared_with: Uuid,
) -> Result<()> {
    Ok(())
}
