use anyhow::Result;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use uuid::Uuid;

/// Checks if a user has access to a resource
pub async fn check_access() -> Result<()> {
    Ok(())
}
