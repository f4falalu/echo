---
title: Add Dashboards to Collection REST Endpoint
author: Cascade
date: 2025-03-19
status: Implemented
---

# Add Dashboards to Collection REST Endpoint

## Problem Statement

Users need the ability to programmatically add dashboards to collections via a REST API. Currently, this functionality is not available, limiting the ability to manage collections through the API.

## Goals

1. ✅ Create a REST endpoint to add dashboards to a collection
2. ✅ Implement proper permission validation
3. ✅ Ensure data integrity with proper error handling
4. ✅ Follow established patterns for REST endpoints and handlers

## Non-Goals

1. Modifying the existing collections functionality
2. Creating UI components for this endpoint

## Technical Design

### REST Endpoint

**Endpoint:** `POST /collections/:id/dashboards`

**Request Body:**
```json
{
  "dashboard_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
- `200 OK` - Success
  ```json
  {
    "message": "Dashboards added to collection successfully"
  }
  ```
- `400 Bad Request` - Invalid input
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Collection not found
- `500 Internal Server Error` - Server error

### Handler Implementation

The handler will:
1. ✅ Validate that the collection exists
2. ✅ Check if the user has appropriate permissions (Owner, FullAccess, or CanEdit)
3. ✅ Validate that the dashboards exist and the user has access to them
4. ✅ Add the dashboards to the collection by creating records in the `collections_to_assets` table
5. ✅ Handle the case where a dashboard was previously in the collection but was deleted (upsert)

### File Changes

#### New Files

1. ✅ `libs/handlers/src/collections/add_dashboards_to_collection_handler.rs`
2. ✅ `src/routes/rest/routes/collections/add_dashboards_to_collection.rs`
3. ✅ Update `libs/handlers/src/collections/mod.rs` to include the new handler
4. ✅ Update `src/routes/rest/routes/collections/mod.rs` to include the new endpoint

### Database Operations

The implementation uses the `collections_to_assets` table with the following operations:
1. ✅ SELECT to check if records exist
2. ✅ INSERT for new records
3. ✅ UPDATE for records that were previously deleted

## Testing Strategy

### Unit Tests

1. ✅ Test the handler with mocked database connections
   - ✅ Test adding dashboards to a collection
   - ✅ Test error cases (collection not found, dashboard not found, insufficient permissions)
   - ✅ Test adding dashboards that were previously in the collection but deleted

2. ✅ Test the REST endpoint
   - ✅ Test successful request
   - ✅ Test error responses for various scenarios

### Integration Tests

1. ✅ Test skeleton created for the endpoint with a test database

## Security Considerations

- ✅ The endpoint requires authentication
- ✅ Permission checks ensure users can only modify collections they have access to
- ✅ Input validation prevents malicious data

## Monitoring and Logging

- ✅ All operations are logged with appropriate context
- ✅ Errors are logged with detailed information

## Dependencies

- `libs/sharing` - For permission checking
- `libs/database` - For database operations

## Rollout Plan

1. ✅ Implement the handler and endpoint
2. ✅ Write tests
3. ✅ Code review
4. Deploy to staging
5. Test in staging
6. Deploy to production
7. Monitor for issues
