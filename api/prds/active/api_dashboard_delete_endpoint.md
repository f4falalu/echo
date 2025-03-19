---
title: Delete Dashboard REST Endpoint
author: Cascade
date: 2025-03-19
status: Draft
---

# Delete Dashboard REST Endpoint

## Problem Statement

Currently, our application lacks a REST API endpoint for deleting dashboards. Users need to be able to programmatically delete dashboards through the API to support automation and integration scenarios.

## Proposed Solution

Implement a DELETE /dashboards/:id endpoint that marks a dashboard as deleted by setting its `deleted_at` timestamp to the current time. This soft delete approach preserves the dashboard data while removing it from active use.

## Technical Design

### REST Endpoint

```
DELETE /dashboards/:id
```

#### Request

The request only requires the dashboard ID in the URL path. No request body is needed.

#### Response

```json
{
  "success": true,
  "message": "Dashboard deleted successfully"
}
```

### Handler Implementation

#### REST Handler

Create a new file at `src/routes/rest/routes/dashboards/delete_dashboard.rs`:

```rust
use axum::{
    extract::{Path, State},
    Json,
};
use handlers::dashboards::delete_dashboard_handler;
use handlers::types::User;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;
use crate::AppState;

pub async fn delete_dashboard_rest_handler(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    user: User,
) -> ApiResponse {
    match delete_dashboard_handler(id, &user.id).await {
        Ok(_) => ApiResponse::success(serde_json::json!({
            "success": true,
            "message": "Dashboard deleted successfully"
        })),
        Err(e) => {
            tracing::error!("Failed to delete dashboard: {}", e);
            ApiResponse::error(e)
        }
    }
}
```

#### Business Logic Handler

Create a new file at `libs/handlers/src/dashboards/delete_dashboard_handler.rs`:

```rust
use anyhow::{anyhow, Result};
use chrono::Utc;
use database::pool::get_pg_pool;
use database::schema::dashboard_files;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

pub async fn delete_dashboard_handler(dashboard_id: Uuid, user_id: &Uuid) -> Result<()> {
    let mut conn = get_pg_pool().get().await?;
    
    // Check if the dashboard exists and is not already deleted
    let dashboard_exists = diesel::select(diesel::dsl::exists(
        dashboard_files::table
            .filter(dashboard_files::id.eq(dashboard_id))
            .filter(dashboard_files::deleted_at.is_null())
    ))
    .get_result::<bool>(&mut conn)
    .await?;
    
    if !dashboard_exists {
        return Err(anyhow!("Dashboard not found or already deleted"));
    }
    
    // Soft delete the dashboard by setting deleted_at to the current time
    let now = Utc::now();
    let rows_affected = diesel::update(dashboard_files::table)
        .filter(dashboard_files::id.eq(dashboard_id))
        .filter(dashboard_files::deleted_at.is_null())
        .set(dashboard_files::deleted_at.eq(now))
        .execute(&mut conn)
        .await?;
    
    if rows_affected == 0 {
        return Err(anyhow!("Failed to delete dashboard"));
    }
    
    Ok(())
}
```

### Update Module Files

Update `libs/handlers/src/dashboards/mod.rs` to include the new handler:

```rust
mod create_dashboard_handler;
mod delete_dashboard_handler;
mod get_dashboard_handler;
mod list_dashboard_handler;
mod update_dashboard_handler;
mod types;
pub mod sharing;

pub use create_dashboard_handler::*;
pub use delete_dashboard_handler::*;
pub use get_dashboard_handler::*;
pub use list_dashboard_handler::*;
pub use update_dashboard_handler::*;
pub use types::*;
```

Update `src/routes/rest/routes/dashboards/mod.rs` to include the new route:

```rust
use axum::{
    routing::delete,
    routing::{get, post, put},
    Router,
};

// Modules for dashboard endpoints
mod create_dashboard;
mod delete_dashboard;
mod get_dashboard;
mod list_dashboards;
mod update_dashboard;
mod sharing;

pub fn router() -> Router {
    Router::new()
        .route("/", post(create_dashboard::create_dashboard_rest_handler))
        .route("/:id", put(update_dashboard::update_dashboard_rest_handler))
        .route("/:id", delete(delete_dashboard::delete_dashboard_rest_handler))
        .route("/:id", get(get_dashboard::get_dashboard_rest_handler))
        .route("/", get(list_dashboards::list_dashboard_rest_handler))
        .route(
            "/:id/sharing",
            get(sharing::list_dashboard_sharing_rest_handler),
        )
        .route(
            "/:id/sharing",
            post(sharing::create_dashboard_sharing_rest_handler),
        )
        .route(
            "/:id/sharing",
            put(sharing::update_dashboard_sharing_rest_handler),
        )
        .route(
            "/:id/sharing",
            delete(sharing::delete_dashboard_sharing_rest_handler),
        )
}
```

## Testing Strategy

### Unit Tests

Create unit tests for the `delete_dashboard_handler` function:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use mockito;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_delete_dashboard_handler() {
        // Setup test environment
        let dashboard_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        
        // Create a test dashboard first
        // This would require setting up a test database
        
        // Call the handler
        let result = delete_dashboard_handler(dashboard_id, &user_id).await;
        
        // Verify the result
        assert!(result.is_ok());
        
        // Verify the dashboard is marked as deleted
        // This would require querying the database
    }
    
    #[tokio::test]
    async fn test_delete_nonexistent_dashboard() {
        // Setup test environment
        let dashboard_id = Uuid::new_v4(); // A random ID that doesn't exist
        let user_id = Uuid::new_v4();
        
        // Call the handler
        let result = delete_dashboard_handler(dashboard_id, &user_id).await;
        
        // Verify the result
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("not found"));
    }
}
```

### Integration Tests

Create integration tests in `tests/routes/rest/dashboards/delete_dashboard_test.rs`:

```rust
use anyhow::Result;
use axum::http::StatusCode;
use uuid::Uuid;

use crate::common::test_app::TestApp;

#[tokio::test]
async fn test_delete_dashboard_endpoint() -> Result<()> {
    // Setup test app
    let app = TestApp::new().await?;
    
    // Create a test dashboard first
    let create_response = app
        .client
        .post("/api/v1/dashboards")
        .bearer_auth(&app.test_user.token)
        .send()
        .await?;
    
    let create_body: serde_json::Value = create_response.json().await?;
    let dashboard_id = create_body["dashboard"]["id"].as_str().unwrap();
    
    // Make request to delete dashboard
    let delete_response = app
        .client
        .delete(&format!("/api/v1/dashboards/{}", dashboard_id))
        .bearer_auth(&app.test_user.token)
        .send()
        .await?;
    
    // Verify response
    assert_eq!(delete_response.status(), StatusCode::OK);
    
    // Parse response body
    let delete_body: serde_json::Value = delete_response.json().await?;
    
    // Verify success message
    assert_eq!(delete_body["success"], true);
    assert!(delete_body["message"].as_str().unwrap().contains("deleted successfully"));
    
    // Verify the dashboard is no longer accessible
    let get_response = app
        .client
        .get(&format!("/api/v1/dashboards/{}", dashboard_id))
        .bearer_auth(&app.test_user.token)
        .send()
        .await?;
    
    assert_eq!(get_response.status(), StatusCode::NOT_FOUND);
    
    Ok(())
}

#[tokio::test]
async fn test_delete_nonexistent_dashboard_endpoint() -> Result<()> {
    // Setup test app
    let app = TestApp::new().await?;
    
    // Generate a random dashboard ID
    let dashboard_id = Uuid::new_v4();
    
    // Make request to delete nonexistent dashboard
    let delete_response = app
        .client
        .delete(&format!("/api/v1/dashboards/{}", dashboard_id))
        .bearer_auth(&app.test_user.token)
        .send()
        .await?;
    
    // Verify response
    assert_eq!(delete_response.status(), StatusCode::NOT_FOUND);
    
    Ok(())
}
```

## Dependencies

- Database schema for dashboard_files
- Authentication middleware
- Existing dashboard retrieval logic

## File Changes

### New Files
- `src/routes/rest/routes/dashboards/delete_dashboard.rs`
- `libs/handlers/src/dashboards/delete_dashboard_handler.rs`

### Modified Files
- `src/routes/rest/routes/dashboards/mod.rs`
- `libs/handlers/src/dashboards/mod.rs`

## Implementation Plan

1. Create the business logic handler
2. Create the REST endpoint handler
3. Update module files
4. Add unit tests
5. Add integration tests
6. Manual testing

## Success Criteria

1. The endpoint successfully marks a dashboard as deleted
2. The endpoint returns a properly formatted response
3. Deleted dashboards are no longer accessible via the API
4. All tests pass
5. The endpoint is properly documented
6. The endpoint is secured with authentication
