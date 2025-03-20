---
title: Add Metrics to Collection REST Endpoint
author: Cascade
date: 2025-03-19
status: Draft
---

# Add Metrics to Collection REST Endpoint

## Problem Statement

Users need the ability to programmatically add metrics to collections via a REST API. Currently, this functionality is not available, limiting the ability to manage collections through the API.

## Goals

1. Create a REST endpoint to add metrics to a collection
2. Implement proper permission validation
3. Ensure data integrity with proper error handling
4. Follow established patterns for REST endpoints and handlers

## Non-Goals

1. Modifying the existing collections functionality
2. Creating UI components for this endpoint

## Technical Design

### REST Endpoint

**Endpoint:** `POST /collections/:id/metrics`

**Request Body:**
```json
{
  "metric_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
- `200 OK` - Success
  ```json
  {
    "message": "Metrics added to collection successfully"
  }
  ```
- `400 Bad Request` - Invalid input
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Collection not found
- `500 Internal Server Error` - Server error

### Handler Implementation

The handler will:
1. Validate that the collection exists
2. Check if the user has appropriate permissions (Owner, FullAccess, or CanEdit)
3. Validate that the metrics exist and the user has access to them
4. Add the metrics to the collection by creating records in the `collections_to_assets` table
5. Handle the case where a metric was previously in the collection but was deleted (upsert)

### File Changes

#### New Files

1. `libs/handlers/src/collections/add_metrics_to_collection_handler.rs`
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

/// Adds metrics to a collection
///
/// # Arguments
///
/// * `collection_id` - The unique identifier of the collection
/// * `metric_ids` - Vector of metric IDs to add to the collection
/// * `user_id` - The unique identifier of the user performing the action
///
/// # Returns
///
/// Ok(()) on success, or an error if the operation fails
pub async fn add_metrics_to_collection_handler(
    collection_id: &Uuid,
    metric_ids: Vec<Uuid>,
    user_id: &Uuid,
) -> Result<()> {
    info!(
        collection_id = %collection_id,
        user_id = %user_id,
        metric_count = metric_ids.len(),
        "Adding metrics to collection"
    );

    if metric_ids.is_empty() {
        return Ok(());
    }

    // 1. Validate the collection exists
    let mut conn = get_pg_pool().get().await.map_err(|e| {
        error!("Database connection error: {}", e);
        anyhow!("Failed to get database connection: {}", e)
    })?;

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
        return Err(anyhow!("Collection not found"));
    }

    // 2. Check if user has permission to modify the collection (Owner, FullAccess, or CanEdit)
    let has_collection_permission = has_permission(
        *collection_id,
        AssetType::Collection,
        *user_id,
        IdentityType::User,
        AssetPermissionRole::CanEdit, // This will pass for Owner and FullAccess too
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
            "User does not have permission to modify this collection"
        );
        return Err(anyhow!("User does not have permission to modify this collection"));
    }

    // 3. Validate metrics exist and user has access to them
    for metric_id in &metric_ids {
        // Check if metric exists
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
            return Err(anyhow!("Metric not found: {}", metric_id));
        }

        // Check if user has access to the metric
        let has_metric_permission = has_permission(
            *metric_id,
            AssetType::MetricFile,
            *user_id,
            IdentityType::User,
            AssetPermissionRole::CanView, // User needs at least view access
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
                "User does not have permission to access this metric"
            );
            return Err(anyhow!("User does not have permission to access metric: {}", metric_id));
        }
    }

    // 4. Add metrics to collection (upsert if previously deleted)
    for metric_id in &metric_ids {
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
        collection_id = %collection_id,
        user_id = %user_id,
        metric_count = metric_ids.len(),
        "Successfully added metrics to collection"
    );

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::enums::{AssetPermissionRole, AssetType, IdentityType};
    use uuid::Uuid;

    #[tokio::test]
    async fn test_add_metrics_to_collection_handler() {
        // This is a placeholder for the actual test
        // In a real implementation, we would use test fixtures and a test database
        assert!(true); 
    }
}
```

2. `src/routes/rest/routes/collections/add_metrics_to_collection.rs`
```rust
use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::collections::add_metrics_to_collection_handler;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct AddMetricsRequest {
    pub metric_ids: Vec<Uuid>,
}

/// REST handler for adding metrics to a collection
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the collection
/// * `request` - The metric IDs to add to the collection
///
/// # Returns
///
/// A success message on success, or an appropriate error response
pub async fn add_metrics_to_collection_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<AddMetricsRequest>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!(
        collection_id = %id,
        user_id = %user.id,
        metric_count = request.metric_ids.len(),
        "Processing POST request to add metrics to collection"
    );

    match add_metrics_to_collection_handler(&id, request.metric_ids, &user.id).await {
        Ok(_) => Ok(ApiResponse::JsonData("Metrics added to collection successfully".to_string())),
        Err(e) => {
            tracing::error!("Error adding metrics to collection: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            
            if error_message.contains("not found") {
                if error_message.contains("Collection not found") {
                    return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
                } else if error_message.contains("Metric not found") {
                    return Err((StatusCode::NOT_FOUND, format!("Metric not found: {}", e)));
                }
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to add metrics to collection: {}", e)))
        }
    }
}
```

3. Update `libs/handlers/src/collections/mod.rs` to include the new handler
4. Update `src/routes/rest/routes/collections/mod.rs` to include the new endpoint

### Database Operations

The implementation will use the `collections_to_assets` table with the following operations:
1. SELECT to check if records exist
2. INSERT for new records
3. UPDATE for records that were previously deleted

## Testing Strategy

### Unit Tests

1. Test the handler with mocked database connections
   - Test adding metrics to a collection
   - Test error cases (collection not found, metric not found, insufficient permissions)
   - Test adding metrics that were previously in the collection but deleted

2. Test the REST endpoint
   - Test successful request
   - Test error responses for various scenarios

### Integration Tests

1. Test the endpoint with a test database
   - Create a collection and metrics
   - Add metrics to the collection
   - Verify the database state
   - Test with different user roles

## Security Considerations

- The endpoint requires authentication
- Permission checks ensure users can only modify collections they have access to
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
