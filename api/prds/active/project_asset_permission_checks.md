---
title: Asset Permission Checks Implementation
author: 
date: 2025-03-21
status: Draft
---

# Asset Permission Checks Implementation

## Problem Statement

Currently, the Buster application's asset endpoints (Chats, Collections, Dashboards, and Metrics) have inconsistent access control logic. While there is a sharing library (`@libs/sharing`) with permission checking functionality, it is not uniformly applied across all asset types and endpoints.

The current state leads to several issues:
- Inconsistent access control enforcement across different asset types
- Potentially allowing unauthorized access to certain assets
- Lack of admin-level permission checks for organization administrators
- Duplicated permission-checking logic across different handlers
- No proper checks for granular permission levels based on asset types

This project aims to standardize asset permission checks across all asset endpoints using the `@libs/sharing` library's `check_asset_permission.rs` functionality, with a specific enhancement to automatically grant FullAccess permissions to users with WorkspaceAdmin or DataAdmin roles in the organization that owns the asset.

## Goals

1. Implement consistent permission checks across all asset types (Chats, Collections, Dashboards, and Metrics)
2. Add organization admin bypass mechanism to grant FullAccess to DataAdmin and WorkspaceAdmin roles
3. Ensure proper permission levels are enforced based on asset type (CanView, CanFilter, CanEdit, FullAccess, Owner)
4. Standardize error handling for permission-denied scenarios
5. Ensure comprehensive test coverage for permission checks

## Non-Goals

1. Modify the permission model itself (only implementing checks against existing model)
2. Re-architect the sharing library
3. Implement new permission-granting interfaces
4. Modify the database schema for permissions
5. Add new permission types

## Technical Design

### Overview

The implementation will follow these key principles:

1. Use the `check_asset_permission` functions from `@libs/sharing/src/check_asset_permission.rs`
2. Add a new helper function to check organization admin status
3. Modify each asset handler to include permission checks as early as possible in the handler logic
4. Follow consistent patterns across different asset types
5. Implement comprehensive testing for each asset type

```mermaid
graph TD
    A[Client Request] --> B[API Router]
    B --> C[Asset Handler]
    C --> D{Check Permissions}
    D -->|Admin Check| E[Check Organization Admin Status]
    D -->|Asset Permission Check| F[check_asset_permission.rs]
    E -->|Yes| G[Grant FullAccess]
    E -->|No| H[Use Regular Permissions]
    F --> H
    G --> I[Process Asset Request]
    H --> I
    I --> J[Return Response]
```

### Component Breakdown

#### Component 1: Organization Admin Check
- Purpose: Add a new utility function that checks if a user has WorkspaceAdmin or DataAdmin role for an organization
- Sub-PRD: [Asset Permission Admin Check](api_asset_permission_admin_check.md)
- Interfaces:
  - Input: User ID, Organization ID
  - Output: Boolean indicating admin status

#### Component 2: Chat Permission Implementation
- Purpose: Implement permission checks for all Chat handlers
- Sub-PRD: [Chat Permission Checks](api_chat_permission_checks.md)
- Interfaces:
  - Input: Chat handlers
  - Output: Modified handlers with permission checks

#### Component 3: Collection Permission Implementation
- Purpose: Implement permission checks for all Collection handlers
- Sub-PRD: [Collection Permission Checks](api_collection_permission_checks.md)
- Interfaces:
  - Input: Collection handlers
  - Output: Modified handlers with permission checks

#### Component 4: Dashboard Permission Implementation
- Purpose: Implement permission checks for all Dashboard handlers
- Sub-PRD: [Dashboard Permission Checks](api_dashboard_permission_checks.md)
- Interfaces:
  - Input: Dashboard handlers
  - Output: Modified handlers with permission checks

#### Component 5: Metric Permission Implementation
- Purpose: Implement permission checks for all Metric handlers
- Sub-PRD: [Metric Permission Checks](api_metric_permission_checks.md)
- Interfaces:
  - Input: Metric handlers
  - Output: Modified handlers with permission checks

### Dependencies

1. `@libs/sharing/src/check_asset_permission.rs` - Used for asset permission checks
2. `database/enums.rs` - For AssetPermissionRole and other enums
3. `database/schema.rs` - For database queries
4. `database/models.rs` - For asset data models
5. `@libs/handlers/src` directories for assets - To modify handlers

## Implementation Plan

### Sub-PRD Implementation Order and Dependencies

The implementation will be broken down into the following sub-PRDs, with their dependencies and development order clearly defined:

1. [Asset Permission Admin Check](api_asset_permission_admin_check.md) - **Must be completed first**
   - This PRD establishes the admin check capability needed by all other components
   - Dependencies: None
   - Required for: All other PRDs

The following can be developed concurrently after the admin check is implemented:

2. [Chat Permission Checks](api_chat_permission_checks.md) - **Can be developed concurrently**
   - Dependencies: Asset Permission Admin Check
   - Required for: None
   - No conflicts with other asset types

3. [Collection Permission Checks](api_collection_permission_checks.md) - **Can be developed concurrently**
   - Dependencies: Asset Permission Admin Check
   - Required for: None
   - No conflicts with other asset types

4. [Dashboard Permission Checks](api_dashboard_permission_checks.md) - **Can be developed concurrently**
   - Dependencies: Asset Permission Admin Check
   - Required for: None
   - No conflicts with other asset types

5. [Metric Permission Checks](api_metric_permission_checks.md) - **Can be developed concurrently**
   - Dependencies: Asset Permission Admin Check
   - Required for: None
   - No conflicts with other asset types

### Concurrent Development Strategy

To enable efficient concurrent development without conflicts:

1. **Consistent Permission Pattern**: Each sub-PRD will follow the same pattern for checking permissions
2. **Isolated Asset Types**: Each asset type's handlers are isolated from other types
3. **Common Helper Function**: The admin check function will be built first to ensure consistency
4. **Unit Test First**: Develop unit tests for each handler before implementation

### Phase 1: Foundation

**Components:**
- Asset Permission Admin Check

**Success Criteria:**
- Admin check function implemented and tested
- Function correctly identifies DataAdmin and WorkspaceAdmin users
- Unit tests passing at 100% coverage
- Integration tests defined

### Phase 2: Parallel Asset Permission Implementation

**Components:**
- Chat Permission Checks
- Collection Permission Checks
- Dashboard Permission Checks
- Metric Permission Checks

**Success Criteria:**
- All handlers implement permission checks
- Consistent error handling across asset types
- Admin bypass working correctly for all asset types
- Unit and integration tests passing

## Testing Strategy

### Unit Tests

- Each handler's permission check will have unit tests that:
  - Test normal permission scenarios
  - Test admin bypass scenarios
  - Test no-permission scenarios
  - Test edge cases (null permissions, etc.)

### Integration Tests

- For each asset type, integration tests will:
  - Test an end-to-end flow where permissions determine access
  - Verify correct permission enforcement for view/edit/delete operations
  - Test admin users can bypass regular permission checks
  - Test users with explicit permissions get appropriate access

## Security Considerations

- Permission checks must happen before any data is accessed or returned
- All permission-based exceptions must be properly logged
- Admin bypass should only work within the user's organization
- Permission checks should fail closed (deny by default)
- No permission information should be exposed in error messages

## Monitoring and Logging

- Log permission check failures with appropriate detail
- Monitor permission check performance
- Track admin bypass usage for auditing

## Rollout Plan

1. Implement and test in development environment
2. Progressive rollout by asset type, starting with less critical assets
3. Monitor for permission issues or unexpected access denials
4. Full deployment once all asset types are validated

## Appendix

### Related PRDs

- [Asset Permission Admin Check](api_asset_permission_admin_check.md)
- [Chat Permission Checks](api_chat_permission_checks.md)
- [Collection Permission Checks](api_collection_permission_checks.md)
- [Dashboard Permission Checks](api_dashboard_permission_checks.md)
- [Metric Permission Checks](api_metric_permission_checks.md)