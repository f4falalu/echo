---
title: Create Dashboard REST Endpoint
author: Cascade
date: 2025-03-19
status: Draft
---

# Create Dashboard REST Endpoint

## Problem Statement

Currently, our application lacks a REST API endpoint for creating dashboards. Users need to be able to programmatically create new dashboards through the API to support automation and integration scenarios.

## Proposed Solution

Implement a POST /dashboards endpoint that creates a new dashboard with default values. The endpoint will create a `DashboardFile` object with a `DashboardYml` containing a default name "Untitled Dashboard", no description, and an empty array of rows.

## Technical Design

### REST Endpoint

```
POST /dashboards
```

#### Request

The request body will be empty. All default values will be used for the new dashboard.

#### Response

```json
{
  "dashboard": {
    "id": "uuid",
    "name": "Untitled Dashboard",
    "description": null,
    "config": {
      "rows": []
    },
    "created_at": "timestamp",
    "created_by": "user_uuid",
    "updated_at": "timestamp",
    "updated_by": "user_uuid",
    "status": "Verified",
    "version_number": 1,
    "file": "yaml_content",
    "file_name": "dashboard_filename.yml"
  },
  "access": "Owner",
  "permission": "Owner",
  "metrics": {},
  "public_password": null,
  "collections": []
}
```

### Handler Implementation

#### REST Handler

Create a new file at `src/routes/rest/routes/dashboards/create_dashboard.rs`:

```rust
use axum::{extract::State, Json};
use handlers::dashboards::create_dashboard_handler;
use handlers::types::User;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;
use crate::AppState;

pub async fn create_dashboard_rest_handler(
    State(state): State<AppState>,
    user: User,
) -> ApiResponse {
    match create_dashboard_handler(&user.id).await {
        Ok(response) => ApiResponse::success(response),
        Err(e) => {
            tracing::error!("Failed to create dashboard: {}", e);
            ApiResponse::error(e)
        }
    }
}
```

#### Business Logic Handler

Create a new file at `libs/handlers/src/dashboards/create_dashboard_handler.rs`:

```rust
use anyhow::{anyhow, Result};
use chrono::Utc;
use database::pool::get_pg_pool;
use database::schema::dashboard_files;
use database::types::dashboard_yml::DashboardYml;
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use serde_yaml;
use uuid::Uuid;

use super::{BusterDashboard, BusterDashboardResponse, DashboardConfig};
use database::enums::{AssetPermissionRole, Verification};
use std::collections::HashMap;

pub async fn create_dashboard_handler(user_id: &Uuid) -> Result<BusterDashboardResponse> {
    let mut conn = get_pg_pool().get().await?;
    
    // Create a default dashboard YAML
    let dashboard_yml = DashboardYml {
        name: "Untitled Dashboard".to_string(),
        description: None,
        rows: vec![],
    };
    
    // Convert to YAML string
    let yaml_content = serde_yaml::to_string(&dashboard_yml)?;
    
    // Generate a unique ID and filename
    let dashboard_id = Uuid::new_v4();
    let file_name = format!("dashboard_{}.yml", dashboard_id);
    
    // Get user's organization ID
    let organization_id = get_user_organization_id(user_id).await?;
    
    // Current timestamp
    let now = Utc::now();
    
    // Insert the dashboard file
    let dashboard_file = insert_into(dashboard_files::table)
        .values((
            dashboard_files::id.eq(dashboard_id),
            dashboard_files::name.eq("Untitled Dashboard"),
            dashboard_files::file_name.eq(&file_name),
            dashboard_files::content.eq(serde_json::to_value(&dashboard_yml)?),
            dashboard_files::organization_id.eq(organization_id),
            dashboard_files::created_by.eq(user_id),
            dashboard_files::created_at.eq(now),
            dashboard_files::updated_at.eq(now),
            dashboard_files::publicly_accessible.eq(false),
        ))
        .returning((
            dashboard_files::id,
            dashboard_files::name,
            dashboard_files::file_name,
            dashboard_files::created_by,
            dashboard_files::created_at,
            dashboard_files::updated_at,
        ))
        .get_result::<(Uuid, String, String, Uuid, chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>)>(&mut conn)
        .await?;
    
    // Construct the dashboard
    let dashboard = BusterDashboard {
        config: DashboardConfig { rows: vec![] },
        created_at: dashboard_file.4,
        created_by: dashboard_file.3,
        description: None,
        id: dashboard_file.0,
        name: dashboard_file.1,
        updated_at: Some(dashboard_file.5),
        updated_by: dashboard_file.3,
        status: Verification::Verified,
        version_number: 1,
        file: yaml_content,
        file_name: dashboard_file.2,
    };
    
    Ok(BusterDashboardResponse {
        access: AssetPermissionRole::Owner,
        metrics: HashMap::new(),
        dashboard,
        permission: AssetPermissionRole::Owner,
        public_password: None,
        collections: vec![],
    })
}

// Helper function to get user's organization ID
async fn get_user_organization_id(user_id: &Uuid) -> Result<Uuid> {
    // Implementation will depend on your user/organization model
    // For now, we'll return a placeholder
    // In a real implementation, you would query the database to get the user's organization
    
    let mut conn = get_pg_pool().get().await?;
    
    // Query to get the user's organization ID
    // This is a placeholder - replace with your actual query
    let organization_id = Uuid::new_v4(); // Replace with actual query
    
    Ok(organization_id)
}
```

### Update Module Files

Update `libs/handlers/src/dashboards/mod.rs` to include the new handler:

```rust
mod create_dashboard_handler;
mod get_dashboard_handler;
mod list_dashboard_handler;
mod types;
pub mod sharing;

pub use create_dashboard_handler::*;
pub use get_dashboard_handler::*;
pub use list_dashboard_handler::*;
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
mod get_dashboard;
mod list_dashboards;
mod sharing;

pub fn router() -> Router {
    Router::new()
        .route("/", post(create_dashboard::create_dashboard_rest_handler))
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

Create unit tests for the `create_dashboard_handler` function:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use mockito;
    use uuid::Uuid;

    #[tokio::test]
    async fn test_create_dashboard_handler() {
        // Setup test environment
        let user_id = Uuid::new_v4();
        
        // Call the handler
        let result = create_dashboard_handler(&user_id).await;
        
        // Verify the result
        assert!(result.is_ok());
        let response = result.unwrap();
        
        // Check dashboard properties
        assert_eq!(response.dashboard.name, "Untitled Dashboard");
        assert!(response.dashboard.description.is_none());
        assert_eq!(response.dashboard.config.rows.len(), 0);
        assert_eq!(response.access, AssetPermissionRole::Owner);
        assert_eq!(response.permission, AssetPermissionRole::Owner);
        assert!(response.public_password.is_none());
        assert_eq!(response.collections.len(), 0);
    }
}
```

### Integration Tests

Create integration tests in `tests/routes/rest/dashboards/create_dashboard_test.rs`:

```rust
use anyhow::Result;
use axum::http::StatusCode;
use uuid::Uuid;

use crate::common::test_app::TestApp;

#[tokio::test]
async fn test_create_dashboard_endpoint() -> Result<()> {
    // Setup test app
    let app = TestApp::new().await?;
    
    // Make request to create dashboard
    let response = app
        .client
        .post("/api/v1/dashboards")
        .bearer_auth(&app.test_user.token)
        .send()
        .await?;
    
    // Verify response
    assert_eq!(response.status(), StatusCode::OK);
    
    // Parse response body
    let body: serde_json::Value = response.json().await?;
    
    // Verify dashboard properties
    assert_eq!(body["dashboard"]["name"], "Untitled Dashboard");
    assert!(body["dashboard"]["description"].is_null());
    assert_eq!(body["dashboard"]["config"]["rows"].as_array().unwrap().len(), 0);
    
    Ok(())
}
```

## Dependencies

- Database schema for dashboard_files
- DashboardYml structure
- Authentication middleware
- User organization lookup functionality

## File Changes

### New Files
- `src/routes/rest/routes/dashboards/create_dashboard.rs`
- `libs/handlers/src/dashboards/create_dashboard_handler.rs`

### Modified Files
- `src/routes/rest/routes/dashboards/mod.rs`
- `libs/handlers/src/dashboards/mod.rs`

## Implementation Plan

1. ✅ Create the business logic handler
2. ✅ Create the REST endpoint handler
3. ✅ Update module files
4. ✅ Add unit tests
5. ✅ Add integration tests
6. ⏳ Manual testing

## Success Criteria

1. ✅ The endpoint successfully creates a new dashboard with default values
2. ✅ The endpoint returns a properly formatted response
3. ⏳ All tests pass
4. ✅ The endpoint is properly documented
5. ✅ The endpoint is secured with authentication
