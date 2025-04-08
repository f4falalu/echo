# Sub-PRD: Enhance Dashboard Metric Permissions

**Author:** AI Assistant (Pair Programming with User)
**Date:** 2023-10-27
**Status:** Proposed
**Parent PRD:** [Project: Granular Asset Permission Checks](mdc:prds/active/project_granular_asset_permissions.md)

## 1. Overview

This PRD describes the modifications needed for the `get_dashboard_handler` to implement granular permission checks for each metric included in a dashboard. It involves leveraging the central permission helper and adjusting how metric data is fetched and represented in the response, potentially by modifying `get_metric_handler` or how its results are processed.

## 2. Problem Statement

Currently, `get_dashboard_handler` fetches associated metrics using `get_metric_handler`. If `get_metric_handler` fails (potentially due to permissions), the metric is silently filtered out from the dashboard response's `metrics` map. Users aren't informed *why* a metric configured in the dashboard isn't visible, and they can't distinguish between a metric failing to load due to an error vs. lack of permissions.

## 3. Goals

- Modify `get_dashboard_handler`'s metric fetching logic to handle permission denials gracefully.
- Ensure that if a user lacks `CanView` permission for a metric configured in a dashboard, the metric is still included in the response's `metrics` map, but represented minimally with `has_access: false`.
- Add the `has_access: bool` field to the `BusterMetric` type.
- Leverage the `check_specific_asset_access` helper for permission verification.

## 4. Non-Goals

- Changing the permission check logic for the dashboard itself.
- Modifying how metrics are associated with dashboards (i.e., the dashboard config).

## 5. Technical Design

**Option A: Modify `get_metric_handler` (Recommended)**

1.  **Type Modification:**
    -   Add `has_access: bool` to `BusterMetric` struct (likely in `libs/handlers/src/metrics/types.rs`). Also ensure relevant nested types like `MetricConfig` are adjusted if necessary or handled during minimal object creation.
        ```rust
        // libs/handlers/src/metrics/types.rs (adjust path as needed)
        #[derive(Serialize, Deserialize, Debug, Clone)] // Add necessary derives
        pub struct BusterMetric {
             // --- Fields always present, even if no access ---
             pub id: Uuid,
             #[serde(default)] // Use default if loading minimal object
             pub name: String,
             pub has_access: bool, // New field

             // --- Fields only present if has_access = true ---
             #[serde(skip_serializing_if = "Option::is_none")]
             pub description: Option<String>,
             #[serde(skip_serializing_if = "Option::is_none")]
             pub config: Option<MetricConfig>, // Or appropriate type
             #[serde(skip_serializing_if = "Option::is_none")]
             pub data: Option<Value>, // Or appropriate type
             #[serde(skip_serializing_if = "Option::is_none")]
             pub created_at: Option<DateTime<Utc>>,
             // ... other optional fields ...
             #[serde(skip_serializing_if = "Option::is_none")]
             pub version_number: Option<i32>,
             // ... etc ...
        }

        // Add default implementation if needed for minimal construction
        impl Default for BusterMetric {
            fn default() -> Self {
                Self {
                    id: Uuid::nil(), // Or handle differently
                    name: String::new(),
                    has_access: false,
                    description: None,
                    config: None,
                    data: None,
                    created_at: None,
                    version_number: None,
                    // ... initialize other optional fields to None ...
                }
            }
        }
        ```

2.  **Modify `get_metric_handler.rs`:**
    -   **Initial Fetch & Check:** Start by fetching the basic `metric_files` record *and* checking permission using `check_specific_asset_access` (or `fetch_metric_file_with_permission` if it can be adapted to return the basic file even on permission denial).
        ```rust
        // Inside get_metric_handler...
        let mut conn = get_pg_pool().get().await?;
        let metric_id = /* get metric_id */;
        let user = /* get user */;

        // Fetch basic info first (needed for permission check and minimal response)
        let basic_metric_info = metric_files::table
            .filter(metric_files::id.eq(metric_id))
            .filter(metric_files::deleted_at.is_null())
            .select((metric_files::id, metric_files::name, metric_files::organization_id))
            .first::<(Uuid, String, Uuid)>(&mut conn)
            .await
            .optional()?; // Use optional() to handle not found gracefully

        let (id, name, org_id) = match basic_metric_info {
             Some(info) => info,
             None => return Err(anyhow!("Metric not found")), // Return Err if metric doesn't exist
        };

        // Check permission
        let required_roles = [AssetPermissionRole::CanView];
        let has_permission = sharing::check_specific_asset_access(
            &mut conn, user, &id, AssetType::MetricFile, org_id, &required_roles
        ).await?; // Propagate DB errors from check

        if has_permission {
            // Proceed to fetch full metric details (content, version history, etc.) as before
            // ... fetch full_metric_file ...
            // Construct full BusterMetric with has_access: true
            Ok(BusterMetric {
                id,
                name, // Use fetched name
                has_access: true,
                // ... populate all other fields from full_metric_file ...
            })
        } else {
            // Construct minimal BusterMetric with has_access: false
            Ok(BusterMetric {
                id,
                name, // Use fetched name
                has_access: false,
                ..Default::default() // Use default for other fields
            })
        }
        ```
    -   **Return Value:** The handler now always returns `Ok(BusterMetric)` if the metric exists, differentiating access via the `has_access` flag. It only returns `Err` if the metric record itself is not found or if a database error occurs during the permission check or data fetching.

3.  **Modify `get_dashboard_handler.rs`:**
    -   The logic using `join_all` and collecting results into the `metrics: HashMap<Uuid, BusterMetric>` map can remain largely the same, as `get_metric_handler` will now consistently return `Ok` for existing metrics. Errors genuinely representing fetch failures (metric not found, DB error) will still be `Err` and should be logged/handled.
        ```rust
         // In get_dashboard_handler, processing results:
         let metric_results = join_all(metric_futures).await;
         let metrics: HashMap<Uuid, BusterMetric> = metric_results
             .into_iter()
             .filter_map(|result| match result {
                 Ok(metric) => Some((metric.id, metric)), // metric includes has_access flag
                 Err(e) => {
                     // Log actual errors (metric not found, DB connection issues, etc.)
                     tracing::error!("Failed to fetch metric details for dashboard (non-permission error): {}", e);
                     None // Exclude metric if there was a real error
                 }
             })
             .collect();
        ```

**Option B: Handle in `get_dashboard_handler` (Less Recommended)**

-   Keep `get_metric_handler` mostly as-is (returning `Err` on permission denied).
-   In `get_dashboard_handler`, after `join_all`, iterate through results. If a result is `Err`, attempt a *separate* minimal query to fetch just the `id` and `name` for that metric ID. If successful, create a minimal `BusterMetric { has_access: false, ... }` and add it to the map. If the minimal query fails (e.g., metric truly doesn't exist), log and omit.
-   *Drawback:* Less efficient (potential extra queries), splits logic.

**Decision:** Proceed with **Option A**.

4.  **File Changes:**
    -   Modify: `libs/handlers/src/metrics/get_metric_handler.rs` (or similar)
    -   Modify: `libs/handlers/src/metrics/types.rs` (or similar, for `BusterMetric`)
    -   Modify: `libs/handlers/src/dashboards/get_dashboard_handler.rs` (minor changes to error handling/filtering logic after `join_all`)

## 6. Implementation Plan

1.  Modify `BusterMetric` type definition.
2.  Refactor `get_metric_handler` to perform permission check upfront and return minimal object on denial.
3.  Adjust result processing loop in `get_dashboard_handler`.
4.  Add/update integration tests.

## 7. Testing Strategy

-   **Unit Tests (`get_metric_handler`):**
    -   Mock DB interactions.
    -   Test case: User lacks `CanView` -> returns `Ok(BusterMetric { id, name, has_access: false, ... })`.
    -   Test case: User has `CanView` -> returns `Ok(BusterMetric { has_access: true, ...full details... })`.
    -   Test case: Metric ID not found -> returns `Err`.
    -   Test case: DB error during permission check -> returns `Err`.
    -   Test case: DB error during full data fetch (when permitted) -> returns `Err`.
-   **Integration Tests (`get_dashboard_handler`):**
    -   Setup: User, Dashboard, Metric A (user has CanView), Metric B (user has no permission), Metric C (ID in dashboard config but doesn't exist).
    -   Execute `get_dashboard_handler`.
    -   Verify:
        -   Response status is OK.
        -   `response.metrics` map contains keys for Metric A and Metric B.
        -   `response.metrics[&MetricA_ID]` has `has_access: true` and full details.
        -   `response.metrics[&MetricB_ID]` has `has_access: false` and minimal details (id, name).
        -   `response.metrics` does not contain a key for Metric C.
        -   An error related to Metric C failing to load should be logged.
    -   Test variations with different user roles and public dashboard access.

## 8. Rollback Plan

-   Revert changes to the modified handler and type files.

## 9. Dependencies

-   Completion of [Refactor Sharing Permission Helper](mdc:prds/active/refactor_sharing_permission_helper.md). 