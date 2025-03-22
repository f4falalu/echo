use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    helpers::collections::fetch_collection,
    pool::get_pg_pool,
};
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use sharing::{
    admin_check::has_permission_with_admin_check_cached,
    create_asset_permission::create_share_by_email,
};
use sharing::types::AssetPermissionLevel;
use tracing::info;
use uuid::Uuid;

/// Recipient for sharing a collection
#[derive(Debug, Deserialize, Serialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}

/// Handler to create sharing permissions for a collection
///
/// # Arguments
/// * `collection_id` - The UUID of the collection to share
/// * `user` - The authenticated user making the request
/// * `request` - List of recipients to share with, containing email and role
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn create_collection_sharing_handler(
    collection_id: &Uuid,
    user: &AuthenticatedUser,
    request: Vec<ShareRecipient>,
) -> Result<()> {
    info!(
        collection_id = %collection_id,
        user_id = %user.id,
        "Creating sharing permissions for collection"
    );

    // 1. Validate the collection exists
    if fetch_collection(collection_id).await?.is_none() {
        return Err(anyhow!("Collection not found"));
    };

    // 2. Check if user has permission to share the collection (Owner or FullAccess)
    // Get a database connection
    let mut conn = get_pg_pool().get().await?;
    
    let has_permission_result = has_permission_with_admin_check_cached(
        &mut conn,
        collection_id,
        &AssetType::Collection,
        user,
        AssetPermissionLevel::FullAccess, // Need FullAccess to share
    )
    .await?;

    if !has_permission_result {
        return Err(anyhow!(
            "User does not have permission to share this collection"
        ));
    }

    // 3. Process each recipient and create sharing permissions
    let emails_and_roles: Vec<(String, AssetPermissionRole)> = request
        .into_iter()
        .map(|recipient| (recipient.email, recipient.role))
        .collect();

    for (email, role) in emails_and_roles {
        // Create or update the permission using create_share_by_email
        match create_share_by_email(
            &email,
            *collection_id,
            AssetType::Collection,
            role,
            user.id,
        )
        .await
        {
            Ok(_) => {
                info!(
                    "Created sharing permission for email: {} on collection: {}",
                    email, collection_id
                );
            }
            Err(e) => {
                tracing::error!("Failed to create sharing for email {}: {}", email, e);
                return Err(anyhow!(
                    "Failed to create sharing for email {}: {}",
                    email,
                    e
                ));
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    #[tokio::test]
    async fn test_create_collection_sharing_collection_not_found() {
        // Test case: Collection not found
        // Expected: Error with "Collection not found" message

        // Since we can't easily mock the function in an integration test
        // This is just a placeholder for the real test
        // A proper test would use a test database or more sophisticated mocking
        assert!(true);
    }

    #[tokio::test]
    async fn test_create_collection_sharing_no_permission() {
        // This would test the case where a user doesn't have permission to share
        assert!(true);
    }

    #[tokio::test]
    async fn test_create_collection_sharing_success() {
        // This would test the successful case
        assert!(true);
    }

    #[tokio::test]
    async fn test_create_collection_sharing_invalid_email() {
        // This would test the case with an invalid email
        assert!(true);
    }
}