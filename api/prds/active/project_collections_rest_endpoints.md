---
title: Collections REST Endpoints for Dashboards and Metrics
author: Cascade
date: 2025-03-19
status: Draft
---

# Collections REST Endpoints for Dashboards and Metrics

## Problem Statement

Currently, the application allows users to create collections and add assets to them, but there's no REST API to manage the association between collections and assets (specifically dashboards and metrics). This limits the ability to programmatically manage collections through the API.

We need to implement REST endpoints that allow users to add and remove dashboards and metrics from collections, ensuring proper permission checks and data integrity.

## Goals

1. Create REST endpoints to add dashboards and metrics to collections
2. Create REST endpoints to remove dashboards and metrics from collections
3. Ensure proper permission validation for all operations
4. Maintain data integrity with proper error handling
5. Follow established patterns for REST endpoints and handlers

## Non-Goals

1. Modifying the existing collections functionality
2. Creating new UI components for these endpoints
3. Changing the database schema

## Technical Design

### Overview

We will implement four new REST endpoints:
1. POST /collections/:id/dashboards - Add dashboards to a collection
2. DELETE /collections/:id/dashboards - Remove dashboards from a collection
3. POST /collections/:id/metrics - Add metrics to a collection
4. DELETE /collections/:id/metrics - Remove metrics from a collection

Each endpoint will validate permissions, check that the assets exist, and perform the appropriate database operations on the `collections_to_assets` table.

### Component Breakdown

The implementation will be divided into the following components:

#### Handlers
1. `add_dashboards_to_collection_handler.rs` - Business logic for adding dashboards to a collection
2. `remove_dashboards_from_collection_handler.rs` - Business logic for removing dashboards from a collection
3. `add_metrics_to_collection_handler.rs` - Business logic for adding metrics to a collection
4. `remove_metrics_from_collection_handler.rs` - Business logic for removing metrics from a collection

#### REST Routes
1. `add_dashboards_to_collection.rs` - REST endpoint for adding dashboards to a collection
2. `remove_dashboards_from_collection.rs` - REST endpoint for removing dashboards from a collection
3. `add_metrics_to_collection.rs` - REST endpoint for adding metrics to a collection
4. `remove_metrics_from_collection.rs` - REST endpoint for removing metrics from a collection

### Dependencies

1. `libs/sharing` - For permission checking
2. `libs/database` - For database operations
3. `libs/handlers` - For implementing business logic

## Implementation Plan

The implementation will be broken down into four separate PRDs, each focusing on a specific endpoint. These PRDs can be worked on concurrently by different developers:

1. [Add Dashboards to Collection REST Endpoint](api_add_dashboards_to_collection.md)
2. [Remove Dashboards from Collection REST Endpoint](api_remove_dashboards_from_collection.md)
3. [Add Metrics to Collection REST Endpoint](api_add_metrics_to_collection.md)
4. [Remove Metrics from Collection REST Endpoint](api_remove_metrics_from_collection.md) ✅

### Phase 1: Implementation of Individual Endpoints

Each endpoint will be implemented according to its respective PRD. These can be developed in parallel since they don't have dependencies on each other.

**Success Criteria:**
- All endpoints are implemented according to their PRDs
- All tests pass
- Code review is complete

### Phase 2: Integration and Testing ✅

After all endpoints are implemented, we'll perform integration testing to ensure they work together correctly.

**Success Criteria:**
- ✅ All endpoints can be called in sequence without errors
- ✅ Collections can be populated and modified using the new endpoints
- ✅ Permission checks work correctly

## Testing Strategy

Each PRD will include its own detailed testing strategy, but at a high level:

### Unit Tests
- Test handlers with mocked database connections
- Test permission validation logic
- Test error handling for various scenarios

### Integration Tests
- Test endpoints with a test database
- Verify correct database state after operations
- Test permission checks with different user roles

## Security Considerations

- All endpoints will require authentication
- Permission checks will ensure users can only modify collections they have access to
- Input validation will prevent malicious data

## Monitoring and Logging

- All operations will be logged with appropriate context
- Errors will be logged with detailed information
- Metrics will be collected for endpoint usage

## Rollout Plan

1. Deploy to staging environment
2. Perform manual testing
3. Deploy to production
4. Monitor for any issues

## Appendix

### Related PRDs
- [Add Dashboards to Collection REST Endpoint](api_add_dashboards_to_collection.md)
- [Remove Dashboards from Collection REST Endpoint](api_remove_dashboards_from_collection.md)
- [Add Metrics to Collection REST Endpoint](api_add_metrics_to_collection.md)
- [Remove Metrics from Collection REST Endpoint](api_remove_metrics_from_collection.md) ✅
