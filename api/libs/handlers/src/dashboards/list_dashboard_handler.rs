
use anyhow::{anyhow, Result};
use diesel::{
    ExpressionMethods, QueryDsl,
    Queryable, Selectable,
};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

use database::{
    enums::Verification,
    pool::get_pg_pool,
    schema::dashboard_files,
};

use super::{BusterDashboardListItem, DashboardMember};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DashboardsListRequest {
    /// The page number to fetch
    pub page_token: i64,
    /// Number of items per page
    pub page_size: i64,
    /// Filter for dashboards shared with the current user
    pub shared_with_me: Option<bool>,
    /// Filter for dashboards owned by the current user
    pub only_my_dashboards: Option<bool>,
}

#[derive(Queryable, Selectable)]
#[diesel(table_name = dashboard_files)]
struct QueryableDashboardFile {
    id: Uuid,
    name: String,
    created_by: Uuid,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

pub async fn list_dashboard_handler(
    user_id: &Uuid,
    request: DashboardsListRequest,
) -> Result<Vec<BusterDashboardListItem>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    // Calculate offset from page_token
    let offset = request.page_token * request.page_size;

    // Build the base query
    let dashboard_statement = dashboard_files::table
        .select((
            dashboard_files::id,
            dashboard_files::name,
            dashboard_files::created_by,
            dashboard_files::created_at,
            dashboard_files::updated_at,
        ))
        .filter(dashboard_files::deleted_at.is_null())
        .distinct()
        .order((dashboard_files::updated_at.desc(), dashboard_files::id.asc()))
        .offset(offset)
        .limit(request.page_size)
        .into_boxed();

    // Execute the query
    let dashboard_results = match dashboard_statement
        .load::<(
            Uuid,
            String,
            Uuid,
            DateTime<Utc>,
            DateTime<Utc>,
        )>(&mut conn)
        .await
    {
        Ok(results) => results,
        Err(e) => return Err(anyhow!("Error getting dashboard results: {}", e)),
    };

    // Transform query results into BusterDashboardListItem
    let dashboards = dashboard_results
        .into_iter()
        .map(
            |(id, name, created_by, created_at, updated_at)| {
                let owner = DashboardMember {
                    id: created_by,
                    name: "Unknown".to_string(),
                    avatar_url: None,
                };

                BusterDashboardListItem {
                    id,
                    name,
                    created_at,
                    last_edited: updated_at,
                    owner,
                    members: vec![],
                    status: Verification::Verified, // Default status, can be updated if needed
                    is_shared: false,
                }
            },
        )
        .collect();

    Ok(dashboards)
}
