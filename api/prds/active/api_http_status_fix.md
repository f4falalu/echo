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
- Public password requirement needs 418 Teapot status

Expected behavior:
- Permission denied returns 403 Forbidden
- Version not found returns 404 Not Found
- Consistent error handling across all asset types
- Clear mapping between handler errors and status codes
- Standardized error response format
- Public password requirement returns 418 I'm a Teapot

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

### Phase 1: REST Handler Updates ⏳ (In Progress)

#### Technical Design

Update the REST handlers to use simple string matching for error mapping:

```rust
// Example for get_metric.rs
pub async fn get_metric_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Query(params): Query<GetMetricQueryParams>,
) -> Result<ApiResponse<BusterMetric>, (StatusCode, &'static str)> {
    match get_metric_handler(&id, &user, params.version_number).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error getting metric: {}", e);
            let error_message = e.to_string();
            
            // Simple string matching for common error cases
            if error_message.contains("public_password required") {
                return Err((StatusCode::IM_A_TEAPOT, "Password required for public access"));
            }
            if error_message.contains("don't have permission") {
                return Err((StatusCode::FORBIDDEN, "Permission denied"));
            }
            if error_message.contains("Version") && error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Version not found"));
            }
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Metric not found"));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"))
        }
    }
}
```

Similar update for dashboard handler:
```rust
// Example for get_dashboard.rs
pub async fn get_dashboard_rest_handler(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Query(params): Query<GetDashboardQueryParams>,
) -> Result<ApiResponse<BusterDashboardResponse>, (StatusCode, &'static str)> {
    match get_dashboard_handler(&id, &user, params.version_number).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error getting dashboard: {}", e);
            let error_message = e.to_string();
            
            // Use same error matching as metrics for consistency
            if error_message.contains("public_password required") {
                return Err((StatusCode::IM_A_TEAPOT, "Password required for public access"));
            }
            if error_message.contains("don't have permission") {
                return Err((StatusCode::FORBIDDEN, "Permission denied"));
            }
            if error_message.contains("Version") && error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Version not found"));
            }
            if error_message.contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Dashboard not found"));
            }
            
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"))
        }
    }
}
```

#### Implementation Steps
1. [ ] Update metric REST handler
   - Add error string matching
   - Standardize error messages
   - Add error logging

2. [ ] Update dashboard REST handler
   - Add error string matching
   - Standardize error messages
   - Add error logging

#### Tests

```rust
#[tokio::test]
async fn test_metric_errors() -> Result<()> {
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    
    // Test not found
    let response = get_metric_rest_handler(
        Extension(setup.user.clone()),
        Path(Uuid::new_v4()),
        Query(GetMetricQueryParams { version_number: None })
    ).await;
    
    assert!(matches!(response, Err((StatusCode::NOT_FOUND, _))));
    
    // Test permission denied
    let metric_id = AssetTestHelpers::create_test_metric(
        &setup.db,
        "Test Metric",
        setup.organization.id
    ).await?;
    
    let viewer = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
    let response = get_metric_rest_handler(
        Extension(viewer.user),
        Path(metric_id),
        Query(GetMetricQueryParams { version_number: None })
    ).await;
    
    assert!(matches!(response, Err((StatusCode::FORBIDDEN, _))));
    
    Ok(())
}

// Similar test for dashboard errors
```

#### Success Criteria
- [ ] REST handlers return correct status codes
- [ ] Error messages are consistent
- [ ] Tests pass for all error scenarios
- [ ] Error handling matches between metrics and dashboards

### Phase 2: Documentation Updates 🔜 (Not Started)

1. Update API documentation with error codes
2. Add examples of error responses
3. Document error handling patterns

## Security Considerations

- Error messages should not expose internal details
- Permission checks must return correct status codes
- Error responses should be consistent and predictable

## References

- [HTTP Status Code Standards](link_to_standards)
- [Error Handling Guidelines](link_to_guidelines)
- [Testing Best Practices](link_to_practices)

### HTTP Status Code Reference

Status codes used:
- 200: OK (Successful request)
- 400: Bad Request (Invalid version format)
- 403: Forbidden (Permission denied)
- 404: Not Found (Resource or version not found)
- 418: I'm a Teapot (Public password required)
- 500: Internal Server Error (Unexpected errors) 