# Sub-PRD: Enhance Collection Asset Permissions

**Author:** AI Assistant (Pair Programming with User)
**Date:** 2023-10-27
**Status:** Proposed
**Parent PRD:** [Project: Granular Asset Permission Checks](mdc:prds/active/project_granular_asset_permissions.md)

## 1. Overview

This PRD details the modifications required for the `get_collection_handler` to incorporate granular permission checks for each asset (Metric, Dashboard, etc.) contained within a collection. It introduces a `has_access` flag to the `CollectionAsset` type to indicate whether the requesting user has permission to view the specific asset.

**Note on Concurrency:** This work depends on the completion of the [Refactor Sharing Permission Helper](mdc:prds/active/refactor_sharing_permission_helper.md). Once the helper is available, this task can potentially be performed concurrently with the enhancements for the dashboard and data execution handlers.

## 2. Problem Statement

The current `get_collection_handler` lists assets associated with a collection but doesn't verify the user's permission for each *individual* asset. This can lead to users seeing assets in the list that they cannot actually access, creating a confusing user experience.

## 3. Goals

- Modify `get_collection_handler` to check permissions for each contained asset using the `check_specific_asset_access` helper.
- Add a `has_access: bool` field to the `CollectionAsset` struct in `libs/handlers/src/collections/types.rs`.
- Populate the `has_access` field based on the permission check result for each asset.
- Ensure the API response includes all associated assets, clearly marking accessible vs. inaccessible ones.

## 4. Non-Goals

- Changing the permission check logic for the collection itself.
- Modifying how assets are associated with collections.
- Implementing checks for asset types not currently queried (e.g., Chats).

## 5. Technical Design

1.  **Type Modification:**
    -   Add `has_access: bool` to `CollectionAsset` struct:
        ```rust
        // libs/handlers/src/collections/types.rs
        use database::enums::{AssetType, AssetPermissionRole};
        use chrono::{DateTime, Utc};
        use uuid::Uuid;

        pub struct CollectionAsset {
            pub id: Uuid,
            pub name: String,
            pub created_by: AssetUser,
            pub created_at: DateTime<Utc>,
            pub updated_at: DateTime<Utc>,
            pub asset_type: AssetType,
            pub has_access: bool,
        }
        ```

2.  **Handler Modification (`get_collection_handler.rs`):**
    -   **Fetch Assets & Permissions Efficiently:** This is the primary **addition**. Adapt or create a batch fetch helper (similar to `fetch_metric_files_with_permissions`) that returns assets (`AssetQueryResult` including `id`, `name`, `asset_type`, `organization_id`, etc.) along with their pre-calculated `base_permission: Option<AssetPermissionRole>` (derived from direct/collection checks, handling `deleted_at`).
        ```rust
        // Example Query Result Struct needed
        #[derive(Queryable, Clone, Debug)]
        struct AssetQueryResult {
            id: Uuid,
            name: String,
            user_name: Option<String>,
            email: Option<String>,
            created_at: DateTime<Utc>,
            updated_at: DateTime<Utc>,
            asset_type: AssetType,
            organization_id: Uuid,
        }

        // Hypothetical efficient fetch result
        struct FetchedAssetWithPermission {
            asset: AssetQueryResult,
            base_permission: Option<AssetPermissionRole> // From direct/collection checks
        }

        // Fetch assets and their base permissions efficiently
        // let fetched_assets_with_perms: Vec<FetchedAssetWithPermission> = /* Call new/adapted helper */ ;
        ```
    -   **Determine Final Access:** This is the second main **addition**. Iterate through `fetched_assets_with_perms`. For each item, determine the final `has_access` flag by checking: (1) if the user is an Org Admin for the asset's org (using cached `user.organizations`), or (2) if the `item.base_permission` meets the `CanView` requirement.
        ```rust
        let mut final_assets: Vec<CollectionAsset> = Vec::new();
        let required_role = AssetPermissionRole::CanView; // Minimum requirement
        let admin_roles = [
            database::enums::UserOrganizationRole::WorkspaceAdmin,
            database::enums::UserOrganizationRole::DataAdmin,
        ];

        for item in fetched_assets_with_perms {
            let asset = item.asset;
            let base_permission = item.base_permission;

            // Check org admin override from cache
            let is_org_admin = user.organizations.iter().any(|org| {
                org.id == asset.organization_id && admin_roles.contains(&org.role)
            });

            let has_access = if is_org_admin {
                true
            } else {
                // Check if base permission (direct/collection) is sufficient
                base_permission.map_or(false, |role| role >= required_role)
            };

            // Construct the CollectionAsset object
            final_assets.push(CollectionAsset {
                id: asset.id,
                name: asset.name,
                created_by: AssetUser { /* ... from asset ... */ },
                created_at: asset.created_at,
                updated_at: asset.updated_at,
                asset_type: asset.asset_type,
                has_access, // Set the final flag
            });
        }
        ```
    -   **Populate Response:** Use the `final_assets` list (now containing the `has_access` flag) in the final `CollectionState` response. The existing logic for fetching the collection itself and checking its permission remains unchanged.

3.  **File Changes:**
    -   Modify: `libs/handlers/src/collections/get_collection_handler.rs` (to add fetch call and access determination loop).
    -   Modify: `libs/handlers/src/collections/types.rs` (to add `has_access`).
    -   Potentially Modify/Create: Helper function in `libs/database/src/helpers/` for efficient batch asset+permission fetching for collections.

## 6. Implementation Plan

1.  Modify `CollectionAsset` struct.
2.  Implement or adapt the efficient batch asset fetching logic (including base permissions).
3.  Integrate the access determination logic using fetched permissions and cached org roles.
4.  Ensure minimal `CollectionAsset` details are always included, regardless of `has_access`.
5.  Add/update integration tests.

## 7. Testing Strategy

-   **Unit Tests:** Not directly applicable to the handler itself, focus on integration tests. Test modifications to `format_assets` logic if separated.
-   **Integration Tests:**
    -   Setup: Use test helpers like `TestDb` and `TestSetup` (defined in `libs/database/tests/common` or similar) to create an isolated test environment with a User, Collection, and associated assets (Metrics, Dashboards).
    -   Grant specific permissions using direct `asset_permissions` entries for the test user and assets.
    -   Example Scenario: User, Collection, Metric A (user has CanView), Dashboard B (user has no permission), Metric C (doesn't exist).

## 8. Rollback Plan

-   Revert changes to the handler and types files.

## 9. Dependencies

-   Completion of Phase 1 (Type modifications for `has_access`). The simplified helper from the revised `refactor_sharing_permission_helper.md` is *not* directly used here. 