use anyhow::Result;
use axum::{extract::Query, Extension};
use middleware::AuthenticatedUser;
use serde::Deserialize;

use handlers::data_sources::{list_data_sources_handler, DataSourceListItem};

use crate::routes::rest::ApiResponse;

#[derive(Deserialize)]
pub struct ListDataSourcesQuery {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

pub async fn list_data_sources(
    Extension(user): Extension<AuthenticatedUser>,
    Query(query): Query<ListDataSourcesQuery>,
) -> Result<ApiResponse<Vec<DataSourceListItem>>, (axum::http::StatusCode, &'static str)> {
    match list_data_sources_handler(&user.id, query.page, query.page_size).await {
        Ok(data_sources) => Ok(ApiResponse::JsonData(data_sources)),
        Err(e) => {
            tracing::error!("Error listing data sources: {:?}", e);
            Err((
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to list data sources",
            ))
        }
    }
}