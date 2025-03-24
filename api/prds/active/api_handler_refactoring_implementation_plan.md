# Handler Refactoring Implementation Plan

## Overview
This PRD outlines the overall implementation plan and priority order for the handler authentication refactoring project. It serves as a master plan that brings together all the individual refactoring PRDs for different handler categories.

## Project Goal
Refactor all get, update, delete, and share handlers in `libs/handlers` to accept and utilize the `AuthenticatedUser` object from `middleware` instead of just a `user_id` parameter. This will improve security, reduce database queries, and create more consistent code patterns.

## Dependencies
All sub-PRDs depend on the test utility implementation:
- `api_handler_test_utils_implementation.md`

## Prioritized Implementation Order

The refactoring work should be completed in the following priority order to minimize integration issues and maximize efficiency:

### Phase 1: Core Infrastructure (Week 1)
1. ⏳ **Test Utilities** (`api_handler_test_utils_implementation.md`)
   - Create mock AuthenticatedUser functions
   - Update test helper modules
   - Enable testing with various user roles
   - Estimated time: 1-2 days
   - _Highest priority: Required for all other work_

2. 🔜 **Metrics Handlers** (`api_metrics_handlers_refactor.md`)
   - Refactor metric handlers and tests
   - Use existing tests as validation
   - Enhance permission checks
   - Estimated time: 1 week
   - _High priority: Has existing tests to validate approach_

### Phase 2: Core Functionality (Week 2)
3. 🔜 **Chat Handlers** (`api_chat_handlers_refactor.md`)
   - Refactor chat handlers
   - Update chat tests
   - Optimize user information usage
   - Estimated time: 1 week
   - _High priority: Core application functionality_

4. 🔜 **Message Handlers** (`api_messages_handlers_refactor.md`)
   - Refactor message handlers
   - Leverage chat handler patterns
   - Estimated time: 1-2 days
   - _Medium-high priority: Part of chat functionality_

### Phase 3: Asset Management (Week 3)
5. 🔜 **Collection Handlers** (`api_collections_handlers_refactor.md`)
   - Refactor collection handlers
   - Update asset relationship logic
   - Estimated time: 1 week
   - _Medium priority: Used throughout the application_

6. 🔜 **Dashboard Handlers** (`api_dashboards_handlers_refactor.md`)
   - Refactor dashboard handlers
   - Update collection relationship logic
   - Estimated time: 1 week
   - _Medium priority: Used throughout the application_

### Phase 4: Remaining Handlers (Week 4-5)
7. 🔜 **Favorites Handlers** (`api_favorites_handlers_refactor.md`)
   - Refactor favorites handlers
   - Relatively simple changes
   - Estimated time: 1-2 days
   - _Lower priority: Used across multiple features_

8. 🔜 **Data Source Handlers** (`api_data_source_handlers_refactor.md`)
   - Refactor data source handlers
   - Enhance organization-level permissions
   - Estimated time: 2-3 days
   - _Lowest priority: Less direct user interaction_

### Phase 5: Integration and Testing (Week 5)
9. 🔜 **Integration Testing**
   - Run comprehensive integration tests
   - Validate all functionality works together
   - Fix any integration issues
   - Estimated time: 2-3 days

10. 🔜 **Documentation and Cleanup**
    - Update developer documentation
    - Clean up any temporary code
    - Final validation
    - Estimated time: 1-2 days

## Dependency Graph

```
Test Utilities
    |
    ├─────> Metrics Handlers
    |
    ├─────> Chat Handlers ────> Message Handlers
    |
    ├─────> Collection Handlers ────> Dashboard Handlers
    |
    ├─────> Favorites Handlers
    |
    └─────> Data Source Handlers
```

## Progress Tracking
Each sub-PRD will track its own implementation progress with these status indicators:
- ✅ Completed
- ⏳ In Progress
- 🔜 Planned
- ❌ Blocked

## Testing Strategy

### Unit Tests
- Each refactored handler must have updated unit tests
- Tests must use the new test utilities
- Tests should verify different user roles and permissions

### Integration Tests
- End-to-end tests must validate complete request flows
- Cross-module tests must verify proper interaction between components
- Performance tests should confirm no regression

## Rollback Procedure
If major issues are discovered during implementation:
1. Revert the specific handlers causing problems
2. Document issues in detail
3. Continue with other handlers that aren't affected
4. Create a mitigation plan before attempting the problematic handlers again

## Success Criteria
- All handlers accept `AuthenticatedUser` instead of just `user_id`
- All tests pass with the new implementation
- REST endpoints properly pass the AuthenticatedUser object
- No regression in functionality or performance
- Code is more maintainable and consistent
- Improved security with more comprehensive permission checks

## Timeline
Total estimated duration: 5 weeks

- Week 1: Test utilities and metrics handlers
- Week 2: Chat and message handlers
- Week 3: Collection and dashboard handlers
- Week 4: Favorites and data source handlers
- Week 5: Integration testing, documentation, and cleanup

## References
- `middleware::AuthenticatedUser` struct in `libs/middleware/src/types.rs`
- Handler documentation in `documentation/handlers.mdc`
- PRD guidelines in `documentation/prds.mdc`
- Individual sub-PRDs for each handler category