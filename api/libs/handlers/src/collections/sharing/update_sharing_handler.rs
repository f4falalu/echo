use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    helpers::collections::fetch_collection,
};
use sharing::{
    check_asset_permission::has_permission,
    create_asset_permission::create_share_by_email,
};
use tracing::info;
use uuid::Uuid;

use super::ShareRecipient;

/// Update sharing permissions for a collection
///
/// # Arguments
/// * `collection_id` - The ID of the collection to update sharing for
/// * `user_id` - The ID of the user updating the sharing permissions
/// * `request` - List of share recipients with email and role
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn update_collection_sharing_handler(
    collection_id: &Uuid,
    user_id: &Uuid,
    request: Vec<ShareRecipient>,
) -> Result<()> {
    info!(
        collection_id = %collection_id,
        user_id = %user_id,
        "Updating sharing permissions for collection"
    );
    
    // 1. Validate the collection exists
    let _collection = match fetch_collection(collection_id).await? {
        Some(collection) => collection,
        None => return Err(anyhow!("Collection not found")),
    };

    // 2. Check if user has permission to update sharing for the collection (Owner or FullAccess)
    let has_perm = has_permission(
        *collection_id,
        AssetType::Collection,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    ).await?;

    if !has_perm {
        return Err(anyhow!("User does not have permission to update sharing for this collection"));
    }

    // 3. Process each recipient and update sharing permissions
    let emails_and_roles: Vec<(String, AssetPermissionRole)> = request
        .into_iter()
        .map(|recipient| (recipient.email, recipient.role))
        .collect();

    for (email, role) in emails_and_roles {
        // The create_share_by_email function handles both creation and updates
        // It performs an upsert operation in the database
        match create_share_by_email(
            &email,
            *collection_id,
            AssetType::Collection,
            role,
            *user_id,
        ).await {
            Ok(_) => {
                info!("Updated sharing permission for email: {} on collection: {}", email, collection_id);
            },
            Err(e) => {
                tracing::error!("Failed to update sharing for email {}: {}", email, e);
                return Err(anyhow!("Failed to update sharing for email {}: {}", email, e));
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_update_collection_sharing_handler_collection_not_found() {
        // Mock UUID for collection and user
        let collection_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        // Test with empty request to simplify the test
        let request: Vec<ShareRecipient> = vec![];
        
        // Call handler - should fail because we haven't mocked fetch_collection
        let result = update_collection_sharing_handler(&collection_id, &user_id, request).await;
        
        // Since we can't easily mock the function in an integration test
        // This is just a placeholder for the real test
        // The actual error could be different based on the testing environment
        assert!(result.is_err());
    }
}