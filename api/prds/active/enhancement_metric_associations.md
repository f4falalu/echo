# PRD: Enhance Get Metric Handler with Associations

## Problem Statement ✅
The current `get_metric_handler` in `libs/handlers/src/metrics/get_metric_handler.rs` retrieves detailed information about a specific metric but does not include information about which dashboards or collections the metric belongs to. Users often need this context to understand where a metric is being used and how it relates to other assets. Adding this information directly to the `BusterMetric` response type will improve usability and provide a more complete picture of the metric's context within the system.

### Current Limitations
- The `BusterMetric` response struct currently includes empty vectors for `dashboards` and `collections`.
- Users must perform separate queries or manually search to find which dashboards and collections utilize a specific metric.

### Impact
- User Impact: Increased effort required to understand metric usage and relationships. Potential for overlooking metric usage in certain dashboards or collections.
- System Impact: More API calls needed to gather complete metric context.
- Business Impact: Slower analysis and navigation for users trying to understand metric relationships.

## Requirements

### Functional Requirements ✅
#### Core Functionality
- Requirement 1: Fetch Associated Dashboards
  - Details: When `get_metric_handler` is called, it should query the database to find all dashboards that include the requested metric.
  - Acceptance Criteria: The `dashboards` field in the `BusterMetric` response should contain a list of objects, each including the `id` and `name` of an associated dashboard.
  - Dependencies: Requires access to `metric_files_to_dashboard_files` and `dashboard_files` tables.

- Requirement 2: Fetch Associated Collections
  - Details: When `get_metric_handler` is called, it should query the database to find all collections that include the requested metric.
  - Acceptance Criteria: The `collections` field in the `BusterMetric` response should contain a list of objects, each including the `id` and `name` of an associated collection.
  - Dependencies: Requires access to `collections_to_assets` and `collections` tables.

### Non-Functional Requirements ✅
- Performance Requirements: The additional queries should not significantly degrade the performance of the `get_metric_handler`. Aim for <100ms added latency per query. Consider optimizing queries, potentially joining them if feasible.
- Security Requirements: Ensure existing permission checks are respected. Users should only see associations with dashboards/collections they have permission to view (or at least know exist). *Initial implementation may return all associated dashboards/collections IDs and names, assuming visibility is handled by subsequent requests for those assets.*
- Scalability Requirements: Queries should scale efficiently as the number of metrics, dashboards, and collections grows. Use appropriate indexing.

## Technical Design ✅

### System Architecture
No changes to the overall system architecture. This change enhances an existing handler by adding concurrent data fetching.

### Core Components ✅
#### Component 1: `libs/handlers/src/metrics/get_metric_handler.rs`
```rust
// ... existing imports ...
use database::schema::{collections, collections_to_assets, dashboard_files, metric_files_to_dashboard_files};
use database::models::{Collection, DashboardFile}; // Assuming Collection model exists
use tokio::task::JoinHandle;
use futures::future::try_join_all;

// Define structs for associated assets
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssociatedDashboard {
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssociatedCollection {
    pub id: Uuid,
    pub name: String,
}

// Modify BusterMetric struct
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterMetric {
    // ... existing fields ...
    pub dashboards: Vec<AssociatedDashboard>, // Updated type
    pub collections: Vec<AssociatedCollection>, // Updated type
    // ... existing fields ...
}

// --- NEW HELPER FUNCTIONS START ---

async fn fetch_associated_dashboards_for_metric(metric_id: Uuid) -> Result<Vec<AssociatedDashboard>> {
    let mut conn = get_pg_pool().get().await?;
    let associated_dashboards = metric_files_to_dashboard_files::table
        .inner_join(dashboard_files::table.on(dashboard_files::id.eq(metric_files_to_dashboard_files::dashboard_file_id)))
        .filter(metric_files_to_dashboard_files::metric_file_id.eq(metric_id))
        .filter(dashboard_files::deleted_at.is_null())
        .select((dashboard_files::id, dashboard_files::name))
        .load::<(Uuid, String)>(&mut conn)
        .await?
        .into_iter()
        .map(|(id, name)| AssociatedDashboard { id, name })
        .collect();
    Ok(associated_dashboards)
}

async fn fetch_associated_collections_for_metric(metric_id: Uuid) -> Result<Vec<AssociatedCollection>> {
    let mut conn = get_pg_pool().get().await?;
    let associated_collections = collections_to_assets::table
        .inner_join(collections::table.on(collections::id.eq(collections_to_assets::collection_id)))
        .filter(collections_to_assets::asset_id.eq(metric_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .filter(collections::deleted_at.is_null())
        .select((collections::id, collections::name))
        .load::<(Uuid, String)>(&mut conn)
        .await?
        .into_iter()
        .map(|(id, name)| AssociatedCollection { id, name })
        .collect();
    Ok(associated_collections)
}

// --- NEW HELPER FUNCTIONS END ---

pub async fn get_metric_handler(
    metric_id: &Uuid,
    user: &AuthenticatedUser,
    version_number: Option<i32>,
) -> Result<BusterMetric> {
    // ... existing logic to fetch metric_file, check permissions ...

    // Clone metric_id for use in spawned tasks
    let m_id = *metric_id;

    // --- UPDATED LOGIC START ---

    // Spawn tasks to fetch associations concurrently
    let dashboards_handle: JoinHandle<Result<Vec<AssociatedDashboard>>> = 
        tokio::spawn(async move { fetch_associated_dashboards_for_metric(m_id).await });

    let collections_handle: JoinHandle<Result<Vec<AssociatedCollection>>> =
        tokio::spawn(async move { fetch_associated_collections_for_metric(m_id).await });

    // ... other potential concurrent tasks can be added here ...

    // Await results
    // Use join! or try_join! depending on whether other essential concurrent tasks exist
    let (dashboards_result, collections_result) = tokio::join!(dashboards_handle, collections_handle);

    // Handle results, logging errors but returning empty Vecs for failed tasks
    let dashboards = match dashboards_result {
        Ok(Ok(d)) => d,
        Ok(Err(e)) => {
            tracing::error!("Failed to fetch associated dashboards for metric {}: {}", metric_id, e);
            vec![]
        }
        Err(e) => { // JoinError
            tracing::error!("Task join error fetching dashboards for metric {}: {}", metric_id, e);
            vec![]
        }
    };

    let collections = match collections_result {
        Ok(Ok(c)) => c,
        Ok(Err(e)) => {
            tracing::error!("Failed to fetch associated collections for metric {}: {}", metric_id, e);
            vec![]
        }
        Err(e) => { // JoinError
            tracing::error!("Task join error fetching collections for metric {}: {}", metric_id, e);
            vec![]
        }
    };

    // --- UPDATED LOGIC END ---

    // ... existing logic to parse metric content, fetch versions, individual permissions etc. ...
    // Note: The main db connection `conn` might still be needed for sequential operations here.
    // Ensure it's acquired if necessary, e.g., let mut conn = get_pg_pool().get().await?;

    Ok(BusterMetric {
        // ... existing field assignments ...
        dashboards, // Assign fetched dashboards
        collections, // Assign fetched collections
        // ... rest of the fields ...
    })
}

```

### Database Changes (If applicable)
No schema changes required. Ensure appropriate indexes exist:
- `metric_files_to_dashboard_files`: Index on `metric_file_id`.
- `collections_to_assets`: Composite index on `(asset_id, asset_type)`.
- `dashboard_files`: Index on `id`.
- `collections`: Index on `id`.

### API Changes (If applicable)
The response structure of the endpoint(s) using `get_metric_handler` will change. The `dashboards` and `collections` fields within the `BusterMetric` object will now be populated with lists of `{id: Uuid, name: String}` objects instead of empty arrays.

### File Changes (If applicable)
#### Modified Files
- `libs/handlers/src/metrics/get_metric_handler.rs`
  - Changes: 
    - Added two new private async functions: `fetch_associated_dashboards_for_metric` and `fetch_associated_collections_for_metric`.
    - Modified `get_metric_handler` to use `tokio::spawn` and `tokio::join!` to call these helper functions concurrently.
    - Updated error handling for concurrent tasks.
    - Updated the `BusterMetric` struct fields `dashboards` and `collections`.
  - Impact: Handler now performs association fetches concurrently. Introduces dependency on `tokio` for spawning tasks and `futures` potentially for joining.
  - Dependencies: `database` crate, `tokio`, `futures`, `anyhow`, `tracing`, `uuid`.
- `libs/handlers/src/metrics/types.rs` (or wherever `BusterMetric`, `AssociatedDashboard`, `AssociatedCollection` are defined)
  - Changes: Update/Define `BusterMetric`, `AssociatedDashboard`, `AssociatedCollection` structs.
  - Impact: Changes the structure returned by the handler.
  - Dependencies: `uuid::Uuid`, `serde::{Serialize, Deserialize}`.

## Implementation Plan

### Phase 1: Implement Backend Logic & Update Types ⏳ (Not Started)
1. Define `AssociatedDashboard` and `AssociatedCollection` structs in `libs/handlers/src/metrics/types.rs` (or appropriate location).
2. Update `BusterMetric` struct definition to use these new types for `dashboards` and `collections`.
3. Implement the database queries within `get_metric_handler.rs` to fetch associated dashboards and collections.
4. Populate the `dashboards` and `collections` fields in the returned `BusterMetric` object.
5. Add tracing for errors during the fetch operations.

### Phase 2: Testing & Documentation 🔜 (Not Started)
1. Add unit tests for the new logic in `get_metric_handler.rs`. Mock database interactions to test:
    - Correctly fetching dashboards.
    - Correctly fetching collections.
    - Handling cases where a metric has no associations.
    - Handling database errors gracefully.
2. Add integration tests to verify the API endpoint returns the expected associations.
3. Update relevant documentation (e.g., API docs, internal handler docs) to reflect the change in the response structure.

## Testing Strategy
- Unit Tests: Mock database responses in `get_metric_handler_test.rs` to ensure the query logic is correct and handles various scenarios (associations found, none found, errors).
- Integration Tests: Create test data (metric, dashboards, collections, associations) and call the relevant API endpoint(s). Verify the response contains the correct `dashboards` and `collections` lists. Test with different permission levels if applicable.

## Rollback Plan
- Revert the changes to `get_metric_handler.rs` and the `BusterMetric` type definition.
- Redeploy the previous version of the code.

## Security Considerations
- Ensure that fetching associated IDs and names does not leak sensitive information. The current design assumes IDs and names are not sensitive, but access to the full dashboard/collection content is protected by separate permission checks when fetching those assets directly. Re-evaluate if names could be considered sensitive.

## Dependencies
- Database tables: `metric_files_to_dashboard_files`, `dashboard_files`, `collections_to_assets`, `collections`.
- Enums: `database::enums::AssetType`.
- Crates: `diesel`, `diesel-async`, `anyhow`, `uuid`, `serde`, `tracing`.

## File References
- Handler: `libs/handlers/src/metrics/get_metric_handler.rs`
- Types: `libs/handlers/src/metrics/types.rs` (or wherever `BusterMetric` is defined)
- Schema: `libs/database/src/schema.rs`
- Models: `libs/database/src/models.rs`
- Enums: `libs/database/src/enums.rs` 