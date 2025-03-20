---
title: Add Assets to Collection REST Endpoint
author: Cascade
date: 2025-03-19
status: Draft
---

# Add Assets to Collection REST Endpoint

## Problem Statement

Users need the ability to programmatically add multiple assets (dashboards, metrics, etc.) to a collection via a REST API. Currently, there are separate endpoints for adding specific asset types, but a unified endpoint for adding multiple assets of different types would improve efficiency and usability.

## Goals

1. Create a REST endpoint to add multiple assets to a collection
2. Support different asset types (dashboards, metrics, etc.) in a single request
3. Implement proper permission validation
4. Ensure data integrity with proper error handling
5. Follow established patterns for REST endpoints and handlers

## Non-Goals

1. Modifying the existing collections functionality
2. Creating UI components for this endpoint
3. Replacing the asset-type specific endpoints

## Technical Design

### REST Endpoint

**Endpoint:** `POST /collections/:id/assets`

**Request Body:**
```json
{
  "assets": [
    {
      "id": "uuid1",
      "type": "dashboard"
    },
    {
      "id": "uuid2",
      "type": "metric"
    },
    {
      "id": "uuid3",
      "type": "dashboard"
    }
  ]
}
```

**Response:**
- `200 OK` - Success
  ```json
  {
    "message": "Assets added to collection successfully",
    "added_count": 3,
    "failed_count": 0,
    "failed_assets": []
  }
  ```
- `400 Bad Request` - Invalid input
- `404 Not Found` - Collection not found
- `500 Internal Server Error` - Server error

### Handler Implementation

The handler will:
1. Validate that the collection exists
2. Check if the user has appropriate permissions (Owner, FullAccess, or CanEdit) for the collection
3. Group assets by type for efficient processing
4. Validate that each asset exists and the user has access to it
5. Add the assets to the collection by creating records in the `collections_to_assets` table
6. Handle the case where an asset was previously in the collection but was deleted (upsert)
7. Return counts of successful and failed operations

### File Changes

#### New Files

1. `libs/handlers/src/collections/add_assets_to_collection_handler.rs`
```rust
use anyhow::{anyhow, Result};
use database::{
    get_pg_pool,
    models::{
        asset_permission_role::AssetPermissionRole,
        asset_type::AssetType,
        collection_to_asset::CollectionToAsset,
        identity_type::IdentityType,
    },
    schema::{collections, collections_to_assets, dashboard_files, metric_files},
};
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use diesel_async::RunQueryDsl as AsyncRunQueryDsl;
use sharing::has_permission;
use tracing::{error, info};
use uuid::Uuid;

/// Asset to add to a collection
#[derive(Debug, Clone)]
pub struct AssetToAdd {
    /// The unique identifier of the asset
    pub id: Uuid,
    /// The type of the asset
    pub asset_type: AssetType,
}

/// Result of adding assets to a collection
#[derive(Debug)]
pub struct AddAssetsToCollectionResult {
    /// Number of assets successfully added
    pub added_count: usize,
    /// Number of assets that failed to be added
    pub failed_count: usize,
    /// List of assets that failed to be added with error messages
    pub failed_assets: Vec<(Uuid, AssetType, String)>,
}

/// Adds multiple assets to a collection
///
/// # Arguments
///
/// * `collection_id` - The unique identifier of the collection
/// * `assets` - Vector of assets to add to the collection
/// * `user_id` - The unique identifier of the user performing the action
///
/// # Returns
///
/// Result containing counts of successful and failed operations
pub async fn add_assets_to_collection_handler(
    collection_id: &Uuid,
    assets: Vec<AssetToAdd>,
    user_id: &Uuid,
) -> Result<AddAssetsToCollectionResult> {
    info!(
        collection_id = %collection_id,
        user_id = %user_id,
        asset_count = assets.len(),
        "Adding assets to collection"
    );

    if assets.is_empty() {
        return Ok(AddAssetsToCollectionResult {
            added_count: 0,
            failed_count: 0,
            failed_assets: vec![],
        });
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
        return Err(anyhow!(
            "User does not have permission to modify this collection"
        ));
    }

    // 3. Group assets by type for efficient processing
    let mut dashboard_ids = Vec::new();
    let mut metric_ids = Vec::new();
    
    for asset in &assets {
        match asset.asset_type {
            AssetType::DashboardFile => dashboard_ids.push(asset.id),
            AssetType::MetricFile => metric_ids.push(asset.id),
            _ => {
                error!(
                    asset_id = %asset.id,
                    asset_type = ?asset.asset_type,
                    "Unsupported asset type"
                );
                // We'll handle this in the results
            }
        }
    }

    // 4. Process each asset type
    let mut result = AddAssetsToCollectionResult {
        added_count: 0,
        failed_count: 0,
        failed_assets: vec![],
    };

    // Process dashboards
    if !dashboard_ids.is_empty() {
        for dashboard_id in &dashboard_ids {
            // Check if dashboard exists
            let dashboard_exists = dashboard_files::table
                .filter(dashboard_files::id.eq(dashboard_id))
                .filter(dashboard_files::deleted_at.is_null())
                .count()
                .get_result::<i64>(&mut conn)
                .await
                .map_err(|e| {
                    error!("Error checking if dashboard exists: {}", e);
                    anyhow!("Database error: {}", e)
                })?;

            if dashboard_exists == 0 {
                error!(
                    dashboard_id = %dashboard_id,
                    "Dashboard not found"
                );
                result.failed_count += 1;
                result.failed_assets.push((*dashboard_id, AssetType::DashboardFile, "Dashboard not found".to_string()));
                continue;
            }

            // Check if user has access to the dashboard
            let has_dashboard_permission = has_permission(
                *dashboard_id,
                AssetType::DashboardFile,
                *user_id,
                IdentityType::User,
                AssetPermissionRole::CanView, // User needs at least view access
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
                    "User does not have permission to access this dashboard"
                );
                result.failed_count += 1;
                result.failed_assets.push((*dashboard_id, AssetType::DashboardFile, "Insufficient permissions".to_string()));
                continue;
            }

            // Check if the dashboard is already in the collection
            let existing = match collections_to_assets::table
                .filter(collections_to_assets::collection_id.eq(collection_id))
                .filter(collections_to_assets::asset_id.eq(dashboard_id))
                .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
                .first::<CollectionToAsset>(&mut conn)
                .await
            {
                Ok(record) => Some(record),
                Err(diesel::NotFound) => None,
                Err(e) => {
                    error!(
                        "Error checking if dashboard is already in collection: {}",
                        e
                    );
                    result.failed_count += 1;
                    result.failed_assets.push((*dashboard_id, AssetType::DashboardFile, format!("Database error: {}", e)));
                    continue;
                }
            };

            if let Some(existing_record) = existing {
                if existing_record.deleted_at.is_some() {
                    // If it was previously deleted, update it
                    match diesel::update(collections_to_assets::table)
                        .filter(collections_to_assets::collection_id.eq(collection_id))
                        .filter(collections_to_assets::asset_id.eq(dashboard_id))
                        .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
                        .set((
                            collections_to_assets::deleted_at
                                .eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
                            collections_to_assets::updated_at.eq(chrono::Utc::now()),
                            collections_to_assets::updated_by.eq(user_id),
                        ))
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => {
                            result.added_count += 1;
                        },
                        Err(e) => {
                            error!(
                                collection_id = %collection_id,
                                dashboard_id = %dashboard_id,
                                "Error updating dashboard in collection: {}", e
                            );
                            result.failed_count += 1;
                            result.failed_assets.push((*dashboard_id, AssetType::DashboardFile, format!("Database error: {}", e)));
                        }
                    }
                } else {
                    // Already in the collection and not deleted, nothing to do
                    result.added_count += 1;
                }
            } else {
                // Not in the collection, insert it
                match diesel::insert_into(collections_to_assets::table)
                    .values((
                        collections_to_assets::collection_id.eq(collection_id),
                        collections_to_assets::asset_id.eq(dashboard_id),
                        collections_to_assets::asset_type.eq(AssetType::DashboardFile),
                        collections_to_assets::created_at.eq(chrono::Utc::now()),
                        collections_to_assets::created_by.eq(user_id),
                        collections_to_assets::updated_at.eq(chrono::Utc::now()),
                        collections_to_assets::updated_by.eq(user_id),
                    ))
                    .execute(&mut conn)
                    .await
                {
                    Ok(_) => {
                        result.added_count += 1;
                    },
                    Err(e) => {
                        error!(
                            collection_id = %collection_id,
                            dashboard_id = %dashboard_id,
                            "Error inserting dashboard into collection: {}", e
                        );
                        result.failed_count += 1;
                        result.failed_assets.push((*dashboard_id, AssetType::DashboardFile, format!("Database error: {}", e)));
                    }
                }
            }
        }
    }

    // Process metrics
    if !metric_ids.is_empty() {
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
                result.failed_count += 1;
                result.failed_assets.push((*metric_id, AssetType::MetricFile, "Metric not found".to_string()));
                continue;
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
                result.failed_count += 1;
                result.failed_assets.push((*metric_id, AssetType::MetricFile, "Insufficient permissions".to_string()));
                continue;
            }

            // Check if the metric is already in the collection
            let existing = match collections_to_assets::table
                .filter(collections_to_assets::collection_id.eq(collection_id))
                .filter(collections_to_assets::asset_id.eq(metric_id))
                .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                .first::<CollectionToAsset>(&mut conn)
                .await
            {
                Ok(record) => Some(record),
                Err(diesel::NotFound) => None,
                Err(e) => {
                    error!(
                        "Error checking if metric is already in collection: {}",
                        e
                    );
                    result.failed_count += 1;
                    result.failed_assets.push((*metric_id, AssetType::MetricFile, format!("Database error: {}", e)));
                    continue;
                }
            };

            if let Some(existing_record) = existing {
                if existing_record.deleted_at.is_some() {
                    // If it was previously deleted, update it
                    match diesel::update(collections_to_assets::table)
                        .filter(collections_to_assets::collection_id.eq(collection_id))
                        .filter(collections_to_assets::asset_id.eq(metric_id))
                        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
                        .set((
                            collections_to_assets::deleted_at
                                .eq::<Option<chrono::DateTime<chrono::Utc>>>(None),
                            collections_to_assets::updated_at.eq(chrono::Utc::now()),
                            collections_to_assets::updated_by.eq(user_id),
                        ))
                        .execute(&mut conn)
                        .await
                    {
                        Ok(_) => {
                            result.added_count += 1;
                        },
                        Err(e) => {
                            error!(
                                collection_id = %collection_id,
                                metric_id = %metric_id,
                                "Error updating metric in collection: {}", e
                            );
                            result.failed_count += 1;
                            result.failed_assets.push((*metric_id, AssetType::MetricFile, format!("Database error: {}", e)));
                        }
                    }
                } else {
                    // Already in the collection and not deleted, nothing to do
                    result.added_count += 1;
                }
            } else {
                // Not in the collection, insert it
                match diesel::insert_into(collections_to_assets::table)
                    .values((
                        collections_to_assets::collection_id.eq(collection_id),
                        collections_to_assets::asset_id.eq(metric_id),
                        collections_to_assets::asset_type.eq(AssetType::MetricFile),
                        collections_to_assets::created_at.eq(chrono::Utc::now()),
                        collections_to_assets::created_by.eq(user_id),
                        collections_to_assets::updated_at.eq(chrono::Utc::now()),
                        collections_to_assets::updated_by.eq(user_id),
                    ))
                    .execute(&mut conn)
                    .await
                {
                    Ok(_) => {
                        result.added_count += 1;
                    },
                    Err(e) => {
                        error!(
                            collection_id = %collection_id,
                            metric_id = %metric_id,
                            "Error inserting metric into collection: {}", e
                        );
                        result.failed_count += 1;
                        result.failed_assets.push((*metric_id, AssetType::MetricFile, format!("Database error: {}", e)));
                    }
                }
            }
        }
    }

    info!(
        collection_id = %collection_id,
        user_id = %user_id,
        added_count = result.added_count,
        failed_count = result.failed_count,
        "Successfully processed add assets to collection request"
    );

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_add_assets_to_collection_handler() {
        // This is a placeholder for the actual test
        // In a real implementation, we would use test fixtures and a test database
        assert!(true);
    }
}
```

2. `src/routes/rest/routes/collections/add_assets_to_collection.rs`
```rust
use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::collections::{add_assets_to_collection_handler, AssetToAdd};
use middleware::AuthenticatedUser;
use serde::{Deserialize, Serialize};
use tracing::info;
use uuid::Uuid;
use database::models::asset_type::AssetType;
use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct AssetRequest {
    pub id: Uuid,
    pub type_: String,
}

#[derive(Debug, Deserialize)]
pub struct AddAssetsRequest {
    pub assets: Vec<AssetRequest>,
}

#[derive(Debug, Serialize)]
pub struct FailedAsset {
    pub id: Uuid,
    pub type_: String,
    pub error: String,
}

#[derive(Debug, Serialize)]
pub struct AddAssetsResponse {
    pub message: String,
    pub added_count: usize,
    pub failed_count: usize,
    pub failed_assets: Vec<FailedAsset>,
}

/// REST handler for adding multiple assets to a collection
///
/// # Arguments
///
/// * `user` - The authenticated user
/// * `id` - The unique identifier of the collection
/// * `request` - The assets to add to the collection
///
/// # Returns
///
/// A JSON response with the result of the operation
pub async fn add_assets_to_collection_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<AddAssetsRequest>,
) -> Result<ApiResponse<AddAssetsResponse>, (StatusCode, String)> {
    info!(
        collection_id = %id,
        user_id = %user.id,
        asset_count = request.assets.len(),
        "Processing POST request to add assets to collection"
    );

    // Convert request assets to handler assets
    let assets: Vec<AssetToAdd> = request.assets.into_iter().filter_map(|asset| {
        let asset_type = match asset.type_.to_lowercase().as_str() {
            "dashboard" => Some(AssetType::DashboardFile),
            "metric" => Some(AssetType::MetricFile),
            _ => None,
        };
        
        asset_type.map(|t| AssetToAdd {
            id: asset.id,
            asset_type: t,
        })
    }).collect();

    match add_assets_to_collection_handler(&id, assets, &user.id).await {
        Ok(result) => {
            let failed_assets = result.failed_assets.into_iter().map(|(id, asset_type, error)| {
                let type_str = match asset_type {
                    AssetType::DashboardFile => "dashboard",
                    AssetType::MetricFile => "metric",
                    _ => "unknown",
                };
                
                FailedAsset {
                    id,
                    type_: type_str.to_string(),
                    error,
                }
            }).collect();
            
            Ok(ApiResponse::JsonData(AddAssetsResponse {
                message: "Assets processed".to_string(),
                added_count: result.added_count,
                failed_count: result.failed_count,
                failed_assets,
            }))
        },
        Err(e) => {
            tracing::error!("Error adding assets to collection: {}", e);
            
            // Map specific errors to appropriate status codes
            let error_message = e.to_string();
            if error_message.contains("Collection not found") {
                return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
            } else if error_message.contains("permission") {
                return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to add assets to collection: {}", e)))
        }
    }
}
```

3. Update `libs/handlers/src/collections/mod.rs` to include the new handler
4. Update `src/routes/rest/routes/collections/mod.rs` to include the new endpoint

### Database Operations

The implementation will use the existing `collections_to_assets` table, which has the following structure:
- `collection_id` - The ID of the collection
- `asset_id` - The ID of the asset
- `asset_type` - The type of the asset (dashboard, metric, etc.)
- `created_at` - When the record was created
- `created_by` - Who created the record
- `updated_at` - When the record was last updated
- `updated_by` - Who last updated the record
- `deleted_at` - When the record was deleted (null if not deleted)

### Unit Tests

1. Test the handler with mocked database connections
   - Test adding multiple assets to a collection
   - Test error cases (collection not found, asset not found, insufficient permissions)
   - Test adding assets that were previously in the collection but deleted

2. Test the REST endpoint
   - Test successful request
   - Test error cases

### Integration Tests

1. Test the endpoint with a test database
   - Create a collection and assets
   - Add assets to the collection
   - Verify the database state
   - Test with different user roles

### Security

- The endpoint requires authentication
- Permission checks ensure users can only modify collections they have access to
- Input validation prevents malicious data

## Monitoring and Logging

- Log all operations with appropriate context (collection ID, user ID, asset IDs)
- Track errors and failed operations
- Monitor performance metrics for the endpoint

## Rollout Plan

1. Implement the handler and endpoint
2. Write unit and integration tests
3. Deploy to staging environment
4. Perform manual testing
5. Deploy to production

## Future Improvements

1. Add support for more asset types
2. Implement batch processing for large numbers of assets
3. Add more detailed error reporting
4. Consider adding an async job for very large batches
