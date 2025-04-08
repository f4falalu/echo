# Sub-PRD: Enhance Dashboard Metric Permissions

**Author:** AI Assistant (Pair Programming with User)
**Date:** 2023-10-27
**Status:** Proposed
**Parent PRD:** [Project: Granular Asset Permission Checks](mdc:prds/active/project_granular_asset_permissions.md)

## 1. Overview

This PRD describes the modifications needed for the `get_dashboard_handler` to implement granular permission checks for each metric included in a dashboard. It involves leveraging the central permission helper and adjusting how metric data is fetched and represented in the response, potentially by modifying `get_metric_handler` or how its results are processed.

**Note on Concurrency:** This work depends on the completion of the [Refactor Sharing Permission Helper](mdc:prds/active/refactor_sharing_permission_helper.md). Once the helper is available, this task can potentially be performed concurrently with the enhancements for the collection and data execution handlers.

## 2. Problem Statement

Currently, `get_dashboard_handler` fetches associated metrics using `get_metric_handler`. If `get_metric_handler` fails (potentially due to permissions), the metric is silently filtered out from the dashboard response's `metrics` map. Users aren't informed *why* a metric configured in the dashboard isn't visible, and they can't distinguish between a metric failing to load due to an error vs. lack of permissions.

## 3. Goals

- Modify `get_dashboard_handler`'s metric fetching logic to handle permission denials gracefully.
- Ensure that if a user lacks `CanView` permission for a metric configured in a dashboard, the metric is still included in the response's `metrics` map, but represented minimally with `has_access: false`.
- Add the `has_access: bool` field to the `BusterMetric` type.
- Leverage the `check_specific_asset_access` helper for permission verification.
- **Note:** This handler modification primarily affects the *metadata* served about the metric. Blocking the actual *execution* of the metric's SQL query for data retrieval will be handled by adding permission checks to the relevant data execution handler (as per the project PRD).

## 4. Non-Goals

- Changing the permission check logic for the dashboard itself.
- Modifying how metrics are associated with dashboards (i.e., the dashboard config).

## 5. Technical Design

**Option A: Modify `get_metric_handler` (Recommended)**

This approach minimizes disruption by leveraging existing efficient helper functions.

1.  **Type Modification:**
    -   Add `has_access: bool` to `BusterMetric` struct (likely in `libs/handlers/src/metrics/types.rs`). Also ensure relevant nested types like `ChartConfig` (note: it's from `database::types::ChartConfig`) are handled during minimal object creation.
        ```rust
        // libs/handlers/src/metrics/types.rs (adjust path as needed)
        use database::types::ChartConfig; // Import the correct ChartConfig
        use database::enums::Verification;
        use chrono::{DateTime, Utc, TimeZone};

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
        // Note: Default cannot be easily derived due to non-optional fields.
        // We will construct the minimal object manually.
        /*
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
        */
        ```

2.  **Modify `get_metric_handler.rs`:**
    -   **Leverage Existing Fetch & Check:** Continue using the existing efficient `fetch_metric_file_with_permissions` helper. This fetches the `MetricFile` and its calculated `base_permission` (direct/collection). The subsequent logic using `check_permission_access` (or similar checks for org admin roles and public access) also remains largely the same for *determining* if access should be granted.
        ```rust
        // Inside get_metric_handler...
        let metric_id = /* get metric_id */;
        let user = /* get user */;

        // Fetch metric and its base permission level efficiently
        let metric_file_with_permission_option = fetch_metric_file_with_permissions(metric_id, &user.id)
            .await
            .map_err(|e| anyhow!("Failed to fetch metric file with permissions: {}", e))?;

        let metric_file_with_permission = if let Some(mf) = metric_file_with_permission_option {
            mf
        } else {
            tracing::warn!(metric_id = %metric_id, "Metric file not found during fetch");
            return Err(anyhow!("Metric file not found"));
        };

        let metric_file = metric_file_with_permission.metric_file;
        let base_permission = metric_file_with_permission.permission; // Direct or Collection permission
        ```
    -   **Determine Final Access & Modify Return:** The primary change is *after* access is determined (using existing logic involving `base_permission`, cached `user.organizations` admin roles, and public access checks). Instead of returning `Err` on access denial, calculate a final `has_access: bool` flag and conditionally construct the response.
        ```rust
        // Still inside get_metric_handler...

        // Check org admin override from cache
        let admin_roles = [
            database::enums::UserOrganizationRole::WorkspaceAdmin,
            database::enums::UserOrganizationRole::DataAdmin,
        ];
        let is_org_admin = user.organizations.iter().any(|org| {
            org.id == metric_file.organization_id && admin_roles.contains(&org.role)
        });

        // Check public access rules (simplified example, adapt from existing handler logic)
        let is_publicly_viewable = metric_file.publicly_accessible
            && metric_file.public_expiry_date.map_or(true, |expiry| expiry > chrono::Utc::now())
            && metric_file.public_password.is_none(); // Simplification: ignore password case for now

        let required_role = AssetPermissionRole::CanView; // Minimum requirement

        let has_access = if is_org_admin {
            true
        } else if base_permission.map_or(false, |role| role >= required_role) {
            true // Has sufficient direct/collection permission
        } else {
            is_publicly_viewable // Fallback to public access check
        };

        // Determine effective permission role to return (for display/context)
        let effective_permission = if is_org_admin {
             base_permission.unwrap_or(AssetPermissionRole::Owner) // Admins often treated as Owners
        } else if let Some(role) = base_permission {
             role
        } else if is_publicly_viewable {
             AssetPermissionRole::CanView
        } else {
             // This case should ideally not be reached if has_access logic is correct
             // but provide a default if needed, maybe linked to has_access=false outcome.
             // If has_access is false here, maybe return a specific 'NoAccess' pseudo-role?
             // For now, align with has_access outcome:
             if has_access { AssetPermissionRole::CanView } else { /* Need a way to signify no access */ AssetPermissionRole::CanView } // Placeholder!
        };

        // If has_access is false, construct minimal object. Otherwise, construct full object.
        if has_access {
            // ... (fetch version content, datasets, user info, dashboards, collections etc. as before) ...
            // ... (construct FULL BusterMetric) ...
            let full_metric = BusterMetric {
                 id: metric_file.id,
                 // ... all fields populated ...
                 has_access: true,
                 permission: effective_permission, // Use determined effective permission
                 // ...
            };
            Ok(full_metric)
        } else {
            // ... (Construct MINIMAL BusterMetric, setting has_access: false, permission: appropriate_indicator) ...
             let minimal_metric = BusterMetric {
                 id: metric_file.id,
                 name: metric_file.name,
                 has_access: false,
                 permission: AssetPermissionRole::CanView, // Or a 'NoAccess' pseudo-role if defined
                 // ... provide defaults for other non-optional fields ...
                 ..Default::default() // Use defaults where possible, but override required fields
             };
            Ok(minimal_metric)
        }
        ```
    -   **Return Value:** The key change is that the handler returns `Ok(BusterMetric)` in both access granted (full object) and access denied (minimal object) scenarios for existing metrics. `Err` is reserved for actual fetch errors (metric not found, DB issues).

3.  **Modify `get_dashboard_handler.rs`:**
    -   Requires minimal-to-no change. It continues to call `get_metric_handler`. Since `get_metric_handler` now consistently returns `Ok` for existing metrics (with `has_access` indicating permission), the dashboard handler correctly includes all configured metrics in its response map.

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
    -   Mock DB interactions (e.g., the return value of `fetch_metric_file_with_permissions`) using `mockall` or similar if the fetch logic is abstracted behind a trait, or by carefully constructing mock `MetricFileWithPermission` objects.
    -   Mock the `AuthenticatedUser` object with different organization roles.
-   **Integration Tests (`get_dashboard_handler`):**
    -   Setup: Use test helpers like `TestDb` and `TestSetup` to create an isolated test environment with a User, Dashboard, and associated Metrics.
    -   Grant specific permissions using direct `asset_permissions` entries for the test user and metrics.
    -   Example Scenario: User, Dashboard, Metric A (user has CanView), Metric B (user has no permission), Metric C (ID in dashboard config but doesn't exist).

## 8. Rollback Plan

-   Revert changes to the modified handler and type files.

## 9. Dependencies

-   Completion of Phase 1 (Type modifications for `has_access`). The simplified helper from the revised `refactor_sharing_permission_helper.md` is *not* directly used here. 