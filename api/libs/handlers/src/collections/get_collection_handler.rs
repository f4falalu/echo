use anyhow::{anyhow, Result};
use database::{collections::fetch_collection, enums::AssetPermissionRole};
use uuid::Uuid;

use crate::collections::types::{CollectionState, GetCollectionRequest};

/// Handler for getting a single collection by ID
///
/// # Arguments
/// * `user_id` - The ID of the user requesting the collection
/// * `req` - The request containing the collection ID
///
/// # Returns
/// * `Result<CollectionState>` - The collection state if found and accessible
pub async fn get_collection_handler(
    user_id: &Uuid,
    req: GetCollectionRequest,
) -> Result<CollectionState> {
    // Reuse the existing collection_utils function
    let collection = match fetch_collection(&req.id).await? {
        Some(collection) => collection,
        None => return Err(anyhow!("Collection not found")),
    };

    Ok(CollectionState {
        collection,
        assets: None,
        permission: AssetPermissionRole::Owner,
        organization_permissions: false,
    })
}
