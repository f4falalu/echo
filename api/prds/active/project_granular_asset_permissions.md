# Project PRD: Granular Asset Permission Checks in Collections and Dashboards

**Author:** AI Assistant (Pair Programming with User)
**Date:** 2023-10-27
**Status:** Proposed

## 1. Overview

This project aims to implement fine-grained permission checks for assets (like metrics and dashboards) contained within collections and dashboards. Currently, access checks primarily focus on the container, potentially exposing the existence of contained assets the user cannot access or hiding them inconsistently. This project will ensure that access to each contained asset is individually verified against the user's permissions, and the accessibility is clearly communicated in the API response.

## 2. Goals

- Implement fine-grained access control checks for individual assets (metrics, dashboards) listed within collections returned by `get_collection_handler`.
- Implement fine-grained access control checks for individual metrics listed within dashboards returned by `get_dashboard_handler`.
- Ensure users can see basic identifying information (ID, name, type) of assets within containers even if they lack `CanView` permission for those specific assets.
- Clearly indicate assets the user lacks permission to view using a `has_access: bool` flag in the response structures.
- Promote consistency by centralizing asset permission checking logic.

## 3. Non-Goals

- Changing the existing permission model (roles, identity types).
- Implementing access checks for asset types beyond metrics and dashboards initially.
- Modifying the frontend UI to visually represent the `has_access` status.
- Changing how permissions for the *container* (collection/dashboard itself) are checked.

## 4. Implementation Plan

The implementation is divided into the following phases and corresponding sub-PRDs. Phase 1 must be completed before Phases 2, 3, and 4 can begin. Phases 2, 3, and 4 can be implemented concurrently after Phase 1 is complete.

**Phase 1: Foundational Permission Helper (Blocking)**

*   **Task:** Implement the centralized permission checking logic.
*   **Sub-PRD:** [Refactor Sharing Permission Helper](mdc:prds/active/refactor_sharing_permission_helper.md)
*   **Status:** Upcoming
*   **Details:** Create or enhance the `check_specific_asset_access` function in `libs/sharing` to reliably check user permissions against specific assets, considering direct permissions and organization roles.

**Phase 2: Concurrent Enhancements (Requires Phase 1 Completion)**

*   **Task A (Concurrent):** Enhance Collection Handler
    *   **Sub-PRD:** [Enhance Collection Asset Permissions](mdc:prds/active/enhancement_collection_asset_permissions.md)
    *   **Status:** Upcoming
    *   **Details:** Modify `get_collection_handler` to use the helper from Phase 1. Add `has_access` field to `CollectionAsset` type and populate it based on permissions.
*   **Task B (Concurrent):** Enhance Dashboard/Metric Handlers
    *   **Sub-PRD:** [Enhance Dashboard Metric Permissions](mdc:prds/active/enhancement_dashboard_metric_permissions.md)
    *   **Status:** Upcoming
    *   **Details:** Modify `get_metric_handler` (and potentially `get_dashboard_handler`'s result processing) to use the helper from Phase 1. Add `has_access` field to `BusterMetric` type. Return minimal metric object with `has_access: false` when permission is denied.
*   **Task C (Concurrent):** Enhance Data Execution Handler
    *   **Sub-PRD:** [Enhance Data Execution Handler Permissions](mdc:prds/active/enhancement_data_execution_permissions.md)
    *   **Status:** Upcoming
    *   **Details:** Modify the handler(s) responsible for executing metric SQL queries to call the helper from Phase 1 *before* execution. Return a permission error if access is denied.

**Phase 3: Integration Testing & Rollout**

*   **Task:** Perform end-to-end testing covering all enhanced handlers and scenarios involving mixed permissions.
*   **Details:** Ensure collections, dashboards, and direct data execution requests correctly reflect and enforce the granular permissions.
*   **Rollout:** Deploy changes once all phases are complete and tested.

## 5. High-Level Technical Design

- Introduce a `has_access: bool` field to `CollectionAsset` and `BusterMetric` response types.
- Develop a reusable function `check_specific_asset_access` in `libs/sharing` to determine if a user has the required permission level for a given asset ID and type.
- Modify `get_collection_handler` to fetch all associated asset IDs, use the helper function (potentially in batch) to check permissions, and populate the `has_access` field in the response.
- Modify `get_dashboard_handler` (and potentially underlying asset fetchers like `get_metric_handler`) to use the helper function. For assets where the user lacks permission, return a minimal representation of the asset with `has_access: false` instead of filtering it out or returning a hard error solely due to permissions.
- **Crucially, modify the handler responsible for executing metric SQL queries to call `check_specific_asset_access` before running the query. If the check returns `false`, the handler must return a permission error instead of executing the query.**

## 6. Testing Strategy

- Each sub-PRD will define specific unit and integration tests.
- End-to-end tests should cover scenarios involving collections and dashboards containing a mix of accessible and inaccessible assets for a given user.

## 7. Rollout Plan

- Implement and merge sub-PRDs sequentially as defined in the Implementation Plan.
- Feature can be rolled out once all sub-PRDs are completed and merged. No feature flag is deemed necessary as this is primarily a backend enhancement improving correctness.

## 8. Dependencies

- Requires understanding of the existing permission system (`asset_permissions`, `users_to_organizations`).
- Modifies core handlers for collections and dashboards.

## 9. Open Questions/Decisions Made

- **Public Container vs. Private Asset:** Decided: Access to a public container *does not* grant implicit access to contained assets. The user's specific permissions for the contained asset will always be checked.
- **Metadata for Inaccessible Assets:** Decided: Assets marked `has_access: false` will include non-sensitive identifiers like `id`, `name`, and `asset_type`. Sensitive data (like metric `content` or dashboard `config`) will not be included.
- **Error Handling for Permission Checks:** Decided: If checking permission for a specific asset fails due to a database error (not lack of permission), that asset will be omitted from the results, and the error will be logged. Lack of permission results in `has_access: false`. 