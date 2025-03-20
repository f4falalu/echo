# API: Add Assets to GET Collection Response

## Problem Statement
Currently, the GET Collection endpoint (`get_collection_handler.rs`) doesn't populate the `assets` field in the response, even though the `CollectionState` type already contains this field. This is a critical functionality gap as clients need to see what assets (metrics and dashboards) are contained within a collection.

The frontend is expecting a `BusterCollection` type that includes an `assets` array containing `BusterCollectionItemAsset` objects with information from both metric_files and dashboard_files tables.

## Proposed Solution
Modify the GET Collection handler to populate the `assets` field in the response. We'll fetch assets from the collections_to_assets junction table and join with metric_files and dashboard_files tables to get the complete asset information.

## Technical Design

### Code Changes

1. Update the `get_collection_handler.rs` to:
   - Query assets from collections_to_assets junction table
   - Join with metric_files and dashboard_files tables based on asset_type
   - Join with users table to get creator information
   - Format the data into CollectionAsset structure
   - Include formatted assets in the CollectionState response

### Database Queries

We'll need to execute two queries to fetch both metric and dashboard assets:

```rust
// For metrics
let metric_assets = collections_to_assets::table
    .inner_join(metric_files::table.on(metric_files::id.eq(collections_to_assets::asset_id)))
    .inner_join(users::table.on(users::id.eq(metric_files::created_by)))
    .filter(collections_to_assets::collection_id.eq(req.id))
    .filter(collections_to_assets::asset_type.eq(AssetType::Metric))
    .filter(collections_to_assets::deleted_at.is_null())
    .filter(metric_files::deleted_at.is_null())
    .select((
        metric_files::id,
        metric_files::name,
        (users::name, users::email),
        metric_files::created_at,
        metric_files::updated_at,
        collections_to_assets::asset_type,
    ))
    .load::<AssetQueryResult>(&mut conn)
    .await?;

// For dashboards
let dashboard_assets = collections_to_assets::table
    .inner_join(dashboard_files::table.on(dashboard_files::id.eq(collections_to_assets::asset_id)))
    .inner_join(users::table.on(users::id.eq(dashboard_files::created_by)))
    .filter(collections_to_assets::collection_id.eq(req.id))
    .filter(collections_to_assets::asset_type.eq(AssetType::Dashboard))
    .filter(collections_to_assets::deleted_at.is_null())
    .filter(dashboard_files::deleted_at.is_null())
    .select((
        dashboard_files::id,
        dashboard_files::name,
        (users::name, users::email),
        dashboard_files::created_at,
        dashboard_files::updated_at,
        collections_to_assets::asset_type,
    ))
    .load::<AssetQueryResult>(&mut conn)
    .await?;

// Combine results
let combined_assets = [metric_assets, dashboard_assets].concat();
```

### Utility Functions

We'll need a helper function to format the database results into the `CollectionAsset` type:

```rust
fn format_assets(assets: Vec<AssetQueryResult>) -> Vec<CollectionAsset> {
    assets
        .into_iter()
        .map(|(id, name, (user_name, email), created_at, updated_at, asset_type)| {
            CollectionAsset {
                id,
                name,
                created_by: AssetUser {
                    name: user_name,
                    email,
                },
                created_at,
                updated_at,
                asset_type,
            }
        })
        .collect()
}
```

## Implementation Plan

### Phase 1: Update `get_collection_handler.rs`
- Define `AssetQueryResult` type for fetching asset data
- Implement the query logic to fetch assets from both tables
- Add the combined assets to the `CollectionState` response

### Phase 2: Update Tests
- Update existing tests to include assertions for the assets field
- Add test cases with different combinations of metrics and dashboards

## Testing Strategy

### Unit Tests
- Test the handler with collections that have:
  - No assets
  - Only metrics
  - Only dashboards
  - Both metrics and dashboards
  - Deleted assets (should not be included)

### Integration Tests
- Update integration tests to verify the full API response structure
- Test that assets are correctly formatted and included in the response

## Success Criteria
- GET Collection API returns the assets field in its response
- Assets field contains correctly formatted data from both metric_files and dashboard_files tables
- Frontend can successfully display the assets associated with a collection

## Affected Files
- `libs/handlers/src/collections/get_collection_handler.rs`
- `tests/integration/collections/get_collection_test.rs` (for updated tests)

## Dependencies
- Schema structure for collections_to_assets, metric_files, and dashboard_files tables
- The types for CollectionAsset and AssetUser already exist in types.rs

## Implementation Status
- [x] Update get_collection_handler to fetch assets
- [x] Add appropriate tests
- [ ] Manual verification with frontend