---
title: HTTP Status Code Fix
author: Claude
date: 2024-04-07
status: Draft
parent_prd: project_bug_fixes_and_testing.md
ticket: BUS-1067
---

# HTTP Status Code Fix

## Problem Statement

The API is currently returning incorrect HTTP status codes in several scenarios, particularly in error cases. This inconsistency makes it difficult for clients to properly handle errors and leads to confusion in error handling. The main issues are:

Current behavior:
- Some error responses return 200 OK with error in body
- Inconsistent use of 4xx status codes
- Missing proper status codes for specific error cases
- Lack of standardization across handlers

Expected behavior:
- Proper HTTP status codes for all responses
- Consistent error status codes
- Clear mapping between error types and status codes
- Standardized error response format

## Goals

1. Standardize HTTP status codes across all handlers
2. Implement proper error status codes
3. Create error-to-status code mapping
4. Add tests for status code verification
5. Document status code usage

## Non-Goals

1. Changing error message format
2. Adding new error types
3. Modifying success response format
4. Changing API contracts

## Technical Design

### Overview

The fix involves creating a standardized error-to-status code mapping and updating all handlers to use this mapping consistently.

### Error Status Code Mapping

```rust
// libs/handlers/src/error.rs

#[derive(Debug)]
pub enum HandlerError {
    NotFound(String),
    Unauthorized(String),
    Forbidden(String),
    BadRequest(String),
    Conflict(String),
    Internal(String),
}

impl HandlerError {
    pub fn status_code(&self) -> StatusCode {
        match self {
            HandlerError::NotFound(_) => StatusCode::NOT_FOUND,
            HandlerError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            HandlerError::Forbidden(_) => StatusCode::FORBIDDEN,
            HandlerError::BadRequest(_) => StatusCode::BAD_REQUEST,
            HandlerError::Conflict(_) => StatusCode::CONFLICT,
            HandlerError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl From<HandlerError> for Response {
    fn from(error: HandlerError) -> Self {
        let status = error.status_code();
        let body = json!({
            "error": {
                "message": error.to_string(),
                "code": status.as_u16()
            }
        });
        
        Response::builder()
            .status(status)
            .header("Content-Type", "application/json")
            .body(body.to_string())
            .unwrap_or_else(|_| {
                Response::builder()
                    .status(StatusCode::INTERNAL_SERVER_ERROR)
                    .body("Internal server error".to_string())
                    .unwrap()
            })
    }
}
```

### Handler Updates

Example handler update:

```rust
// libs/handlers/src/assets/get_asset.rs

pub async fn get_asset_handler(
    asset_id: &Uuid,
    user: &AuthenticatedUser,
) -> Result<Response, HandlerError> {
    let asset = match Asset::find_by_id(asset_id).await {
        Ok(asset) => asset,
        Err(_) => return Err(HandlerError::NotFound(
            format!("Asset {} not found", asset_id)
        )),
    };
    
    if !user.can_view(&asset) {
        return Err(HandlerError::Forbidden(
            "User does not have permission to view this asset".to_string()
        ));
    }
    
    Ok(Response::builder()
        .status(StatusCode::OK)
        .body(json!(asset).to_string())
        .unwrap())
}
```

### Test Cases

```rust
// libs/handlers/tests/error_status_test.rs

#[tokio::test]
async fn test_not_found_status() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
    let fake_id = Uuid::new_v4();
    
    let response = get_asset_handler(
        &fake_id,
        &setup.user
    ).await;
    
    assert!(response.is_err());
    let err = response.unwrap_err();
    assert_eq!(err.status_code(), StatusCode::NOT_FOUND);
    
    Ok(())
}

#[tokio::test]
async fn test_forbidden_status() -> Result<()> {
    // Create test setup with viewer role
    let setup = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
    
    // Create asset without permissions
    let asset_id = AssetTestHelpers::create_test_asset(
        &setup.db,
        "Test Asset",
        setup.organization.id
    ).await?;
    
    let response = get_asset_handler(
        &asset_id,
        &setup.user
    ).await;
    
    assert!(response.is_err());
    let err = response.unwrap_err();
    assert_eq!(err.status_code(), StatusCode::FORBIDDEN);
    
    // Verify error is logged
    let mut conn = setup.db.diesel_conn().await?;
    let error_log = error_logs::table
        .filter(error_logs::asset_id.eq(asset_id))
        .filter(error_logs::user_id.eq(setup.user.id))
        .first::<ErrorLog>(&mut conn)
        .await?;
    
    assert_eq!(error_log.status_code, StatusCode::FORBIDDEN.as_u16() as i32);
    
    Ok(())
}

#[tokio::test]
async fn test_error_response_format() -> Result<()> {
    // Create test setup with viewer role
    let setup = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
    
    // Create test asset
    let asset_id = AssetTestHelpers::create_test_asset(
        &setup.db,
        "Test Asset",
        setup.organization.id
    ).await?;
    
    let response = get_asset_handler(
        &asset_id,
        &setup.user
    ).await;
    
    assert!(response.is_err());
    let err = response.unwrap_err();
    
    // Convert error to response
    let error_response: Response = err.into();
    
    // Verify response format
    let body = hyper::body::to_bytes(error_response.into_body()).await?;
    let error_json: serde_json::Value = serde_json::from_slice(&body)?;
    
    assert!(error_json.get("error").is_some());
    assert!(error_json["error"].get("message").is_some());
    assert!(error_json["error"].get("code").is_some());
    
    Ok(())
}
```

### Dependencies

1. Test infrastructure from [Test Infrastructure Setup](api_test_infrastructure.md)
2. Existing handler implementations
3. HTTP status code definitions
4. Error type definitions

## Implementation Plan

### Phase 1: Error Type Updates

1. Create/update error types
2. Implement status code mapping
3. Add error response formatting
4. Update documentation

### Phase 2: Handler Updates

1. Update handlers to use new error types
2. Add proper status code returns
3. Implement error handling
4. Add tests

### Phase 3: Testing

1. Add status code tests
2. Test error scenarios
3. Verify response formats
4. Test edge cases

## Testing Strategy

### Unit Tests

- Test error type mapping
- Test status code assignment
- Test error response format
- Test handler error cases

### Integration Tests

- Test complete request flow
- Verify status codes
- Test error scenarios
- Test response format

## Success Criteria

1. All handlers return correct status codes
2. Error responses are properly formatted
3. Tests pass for all scenarios
4. Documentation is updated

## Rollout Plan

1. Implement error type changes
2. Update handlers incrementally
3. Deploy to staging
4. Monitor for issues
5. Deploy to production

## Appendix

### Related Files

- `libs/handlers/src/error.rs`
- `libs/handlers/src/assets/*.rs`
- `libs/handlers/tests/error_status_test.rs`
- `libs/handlers/tests/assets/*.rs`

### HTTP Status Code Reference

Common status codes used:
- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error 