use anyhow::Result;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use database::{pool::get_pg_pool, schema::users_to_organizations};

/// Count the number of active users in an organization
pub async fn count_workspace_members(organization_id: Uuid) -> Result<i64> {
    let mut conn = get_pg_pool().get().await?;
    
    let count = users_to_organizations::table
        .filter(users_to_organizations::organization_id.eq(organization_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .count()
        .get_result::<i64>(&mut conn)
        .await?;
    
    Ok(count)
}