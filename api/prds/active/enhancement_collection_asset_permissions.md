# Sub-PRD: Enhance Collection Asset Permissions

**Author:** AI Assistant (Pair Programming with User)
**Date:** 2023-10-27
**Status:** Proposed
**Parent PRD:** [Project: Granular Asset Permission Checks](mdc:prds/active/project_granular_asset_permissions.md)

## 1. Overview

This PRD details the modifications required for the `get_collection_handler` to incorporate granular permission checks for each asset (Metric, Dashboard, etc.) contained within a collection. It introduces a `has_access` flag to the `CollectionAsset` type to indicate whether the requesting user has permission to view the specific asset.

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
        pub struct CollectionAsset {
            pub id: Uuid,
            pub name: String,
            pub created_by: AssetUser,
            pub created_at: DateTime<Utc>,
            pub updated_at: DateTime<Utc>,
            pub asset_type: AssetType,
            pub has_access: bool, // New field
        }
        ```

2.  **Handler Modification (`get_collection_handler.rs`):**
    -   **Fetch Assets:** Continue fetching associated metric and dashboard assets as currently done (results in `Vec<AssetQueryResult>`). Add `organization_id` from the joined `metric_files` or `dashboard_files` table to the `AssetQueryResult` struct if not already present.
        ```rust
        // Define or modify AssetQueryResult
        #[derive(Queryable, Clone, Debug)]
        struct AssetQueryResult {
            id: Uuid,
            name: String,
            user_name: Option<String>,
            email: Option<String>,
            created_at: DateTime<Utc>,
            updated_at: DateTime<Utc>,
            asset_type: AssetType,
            organization_id: Uuid, // Ensure this is selected
        }
        ```
    -   **Check Permissions:** After fetching `all_assets: Vec<AssetQueryResult>`, iterate through them. For each `asset_result`:
        -   Call `sharing::check_specific_asset_access` with the user context, asset details (`asset_result.id`, `asset_result.asset_type`, `asset_result.organization_id`), and required roles (e.g., `&[AssetPermissionRole::CanView]`).
        -   Store the boolean result (true/false) alongside the asset data. Handle potential `Err` results from the check (log and treat as `has_access: false` or filter out as per project decision).
        ```rust
        // Example logic within get_collection_handler
        let mut assets_with_access: Vec<(AssetQueryResult, bool)> = Vec::new();
        for asset_result in all_assets {
            let required_roles = [AssetPermissionRole::CanView]; // Minimum role needed
            let check_result = sharing::check_specific_asset_access(
                &mut conn, // Get mutable conn borrow
                user,
                &asset_result.id,
                asset_result.asset_type,
                asset_result.organization_id,
                &required_roles,
            )
            .await;

            match check_result {
                Ok(has_access) => {
                    assets_with_access.push((asset_result, has_access));
                }
                Err(e) => {
                    tracing::error!(
                        "Failed permission check for asset {} in collection {}: {}",
                        asset_result.id, req.id, e
                    );
                    // Decide how to handle error: push with false or omit
                    // Following project decision: Omit on hard DB errors, log.
                    // If check_specific_asset_access only returns Err on DB error, we omit here.
                    // If it could return Err for other reasons, might push with false.
                    // Assuming Err means DB error:
                     continue; // Skip asset if permission check failed
                     // Alternatively, to show it exists but is inaccessible due to error:
                     // assets_with_access.push((asset_result, false));
                }
            }
        }
        ```
    -   **Format Response:** Modify `format_assets` (or create a new formatting step) to accept the `Vec<(AssetQueryResult, bool)>` and populate the `CollectionAsset` including the `has_access` field.
        ```rust
        // Modify or replace format_assets
        fn format_assets_with_access(assets: Vec<(AssetQueryResult, bool)>) -> Vec<CollectionAsset> {
            assets
                .into_iter()
                .map(|(asset, has_access)| CollectionAsset {
                    id: asset.id,
                    name: asset.name,
                    created_by: AssetUser { /* ... */ },
                    created_at: asset.created_at,
                    updated_at: asset.updated_at,
                    asset_type: asset.asset_type,
                    has_access, // Set the flag
                })
                .collect()
        }

        // Call the modified formatter
        let formatted_assets = format_assets_with_access(assets_with_access);
        ```

3.  **File Changes:**
    -   Modify: `libs/handlers/src/collections/get_collection_handler.rs`
    -   Modify: `libs/handlers/src/collections/types.rs`

## 6. Implementation Plan

1.  Modify `CollectionAsset` struct.
2.  Update database queries in `get_collection_handler` to select `organization_id` for assets.
3.  Integrate the call to `check_specific_asset_access` for each asset.
4.  Update the asset formatting logic to include the `has_access` flag.
5.  Add/update integration tests.

## 7. Testing Strategy

-   **Unit Tests:** Not directly applicable to the handler itself, focus on integration tests. Test modifications to `format_assets` logic if separated.
-   **Integration Tests:**
    -   Setup: User, Collection, Metric A (user has CanView), Dashboard B (user has no permission), Metric C (doesn't exist).
    -   Execute `get_collection_handler`.
    -   Verify:
        -   Response status is OK.
        -   `collection_state.assets` contains representations for Metric A and Dashboard B.
        -   Metric A has `has_access: true`.
        -   Dashboard B has `has_access: false`.
        -   Metric C is not present.
        -   Basic details (id, name, type) are present for both A and B.
    -   Test variations with different user roles (Owner, Org Admin, Member, No Access).
    -   Test scenario where `check_specific_asset_access` returns an `Err` (e.g., simulate DB failure during check) -> Verify asset is omitted or marked inaccessible based on error handling decision.

## 8. Rollback Plan

-   Revert changes to the handler and types files.

## 9. Dependencies

-   Completion of [Refactor Sharing Permission Helper](mdc:prds/active/refactor_sharing_permission_helper.md). 