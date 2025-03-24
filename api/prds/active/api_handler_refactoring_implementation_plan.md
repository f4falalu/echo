# Handler Refactoring Implementation Plan

## Overview
This PRD outlines the overall implementation plan and priority order for the handler authentication refactoring project. It serves as a master plan that brings together all the individual refactoring PRDs for specified handler categories.

## Project Goal
Refactor all get, update, delete, and share handlers in the following modules to accept and utilize the `AuthenticatedUser` object from `middleware` instead of just a `user_id` parameter:
- `libs/handlers/src/chats/`
- `libs/handlers/src/metrics/`
- `libs/handlers/src/collections/`
- `libs/handlers/src/dashboards/`

This will improve security, reduce database queries, and create more consistent code patterns.

## Prioritized Implementation Order

The refactoring work should be completed in the following priority order to minimize integration issues and maximize efficiency:

### 1. Metrics Handlers (Week 1)
- Implementation outlined in `api_metrics_handlers_refactor.md`
- Includes test utilities creation as part of this PRD
- Refactor metric handlers and tests
- Make REST endpoint updates
- Run comprehensive tests to validate the changes
- ✅ Success criteria: All metric handlers and tests pass with the new parameter format

### 2. Chat Handlers (Week 2)
- Implementation outlined in `api_chat_handlers_refactor.md`
- Refactor chat handlers and tests
- Make REST endpoint updates
- Run comprehensive tests to validate the changes
- ✅ Success criteria: All chat handlers and tests pass with the new parameter format

### 3. Collection Handlers (Week 3)
- Implementation outlined in `api_collections_handlers_refactor.md`
- Refactor collection handlers and tests
- Make REST endpoint updates
- Run comprehensive tests to validate the changes
- ✅ Success criteria: All collection handlers and tests pass with the new parameter format

### 4. Dashboard Handlers (Week 4)
- Implementation outlined in `api_dashboards_handlers_refactor.md`
- Refactor dashboard handlers and tests
- Make REST endpoint updates
- Run comprehensive tests to validate the changes
- ✅ Success criteria: All dashboard handlers and tests pass with the new parameter format

## Dependency Graph

```
Metrics Handlers (includes test utilities)
    |
    ├────> Chat Handlers
    |
    ├────> Collection Handlers
    |
    └────> Dashboard Handlers
```

## Progress Tracking
Each sub-PRD will track its own implementation progress with these status indicators:
- ✅ Completed
- ⏳ In Progress
- 🔜 Planned
- ❌ Blocked

## Testing Integration

Testing is integrated into each PRD's implementation plan. Each handler refactoring will not be considered complete until:

1. The necessary test utilities are implemented (as part of the metrics handlers PRD)
2. All unit tests for the handlers are updated to use the new parameter format
3. All tests pass with the new implementation
4. Integration tests validate that REST endpoints work with the refactored handlers

## General Pattern for Each Handler Refactoring

For each handler category, the implementation will follow this general pattern:

1. Update function signatures from `user_id: &Uuid` to `user: &AuthenticatedUser`
2. Update function implementations to use `user.id` where appropriate
3. Enhance permission checking using organizational and team roles
4. Update tests to use the test utilities
5. Verify all tests pass
6. Update related REST endpoints
7. Validate with integration testing

## Rollback Procedure
If major issues are discovered during implementation:
1. Revert the specific handlers causing problems
2. Document issues in detail
3. Continue with other handlers that aren't affected
4. Create a mitigation plan before attempting the problematic handlers again

## Success Criteria
The overall project will be considered successful when:
- All specified handlers accept `AuthenticatedUser` instead of just `user_id`
- All tests pass with the new implementation
- REST endpoints properly pass the AuthenticatedUser object
- No regression in functionality or performance
- Improved security with more comprehensive permission checks

## Timeline
Total estimated duration: 4 weeks

- Week 1: Metrics handlers (includes test utilities)
- Week 2: Chat handlers
- Week 3: Collection handlers
- Week 4: Dashboard handlers

## References
- `middleware::AuthenticatedUser` struct in `libs/middleware/src/types.rs`
- Handler documentation in `documentation/handlers.mdc`
- PRD guidelines in `documentation/prds.mdc`
- Individual sub-PRDs for each handler category