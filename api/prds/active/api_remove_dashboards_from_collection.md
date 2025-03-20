---
title: Remove Dashboard from Collections REST Endpoint
author: Cascade
date: 2025-03-19
status: Draft
---

# Remove Dashboard from Collections REST Endpoint

## Problem Statement

Users need the ability to programmatically remove a dashboard from multiple collections via a REST API. Currently, this functionality is not available, limiting the ability to manage collections through the API.

## Goals

1. Create a REST endpoint to remove a dashboard from multiple collections
2. Implement proper permission validation
3. Ensure data integrity with proper error handling
4. Follow established patterns for REST endpoints and handlers

## Non-Goals

1. Modifying the existing collections functionality
2. Creating UI components for this endpoint

## Technical Design

### REST Endpoint

**Endpoint:** `DELETE /dashboards/:id/collections`

**Request Body:**
```json
{
  "collection_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
- `200 OK` - Success
  ```json
  {
    "message": "Dashboard removed from collections successfully",
    "removed_count": 3,
    "failed_count": 0,
    "failed_ids": []
  }
  ```

- `400 Bad Request` - Invalid input
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Dashboard not found
- `500 Internal Server Error` - Server error

### Handler Implementation

The handler will:

1. Validate that the dashboard exists
2. Check if the user has appropriate permissions for the dashboard (Owner, FullAccess, or CanEdit)
3. For each collection in the request:
   a. Check if the user has permission to modify the collection
   b. Mark the dashboard association as deleted in the `collections_to_assets` table

### File Changes

#### New Files

1. `libs/handlers/src/dashboards/remove_dashboard_from_collections_handler.rs`

```rust
use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    helpers::dashboard_files::get_dashboard_file_by_id,
    pool::get_pg_pool,
    schema::{collections, collections_to_assets},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use futures::future::join_all;
use sharing::check_asset_permission::has_permission;
use std::collections::HashMap;
use tracing::{error, info};
use uuid::Uuid;

/// Response for removing a dashboard from collections
#[derive(Debug)]
pub struct RemoveDashboardFromCollectionsResponse {
    pub removed_count: usize,
    pub failed_count: usize,
    pub failed_ids: Vec<Uuid>,
}

/// Removes a dashboard from multiple collections
///
/// # Arguments
///
/// * `dashboard_id` - The unique identifier of the dashboard
/// * `collection_ids` - Vector of collection IDs to remove the dashboard from
/// * `user_id` - The unique identifier of the user performing the action
///
/// # Returns
///
/// RemoveDashboardFromCollectionsResponse on success, or an error if the operation fails
pub async fn remove_dashboard_from_collections_handler(
    dashboard_id: &Uuid,
    collection_ids: Vec<Uuid>,
    user_id: &Uuid,
) -> Result<RemoveDashboardFromCollectionsResponse> {
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user_id,
        collection_count = collection_ids.len(),
        "Removing dashboard from collections"
    );

    if collection_ids.is_empty() {
        return Ok(RemoveDashboardFromCollectionsResponse {
            removed_count: 0,
            failed_count: 0,
            failed_ids: vec![],
        });
    }

    // 1. Validate the dashboard exists
    let dashboard = match get_dashboard_file_by_id(dashboard_id).await {
        Ok(Some(dashboard)) => dashboard,
        Ok(None) => {
            error!(
                dashboard_id = %dashboard_id,
                "Dashboard not found"
            );
            return Err(anyhow!("Dashboard not found"));
        }
        Err(e) => {
            error!("Error checking if dashboard exists: {}", e);
            return Err(anyhow!("Database error: {}", e));
        }
    };

    // 2. Check if user has permission to modify the dashboard
    let has_dashboard_permission = has_permission(
        *dashboard_id,
        AssetType::DashboardFile,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::CanEdit, // This will pass for Owner and FullAccess too
    )
    .await
    .map_err(|e| {
        error!(
            dashboard_id = %dashboard_id,
            user_id = %user_id,
            "Error checking dashboard permission: {}", e
        );
        anyhow!("Error checking permissions: {}", e)
    })?;

    if !has_dashboard_permission {
        error!(
            dashboard_id = %dashboard_id,
            user_id = %user_id,
            "User does not have permission to modify this dashboard"
        );
        return Err(anyhow!("User does not have permission to modify this dashboard"));
    }

    // 3. Get database connection
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        error!("Database connection error: {}", e);
        anyhow!("Failed to get database connection: {}", e)
    })?;

    // 4. Process each collection
    let mut failed_ids = Vec::new();
    let mut removed_count = 0;
    let now = chrono::Utc::now();

    for collection_id in &collection_ids {
        // Check if collection exists
        let collection_exists = collections::table
            .filter(collections::id.eq(collection_id))
            .filter(collections::deleted_at.is_null())
            .count()
            .get_result::<i64>(&mut conn)
            .await;

        if let Err(e) = collection_exists {
            error!(
                collection_id = %collection_id,
                "Error checking if collection exists: {}", e
            );
            failed_ids.push(*collection_id);
            continue;
        }

        if collection_exists.unwrap() == 0 {
            error!(
                collection_id = %collection_id,
                "Collection not found"
            );
            failed_ids.push(*collection_id);
            continue;
        }

        // Check if user has permission to modify the collection
        let has_collection_permission = has_permission(
            *collection_id,
            AssetType::Collection,
            *user_id,
            IdentityType::User,
            AssetPermissionRole::CanEdit,
        )
        .await;

        if let Err(e) = has_collection_permission {
            error!(
                collection_id = %collection_id,
                user_id = %user_id,
                "Error checking collection permission: {}", e
            );
            failed_ids.push(*collection_id);
            continue;
        }

        if !has_collection_permission.unwrap() {
            error!(
                collection_id = %collection_id,
                user_id = %user_id,
                "User does not have permission to modify this collection"
            );
            failed_ids.push(*collection_id);
            continue;
        }

        // Mark dashboard as deleted from this collection
        match diesel::update(collections_to_assets::table)
            .filter(collections_to_assets::collection_id.eq(collection_id))
            .filter(collections_to_assets::asset_id.eq(dashboard_id))
            .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
            .filter(collections_to_assets::deleted_at.is_null())
            .set((
                collections_to_assets::deleted_at.eq(now),
                collections_to_assets::updated_at.eq(now),
                collections_to_assets::updated_by.eq(user_id),
            ))
            .execute(&mut conn)
            .await
        {
            Ok(updated) => {
                if updated > 0 {
                    removed_count += 1;
                    info!(
                        dashboard_id = %dashboard_id,
                        collection_id = %collection_id,
                        "Successfully removed dashboard from collection"
                    );
                } else {
                    error!(
                        dashboard_id = %dashboard_id,
                        collection_id = %collection_id,
                        "Dashboard not found in collection"
                    );
                    failed_ids.push(*collection_id);
                }
            }
            Err(e) => {
                error!(
                    dashboard_id = %dashboard_id,
                    collection_id = %collection_id,
                    "Error removing dashboard from collection: {}", e
                );
                failed_ids.push(*collection_id);
            }
        }
    }

    let failed_count = failed_ids.len();
    
    info!(
        dashboard_id = %dashboard_id,
        user_id = %user_id,
        collection_count = collection_ids.len(),
        removed_count = removed_count,
        failed_count = failed_count,
        "Finished removing dashboard from collections"
    );

    Ok(RemoveDashboardFromCollectionsResponse {
        removed_count,
        failed_count,
        failed_ids,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::enums::{AssetPermissionRole, AssetType, IdentityType};
    use uuid::Uuid;

    #[tokio::test]
    async fn test_remove_dashboard_from_collections_handler() {
        // This is a placeholder for the actual test
        // In a real implementation, we would use test fixtures and a test database
        assert!(true); 
    }
}
```

2. `src/routes/rest/routes/dashboards/remove_dashboard_from_collections.rs`

```rust
use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::dashboards::remove_dashboard_from_collections_handler;
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct RemoveFromCollectionsRequest {
    pub collection_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct RemoveFromCollectionsResponse {
    pub message: String,
    pub removed_count: usize,
    pub failed_count: usize,
    pub failed_ids: Vec<Uuid>,
}

/// REST handler for removing a dashboard from multiple collections
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the dashboard
/// * `request` - The collection IDs to remove the dashboard from
///
/// # Returns
///
/// A success message on success, or an appropriate error response
pub async fn remove_dashboard_from_collections_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<RemoveFromCollectionsRequest>,
) -> Result<ApiResponse<RemoveFromCollectionsResponse>, (StatusCode, String)> {
    info!(
        dashboard_id = %id,
        user_id = %user.id,
        collection_count = request.collection_ids.len(),
        "Processing DELETE request to remove dashboard from collections"
    );

    match remove_dashboard_from_collections_handler(&id, request.collection_ids, &user.id).await {
        Ok(result) => {
            let response = RemoveFromCollectionsResponse {
                message: "Dashboard removed from collections successfully".to_string(),
                removed_count: result.removed_count,
                failed_count: result.failed_count,
                failed_ids: result.failed_ids,
            };
            Ok(ApiResponse::JsonData(response))
        }
        Err(e) => {
            tracing::error!("Error removing dashboard from collections: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("Dashboard not found") {
                return Err((StatusCode::NOT_FOUND, format!("Dashboard not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to remove dashboard from collections: {}", e)))
        }
    }
}
```

3. Update `libs/handlers/src/dashboards/mod.rs` to include the new handler

4. Update `src/routes/rest/routes/dashboards/mod.rs` to include the new endpoint

### Database Operations

The implementation will use the following database operations:

1. SELECT to check if the dashboard exists
2. SELECT to check if the collections exist
3. UPDATE to mark dashboard associations as deleted

## Testing Strategy

### Unit Tests

1. Test the handler with mocked database connections
   - Test removing a dashboard from collections
   - Test error cases (dashboard not found, collection not found, insufficient permissions)
   - Test removing a dashboard that isn't in a collection

2. Test the REST endpoint
   - Test successful request
   - Test error responses for various scenarios

### Integration Tests

1. Test the endpoint with a test database
   - Create collections and add a dashboard to them
   - Remove the dashboard from the collections
   - Verify the database state
   - Test with different user roles

## Security Considerations

- The endpoint requires authentication

- Permission checks ensure users can only modify collections and dashboards they have access to

- Input validation prevents malicious data

## Monitoring and Logging

- All operations are logged with appropriate context

- Errors are logged with detailed information

## Dependencies

- `libs/sharing` - For permission checking

- `libs/database` - For database operations
  - Using existing helpers in `dashboard_files.rs` for dashboard existence checks

## Rollout Plan

1. Implement the handler and endpoint

2. Write tests

3. Code review

4. Deploy to staging

5. Test in staging

6. Deploy to production

7. Monitor for issues
