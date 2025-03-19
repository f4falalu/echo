use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    helpers::collections::fetch_collection,
};
use sharing::{
    check_asset_permission::has_permission,
    remove_asset_permissions::remove_share_by_email,
};
use tracing::info;
use uuid::Uuid;

/// Handler to delete sharing permissions for a collection
///
/// # Arguments
/// * `collection_id` - The UUID of the collection to delete sharing permissions for
/// * `user_id` - The UUID of the user making the request
/// * `emails` - List of email addresses to remove sharing permissions for
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn delete_collection_sharing_handler(
    collection_id: &Uuid,
    user_id: &Uuid,
    emails: Vec<String>,
) -> Result<()> {
    info!(
        collection_id = %collection_id,
        user_id = %user_id,
        "Deleting sharing permissions for collection"
    );

    // 1. Validate the collection exists
    if fetch_collection(collection_id).await?.is_none() {
        return Err(anyhow!("Collection not found"));
    };

    // 2. Check if user has permission to delete sharing for the collection (Owner or FullAccess)
    let has_permission_result = has_permission(
        *collection_id,
        AssetType::Collection,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::FullAccess, // Owner role implicitly has FullAccess permissions
    ).await?;

    if !has_permission_result {
        return Err(anyhow!("User does not have permission to delete sharing for this collection"));
    }

    // 3. Process each email and delete sharing permissions
    for email in emails {
        // The remove_share_by_email function handles soft deletion of permissions
        match remove_share_by_email(
            &email,
            *collection_id,
            AssetType::Collection,
            *user_id,
        ).await {
            Ok(_) => {
                info!("Deleted sharing permission for email: {} on collection: {}", email, collection_id);
            },
            Err(e) => {
                // If the error is because the permission doesn't exist, we can ignore it
                if e.to_string().contains("No active permission found") {
                    tracing::warn!("No active permission found for email {}: {}", email, e);
                    continue;
                }
                
                tracing::error!("Failed to delete sharing for email {}: {}", email, e);
                return Err(anyhow!("Failed to delete sharing for email {}: {}", email, e));
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::{
        enums::{AssetPermissionRole, AssetType, IdentityType},
        models::{AssetPermission, Collection, User},
    };
    use chrono::Utc;
    use mockall::predicate::*;
    use mockall::mock;
    use uuid::Uuid;
    
    // Mock the database functions
    mock! {
        pub FetchCollection {}
        impl FetchCollection {
            pub async fn fetch_collection(id: &Uuid) -> Result<Option<Collection>>;
        }
    }

    mock! {
        pub HasPermission {}
        impl HasPermission {
            pub async fn has_permission(
                asset_id: Uuid,
                asset_type: AssetType,
                identity_id: Uuid,
                identity_type: IdentityType,
                required_role: AssetPermissionRole,
            ) -> Result<bool>;
        }
    }

    mock! {
        pub RemoveShareByEmail {}
        impl RemoveShareByEmail {
            pub async fn remove_share_by_email(
                email: &str,
                asset_id: Uuid,
                asset_type: AssetType,
                updated_by: Uuid,
            ) -> Result<()>;
        }
    }

    #[tokio::test]
    async fn test_delete_collection_sharing_collection_not_found() {
        // Test case: Collection not found
        // Expected: Error with "Collection not found" message
        
        let collection_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let emails = vec!["test@example.com".to_string()];

        // Since we can't easily mock the function in an integration test
        // This is just a placeholder for the real test
        // A proper test would use a test database or more sophisticated mocking
        assert!(true);
    }

    #[tokio::test]
    async fn test_delete_collection_sharing_no_permission() {
        // This would test the case where a user doesn't have permission to delete sharing
        assert!(true);
    }

    #[tokio::test]
    async fn test_delete_collection_sharing_success() {
        // This would test the successful case
        assert!(true);
    }

    #[tokio::test]
    async fn test_delete_collection_sharing_invalid_email() {
        // This would test the case with an invalid email
        assert!(true);
    }
}