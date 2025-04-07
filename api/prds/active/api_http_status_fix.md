---
title: HTTP Status Code Fix
author: Claude
date: 2024-04-07
status: Draft
parent_prd: project_bug_fixes_and_testing.md
ticket: BUS-1067
---

# HTTP Status Code Fix

## Parent Project

This is a sub-PRD of the [Bug Fixes and Testing Improvements](project_bug_fixes_and_testing.md) project. Please refer to the parent PRD for the overall project context, goals, and implementation plan.

## Problem Statement

<!-- 
Clearly articulate the problem you're solving. Include:
- Current state and behavior
- Expected behavior
- How this fits into the larger project
- Specific pain points this component addresses
-->

Current behavior:
- Permission denied errors return 404 instead of 403
- Version not found errors have inconsistent handling
- Error status codes differ between metrics and dashboards
- Error messages in status codes don't match handler messages
- No standardized error response format

Expected behavior:
- Permission denied returns 403 Forbidden
- Version not found returns 404 Not Found
- Consistent error handling across all asset types
- Clear mapping between handler errors and status codes
- Standardized error response format

## Goals

1. Standardize HTTP status codes for asset handlers
2. Implement proper error status codes for permission and version errors
3. Create consistent error-to-status code mapping
4. Add comprehensive tests for status code verification

## Non-Goals

1. Changing handler error messages
2. Adding new error types
3. Modifying success response format
4. Changing handler logic

## Implementation Plan

### Phase 1: Error Mapping ⏳ (In Progress)

#### Technical Design

```rust
// Error mapping structure
pub struct ErrorMapping {
    pub pattern: &'static str,
    pub status: StatusCode,
    pub message: &'static str,
}

// Error mappings
const ERROR_MAPPINGS: &[ErrorMapping] = &[
    ErrorMapping {
        pattern: "don't have permission",
        status: StatusCode::FORBIDDEN,
        message: "Permission denied",
    },
    ErrorMapping {
        pattern: "not found",
        status: StatusCode::NOT_FOUND,
        message: "Resource not found",
    },
    // ... more mappings
];
```

#### Implementation Steps
1. [ ] Create error mapping structure
   - Define error patterns
   - Map to status codes
   - Standardize messages
   - Testing requirements:
     - Pattern matching
     - Message formatting
     - Edge cases

2. [ ] Update metric route handler
   - Add error mapping
   - Update response format
   - Testing requirements:
     - All error types
     - Status code verification
     - Message validation

3. [ ] Update dashboard route handler
   - Add error mapping
   - Update response format
   - Testing requirements:
     - All error types
     - Status code verification
     - Message validation

#### Tests

##### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_permission_denied_mapping() {
        let error = anyhow!("User doesn't have permission to access this resource");
        let result = map_error(error);
        assert_eq!(result.status(), StatusCode::FORBIDDEN);
        assert_eq!(result.message(), "Permission denied");
    }

    #[test]
    fn test_not_found_mapping() {
        let error = anyhow!("Metric not found");
        let result = map_error(error);
        assert_eq!(result.status(), StatusCode::NOT_FOUND);
        assert_eq!(result.message(), "Resource not found");
    }

    #[test]
    fn test_version_not_found_mapping() {
        let error = anyhow!("Version 123 not found");
        let result = map_error(error);
        assert_eq!(result.status(), StatusCode::NOT_FOUND);
        assert_eq!(result.message(), "Version not found");
    }

    #[test]
    fn test_unknown_error_mapping() {
        let error = anyhow!("Some unexpected error");
        let result = map_error(error);
        assert_eq!(result.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }
}
```

##### Integration Tests
- Test Scenario: Permission Denied
  - Setup:
    - Create test metric
    - Create user without permissions
  - Steps:
    1. Attempt to access metric
    2. Verify response
  - Assertions:
    - Status code is 403
    - Message is "Permission denied"
  - Edge Cases:
    - Inherited permissions
    - Public resources
    - Invalid user

- Test Scenario: Resource Not Found
  - Setup:
    - Create test user
    - Generate invalid UUID
  - Steps:
    1. Attempt to access non-existent resource
    2. Verify response
  - Assertions:
    - Status code is 404
    - Message is "Resource not found"
  - Edge Cases:
    - Deleted resources
    - Case sensitivity
    - Special characters

#### Success Criteria
- [ ] All error mappings implemented
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Consistent behavior across asset types

### Phase 2: Handler Updates 🔜 (Not Started)

[Similar structure to Phase 1]

## Dependencies on Other Components

1. Test Infrastructure
   - Interface: TestDb for database access
   - Testing: Permission setup utilities

2. Asset Handlers
   - Interface: Error types and messages
   - Testing: Error generation scenarios

## Security Considerations

- Consideration 1: Error Information Exposure
  - Risk: Detailed errors could expose system info
  - Mitigation: Standardized error messages
  - Testing: Message content validation

- Consideration 2: Permission Checks
  - Risk: Incorrect status codes bypass frontend checks
  - Mitigation: Comprehensive error mapping
  - Testing: All permission scenarios

## References

- [HTTP Status Code Standards](link_to_standards)
- [Error Handling Guidelines](link_to_guidelines)
- [Testing Best Practices](link_to_practices) 