---
title: Dashboard Version Restoration Implementation
author: Buster Engineering Team
date: 2025-03-25
status: Draft
parent_prd: restoration_project.md
---

# Dashboard Version Restoration Implementation

## Overview
This document details the implementation of version restoration for dashboards as part of the larger [Version Restoration Feature](restoration_project.md) project.

## Technical Design

### Update Dashboard Handler Modification

The `update_dashboard_handler.rs` file needs to be modified to handle the new `restore_to_version` parameter. When this parameter is provided, the handler will:

1. Ignore all other request parameters
2. Retrieve the specified historical version
3. Create a new version that is a copy of the historical version
4. Update the dashboard with this restored content

### API Changes

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardUpdateRequest {
    // Existing fields...
    pub name: Option<String>,
    pub description: Option<Option<String>>,
    pub config: Option<DashboardConfig>,
    pub status: Option<Verification>,
    pub metrics: Option<Vec<String>>,
    pub file: Option<String>,
    pub public: Option<bool>,
    pub public_expiry_date: Option<String>,
    pub public_password: Option<String>,
    pub update_version: Option<bool>,
    
    // New field for version restoration
    pub restore_to_version: Option<i32>,
}
```

### Implementation Details

The update handler will need to be modified as follows:

```rust
pub async fn update_dashboard_handler(
    dashboard_id: Uuid,
    request: DashboardUpdateRequest,
    user: &AuthenticatedUser,
) -> Result<BusterDashboardResponse> {
    // ... existing permission checks ...
    
    let mut conn = get_pg_pool().get().await?;

    // Get existing dashboard
    let current_dashboard = get_dashboard_handler(&dashboard_id, user, None).await?;
    
    // Get version history
    let mut current_version_history: VersionHistory = dashboard_files::table
        .filter(dashboard_files::id.eq(dashboard_id))
        .select(dashboard_files::version_history)
        .first::<VersionHistory>(&mut conn)
        .await
        .unwrap_or_else(|_| VersionHistory::new(0, DashboardYml::default()));
    
    // Version restoration logic
    let dashboard_yml = if let Some(version_number) = request.restore_to_version {
        // Fetch the requested version
        let version = current_version_history
            .get_version(version_number)
            .ok_or_else(|| anyhow!("Version {} not found", version_number))?;
        
        // Parse the YAML content from the version
        version.content.clone()
    } else if let Some(file_content) = request.file {
        // Existing file content logic
        serde_yaml::from_str(&file_content)?
    } else {
        // Existing field-by-field update logic
        let mut dashboard_yml = serde_yaml::from_str::<DashboardYml>(&current_dashboard.dashboard.file)?;
        // ... update individual fields ...
        dashboard_yml
    };
    
    // Flag indicating whether any changes were made
    let has_changes = request.restore_to_version.is_some() || /* other change conditions */;
    
    // Calculate the next version number
    let next_version = current_version_history
        .get_latest_version()
        .map(|v| v.version_number + 1)
        .unwrap_or(1);
    
    // Add the new version to the version history only if update_version is true (defaults to true)
    let should_update_version = request.update_version.unwrap_or(true);

    // Only add a new version if has_changes
    if has_changes {
        if should_update_version {
            current_version_history.add_version(next_version, dashboard_yml.clone());
        } else {
            // Overwrite the current version instead of creating a new one
            current_version_history.update_latest_version(dashboard_yml.clone());
        }
    }
    
    // ... rest of existing code to update the dashboard in the database ...
}

## Testing

### Unit Tests

The following unit tests should be implemented to ensure the dashboard version restoration functionality works correctly:

#### Basic Functionality Tests
1. **Test Successful Restoration**: Verify that a specific version can be restored successfully
   - Create a dashboard with multiple versions
   - Restore an earlier version
   - Verify a new version is created with content matching the restored version
   - Verify the version number is incremented appropriately

2. **Test Restoration Priority**: Verify that when `restore_to_version` is provided, all other update parameters are ignored
   - Create a request with both `restore_to_version` and other fields like `name`, `description`, and `config`
   - Verify the restored content matches the historical version, not the new parameters

3. **Test Version Not Found**: Verify appropriate error handling when trying to restore a non-existent version
   - Attempt to restore a version number that doesn't exist
   - Verify an appropriate error is returned

#### Permission Tests
4. **Test Permission Check - Authorized**: Verify users with appropriate permissions can restore versions
   - Test with users having CanEdit, FullAccess, and Owner permissions
   - Verify restoration succeeds

5. **Test Permission Check - Unauthorized**: Verify users without appropriate permissions cannot restore versions
   - Test with users having ReadOnly or no permissions
   - Verify appropriate error is returned

#### Edge Cases
6. **Test Restoring Latest Version**: Verify behavior when restoring the current version
   - Attempt to restore the most recent version
   - Verify a new version is still created with the same content

7. **Test With Empty Version History**: Verify behavior for dashboards with no version history
   - Create a dashboard with minimal version history
   - Attempt restoration
   - Verify appropriate error handling

8. **Test With update_version Flag**: Test interaction between `restore_to_version` and `update_version`
   - When `update_version` is false, verify the restored content replaces the current version
   - When `update_version` is true (default), verify a new version is created

9. **Test Content Integrity**: Verify all content fields are properly restored
   - Create a complex dashboard with multiple rows and metrics
   - Modify the dashboard significantly
   - Restore the original version
   - Verify all fields match the original version (name, description, rows, metrics, etc.)
   
10. **Test Metric Associations**: Verify that metric associations are properly restored
    - Create a dashboard with specific metrics
    - Update the dashboard to use different metrics
    - Restore the original version
    - Verify that the correct metric associations are restored

### Integration Tests

The following integration tests should verify end-to-end functionality:

1. **Full Restoration Flow**: Test the complete dashboard restoration process
   - Create a dashboard through the API
   - Update it multiple times to create versions
   - Send a restoration request through the API
   - Verify the response contains the correctly restored content
   - Fetch the dashboard again to confirm persistence

2. **Authorization Flow**: Test authorization rules throughout the complete process
   - Create a dashboard owned by user A
   - Share it with user B with CanEdit permissions
   - Share it with user C with ReadOnly permissions
   - Have each user attempt restoration
   - Verify only authorized users succeed

3. **Concurrent Updates**: Test behavior with concurrent update operations
   - Initiate a restoration operation
   - Before it completes, send another update operation
   - Verify both operations are properly sequenced without data corruption

4. **Error Recovery**: Test system recovery from errors during restoration
   - Simulate database errors during restoration
   - Verify the system handles errors gracefully without corrupting data
   - Verify appropriate error responses

5. **Public Dashboard Restoration**: Test that public sharing settings are correctly handled
   - Create a dashboard with public sharing enabled
   - Update it to disable public sharing
   - Restore the original version
   - Verify that the public sharing settings are properly restored

### Example Unit Test Code

```rust
#[tokio::test]
async fn test_restore_dashboard_version() {
    // Set up test environment
    let pool = setup_test_db().await;
    let user = create_test_user().await;
    
    // Create a dashboard with initial content
    let initial_rows = vec![
        Row {
            items: vec![RowItem { id: Uuid::new_v4() }],
            row_height: 300,
            column_sizes: vec![12],
            id: Some(1),
        }
    ];
    
    let initial_content = DashboardYml {
        name: "Original Dashboard".to_string(),
        description: Some("Original description".to_string()),
        rows: initial_rows,
        // Other fields...
    };
    
    let dashboard_id = create_test_dashboard(&user, initial_content.clone()).await;
    
    // Update the dashboard to create version 2
    let updated_rows = vec![
        Row {
            items: vec![RowItem { id: Uuid::new_v4() }, RowItem { id: Uuid::new_v4() }],
            row_height: 400,
            column_sizes: vec![6, 6],
            id: Some(1),
        },
        Row {
            items: vec![RowItem { id: Uuid::new_v4() }],
            row_height: 300,
            column_sizes: vec![12],
            id: Some(2),
        }
    ];
    
    let updated_content = DashboardYml {
        name: "Updated Dashboard".to_string(),
        description: Some("Updated description".to_string()),
        rows: updated_rows,
        // Other fields...
    };
    
    update_test_dashboard(dashboard_id, &user, updated_content).await;
    
    // Restore to version 1
    let restore_request = DashboardUpdateRequest {
        restore_to_version: Some(1),
        ..Default::default()
    };
    
    let result = update_dashboard_handler(dashboard_id, restore_request, &user).await;
    
    // Assertions
    assert!(result.is_ok());
    
    let restored_dashboard = result.unwrap();
    
    // Verify a new version was created (should be version 3)
    assert_eq!(restored_dashboard.dashboard.version, 3);
    
    // Verify the content matches the original version
    let restored_content = serde_yaml::from_str::<DashboardYml>(&restored_dashboard.dashboard.file).unwrap();
    assert_eq!(restored_content.name, initial_content.name);
    assert_eq!(restored_content.description, initial_content.description);
    assert_eq!(restored_content.rows.len(), initial_content.rows.len());
    // Verify other fields...
    
    // Verify metric associations are restored correctly
    assert_eq!(restored_dashboard.metrics.len(), 1);
    // More specific checks for metric associations...
}

### Example Integration Test Code

```rust
#[tokio::test]
async fn test_dashboard_restore_integration() {
    // Set up test server with routes
    let app = create_test_app().await;
    let client = TestClient::new(app);
    
    // Create a test user and authenticate
    let (user, token) = create_and_login_test_user().await;
    
    // Create a test metric to include in the dashboard
    let metric_id = create_test_metric(&user).await;
    
    // Create a dashboard
    let create_response = client
        .post("/dashboards")
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "name": "Test Dashboard",
            "description": "Initial description",
            "config": {
                "rows": [
                    {
                        "id": "1",
                        "row_height": 300,
                        "column_sizes": [12],
                        "items": [
                            {
                                "id": metric_id.to_string()
                            }
                        ]
                    }
                ]
            }
        }))
        .send()
        .await;
    
    assert_eq!(create_response.status(), StatusCode::OK);
    let dashboard: BusterDashboardResponse = create_response.json().await;
    
    // Update the dashboard to create version 2
    let update_response = client
        .put(&format!("/dashboards/{}", dashboard.dashboard.id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "name": "Updated Dashboard",
            "description": "Updated description",
            "config": {
                "rows": [
                    {
                        "id": "1",
                        "row_height": 400,
                        "column_sizes": [6, 6],
                        "items": [
                            {
                                "id": metric_id.to_string()
                            },
                            {
                                "id": create_test_metric(&user).await.to_string()
                            }
                        ]
                    }
                ]
            }
        }))
        .send()
        .await;
    
    assert_eq!(update_response.status(), StatusCode::OK);
    
    // Restore to version 1
    let restore_response = client
        .put(&format!("/dashboards/{}", dashboard.dashboard.id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "restore_to_version": 1
        }))
        .send()
        .await;
    
    assert_eq!(restore_response.status(), StatusCode::OK);
    let restored_dashboard: BusterDashboardResponse = restore_response.json().await;
    
    // Verify the dashboard was restored properly
    assert_eq!(restored_dashboard.dashboard.name, "Test Dashboard");
    assert_eq!(restored_dashboard.dashboard.version, 3);
    
    // Verify by fetching the dashboard again
    let get_response = client
        .get(&format!("/dashboards/{}", dashboard.dashboard.id))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await;
    
    assert_eq!(get_response.status(), StatusCode::OK);
    let fetched_dashboard: BusterDashboardResponse = get_response.json().await;
    
    // Verify the fetched dashboard matches the restored version
    assert_eq!(fetched_dashboard.dashboard.name, "Test Dashboard");
    assert_eq!(fetched_dashboard.dashboard.version, 3);
    assert_eq!(fetched_dashboard.metrics.len(), 1);
}

## Security Considerations

- The existing permission checks in `update_dashboard_handler` should be maintained
- Only users with `CanEdit`, `FullAccess`, or `Owner` permissions should be able to restore versions
- Ensure the audit trail captures version restoration actions
