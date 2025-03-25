---
title: Metric Version Restoration Implementation
author: Buster Engineering Team
date: 2025-03-25
status: Draft
parent_prd: restoration_project.md
---

# Metric Version Restoration Implementation

## Overview
This document details the implementation of version restoration for metrics as part of the larger [Version Restoration Feature](restoration_project.md) project.

## Technical Design

### Update Metric Handler Modification

The `update_metric_handler.rs` file needs to be modified to handle the new `restore_to_version` parameter. When this parameter is provided, the handler will:

1. Ignore all other request parameters
2. Retrieve the specified historical version
3. Create a new version that is a copy of the historical version
4. Update the metric with this restored content

### API Changes

```rust
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct UpdateMetricRequest {
    // Existing fields...
    pub name: Option<String>,
    pub description: Option<String>,
    pub chart_config: Option<Value>,
    pub time_frame: Option<String>,
    pub dataset_ids: Option<Vec<String>>,
    pub verification: Option<database::enums::Verification>,
    pub file: Option<String>,
    pub sql: Option<String>,
    pub update_version: Option<bool>,
    
    // New field for version restoration
    pub restore_to_version: Option<i32>,
}
```

### Implementation Details

The update handler will need to be modified as follows:

```rust
pub async fn update_metric_handler(
    metric_id: &Uuid,
    user: &AuthenticatedUser,
    request: UpdateMetricRequest,
) -> Result<BusterMetric> {
    // ... existing code ...

    // Check if metric exists and user has access
    let metric = get_metric_handler(metric_id, user, None).await?;
    
    // Get version history
    let mut current_version_history: VersionHistory = metric_files::table
        .filter(metric_files::id.eq(metric_id))
        .select(metric_files::version_history)
        .first::<VersionHistory>(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to get version history: {}", e))?;
    
    // Version restoration logic
    let content = if let Some(version_number) = request.restore_to_version {
        // Fetch the requested version
        let version = current_version_history
            .get_version(version_number)
            .ok_or_else(|| anyhow!("Version {} not found", version_number))?;
        
        // Parse the YAML content from the version
        serde_yaml::from_str::<MetricYml>(&serde_yaml::to_string(&version.content)?)
            .map_err(|e| anyhow!("Failed to parse restored version content: {}", e))?
    } else if let Some(file_content) = request.file {
        // Existing file content logic
        // ...
    } else {
        // Existing field-by-field update logic
        // ...
    };

    // Calculate the next version number
    let next_version = metric.versions.len() as i32 + 1;

    // Only add a new version if update_version is true (defaults to true)
    let should_update_version = request.update_version.unwrap_or(true);

    // Add the new version to the version history
    if should_update_version {
        current_version_history.add_version(next_version, content.clone());
    } else {
        // Overwrite the current version instead of creating a new one
        current_version_history.update_latest_version(content.clone());
    }

    // ... rest of existing code to update the metric in the database ...
}
```

## Testing

### Unit Tests

The following unit tests should be implemented to ensure the metric version restoration functionality works correctly:

#### Basic Functionality Tests
1. **Test Successful Restoration**: Verify that a specific version can be restored successfully
   - Create a metric with multiple versions
   - Restore an earlier version
   - Verify a new version is created with content matching the restored version
   - Verify the version number is incremented appropriately

2. **Test Restoration Priority**: Verify that when `restore_to_version` is provided, all other update parameters are ignored
   - Create a request with both `restore_to_version` and other fields like `name` and `description`
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

7. **Test With Empty Version History**: Verify behavior for metrics with no version history
   - Create a metric with minimal version history
   - Attempt restoration
   - Verify appropriate error handling

8. **Test With update_version Flag**: Test interaction between `restore_to_version` and `update_version`
   - When `update_version` is false, verify the restored content replaces the current version
   - When `update_version` is true (default), verify a new version is created

9. **Test Content Integrity**: Verify all content fields are properly restored
   - Create a complex metric with various fields set
   - Modify the metric significantly
   - Restore the original version
   - Verify all fields match the original version (name, description, chart_config, time_frame, etc.)

### Integration Tests

The following integration tests should verify end-to-end functionality:

1. **Full Restoration Flow**: Test the complete metric restoration process
   - Create a metric through the API
   - Update it multiple times to create versions
   - Send a restoration request through the API
   - Verify the response contains the correctly restored content
   - Fetch the metric again to confirm persistence

2. **Authorization Flow**: Test authorization rules throughout the complete process
   - Create a metric owned by user A
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

### Example Unit Test Code

```rust
#[tokio::test]
async fn test_restore_metric_version() {
    // Set up test environment
    let pool = setup_test_db().await;
    let user = create_test_user().await;
    
    // Create a metric with initial content
    let initial_content = MetricYml {
        name: "Original Metric".to_string(),
        description: Some("Original description".to_string()),
        time_frame: "last_7_days".to_string(),
        // Other fields...
    };
    
    let metric_id = create_test_metric(&user, initial_content.clone()).await;
    
    // Update the metric to create version 2
    let updated_content = MetricYml {
        name: "Updated Metric".to_string(),
        description: Some("Updated description".to_string()),
        time_frame: "last_30_days".to_string(),
        // Other fields...
    };
    
    update_test_metric(&metric_id, &user, updated_content).await;
    
    // Restore to version 1
    let restore_request = UpdateMetricRequest {
        restore_to_version: Some(1),
        ..Default::default()
    };
    
    let result = update_metric_handler(&metric_id, &user, restore_request).await;
    
    // Assertions
    assert!(result.is_ok());
    
    let restored_metric = result.unwrap();
    
    // Verify a new version was created (should be version 3)
    assert_eq!(restored_metric.version, 3);
    
    // Verify the content matches the original version
    let restored_content = serde_yaml::from_str::<MetricYml>(&restored_metric.file).unwrap();
    assert_eq!(restored_content.name, initial_content.name);
    assert_eq!(restored_content.description, initial_content.description);
    assert_eq!(restored_content.time_frame, initial_content.time_frame);
    // Verify other fields...
}
```

### Example Integration Test Code

```rust
#[tokio::test]
async fn test_metric_restore_integration() {
    // Set up test server with routes
    let app = create_test_app().await;
    let client = TestClient::new(app);
    
    // Create a test user and authenticate
    let (user, token) = create_and_login_test_user().await;
    
    // Create a metric
    let create_response = client
        .post("/metrics")
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "name": "Test Metric",
            "description": "Initial description",
            "time_frame": "last_7_days",
            // Other required fields...
        }))
        .send()
        .await;
    
    assert_eq!(create_response.status(), StatusCode::OK);
    let metric: BusterMetric = create_response.json().await;
    
    // Update the metric to create version 2
    let update_response = client
        .put(&format!("/metrics/{}", metric.id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "name": "Updated Metric",
            "description": "Updated description",
            "time_frame": "last_30_days",
        }))
        .send()
        .await;
    
    assert_eq!(update_response.status(), StatusCode::OK);
    
    // Restore to version 1
    let restore_response = client
        .put(&format!("/metrics/{}", metric.id))
        .header("Authorization", format!("Bearer {}", token))
        .json(&json!({
            "restore_to_version": 1
        }))
        .send()
        .await;
    
    assert_eq!(restore_response.status(), StatusCode::OK);
    let restored_metric: BusterMetric = restore_response.json().await;
    
    // Verify the metric was restored properly
    assert_eq!(restored_metric.name, "Test Metric");
    assert_eq!(restored_metric.version, 3);
    
    // Verify by fetching the metric again
    let get_response = client
        .get(&format!("/metrics/{}", metric.id))
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await;
    
    assert_eq!(get_response.status(), StatusCode::OK);
    let fetched_metric: BusterMetric = get_response.json().await;
    
    // Verify the fetched metric matches the restored version
    assert_eq!(fetched_metric.name, "Test Metric");
    assert_eq!(fetched_metric.version, 3);
}

## Security Considerations

- The existing permission checks in `update_metric_handler` should be maintained
- Only users with `CanEdit`, `FullAccess`, or `Owner` permissions should be able to restore versions
- Ensure the audit trail captures version restoration actions
