use anyhow::Result;
use uuid::Uuid;

use search::{search as search_lib, SearchObject, SearchObjectType, SearchOptions};
use crate::utils::user::user_info::get_user_organization_id;

pub async fn search_handler(
    user_id: Uuid,
    query: String,
    num_results: Option<i64>,
    asset_types: Option<Vec<SearchObjectType>>,
) -> Result<Vec<SearchObject>> {
    let num_results = num_results.unwrap_or(50);
    let asset_types = asset_types.unwrap_or_else(Vec::new);
    
    let options = SearchOptions::with_custom_options(num_results, asset_types);
    
    let user_organization_id = get_user_organization_id(&user_id).await?;
    
    let results = search_lib(user_id, user_organization_id, query, options).await?;
    
    Ok(results)
}