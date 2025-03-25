---
title: Version Restoration Feature
author: Buster Engineering Team
date: 2025-03-25
status: Draft
---

# Version Restoration Feature

## Overview
This document outlines the implementation of a version restoration feature that allows users to recover previous versions of metrics, dashboards, and chats. The feature will enable users to easily restore earlier versions of their assets without losing the version history.

## Problem Statement
Currently, users can view the history of their metrics and dashboards but have no way to restore a previous version if they need to revert changes. This limitation forces users to manually recreate previous states of their assets, which is time-consuming and error-prone.

## Goals
- Allow users to restore previous versions of metrics and dashboards directly through the existing update endpoints
- Create a new dedicated endpoint for restoring chat-related assets with appropriate messaging
- Maintain version history integrity by creating new versions when restoring rather than overwriting current versions
- Provide a consistent user experience across all asset types

## Non-Goals
- This feature will not implement version comparison
- This feature will not modify the version history structure itself
- This feature will not add version annotations or labels

## Technical Design

### Overview
The version restoration feature will be implemented by modifying existing update handlers and creating a new chat restoration endpoint. When restoring a version, the system will:

1. Retrieve the requested historical version
2. Create a new version that is a copy of the historical version
3. For chat-related restorations, add appropriate messages to the chat history

### Affected Components

#### 1. Metric Update Handler Modification
Modify the `update_metric_handler.rs` to accept a new `restore_to_version` parameter in the request body. When this parameter is provided, the handler will ignore all other update parameters and instead:
- Fetch the specified version from version history
- Create a new version based on that historical version
- Update the metric content and version history accordingly

#### 2. Dashboard Update Handler Modification
Similar to the metric handler, modify the `update_dashboard_handler.rs` to accept a `restore_to_version` parameter and implement the same restoration logic.

#### 3. New Chat Restoration Endpoint
Create a new REST endpoint at `PUT /chats/{id}/restore` that:
- Accepts a request body with `asset_id`, `asset_type`, and `version_number`
- Restores the specified asset version (metric or dashboard)
- Adds appropriate messages to the chat history indicating the restoration

### API Changes

#### 1. Update Metric Request
```rust
#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct UpdateMetricRequest {
    // Existing fields...
    pub restore_to_version: Option<i32>,
}
```

#### 2. Update Dashboard Request
```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardUpdateRequest {
    // Existing fields...
    pub restore_to_version: Option<i32>,
}
```

#### 3. New Chat Restore Request
```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct ChatRestoreRequest {
    pub asset_id: Uuid,
    pub asset_type: AssetType,  // "metric" or "dashboard"
    pub version_number: i32,
}
```

### Database Changes
No schema changes are required. The feature will use the existing version history structure in the database.

## Implementation Plan

### Phase 1: Metric and Dashboard Update Handlers

#### Task 1.1: Update Metric Handler
- ✅ Modify `update_metric_handler.rs` to accept `restore_to_version` parameter
- ✅ Implement version restoration logic
- ⚠️ Add unit and integration tests for the new functionality (tests written but execution verification pending)

#### Task 1.2: Update Dashboard Handler ✅
- Modify `update_dashboard_handler.rs` to accept `restore_to_version` parameter ✅
- Implement version restoration logic ✅
- Add unit tests for the new functionality ✅

### Phase 2: Chat Restoration Endpoint ✅

#### Task 2.1: Create Chat Restore Handler ✅
- Create a new file `restore_chat_handler.rs` in the `api/libs/handlers/src/chats` directory ✅
- Implement the handler to process asset restoration and create appropriate chat messages ✅
- Add unit tests for the new handler ✅

#### Task 2.2: Add REST Endpoint ✅
- Create a new REST route in `api/src/routes/rest/routes/chats` directory ✅
- Implement the route to use the new handler ✅
- Add integration tests for the new endpoint ✅

### Development Order and Parallelization
- Tasks 1.1 and 1.2 can be implemented in parallel as they modify similar structures but different files
- Task 2.1 depends on the completion of both Task 1.1 and 1.2 as it will leverage their restoration logic
- Task 2.2 depends on Task 2.1

## Testing Strategy

### Unit Tests
- Test metric restoration with various version numbers
- Test dashboard restoration with various version numbers
- Test edge cases (e.g., restoring to a non-existent version)
- Test chat restoration with both metric and dashboard asset types
- Test message creation during chat restoration

### Integration Tests
- Test end-to-end restoration flow for metrics
- Test end-to-end restoration flow for dashboards
- Test end-to-end chat restoration flow

### Manual Testing
- Verify restored versions appear correctly in the UI
- Verify version history remains intact after restoration
- Verify chat messages accurately reflect restoration actions

### Comprehensive Testing Overview

The testing strategy for the version restoration feature will be comprehensive, covering all components with both unit tests and integration tests.

#### Permission Testing
- Verify that only authorized users can restore versions
- Test with various permission levels (Owner, FullAccess, CanEdit, ReadOnly, None)

#### Functionality Testing
- Test successful restoration of specific versions
- Test handling of non-existent versions
- Test edge cases (restoring the latest version, etc.)
- Verify that a new version is created when restoring

#### Data Integrity Testing
- Verify that all content is properly restored
- Ensure associated elements (dashboard metrics, chat messages) are properly handled

#### API Flow Testing
- Test the complete process from creating assets to restoring previous versions
- Verify that the correct content is restored and persisted

#### Authorization Flow
- Test access control throughout the restoration process
- Verify correct behavior for both authorized and unauthorized users

#### Error Handling
- Test system recovery from errors during restoration
- Verify appropriate error responses and state handling

#### Concurrent Operations
- Test behavior with concurrent update/restore operations
- Ensure data integrity is maintained

#### Frontend Testing
- Verify that version history is properly displayed
- Test that restoration controls work correctly
- Verify proper feedback to users during restoration

#### Test Organization
Tests will be organized by component to match the implementation phases:

1. **Metric Restoration Tests**
   - Unit tests for the update_metric_handler with restore_to_version
   - Integration tests for the metric restoration API

2. **Dashboard Restoration Tests**
   - Unit tests for the update_dashboard_handler with restore_to_version
   - Integration tests for the dashboard restoration API

3. **Chat Restoration Tests**
   - Unit tests for the restore_chat_handler
   - Integration tests for the chat restoration API and UI

## Security Considerations
- Ensure proper permission checks are in place for all restoration actions
- Maintain existing permission models for metrics and dashboards
- Verify that users can only restore versions of assets they have access to

## Rollout Plan
1. Deploy to staging environment for QA testing
2. Deploy to production with feature flag
3. Enable for internal users first
4. Monitor for any issues
5. Roll out to all users

## Future Enhancements
- Add version comparison feature
- Allow users to add notes when restoring versions
- Implement version labels or tagging

## Appendix

### Detailed Technical Implementation

#### Metric Update Handler
```rust
// If restore_to_version is provided, fetch that version and create a new version from it
if let Some(version_number) = request.restore_to_version {
    let version = current_version_history
        .get_version(version_number)
        .ok_or_else(|| anyhow!("Version {} not found", version_number))?;
    
    // Create a new version based on the restored version
    let next_version = metric.versions.len() as i32 + 1;
    current_version_history.add_version(next_version, version.content.clone());
    
    // Update the metric with the restored content
    // (rest of the implementation)
}
```

#### Dashboard Update Handler
```rust
// If restore_to_version is provided, fetch that version and create a new version from it
if let Some(version_number) = request.restore_to_version {
    let version = current_version_history
        .get_version(version_number)
        .ok_or_else(|| anyhow!("Version {} not found", version_number))?;
    
    // Create a new version based on the restored version
    let next_version = current_version_history
        .get_latest_version()
        .map(|v| v.version_number + 1)
        .unwrap_or(1);
    current_version_history.add_version(next_version, version.content.clone());
    
    // Update the dashboard with the restored content
    // (rest of the implementation)
}
```

#### Chat Restoration Handler
```rust
// Simplified pseudo-code for chat restoration
match request.asset_type {
    AssetType::Metric => {
        // Restore metric using logic from update_metric_handler
        let metric = update_metric_with_version(request.asset_id, request.version_number)?;
        
        // Create chat messages
        let text_message = format!("Version {} was created by restoring version {}", 
                                  metric.current_version, request.version_number);
        create_text_message(chat_id, text_message)?;
        
        create_file_message(chat_id, metric.id, AssetType::Metric, metric.current_version)?;
    },
    AssetType::Dashboard => {
        // Similar logic for dashboards
    },
    _ => return Err(anyhow!("Unsupported asset type for restoration")),
}
```
