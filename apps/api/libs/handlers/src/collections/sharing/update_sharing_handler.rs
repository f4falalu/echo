use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType, WorkspaceSharing},
    helpers::collections::fetch_collection_with_permission,
    pool::get_pg_pool,
    schema::collections::dsl,
};
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use diesel::ExpressionMethods;
use diesel_async::RunQueryDsl as AsyncRunQueryDsl;
use sharing::{
    check_permission_access,
    create_asset_permission::create_share_by_email,
    types::UpdateField,
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
    /// Password for public access
    /// Note: Collections are not publicly accessible, this field is ignored
    #[serde(default)]
    pub public_password: UpdateField<String>,
    /// Expiration date for public access
    /// Note: Collections are not publicly accessible, this field is ignored
    #[serde(default)]
    pub public_expiry_date: UpdateField<DateTime<Utc>>,
    /// Workspace sharing permissions
    #[serde(rename = "workspace_sharing")]
    pub workspace_permissions: Option<Option<WorkspaceSharing>>,
}

/// Update sharing permissions for a collection
///
/// # Arguments
/// * `collection_id` - The ID of the collection to update sharing for
/// * `user` - The authenticated user updating the sharing permissions
/// * `request` - The update request containing sharing settings
///
/// # Returns
/// * `Result<()>` - Success or error
pub async fn update_collection_sharing_handler(
    collection_id: &Uuid,
    user: &AuthenticatedUser,
    request: UpdateCollectionSharingRequest,
) -> Result<()> {
    info!(
        collection_id = %collection_id,
        user_id = %user.id,
        "Updating sharing permissions for collection"
    );
    
    // 1. Fetch the collection with permission
    let collection_with_permission = fetch_collection_with_permission(collection_id, &user.id).await?;
    
    // If collection not found, return error
    let collection_with_permission = match collection_with_permission {
        Some(cwp) => cwp,
        None => {
            return Err(anyhow!("Collection not found"));
        }
    };
    
    // 2. Check if user has permission to update sharing for the collection (FullAccess or Owner)
    let has_permission = check_permission_access(
        collection_with_permission.permission,
        &[
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        collection_with_permission.collection.organization_id,
        &user.organizations,
        collection_with_permission.collection.workspace_sharing,
    );
    
    if !has_permission {
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
                user.id,
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

    // 5. Handle workspace_permissions if provided
    if let Some(workspace_perm) = request.workspace_permissions {
        let mut conn = get_pg_pool().get().await?;
        
        // Load current collection data for updates
        let collection = collection_with_permission.collection;
        
        match workspace_perm {
            Some(perm) => {
                info!(
                    collection_id = %collection_id,
                    "Setting workspace permissions for collection to {:?}",
                    perm
                );
                diesel::update(dsl::collections)
                    .filter(dsl::id.eq(collection_id))
                    .set((
                        dsl::workspace_sharing.eq(perm),
                        dsl::workspace_sharing_enabled_by.eq(if perm != WorkspaceSharing::None {
                            Some(user.id)
                        } else {
                            None
                        }),
                        dsl::workspace_sharing_enabled_at.eq(if perm != WorkspaceSharing::None {
                            Some(Utc::now())
                        } else {
                            None
                        }),
                    ))
                    .execute(&mut conn)
                    .await?;
            }
            None => {
                // Setting to None means removing workspace sharing
                info!(
                    collection_id = %collection_id,
                    "Removing workspace permissions for collection"
                );
                diesel::update(dsl::collections)
                    .filter(dsl::id.eq(collection_id))
                    .set((
                        dsl::workspace_sharing.eq(WorkspaceSharing::None),
                        dsl::workspace_sharing_enabled_by.eq(None::<Uuid>),
                        dsl::workspace_sharing_enabled_at.eq(None::<DateTime<Utc>>),
                    ))
                    .execute(&mut conn)
                    .await?;
            }
        }
    }

    Ok(())
}