---
title: Add Metric to Collections REST Endpoint
author: Cascade
date: 2025-03-19
status: Draft
---

# Add Metric to Collections REST Endpoint

## Problem Statement

Users need the ability to programmatically add a metric to multiple collections via a REST API. Currently, this functionality is not available, limiting the ability to manage collections through the API.

## Goals

1. Create a REST endpoint to add a metric to multiple collections
2. Implement proper permission validation
3. Ensure data integrity with proper error handling
4. Follow established patterns for REST endpoints and handlers

## Non-Goals

1. Modifying the existing collections functionality
2. Creating UI components for this endpoint

## Technical Design

### REST Endpoint

**Endpoint:** `POST /metrics/:id/collections`

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
    "message": "Metric added to collections successfully"
  }
  ```
- `400 Bad Request` - Invalid input
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Metric not found
- `500 Internal Server Error` - Server error

### Handler Implementation

The handler will:
1. Validate that the metric exists
2. Check if the user has appropriate permissions (Owner, FullAccess, or CanEdit) for the metric
3. Validate that the collections exist and the user has access to them
4. Add the metric to the collections by creating records in the `collections_to_assets` table
5. Handle the case where a metric was previously in a collection but was deleted (upsert)

### File Changes

#### New Files

1. `libs/handlers/src/metrics/add_metric_to_collections_handler.rs`
```rust
use anyhow::{anyhow, Result};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::CollectionToAsset,
    pool::get_pg_pool,
    schema::{collections, collections_to_assets, metric_files},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use sharing::check_asset_permission::has_permission;
use tracing::{error, info};
use uuid::Uuid;

/// Adds a metric to multiple collections
///
/// # Arguments
///
/// * `metric_id` - The unique identifier of the metric
/// * `collection_ids` - Vector of collection IDs to add the metric to
/// * `user_id` - The unique identifier of the user performing the action
///
/// # Returns
///
/// Ok(()) on success, or an error if the operation fails
pub async fn add_metric_to_collections_handler(
    metric_id: &Uuid,
    collection_ids: Vec<Uuid>,
    user_id: &Uuid,
) -> Result<()> {
    info!(
        metric_id = %metric_id,
        user_id = %user_id,
        collection_count = collection_ids.len(),
        "Adding metric to collections"
    );

    if collection_ids.is_empty() {
        return Ok(());
    }

    // 1. Validate the metric exists
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        error!("Database connection error: {}", e);
        anyhow!("Failed to get database connection: {}", e)
    })?;

    let metric_exists = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null())
        .count()
        .get_result::<i64>(&mut conn)
        .await
        .map_err(|e| {
            error!("Error checking if metric exists: {}", e);
            anyhow!("Database error: {}", e)
        })?;

    if metric_exists == 0 {
        error!(
            metric_id = %metric_id,
            "Metric not found"
        );
        return Err(anyhow!("Metric not found"));
    }

    // 2. Check if user has permission to modify the metric (Owner, FullAccess, or CanEdit)
    let has_metric_permission = has_permission(
        *metric_id,
        AssetType::MetricFile,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::CanEdit, // This will pass for Owner and FullAccess too
    )
    .await
    .map_err(|e| {
        error!(
            metric_id = %metric_id,
            user_id = %user_id,
            "Error checking metric permission: {}", e
        );
        anyhow!("Error checking permissions: {}", e)
    })?;

    if !has_metric_permission {
        error!(
            metric_id = %metric_id,
            user_id = %user_id,
            "User does not have permission to modify this metric"
        );
        return Err(anyhow!("User does not have permission to modify this metric"));
    }

    // 3. Validate collections exist and user has access to them
    for collection_id in &collection_ids {
        // Check if collection exists
        let collection_exists = collections::table
            .filter(collections::id.eq(collection_id))
            .filter(collections::deleted_at.is_null())
            .count()
            .get_result::<i64>(&mut conn)
            .await
            .map_err(|e| {
                error!("Error checking if collection exists: {}", e);
                anyhow!("Database error: {}", e)
            })?;

        if collection_exists == 0 {
            error!(
                collection_id = %collection_id,
                "Collection not found"
            );
            return Err(anyhow!("Collection not found: {}", collection_id));
        }

        // Check if user has access to the collection
        let has_collection_permission = has_permission(
            *collection_id,
            AssetType::Collection,
            *user_id,
            IdentityType::User,
            AssetPermissionRole::CanView, // User needs at least view access
        )
        .await
        .map_err(|e| {
            error!(
                collection_id = %collection_id,
                user_id = %user_id,
                "Error checking collection permission: {}", e
            );
            anyhow!("Error checking permissions: {}", e)
        })?;

        if !has_collection_permission {
            error!(
                collection_id = %collection_id,
                user_id = %user_id,
                "User does not have permission to access this collection"
            );
            return Err(anyhow!("User does not have permission to access collection: {}", collection_id));
        }
    }

    // 4. Add metric to collections (upsert if previously deleted)
    for collection_id in &collection_ids {
        // Check if the metric is already in the collection
        let existing = collections_to_assets::table
            .filter(collections_to_assets::collection_id.eq(collection_id))
            .filter(collections_to_assets::asset_id.eq(metric_id))
            .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
            .first::<CollectionToAsset>(&mut conn)
            .await
            .optional()
            .map_err(|e| {
                error!("Error checking if metric is already in collection: {}", e);
                anyhow!("Database error: {}", e)
            })?;

        if let Some(existing_record) = existing {
            if existing_record.deleted_at.is_some() {
                // If it was previously deleted, update it
                diesel::update(collections_to_assets::table)
                    .filter(collections_to_assets::collection_id.eq(collection_id))
                    .filter(collections_to_assets::asset_id.eq(metric_id))
                    .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                    .set((
                        collections_to_assets::deleted_at.eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
                        collections_to_assets::updated_at.eq(chrono::Utc::now()),
                        collections_to_assets::updated_by.eq(user_id),
                    ))
                    .execute(&mut conn)
                    .await
                    .map_err(|e| {
                        error!("Error updating collection to asset record: {}", e);
                        anyhow!("Database error: {}", e)
                    })?;
            }
            // If it's already active, do nothing
        } else {
            // If it doesn't exist, create a new record
            diesel::insert_into(collections_to_assets::table)
                .values((
                    collections_to_assets::collection_id.eq(collection_id),
                    collections_to_assets::asset_id.eq(metric_id),
                    collections_to_assets::asset_type.eq(AssetType::MetricFile),
                    collections_to_assets::created_at.eq(chrono::Utc::now()),
                    collections_to_assets::updated_at.eq(chrono::Utc::now()),
                    collections_to_assets::created_by.eq(user_id),
                    collections_to_assets::updated_by.eq(user_id),
                ))
                .execute(&mut conn)
                .await
                .map_err(|e| {
                    error!("Error creating collection to asset record: {}", e);
                    anyhow!("Database error: {}", e)
                })?;
        }
    }

    info!(
        metric_id = %metric_id,
        user_id = %user_id,
        collection_count = collection_ids.len(),
        "Successfully added metric to collections"
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::enums::{AssetPermissionRole, AssetType, IdentityType};
    use uuid::Uuid;

    #[tokio::test]
    async fn test_add_metric_to_collections_handler() {
        // This is a placeholder for the actual test
        // In a real implementation, we would use test fixtures and a test database
        assert!(true); 
    }
}
```

2. `src/routes/rest/routes/metrics/add_metric_to_collections.rs`
```rust
use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::metrics::add_metric_to_collections_handler;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct AddMetricRequest {
    pub collection_ids: Vec<Uuid>,
}

/// REST handler for adding a metric to multiple collections
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the metric
/// * `request` - The collection IDs to add the metric to
///
/// # Returns
///
/// A success message on success, or an appropriate error response
pub async fn add_metric_to_collections_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<AddMetricRequest>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!(
        metric_id = %id,
        user_id = %user.id,
        collection_count = request.collection_ids.len(),
        "Processing POST request to add metric to collections"
    );

    match add_metric_to_collections_handler(&id, request.collection_ids, &user.id).await {
        Ok(_) => Ok(ApiResponse::JsonData("Metric added to collections successfully".to_string())),
        Err(e) => {
            tracing::error!("Error adding metric to collections: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                if error_message.contains("Metric not found") {
                    return Err((StatusCode::NOT_FOUND, format!("Metric not found: {}", e)));
                } else if error_message.contains("Collection not found") {
                    return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
                }
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to add metric to collections: {}", e)))
        }
    }
}
```

3. Update `libs/handlers/src/metrics/mod.rs` to include the new handler
4. Update `src/routes/rest/routes/metrics/mod.rs` to include the new endpoint

### Database Operations

The implementation will use the `collections_to_assets` table with the following operations:
1. SELECT to check if records exist
2. INSERT for new records
3. UPDATE for records that were previously deleted

## Testing Strategy

### Unit Tests

1. Test the handler with mocked database connections
   - Test adding a metric to multiple collections
   - Test error cases (metric not found, collection not found, insufficient permissions)
   - Test adding a metric that was previously in a collection but deleted

2. Test the REST endpoint
   - Test successful request
   - Test error responses for various scenarios

### Integration Tests

1. Test the endpoint with a test database
   - Create a metric and collections
   - Add the metric to the collections
   - Verify the database state
   - Test with different user roles

## Security Considerations

- The endpoint requires authentication
- Permission checks ensure users can only modify metrics they have access to
- Input validation prevents malicious data

## Monitoring and Logging

- All operations are logged with appropriate context
- Errors are logged with detailed information

## Dependencies

- `libs/sharing` - For permission checking
- `libs/database` - For database operations

## Rollout Plan

1. Implement the handler and endpoint
2. Write tests
3. Code review
4. Deploy to staging
5. Test in staging
6. Deploy to production
7. Monitor for issues
