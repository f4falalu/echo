# PRD: Enhance Get Dashboard Handler with Collections

## Problem Statement ✅
The current `get_dashboard_handler` in `libs/handlers/src/dashboards/get_dashboard_handler.rs` retrieves detailed information about a specific dashboard but does not include information about which collections the dashboard belongs to. Users often need this context to understand how a dashboard is organized and grouped with other assets.
Adding this information directly to the `BusterDashboardResponse` type will improve usability and provide a more complete picture of the dashboard's organizational context.

### Current Limitations
- The `BusterDashboardResponse` struct currently includes an empty vector for `collections`.
- Users must perform separate queries or manually search to find which collections contain a specific dashboard.

### Impact
- User Impact: Increased effort required to understand dashboard organization. Potential for missing context about how dashboards are grouped.
- System Impact: More API calls needed to gather complete dashboard context.
- Business Impact: Slower analysis and navigation for users trying to understand dashboard relationships within collections.

## Requirements

### Functional Requirements ✅
#### Core Functionality
- Requirement 1: Fetch Associated Collections
  - Details: When `get_dashboard_handler` is called, it should query the database to find all collections that include the requested dashboard.
  - Acceptance Criteria: The `collections` field in the `BusterDashboardResponse` should contain a list of objects, each including the `id` and `name` of an associated collection.
  - Dependencies: Requires access to `collections_to_assets` and `collections` tables.

### Non-Functional Requirements ✅
- Performance Requirements: The additional query should not significantly degrade the performance of the `get_dashboard_handler`. Aim for <100ms added latency. Consider optimizing the query.
- Security Requirements: Ensure existing permission checks are respected. Users should only see associations with collections they have permission to view (or at least know exist). *Initial implementation may return all associated collection IDs and names, assuming visibility is handled by subsequent requests for those assets.*
- Scalability Requirements: The query should scale efficiently as the number of dashboards and collections grows. Use appropriate indexing.

## Technical Design ✅

### System Architecture
No changes to the overall system architecture. This change enhances an existing handler by adding concurrent data fetching.

### Core Components ✅
#### Component 1: `libs/handlers/src/dashboards/get_dashboard_handler.rs`
```rust
// ... existing imports ...
use database::schema::{collections, collections_to_assets};
use database::models::Collection; // Assuming Collection model exists
use tokio::task::JoinHandle;

// Define struct for associated collection (assuming defined, possibly in types.rs or shared location)
// #[derive(Debug, Serialize, Deserialize, Clone)]
// pub struct AssociatedCollection { ... }

// Modify BusterDashboardResponse struct (assuming defined elsewhere)
// #[derive(Debug, Serialize, Deserialize, Clone)]
// pub struct BusterDashboardResponse { ... collections: Vec<AssociatedCollection> ... }

// --- NEW HELPER FUNCTION START ---

async fn fetch_associated_collections_for_dashboard(dashboard_id: Uuid) -> Result<Vec<AssociatedCollection>> {
    let mut conn = get_pg_pool().get().await?;
    let associated_collections = collections_to_assets::table
        .inner_join(collections::table.on(collections::id.eq(collections_to_assets::collection_id)))
        .filter(collections_to_assets::asset_id.eq(dashboard_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile)) // Filter by asset type
        .filter(collections::deleted_at.is_null()) // Ensure collection isn't deleted
        .select((collections::id, collections::name))
        .load::<(Uuid, String)>(&mut conn)
        .await?
        .into_iter()
        .map(|(id, name)| AssociatedCollection { id, name })
        .collect();
    Ok(associated_collections)
}

// --- NEW HELPER FUNCTION END ---

pub async fn get_dashboard_handler(
    dashboard_id: &Uuid,
    user: &AuthenticatedUser,
    version_number: Option<i32>,
) -> Result<BusterDashboardResponse> {
    // ... existing logic to fetch dashboard_with_permission, parse content, check permissions ...

    // Clone dashboard_id for use in spawned task
    let d_id = *dashboard_id;

    // --- UPDATED LOGIC START ---

    // Spawn task to fetch collections concurrently
    let collections_handle: JoinHandle<Result<Vec<AssociatedCollection>>> =
        tokio::spawn(async move { fetch_associated_collections_for_dashboard(d_id).await });

    // Fetch metrics concurrently (assuming this is already happening or will be added)
    // Example: let metrics_handle = tokio::spawn(async move { fetch_metrics_for_dashboard(...).await });

    // Await results - potentially join multiple handles
    // Example: let (collections_result, metrics_result) = tokio::join!(collections_handle, metrics_handle);
    let collections_result = collections_handle.await;

    // Handle collections result
    let collections = match collections_result {
        Ok(Ok(c)) => c,
        Ok(Err(e)) => {
            tracing::error!("Failed to fetch associated collections for dashboard {}: {}", dashboard_id, e);
            vec![]
        }
        Err(e) => { // JoinError
            tracing::error!("Task join error fetching collections for dashboard {}: {}", dashboard_id, e);
            vec![]
        }
    };
    
    // Handle metrics result (if fetched concurrently)
    // Example: let metrics = handle_metrics_result(metrics_result, dashboard_id);
    
    // Fetch metrics sequentially for now if not concurrent
    // Collect all metric IDs from the rows
    let metric_ids: Vec<Uuid> = config // Assuming config is parsed earlier
        .rows
        .iter()
        .flat_map(|row| {
            row.items
                .iter()
                .filter_map(|item| Uuid::parse_str(&item.id).ok())
        })
        .collect();

    // Fetch all metrics (latest versions)
    let metric_futures: Vec<_> = metric_ids
        .iter()
        .map(|metric_id| get_metric_handler(metric_id, &user, None)) // Assuming get_metric_handler exists
        .collect();
    let metric_results = futures::future::join_all(metric_futures).await;
    let metrics: std::collections::HashMap<Uuid, BusterMetric> = metric_results // Assuming BusterMetric type
        .into_iter()
        .filter_map(|result| result.ok())
        .map(|metric| (metric.id, metric))
        .collect();

    // --- UPDATED LOGIC END ---

    // ... existing logic to fetch individual permissions, versions, construct final dashboard object ...
    // Ensure a db connection is available if needed for sequential tasks
    // let mut conn = get_pg_pool().get().await?;

    Ok(BusterDashboardResponse {
        // ... existing field assignments ...
        metrics, // Assign fetched metrics
        collections, // Assign fetched collections
        // ... rest of the fields ...
    })
}

```

### Database Changes (If applicable)
No schema changes required. Ensure appropriate indexes exist:
- `collections_to_assets`: Composite index on `(asset_id, asset_type)`.
- `collections`: Index on `id`.

### API Changes (If applicable)
The response structure of the endpoint(s) using `get_dashboard_handler` will change. The `collections` field within the `BusterDashboardResponse` object will now be populated with a list of `{id: Uuid, name: String}` objects instead of an empty array.

### File Changes (If applicable)
#### Modified Files
- `libs/handlers/src/dashboards/get_dashboard_handler.rs`
  - Changes: 
    - Added a new private async function: `fetch_associated_collections_for_dashboard`.
    - Modified `get_dashboard_handler` to use `tokio::spawn` to call this helper function concurrently with other potential async operations (like fetching metrics).
    - Updated error handling for the concurrent task.
    - Updated the `BusterDashboardResponse` struct field `collections`.
    - Note: Assumes metric fetching might also be made concurrent or remains sequential as shown.
  - Impact: Handler now performs collection fetch concurrently. Introduces dependency on `tokio`.
  - Dependencies: `database` crate, `tokio`, `futures`, `anyhow`, `tracing`, `uuid`.
- `libs/handlers/src/dashboards/types.rs` (or wherever `BusterDashboardResponse`, `AssociatedCollection` are defined)
  - Changes: Update/Define `BusterDashboardResponse` and `AssociatedCollection` structs.
  - Impact: Changes the structure returned by the handler.
  - Dependencies: `uuid::Uuid`, `serde::{Serialize, Deserialize}`.

## Implementation Plan

### Phase 1: Implement Backend Logic & Update Types ⏳ (Not Started)
1. Define or reuse `AssociatedCollection` struct (e.g., in `libs/handlers/src/dashboards/types.rs` or a shared location).
2. Update `BusterDashboardResponse` struct definition to use `Vec<AssociatedCollection>` for the `collections` field.
3. Implement the database query within `get_dashboard_handler.rs` to fetch associated collections.
4. Populate the `collections` field in the returned `BusterDashboardResponse` object.
5. Add tracing for errors during the fetch operation.

### Phase 2: Testing & Documentation 🔜 (Not Started)
1. Add unit tests for the new logic in `get_dashboard_handler.rs`. Mock database interactions to test:
    - Correctly fetching collections.
    - Handling cases where a dashboard has no collections.
    - Handling database errors gracefully.
2. Add integration tests to verify the API endpoint returns the expected associations.
3. Update relevant documentation (e.g., API docs, internal handler docs) to reflect the change in the response structure.

## Testing Strategy
- Unit Tests: Mock database responses in `get_dashboard_handler_test.rs` to ensure the query logic is correct and handles various scenarios (associations found, none found, errors).
- Integration Tests: Create test data (dashboard, collections, associations) and call the relevant API endpoint(s). Verify the response contains the correct `collections` list. Test with different permission levels if applicable.

## Rollback Plan
- Revert the changes to `get_dashboard_handler.rs` and the `BusterDashboardResponse` type definition.
- Redeploy the previous version of the code.

## Security Considerations
- Ensure that fetching associated collection IDs and names does not leak sensitive information. The current design assumes IDs and names are not sensitive, but access to the full collection content is protected by separate permission checks when fetching those assets directly. Re-evaluate if names could be considered sensitive.

## Dependencies
- Database tables: `collections_to_assets`, `collections`.
- Enums: `database::enums::AssetType`.
- Crates: `diesel`, `diesel-async`, `anyhow`, `uuid`, `serde`, `tracing`.

## File References
- Handler: `libs/handlers/src/dashboards/get_dashboard_handler.rs`
- Types: `libs/handlers/src/dashboards/types.rs` (or wherever `BusterDashboardResponse` is defined)
- Schema: `libs/database/src/schema.rs`
- Models: `libs/database/src/models.rs`
- Enums: `libs/database/src/enums.rs`

</rewritten_file> 