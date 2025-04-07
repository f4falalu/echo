# Database Test Infrastructure Guide

This directory contains the test infrastructure for the database library, providing standardized utilities for database testing, permission testing, and asset management.

## Overview

The test infrastructure is located in the `common/` directory and consists of:

1. **TestDb**: Central utility for database connections and cleanup
2. **PermissionTestHelpers**: Utilities for testing permissions
3. **AssetTestHelpers**: Utilities for creating and managing test assets
4. **AuthenticatedUser**: Test user representation for auth scenarios

## Using the Test Infrastructure

### Basic Usage

Here's a simple example of using the test infrastructure:

```rust
#[tokio::test]
async fn test_my_feature() -> Result<()> {
    // Create a test database environment
    let test_db = TestDb::new().await?;
    
    // Create a test metric
    let metric = AssetTestHelpers::create_test_metric(&test_db, "Test Metric").await?;
    
    // Add permission
    PermissionTestHelpers::create_user_permission(
        &test_db,
        metric.id,
        AssetType::MetricFile,
        test_db.user_id,
        AssetPermissionRole::Owner
    ).await?;
    
    // Test your functionality using the created test data
    
    // Clean up (optional - will be done automatically when test_db is dropped)
    test_db.cleanup().await?;
    
    Ok(())
}
```

### TestSetup

For more complex tests requiring an authenticated user and organization:

```rust
#[tokio::test]
async fn test_with_authenticated_user() -> Result<()> {
    // Create test setup with admin user
    let setup = TestSetup::new(Some(UserOrganizationRole::WorkspaceAdmin)).await?;
    
    // Use authenticated user in handler
    let result = some_handler(
        &setup.user,
        &setup.organization,
        // ... other params ...
    ).await?;
    
    // Test assertions
    assert!(result.is_ok());
    
    Ok(())
}
```

### Testing with Different User Roles

```rust
#[tokio::test]
async fn test_with_different_roles() -> Result<()> {
    // Test with viewer role
    let viewer_setup = TestSetup::new(Some(UserOrganizationRole::Viewer)).await?;
    
    // Test with editor role
    let editor_setup = TestSetup::new(Some(UserOrganizationRole::Querier)).await?;
    
    // Make assertions based on roles
    
    Ok(())
}
```

## Working with Assets and Permissions

### Creating Assets

```rust
// Create a test metric
let metric = AssetTestHelpers::create_test_metric(&test_db, "Test Metric").await?;

// Create a test dashboard
let dashboard = AssetTestHelpers::create_test_dashboard(&test_db, "Test Dashboard").await?;

// Create a test collection
let collection = AssetTestHelpers::create_test_collection(&test_db, "Test Collection").await?;

// Create a test chat
let chat = AssetTestHelpers::create_test_chat(&test_db, "Test Chat").await?;
```

### Creating Assets with Permissions

```rust
// Create a metric with owner permission
let metric = AssetTestHelpers::create_test_metric_with_permission(
    &test_db,
    "Test Metric with Permission",
    user_id,
    AssetPermissionRole::Owner
).await?;

// Create a dashboard with editor permission
let dashboard = AssetTestHelpers::create_test_dashboard_with_permission(
    &test_db,
    "Test Dashboard with Permission",
    user_id,
    AssetPermissionRole::CanEdit
).await?;
```

### Managing Permissions

```rust
// Create a permission
let permission = PermissionTestHelpers::create_user_permission(
    &test_db,
    asset_id,
    AssetType::MetricFile,
    user_id,
    AssetPermissionRole::Owner
).await?;

// Verify a permission
PermissionTestHelpers::verify_user_permission(
    &test_db,
    asset_id,
    user_id,
    AssetPermissionRole::Owner
).await?;

// Get all permissions for an asset
let permissions = PermissionTestHelpers::get_asset_permissions(
    &test_db,
    asset_id
).await?;

// Get all permissions for a user
let user_permissions = PermissionTestHelpers::get_user_permissions(
    &test_db,
    user_id
).await?;
```

## Best Practices

1. **Use unique test identifiers**: The TestDb creates a unique test_id for each test instance. Use this to prefix test asset names for easy identification and cleanup.

2. **Clean up after tests**: The TestDb.cleanup() method removes all test data created during the test. Call it explicitly at the end of your test or let it be called automatically when TestDb is dropped.

3. **Isolate tests**: Each test should create its own TestDb instance to ensure proper isolation between tests.

4. **Use descriptive names**: Provide descriptive names for test assets to make test debugging easier.

5. **Prefer combined helpers**: Use methods like create_test_metric_with_permission when you need both an asset and its permission.

## Additional Information

For more details on testing patterns and best practices, refer to the `documentation/testing.mdc` file in the project root.