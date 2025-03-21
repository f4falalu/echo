# Update Message REST Endpoint PRD

## Overview
This PRD describes the implementation of a new REST endpoint for updating a message. This endpoint will allow users to update specific properties of a message, such as setting feedback on a message.

## Endpoint Details

### Basic Information
- **HTTP Method**: PUT
- **URL Path**: `/api/v1/messages/:id`
- **Purpose**: Update properties of a specific message

### Request Format
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
- **URL Parameters**:
  - `id`: UUID of the message to update
- **Request Body (JSON)**:
  - `feedback`: String (optional) - "positive" or "negative"

### Response Format
- **Success**:
  - Status: 200 OK
  - Body: Updated message object
- **Error Responses**:
  - 401 Unauthorized: If the user is not authenticated
  - 403 Forbidden: If the user does not have permission to update the message
  - 404 Not Found: If the message with the specified ID does not exist
  - 500 Internal Server Error: If there's a server error

### Example Request
```bash
curl --location --request PUT 'http://localhost:3001/api/v1/messages/cee3065d-c165-4e04-be44-be05d1e6d902' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMmRkNjRjZC1mN2YzLTQ4ODQtYmM5MS1kNDZhZTQzMTkwMWUiLCJuYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MjUxODU1NTMyNiwiYXVkIjoiYXV0aGVudGljYXRlZCJ9.uRs5OVyYErQ1iSQwAXVUD6TFolOu31ejPhcBS41ResA' \
--data '{
    "feedback": "negative"
}'
```

### Example Response
```json
{
  "id": "cee3065d-c165-4e04-be44-be05d1e6d902",
  "request_message": {
    "request": "Example message text",
    "sender_id": "c2dd64cd-f7f3-4884-bc91-d46ae431901e",
    "sender_name": "John Doe",
    "sender_avatar": null
  },
  "response_message_ids": ["..."],
  "response_messages": {},
  "reasoning_message_ids": ["..."],
  "reasoning_messages": {},
  "created_at": "2025-03-20T15:30:00Z",
  "final_reasoning_message": null,
  "feedback": "negative"
}
```

## Implementation Details

### New Files to Create

#### 1. Handler Implementation
- **File**: `/libs/handlers/src/messages/helpers/update_message_handler.rs`
- **Purpose**: Contains the business logic for updating a message

#### 2. REST Route Implementation
- **File**: `/src/routes/rest/routes/messages/update_message.rs`
- **Purpose**: Contains the HTTP handler for the REST endpoint

#### 3. Update Module Exports
- **File**: `/libs/handlers/src/messages/helpers/mod.rs` (update)
- **File**: `/src/routes/rest/routes/messages/mod.rs` (update)

### Implementation Steps

#### 1. Create the Handler Function
Create a new handler in `/libs/handlers/src/messages/helpers/update_message_handler.rs` that:
- Takes a user, message ID, and update parameters
- Verifies the user has permission to update the message
- Updates the message in the database
- Returns the updated message

#### 2. Create the REST Endpoint
Create a new file at `/src/routes/rest/routes/messages/update_message.rs` that:
- Creates a request struct to deserialize the request body
- Maps the HTTP request to the handler function
- Handles errors appropriately
- Returns the appropriate HTTP response

#### 3. Update Module Exports
Update the module exports to include the new handler and endpoint.

## Technical Details

### Database Updates
The update operation will modify records in the `messages` table.

### Expected Behavior
- Only the user who created the message or an admin should be able to update the message
- Updates should be atomic and consistent
- The endpoint should validate input data before updating the database

### Testing Strategy
1. Test updating a message with valid data as the message owner
2. Test updating a message with valid data as an admin
3. Test updating a message with invalid data
4. Test updating a non-existent message
5. Test updating a message without permission
6. Test concurrent updates to the same message

## Security Considerations
- Ensure proper authentication and authorization
- Validate input data to prevent injection attacks
- Ensure database queries are properly parameterized
