# Sub-PRD: Enhance Data Execution Handler Permissions

**Author:** AI Assistant (Pair Programming with User)
**Date:** 2023-10-27
**Status:** Proposed
**Parent PRD:** [Project: Granular Asset Permission Checks](mdc:prds/active/project_granular_asset_permissions.md)

## 1. Overview

This PRD outlines the necessary modifications to the handler responsible for executing metric SQL queries (the "data execution handler"). The goal is to ensure that a permission check is performed *before* any query is executed against the database, preventing users from retrieving data for metrics they are not authorized to view, even if they somehow obtained the metric ID.

**Note on Concurrency:** This work depends on the completion of the [Refactor Sharing Permission Helper](mdc:prds/active/refactor_sharing_permission_helper.md). Once the helper is available, this task can potentially be performed concurrently with the enhancements for the collection and dashboard handlers.

## 2. Problem Statement

While other handlers (`get_metric_handler`, `get_dashboard_handler`) are being modified to control the visibility and metadata of metrics based on permissions, the handler that actually runs the metric's SQL query might currently execute it based solely on receiving a valid metric ID. This could allow unauthorized data access if a user bypasses the standard UI flows or if the metadata handlers fail to properly restrict access information.

## 3. Goals

- Identify the primary handler(s) responsible for taking a metric ID (and potentially parameters) and executing its SQL query.
- Integrate a call to the `check_specific_asset_access` helper function at the beginning of this handler.
- Ensure the handler returns a clear permission denied error if the check fails.
- Prevent unauthorized execution of metric queries and subsequent data leakage.

## 4. Non-Goals

- Modifying the query execution engine itself.
- Changing how metric SQL queries are stored or constructed.
- Implementing rate limiting or query cost analysis (though permission checks are a prerequisite for such features).

## 5. Technical Design

1.  **Identify Target Handler:** The primary handler needs to be identified. Assuming a hypothetical handler like `execute_metric_query_handler(metric_id: Uuid, user: AuthenticatedUser, params: Option<Value>) -> Result<QueryResultData>` exists (the actual name and signature might differ).
2.  **Fetch Asset Metadata:** Before executing the query, the handler must fetch basic metadata for the given `metric_id`, specifically its `organization_id`, to pass to the permission checker. This might already be part of the handler logic to retrieve the SQL.
    ```rust
    // Inside the data execution handler...
    let mut conn = get_pg_pool().get().await?;
    let metric_id = /* from request */;
    let user = /* from request context */;

    // Fetch necessary info for permission check (and potentially SQL)
    let metric_info = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null())
        .select((metric_files::organization_id, metric_files::sql /* or content */)) // Select org_id and SQL/content
        .first::<(Uuid, String /* or appropriate type */)>(&mut conn)
        .await
        .map_err(|_| anyhow!("Metric not found or basic info inaccessible"))?; // Handle not found

    let (organization_id, _sql_or_content) = metric_info;
    ```
3.  **Permission Check:** Call `check_specific_asset_access` immediately after retrieving the necessary metadata and before executing any query based on the metric's definition. The required role is typically `CanView`.
    ```rust
    // Still inside the data execution handler...

    let required_roles = [AssetPermissionRole::CanView];
    let has_permission = sharing::check_specific_asset_access(
        &mut conn,
        user,
        &metric_id,
        AssetType::MetricFile, // Assuming metrics are the target here
        organization_id,
        &required_roles,
    )
    .await?; // Propagate DB errors

    if !has_permission {
        tracing::warn!(user_id = %user.id, metric_id = %metric_id, "Permission denied for metric query execution.");
        // Return a specific, user-friendly permission error
        return Err(anyhow!("Permission denied: You do not have access to view data for this metric."));
    }

    // --- Permission Granted: Proceed with Query Execution ---
    // ... existing logic to prepare and execute the SQL query ...
    // let sql = _sql_or_content; // Get the SQL from fetched info
    // ... run query ...
    // return Ok(query_result);
    ```
4.  **Error Handling:** Ensure that a distinct and user-understandable error is returned upon permission failure, separate from "metric not found" or query execution errors.

5.  **File Changes:**
    -   Modify: The identified data execution handler file (e.g., `libs/handlers/src/query_execution/execute_metric_handler.rs` - **Actual path needs confirmation**).

## 6. Implementation Plan

1.  Confirm the exact handler(s) and file path(s) responsible for executing metric queries.
2.  Ensure the handler fetches the metric's `organization_id`.
3.  Insert the call to `check_specific_asset_access` near the beginning of the handler.
4.  Add error handling for permission denial.
5.  Add/update unit and integration tests for this handler.

## 7. Testing Strategy

-   **Unit Tests:**
    -   Mock the `check_specific_asset_access` function and database interactions.
    -   Test case: `check_specific_asset_access` returns `Ok(true)` -> Verify query execution proceeds.
    -   Test case: `check_specific_asset_access` returns `Ok(false)` -> Verify a specific permission error is returned and the query execution logic is *not* called.
    -   Test case: `check_specific_asset_access` returns `Err` -> Verify the error is propagated correctly.
    -   Test case: Metric ID not found during initial metadata fetch -> Verify appropriate error is returned.
-   **Integration Tests:**
    -   Setup: User, Metric A (user has CanView), Metric B (user has no CanView).
    -   Scenario 1: Call the data execution endpoint/handler for Metric A -> Verify success and data return.
    -   Scenario 2: Call the data execution endpoint/handler for Metric B -> Verify a clear "Permission Denied" error is returned.

## 8. Rollback Plan

-   Revert the changes to the identified data execution handler file(s).

## 9. Dependencies

-   Completion of [Refactor Sharing Permission Helper](mdc:prds/active/refactor_sharing_permission_helper.md).
-   Identification of the correct data execution handler file path. 