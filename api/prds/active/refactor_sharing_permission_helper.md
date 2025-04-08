# Sub-PRD: Refactor Sharing Permission Helper

**Author:** AI Assistant (Pair Programming with User)
**Date:** 2023-10-27
**Status:** Proposed
**Parent PRD:** [Project: Granular Asset Permission Checks](mdc:prds/active/project_granular_asset_permissions.md)

## 1. Overview

This PRD details the creation or enhancement of a centralized helper function within the `libs/sharing` crate. This function will encapsulate the logic for checking if a given user has at least one of a set of required permission roles for a specific asset (identified by ID and type). This promotes consistency and simplifies permission checking in various handlers, including those retrieving asset metadata (like `get_metric_handler`, `get_collection_handler`) and those executing actions based on assets (like the handler running metric SQL queries).

## 2. Problem Statement

Currently, permission checking logic might be duplicated or slightly varied across different handlers (e.g., `get_collection_handler`, `get_dashboard_handler`, `get_metric_handler`, and potentially data execution handlers). Checking permissions for assets *contained within* other assets, or *before executing* an action related to an asset, requires a standardized, testable approach that considers direct user permissions, organization roles, and potentially public access settings of the specific asset.

## 3. Goals

- Create a reusable, modular, and easily testable function `check_specific_asset_access` within `libs/sharing`.
- This function should accept user context, asset details (ID, type, org ID), and required permission levels.
- It should return `Ok(true)` if the user meets the requirements, `Ok(false)` if they don't, and `Err` only for database or unexpected errors.
- Consolidate permission checking logic for specific assets into this single helper, callable from multiple contexts (metadata retrieval, action execution).

## 4. Non-Goals

- Modifying the underlying permission tables (`asset_permissions`, `users_to_organizations`).
- Implementing permission checks for containers (collections/dashboards themselves) - this focuses on contained assets.
- Handling public access checks for the *container* object (though it might check public access for the *target asset* if relevant in the future).

## 5. Technical Design

1.  **Location:** `libs/sharing/src/permissions.rs` (create if not exists) or `libs/sharing/src/lib.rs`.
2.  **Function Signature:**
    ```rust
    // libs/sharing/src/permissions.rs
    use anyhow::Result;
    use diesel_async::AsyncPgConnection;
    use uuid::Uuid;
    use middleware::AuthenticatedUser;
    use database::enums::{AssetPermissionRole, AssetType};
    use database::schema::{asset_permissions, users_to_organizations};
    use diesel::{prelude::*, dsl::exists};

    /// Checks if a user has the required permission level for a specific asset.
    ///
    /// This function checks:
    /// 1. Direct user permissions in `asset_permissions`.
    /// 2. The user's role within the asset's organization via `users_to_organizations`.
    ///
    /// Returns `Ok(true)` if the user has at least one of the `required_roles`,
    /// `Ok(false)` otherwise. Returns `Err` on database query failures.
    pub async fn check_specific_asset_access(
        conn: &mut AsyncPgConnection,
        user: &AuthenticatedUser,
        asset_id: &Uuid,
        asset_type: AssetType,
        asset_organization_id: Uuid,
        required_roles: &[AssetPermissionRole],
    ) -> Result<bool> {
        // --- 1. Check High-Level Organization Permissions First ---
        // Check if the user is WorkspaceAdmin or DataAdmin in the asset's organization
        let high_level_org_roles = [
             database::enums::UserOrganizationRole::WorkspaceAdmin,
             database::enums::UserOrganizationRole::DataAdmin,
        ];

        let has_high_level_org_role = select(exists(
            users_to_organizations::table
                .filter(users_to_organizations::user_id.eq(&user.id))
                .filter(users_to_organizations::organization_id.eq(asset_organization_id))
                .filter(users_to_organizations::deleted_at.is_null())
                .filter(users_to_organizations::status.eq(database::enums::UserOrganizationStatus::Active))
                .filter(users_to_organizations::role.eq_any(high_level_org_roles))
        ))
        .get_result::<bool>(conn)
        .await;

        match has_high_level_org_role {
            Ok(true) => return Ok(true), // User is Org Admin/Data Admin, grant access
            Ok(false) => { /* Continue to check direct permissions */ }
            Err(e) => {
                tracing::error!(
                    "DB error checking high-level organization permissions for user {} in org {}: {}",
                    user.id, asset_organization_id, e
                );
                return Err(anyhow!("Failed to check organization permissions: {}", e));
            }
        }

        // --- 2. Check Direct Permissions ---
        let direct_permission_exists = select(exists(
            asset_permissions::table
                .filter(asset_permissions::identity_id.eq(&user.id))
                .filter(asset_permissions::asset_id.eq(asset_id))
                .filter(asset_permissions::asset_type.eq(asset_type))
                .filter(asset_permissions::identity_type.eq(database::enums::IdentityType::User))
                .filter(asset_permissions::deleted_at.is_null())
                .filter(asset_permissions::role.eq_any(required_roles)),
        ))
        .get_result::<bool>(conn)
        .await;

        match direct_permission_exists {
            Ok(true) => return Ok(true), // Found sufficient direct permission
            Ok(false) => { /* Continue to check org permissions */ }
            Err(e) => {
                tracing::error!(
                    "DB error checking direct asset permissions for asset {} type {:?}: {}",
                    asset_id, asset_type, e
                );
                // Consider returning Err only for non-NotFound errors if needed
                return Err(anyhow!("Failed to check direct asset permissions: {}", e));
            }
        }

        // --- 3. Check Other Organization Permissions (e.g., Member role granting CanView) ---
        // If specific roles like Member should grant CanView, add that check here.
        // This check is only relevant if high-level admin check and direct permission check failed.
        // Example (If Member grants CanView):
        /*
        if required_roles.contains(&AssetPermissionRole::CanView) {
            let is_org_member = select(exists(
                users_to_organizations::table
                    .filter(users_to_organizations::user_id.eq(&user.id))
                    .filter(users_to_organizations::organization_id.eq(asset_organization_id))
                    .filter(users_to_organizations::deleted_at.is_null())
                    .filter(users_to_organizations::status.eq(database::enums::UserOrganizationStatus::Active))
                    .filter(users_to_organizations::role.eq(database::enums::UserOrganizationRole::Member)) // Check for Member
            ))
            .get_result::<bool>(conn)
            .await;

            match is_org_member {
                Ok(true) => return Ok(true), // Org Member grants CanView
                Ok(false) => { /* Continue */ }
                Err(e) => {
                     tracing::error!(
                         "DB error checking Member organization permissions for asset {} type {:?} in org {}: {}",
                         asset_id, asset_type, asset_organization_id, e
                     );
                     // Don't return Err here, as failure to check Member role shouldn't block access
                     // if other permissions might exist (though they were already checked).
                     // Fall through to return false.
                }
            }
        }
        */

        // If none of the above checks granted access, return false
        Ok(false)
    }
    ```
3.  **File Changes:**
    -   Create/Modify: `libs/sharing/src/permissions.rs`
    -   Modify: `libs/sharing/src/lib.rs` (to export the function if needed)

## 6. Implementation Plan

1.  Create `permissions.rs` if it doesn't exist.
2.  Implement the `check_specific_asset_access` function as defined above.
3.  Add comprehensive unit tests.
4.  Export the function from the `libs/sharing` crate.

## 7. Testing Strategy

-   **Unit Tests:**
    -   Mock `AuthenticatedUser` and `AsyncPgConnection`.
    -   Test cases:
        -   User has direct `CanView` permission -> returns `Ok(true)` when `CanView` is required.
        -   User has direct `Owner` permission -> returns `Ok(true)` when `CanView` or `Owner` is required.
        -   User has direct `CanView` permission -> returns `Ok(false)` when `Owner` is required.
        -   User has no direct permission but Org Admin role -> returns `Ok(true)` when `CanView` is required.
        -   User has no direct permission and Org Member role -> returns `Ok(false)` (unless Member role check is added and CanView is required).
        -   User has no relevant direct or org permission -> returns `Ok(false)`.
        -   Database error during direct permission check -> returns `Err`.
        -   Database error during org permission check -> returns `Err`.
        -   User deleted from org -> returns `Ok(false)`.
        -   Asset permission deleted -> returns `Ok(false)`.

## 8. Rollback Plan

-   Revert the changes to `libs/sharing`. Dependent PRs cannot be merged without this helper.

## 9. Dependencies

-   None (this is the foundational piece). 