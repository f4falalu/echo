use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::{
    enums::DataSourceType,
    models::UserToOrganization,
    pool::get_pg_pool,
    schema::{data_sources, users_to_organizations},
};

#[derive(Deserialize)]
pub struct ListDataSourcesRequest {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

#[derive(Serialize)]
pub struct DataSourceListItem {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub type_: DataSourceType,
    pub updated_at: DateTime<Utc>,
}

pub async fn list_data_sources_handler(
    user_id: &Uuid,
    page: Option<i64>,
    page_size: Option<i64>,
) -> Result<Vec<DataSourceListItem>> {
    let page = page.unwrap_or(0);
    let page_size = page_size.unwrap_or(25);

    let mut conn = get_pg_pool().get().await?;

    // Get the user's organization
    let user_organization = users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .select(users_to_organizations::all_columns)
        .first::<UserToOrganization>(&mut conn)
        .await
        .map_err(|e| anyhow!("Unable to get user organization: {}", e))?;

    // Get data sources for the organization
    let data_sources_list = data_sources::table
        .filter(data_sources::organization_id.eq(user_organization.organization_id))
        .filter(data_sources::deleted_at.is_null())
        .order_by(data_sources::updated_at.desc())
        .limit(page_size)
        .offset(page * page_size)
        .load::<database::models::DataSource>(&mut conn)
        .await
        .map_err(|e| anyhow!("Unable to fetch data sources: {}", e))?;

    // Transform to response format
    let response_items = data_sources_list
        .into_iter()
        .map(|ds| DataSourceListItem {
            id: ds.id.to_string(),
            name: ds.name,
            type_: ds.type_,
            updated_at: ds.updated_at,
        })
        .collect();

    Ok(response_items)
}