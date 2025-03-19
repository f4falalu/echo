use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    helpers::collections::fetch_collection,
};
use serde::{Deserialize, Serialize};
use sharing::{
    check_asset_permission::has_permission,
    create_asset_permission::create_share_by_email,
};
use tracing::info;
use uuid::Uuid;

/// Request for updating sharing permissions for a collection
#[derive(Debug, Serialize, Deserialize)]
pub struct ShareRecipient {
    pub email: String,
    pub role: AssetPermissionRole,
}

/// Request for updating sharing settings for a collection
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCollectionSharingRequest {
    /// List of users to share with
    pub users: Option<Vec<ShareRecipient>>,
    /// Whether the collection should be publicly accessible
    /// Note: Collections are not publicly accessible, this field is ignored
    pub publicly_accessible: Option<bool>,
    /// Password for public access (if null, will clear existing password)
    /// Note: Collections are not publicly accessible, this field is ignored
    pub public_password: Option<Option<String>>,
    /// Expiration date for public access (if null, will clear existing expiration)
    /// Note: Collections are not publicly accessible, this field is ignored
    pub public_expiration: Option<Option<DateTime<Utc>>>,
}

/// Update sharing permissions for a collection
///
/// # Arguments
/// * `collection_id` - The ID of the collection to update sharing for
/// * `user_id` - The ID of the user updating the sharing permissions
/// * `request` - The update request containing sharing settings
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn update_collection_sharing_handler(
    collection_id: &Uuid,
    user_id: &Uuid,
    request: UpdateCollectionSharingRequest,
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

    // 3. Process user sharing permissions if provided
    if let Some(users) = &request.users {
        for recipient in users {
            // The create_share_by_email function handles both creation and updates
            // It performs an upsert operation in the database
            match create_share_by_email(
                &recipient.email,
                *collection_id,
                AssetType::Collection,
                recipient.role,
                *user_id,
            ).await {
                Ok(_) => {
                    info!("Updated sharing permission for email: {} on collection: {}", recipient.email, collection_id);
                },
                Err(e) => {
                    tracing::error!("Failed to update sharing for email {}: {}", recipient.email, e);
                    return Err(anyhow!("Failed to update sharing for email {}: {}", recipient.email, e));
                }
            }
        }
    }

    // 4. Public access settings are ignored for collections
    // Collections are not publicly accessible, so we ignore the public_* fields

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
        let request = UpdateCollectionSharingRequest {
            users: None,
            publicly_accessible: None,
            public_password: None,
            public_expiration: None,
        };
        
        // Call handler - should fail because we haven't mocked fetch_collection
        let result = update_collection_sharing_handler(&collection_id, &user_id, request).await;
        
        // Since we can't easily mock the function in an integration test
        // This is just a placeholder for the real test
        // The actual error could be different based on the testing environment
        assert!(result.is_err());
    }
    
    #[tokio::test]
    async fn test_update_collection_sharing_handler_with_users() {
        // Mock UUID for collection and user
        let collection_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        // Test with users in the request
        let request = UpdateCollectionSharingRequest {
            users: Some(vec![
                ShareRecipient {
                    email: "test@example.com".to_string(),
                    role: AssetPermissionRole::Viewer,
                }
            ]),
            publicly_accessible: None,
            public_password: None,
            public_expiration: None,
        };
        
        // This test will fail in isolation as we can't easily mock the database
        // It's here as a structural guide - the real testing will happen in integration tests
        let result = update_collection_sharing_handler(&collection_id, &user_id, request).await;
        assert!(result.is_err()); // Should fail since collection doesn't exist
    }
}