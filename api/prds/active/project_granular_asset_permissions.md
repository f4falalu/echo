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

The implementation will be broken down into three sub-PRDs, executed in the specified order due to dependencies:

1.  **Upcoming:** [Refactor Sharing Permission Helper](mdc:prds/active/refactor_sharing_permission_helper.md) - Create/Enhance a centralized helper function in `libs/sharing` for checking specific asset permissions.
2.  **Upcoming:** [Enhance Collection Asset Permissions](mdc:prds/active/enhancement_collection_asset_permissions.md) - Modify `get_collection_handler` and related types to use the new helper and include the `has_access` flag. (Depends on #1)
3.  **Upcoming:** [Enhance Dashboard Metric Permissions](mdc:prds/active/enhancement_dashboard_metric_permissions.md) - Modify `get_dashboard_handler`, potentially `get_metric_handler`, and related types to use the new helper and include the `has_access` flag. (Depends on #1)

**Concurrency:** Sub-PRDs #2 and #3 can potentially be worked on concurrently *after* Sub-PRD #1 is completed and merged, as they modify different handlers but depend on the same shared helper.

## 5. High-Level Technical Design

- Introduce a `has_access: bool` field to `CollectionAsset` and `BusterMetric` response types.
- Develop a reusable function `check_specific_asset_access` in `libs/sharing` to determine if a user has the required permission level for a given asset ID and type.
- Modify `get_collection_handler` to fetch all associated asset IDs, use the helper function (potentially in batch) to check permissions, and populate the `has_access` field in the response.
- Modify `get_dashboard_handler` (and potentially underlying asset fetchers like `get_metric_handler`) to use the helper function. For assets where the user lacks permission, return a minimal representation of the asset with `has_access: false` instead of filtering it out or returning a hard error solely due to permissions.

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