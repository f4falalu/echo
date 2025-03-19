# API Metrics Sharing Endpoints - Summary PRD

## Overview
This document provides a high-level summary of the API metrics sharing endpoints implementation and outlines the development sequence for the individual components.

## Problem Statement
Currently, there is no way to manage sharing permissions for metrics through REST endpoints. Users need to be able to share metrics with other users, update sharing permissions, and remove sharing permissions through REST endpoints.

## Implementation Components
The implementation is broken down into the following components, each with its own detailed PRD:

1. **List Metrics Sharing Endpoint** - GET /metrics/:id/sharing ✅
   - PRD: [api_metrics_sharing_list.md](/Users/dallin/buster/buster/api/prds/active/api_metrics_sharing_list.md)

2. **Create Metrics Sharing Endpoint** - POST /metrics/:id/sharing
   - PRD: [api_metrics_sharing_create.md](/Users/dallin/buster/buster/api/prds/active/api_metrics_sharing_create.md)

3. **Update Metrics Sharing Endpoint** - PUT /metrics/:id/sharing
   - PRD: [api_metrics_sharing_update.md](/Users/dallin/buster/buster/api/prds/active/api_metrics_sharing_update.md)

4. **Delete Metrics Sharing Endpoint** - DELETE /metrics/:id/sharing ✅
   - PRD: [api_metrics_sharing_delete.md](/Users/dallin/buster/buster/api/prds/active/api_metrics_sharing_delete.md)

## PRD Development Sequence and Parallelization

### PRD Development Order
The PRDs can be developed in the following order, with opportunities for parallel work:

1. **First: List Metrics Sharing Endpoint PRD** (api_metrics_sharing_list.md) ✅
   - This PRD should be completed first as it establishes the basic data structures and permission checking patterns that other PRDs will build upon.
   - It introduces the core response types and error handling approaches.

2. **Second (Can be done in parallel):**
   - **Create Metrics Sharing Endpoint PRD** (api_metrics_sharing_create.md)
   - **Delete Metrics Sharing Endpoint PRD** (api_metrics_sharing_delete.md) ✅
   - These PRDs can be worked on simultaneously by different team members after the List PRD is complete.
   - They use different sharing library functions and have minimal dependencies on each other.

3. **Third: Update Metrics Sharing Endpoint PRD** (api_metrics_sharing_update.md)
   - This PRD should be completed after the Create PRD since it builds on similar concepts and uses the same underlying sharing library functions.
   - The update endpoint reuses many patterns from the create endpoint with slight modifications.

### Dependencies Between PRDs
- The List PRD establishes patterns for permission checking and response structures.
- The Create and Delete PRDs are independent of each other but depend on patterns from the List PRD.
- The Update PRD builds upon the Create PRD's approach to modifying permissions.

## Implementation Sequence and Parallelization

### Phase 1: Foundation (Sequential) ✅
1. Set up the directory structure for sharing handlers and endpoints
   - Create `/src/routes/rest/routes/metrics/sharing/mod.rs` ✅
   - Create `/libs/handlers/src/metrics/sharing/mod.rs` ✅
   - Update `/src/routes/rest/routes/metrics/mod.rs` to include the sharing router ✅
   - Update `/libs/handlers/src/metrics/mod.rs` to export the sharing module ✅

### Phase 2: Core Endpoints (Can be Parallelized) ⏳
After Phase 1 is complete, the following components can be implemented in parallel by different developers:

- **List Sharing Endpoint** ✅
  - Uses `list_shares` from `@[api/libs/sharing/src]/list_asset_permissions.rs`
  - Uses `check_access` from `@[api/libs/sharing/src]/check_asset_permission.rs`

- **Create Sharing Endpoint**
  - Uses `find_user_by_email` from `@[api/libs/sharing/src]/user_lookup.rs`
  - Uses `create_share_by_email` from `@[api/libs/sharing/src]/create_asset_permission.rs`
  - Uses `has_permission` from `@[api/libs/sharing/src]/check_asset_permission.rs`

- **Update Sharing Endpoint**
  - Uses `create_share_by_email` from `@[api/libs/sharing/src]/create_asset_permission.rs`
  - Uses `has_permission` from `@[api/libs/sharing/src]/check_asset_permission.rs`

- **Delete Sharing Endpoint** ✅
  - Uses `remove_share_by_email` from `@[api/libs/sharing/src]/remove_asset_permissions.rs`
  - Uses `has_permission` from `@[api/libs/sharing/src]/check_asset_permission.rs`

### Phase 3: Integration and Testing (Sequential) 🔜
1. Integration testing of all endpoints together
2. Manual testing with Postman/curl
3. Performance testing
4. Documentation updates

## Dependencies
All components depend on the sharing library at `@[api/libs/sharing/src]`, which provides the core functionality for managing asset permissions. The specific dependencies are:

- `/api/libs/sharing/src/user_lookup.rs` - User lookup by email
- `/api/libs/sharing/src/create_asset_permission.rs` - Create/update permissions
- `/api/libs/sharing/src/remove_asset_permissions.rs` - Remove permissions
- `/api/libs/sharing/src/list_asset_permissions.rs` - List permissions
- `/api/libs/sharing/src/check_asset_permission.rs` - Check permissions
- `/api/libs/sharing/src/types.rs` - Shared types for permissions

## Security Considerations
- All endpoints require authentication
- Only users with appropriate permissions can manage sharing
- Input validation must be thorough to prevent security issues
- Email addresses must be properly validated and resolved to user IDs
- Permission checks must be enforced for all operations

## Rollback Plan
If issues are discovered:
1. Revert the changes to the affected files
2. Deploy the previous version
3. Investigate and fix the issues in a new PR