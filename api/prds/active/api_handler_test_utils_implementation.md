# Handler Test Utils Implementation

## Overview
This PRD outlines the design and implementation of test utilities for creating mock `AuthenticatedUser` objects to support the handler authentication refactoring project.

## Problem Statement
The ongoing handler refactoring project requires all handlers to accept an `AuthenticatedUser` object instead of just a user ID. To properly test these refactored handlers, we need consistent and configurable test utilities to create mock `AuthenticatedUser` objects with various roles and permissions.

Currently, our tests use simple UUIDs for user identification, which lacks important context like:
- Organization memberships and roles
- Team memberships and roles
- User attributes and metadata
- Creation and modification timestamps

This makes it difficult to test authorization logic that depends on these attributes, leading to potential security gaps and testing inconsistencies.

## Goals
- Create a comprehensive test utility module for generating `AuthenticatedUser` instances
- Support various user roles and permission scenarios
- Ensure test utilities are flexible and configurable
- Enable more thorough testing of authorization logic
- Standardize the approach to user mocking across all tests

## Non-Goals
- Changing existing test logic beyond adapting to the new user structure
- Modifying production authentication mechanisms
- Generating real authentication tokens

## Technical Design

### Overview
We will create a new test utility module in `libs/handlers/tests/common/test_utils.rs` that provides functions to generate mock `AuthenticatedUser` objects with various configurations.

### Components to Create/Modify

#### 1. Test Utils Module
```
/libs/handlers/tests/common/test_utils.rs
```

This module will contain the following functions:

1. `create_test_user` - Basic function to create a customizable user
2. `create_test_admin_user` - Function to create an admin user
3. `create_test_regular_user` - Function to create a regular (non-admin) user
4. `create_test_org_user` - Function to create a user with specific organization roles
5. `create_test_team_user` - Function to create a user with specific team roles

#### 2. Implementation

```rust
use middleware::AuthenticatedUser;
use middleware::{OrganizationMembership, TeamMembership};
use database::enums::{TeamToUserRole, UserOrganizationRole};
use chrono::{DateTime, Utc};
use serde_json::Value;
use uuid::Uuid;

/// Creates a mock authenticated user for testing with customizable properties
pub fn create_test_user(
    id: Option<Uuid>,
    email: Option<String>,
    name: Option<String>,
    avatar_url: Option<String>,
    config: Option<Value>,
    attributes: Option<Value>,
    organizations: Option<Vec<OrganizationMembership>>,
    teams: Option<Vec<TeamMembership>>,
    created_at: Option<DateTime<Utc>>,
    updated_at: Option<DateTime<Utc>>
) -> AuthenticatedUser {
    let user_id = id.unwrap_or_else(Uuid::new_v4);
    let now = Utc::now();
    
    AuthenticatedUser {
        id: user_id,
        email: email.unwrap_or_else(|| format!("test-{}@example.com", user_id)),
        name: name.or_else(|| Some(format!("Test User {}", user_id))),
        avatar_url,
        config: config.unwrap_or_else(|| serde_json::json!({})),
        attributes: attributes.unwrap_or_else(|| serde_json::json!({"avatar": "test-avatar.jpg"})),
        organizations: organizations.unwrap_or_else(Vec::new),
        teams: teams.unwrap_or_else(Vec::new),
        created_at: created_at.unwrap_or(now),
        updated_at: updated_at.unwrap_or(now),
    }
}

/// Creates a basic test user with default values
pub fn create_basic_test_user() -> AuthenticatedUser {
    create_test_user(
        None, None, None, None, None, None, None, None, None, None
    )
}

/// Creates a mock admin user for testing
pub fn create_test_admin_user(org_id: Option<Uuid>) -> AuthenticatedUser {
    let organization_id = org_id.unwrap_or_else(Uuid::new_v4);
    
    create_test_user(
        None, 
        None,
        Some("Admin User".to_string()),
        None,
        None,
        None,
        Some(vec![
            OrganizationMembership {
                id: organization_id,
                role: UserOrganizationRole::Admin,
            }
        ]),
        None,
        None,
        None
    )
}

/// Creates a mock regular user for testing
pub fn create_test_regular_user(org_id: Option<Uuid>) -> AuthenticatedUser {
    let organization_id = org_id.unwrap_or_else(Uuid::new_v4);
    
    create_test_user(
        None, 
        None,
        Some("Regular User".to_string()),
        None,
        None,
        None,
        Some(vec![
            OrganizationMembership {
                id: organization_id,
                role: UserOrganizationRole::Member,
            }
        ]),
        None,
        None,
        None
    )
}

/// Creates a mock user with specific organization role
pub fn create_test_org_user(
    org_id: Uuid,
    role: UserOrganizationRole
) -> AuthenticatedUser {
    create_test_user(
        None, 
        None,
        None,
        None,
        None,
        None,
        Some(vec![
            OrganizationMembership {
                id: org_id,
                role,
            }
        ]),
        None,
        None,
        None
    )
}

/// Creates a mock user with specific team role
pub fn create_test_team_user(
    org_id: Uuid,
    team_id: Uuid,
    org_role: UserOrganizationRole,
    team_role: TeamToUserRole
) -> AuthenticatedUser {
    create_test_user(
        None, 
        None,
        None,
        None,
        None,
        None,
        Some(vec![
            OrganizationMembership {
                id: org_id,
                role: org_role,
            }
        ]),
        Some(vec![
            TeamMembership {
                id: team_id,
                role: team_role,
            }
        ]),
        None,
        None
    )
}

/// Creates a mock user with multiple organization memberships
pub fn create_multi_org_user(
    org_memberships: Vec<(Uuid, UserOrganizationRole)>
) -> AuthenticatedUser {
    let organizations = org_memberships
        .into_iter()
        .map(|(id, role)| OrganizationMembership { id, role })
        .collect();
    
    create_test_user(
        None, 
        None,
        None,
        None,
        None,
        None,
        Some(organizations),
        None,
        None,
        None
    )
}
```

#### 3. Test Helper Module Update

We'll also update the test helpers to use these new utilities:

```rust
// In libs/handlers/tests/common/mod.rs or libs/handlers/tests/common/helpers.rs

use super::test_utils::{create_test_user, create_test_admin_user, create_test_regular_user};
use middleware::AuthenticatedUser;

/// Updates existing test functions to use the AuthenticatedUser
pub async fn setup_test_with_user() -> (TestContext, AuthenticatedUser) {
    let context = setup_test_environment().await?;
    let user = create_test_admin_user(None);
    
    (context, user)
}
```

### Files to Create/Modify

1. Create new file:
   - `/libs/handlers/tests/common/test_utils.rs`

2. Update test common module:
   - `/libs/handlers/tests/common/mod.rs` (to export the new module)

## Implementation Plan

### Phase 1: Core Implementation
- ⏳ Create `test_utils.rs` module with all user creation functions
- ⏳ Update common test module to expose new utilities
- ⏳ Create basic tests for the utility functions themselves

### Phase 2: Integration with Existing Tests
- 🔜 Update an example test file to use the new utilities
- 🔜 Verify that the utilities meet testing needs
- 🔜 Make any necessary adjustments to the utilities

### Phase 3: Documentation
- 🔜 Add comprehensive documentation to the utility functions
- 🔜 Create usage examples for test authors
- 🔜 Document best practices for test user creation

## Testing Strategy

### Unit Tests
- Create specific tests for the utility functions themselves
- Verify that created users have correct properties
- Test edge cases like empty organizations/teams

### Integration Tests
- Use the utilities in a sample test to verify they work correctly
- Ensure the utilities support all testing scenarios

## Rollback Plan
If issues arise:
1. Identify specific problematic functions or patterns
2. Adjust implementation to address issues
3. If necessary, simplify implementation temporarily while resolving issues

## Success Criteria
- All functions in the test utility module work correctly
- The utilities can create users with various role combinations
- The utilities are easily adoptable by existing tests
- Documentation provides clear usage guidance

## Dependencies
- `middleware::AuthenticatedUser` struct from `libs/middleware/src/types.rs`
- Database enums for roles and permissions
- Existing test infrastructure

## Timeline
1-2 days for implementation and integration with existing test suite.

This PRD is a dependency for the main handler authentication refactoring project and should be completed first.