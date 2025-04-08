# Sub-PRD: Simplified Asset Permission Helper

**Author:** AI Assistant (Pair Programming with User)
**Date:** 2023-10-27
**Status:** Proposed
**Parent PRD:** [Project: Granular Asset Permission Checks](mdc:prds/active/project_granular_asset_permissions.md)

## 1. Overview

This PRD details the creation of a simplified, centralized helper function within the `libs/sharing` crate. This function is primarily intended for contexts (like pre-execution checks where only an asset ID is available, e.g., `get_metric_data_handler` before running SQL) and an efficient permission check is needed. It leverages the user's cached organization roles and performs a targeted database query only for direct asset permissions. It differs from fetch helpers like `fetch_metric_file_with_permissions` which retrieve the full asset alongside its base permission.

## 2. Problem Statement

While handlers retrieving full asset metadata use efficient fetch helpers (like `fetch_..._with_permissions`), handlers performing actions based only on an asset ID (e.g., executing a query for a metric ID) need a way to check permissions without re-fetching the user's organization roles or the full asset. A dedicated helper using cached roles and querying only direct permissions is needed for these specific scenarios.

## 3. Goals

- Create a reusable, modular, and testable function `check_permission_for_asset_id` within `libs/sharing`.
- This function should accept user context (`AuthenticatedUser` containing cached org roles), asset details (ID, type, org ID), and required permission levels.
- It should first check the user's cached organization roles (`user.organizations`) for high-level admin privileges (`WorkspaceAdmin`, `DataAdmin`).
- If no admin role applies, it should query the `asset_permissions` table for direct permissions for the specific asset ID and user.
- It should return `Ok(true)` if the user meets the requirements (either via org admin role or direct permission), `Ok(false)` if they don't, and `Err` only for database query errors.

## 4. Non-Goals

- Replacing the efficient fetch helpers like `fetch_metric_file_with_permissions` used by metadata retrieval handlers.
- Querying the `users_to_organizations` table (relies on cached roles in `AuthenticatedUser`).
- Handling complex permission inheritance beyond direct permissions and high-level org roles (unless explicitly added).

## 5. Technical Design

1.  **Location:** `libs/sharing/src/permissions.rs` (or similar).
2.  **Function Signature & Implementation:**
    ```rust
    // libs/sharing/src/permissions.rs
    use anyhow::{anyhow, Result};
    use diesel::prelude::*;
    use diesel::dsl::exists;
    use diesel_async::AsyncPgConnection;
    use middleware::AuthenticatedUser;
    use uuid::Uuid;
    use database::enums::{AssetPermissionRole, AssetType, UserOrganizationRole, UserOrganizationStatus};
    use database::schema::asset_permissions;

    /// Checks if a user has the required permission level for a specific asset ID,
    /// leveraging cached organization roles and querying direct permissions.
    /// Intended primarily for pre-execution checks.
    pub async fn check_permission_for_asset_id(
        conn: &mut AsyncPgConnection,
        user: &AuthenticatedUser,
        asset_id: &Uuid,
        asset_type: AssetType,
        asset_organization_id: Uuid, // Org ID of the asset itself
        required_roles: &[AssetPermissionRole],
    ) -> Result<bool> {
        // --- 1. Check Cached High-Level Organization Roles First ---
        let high_level_org_roles = [
            UserOrganizationRole::WorkspaceAdmin,
            UserOrganizationRole::DataAdmin,
        ];

        let has_high_level_org_role = user.organizations.iter().any(|org| {
            org.id == asset_organization_id && high_level_org_roles.contains(&org.role)
            // Assuming AuthenticatedUser.organizations only contains active memberships
        });

        if has_high_level_org_role {
            return Ok(true); // User is Org Admin/Data Admin for the asset's org, grant access
        }

        // --- 2. Check Direct Permissions (Database Query) ---
        let direct_permission_exists = select(exists(
            asset_permissions::table
                .filter(asset_permissions::asset_id.eq(asset_id))
                .filter(asset_permissions::asset_type.eq(asset_type))
                .filter(asset_permissions::identity_id.eq(user.id))
                .filter(asset_permissions::identity_type.eq(database::enums::IdentityType::User))
                .filter(asset_permissions::deleted_at.is_null()) // Ignore deleted permissions
                .filter(asset_permissions::role.eq_any(required_roles)),
        ))
        .get_result::<bool>(conn)
        .await;

        match direct_permission_exists {
            Ok(true) => Ok(true), // Found sufficient direct permission
            Ok(false) => Ok(false), // No sufficient direct permission found
            Err(e) => {
                tracing::error!(
                    "DB error checking direct asset permissions for user {} asset {} type {:?}: {}",
                    user.id, asset_id, asset_type, e
                );
                Err(anyhow!("Failed to check direct asset permissions: {}", e))
            }
        }
        // Note: No check for Member role here unless specifically required
        // for action execution contexts, as metadata handlers use different logic.
    }
    ```
3.  **File Changes:**
    -   Create/Modify: `libs/sharing/src/permissions.rs`
    -   Modify: `libs/sharing/src/lib.rs` (to export the function)

## 6. Implementation Plan

1.  Implement the `check_permission_for_asset_id` function as defined above.
2.  Add comprehensive unit tests.
3.  Export the function.

## 7. Testing Strategy

-   **Unit Tests:**
    -   Mock `AuthenticatedUser` with various `organizations` states.
    -   Mock the `AsyncPgConnection` dependency (e.g., using `mockall` if the connection is passed via a trait, or by creating a mock connection object) to simulate different `asset_permissions` query results without hitting a real database.
    -   Test cases:
        -   User has `