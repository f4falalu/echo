# API Sharing Endpoints - Master Summary PRD

## Overview
This document provides a high-level summary of all sharing endpoints for different asset types (metrics, dashboards, collections, and chats) and outlines the development strategy across these components.

## Problem Statement
Currently, there is no way to manage sharing permissions for various asset types through REST endpoints. Users need to be able to share assets with other users, update sharing permissions, and remove sharing permissions through REST endpoints.

## Asset Types
The sharing endpoints will be implemented for the following asset types:

1. **Metrics**
   - Summary PRD: [api_metrics_sharing_summary.md](/Users/dallin/buster/buster/api/prds/active/api_metrics_sharing_summary.md)

2. **Dashboards**
   - Summary PRD: [api_dashboards_sharing_summary.md](/Users/dallin/buster/buster/api/prds/active/api_dashboards_sharing_summary.md)

3. **Collections**
   - Summary PRD: [api_collections_sharing_summary.md](/Users/dallin/buster/buster/api/prds/active/api_collections_sharing_summary.md)

4. **Chats**
   - Summary PRD: [api_chats_sharing_summary.md](/Users/dallin/buster/buster/api/prds/active/api_chats_sharing_summary.md)

## Development Strategy

### Cross-Asset Type Parallelization
The development of sharing endpoints can be parallelized across asset types. Different teams or developers can work on different asset types simultaneously:

1. **Team A**: Metrics sharing endpoints
2. **Team B**: Dashboards sharing endpoints
3. **Team C**: Collections sharing endpoints
4. **Team D**: Chats sharing endpoints

### Within-Asset Type Sequencing
For each asset type, the development should follow this sequence:

1. First: List Sharing Endpoint (GET /:asset-type/:id/sharing)
2. Second (can be done in parallel):
   - Create Sharing Endpoint (POST /:asset-type/:id/sharing)
   - Delete Sharing Endpoint (DELETE /:asset-type/:id/sharing)
3. Third: Update Sharing Endpoint (PUT /:asset-type/:id/sharing)

### Priority Order
If resources are limited and sequential development is necessary, the following priority order is recommended:

1. Metrics sharing endpoints (highest priority)
2. Dashboards sharing endpoints
3. Collections sharing endpoints
4. Chats sharing endpoints (lowest priority)

## Shared Components and Code Reuse

### Common Response Types
All sharing endpoints will use the same response structure:

```rust
pub struct SharingResponse {
    pub permissions: Vec<SharingPermission>,
}

pub struct SharingPermission {
    pub user_id: Uuid,
    pub email: String,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub role: AssetPermissionRole,
}
```

### Common Request Types
Create and update endpoints will use the same request structure:

```rust
pub struct SharingRequest {
    pub emails: Vec<String>,
    pub role: AssetPermissionRole,
}
```

Delete endpoints will use:

```rust
pub struct DeleteSharingRequest {
    pub emails: Vec<String>,
}
```

### Shared Library Functions
All endpoints will leverage the same sharing library functions:

- `check_access` and `has_permission` from `check_asset_permission.rs`
- `list_shares` from `list_asset_permissions.rs`
- `create_share_by_email` from `create_asset_permission.rs`
- `remove_share_by_email` from `remove_asset_permissions.rs`
- `find_user_by_email` from `user_lookup.rs`

## Testing Strategy

### Unit Tests
Each endpoint should have unit tests covering:
- Permission validation logic
- Error handling
- Mapping between API types and sharing library types

### Integration Tests
Integration tests should cover:
- Valid and invalid inputs for each endpoint
- Error handling
- Permission checks

### Cross-Asset Type Tests
Tests should verify that sharing works consistently across different asset types.

## Security Considerations
- All endpoints require authentication
- Only users with appropriate permissions can manage sharing
- Input validation must be thorough to prevent security issues
- Email addresses must be properly validated and resolved to user IDs
- Permission checks must be enforced for all operations

## Rollout Plan
1. Deploy metrics sharing endpoints first
2. Monitor for issues and gather feedback
3. Roll out remaining asset types in priority order
4. Update documentation and notify users of new sharing capabilities

## Dependencies
All components depend on the sharing library at `@[api/libs/sharing/src]`, which provides the core functionality for managing asset permissions.

## Timeline Estimation
- Metrics sharing endpoints: 1 week
- Dashboards sharing endpoints: 1 week
- Collections sharing endpoints: 1 week
- Chats sharing endpoints: 1 week

Total estimated time: 4 weeks if done sequentially, or 1-2 weeks if done in parallel.
