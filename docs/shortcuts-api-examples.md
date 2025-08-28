# Shortcuts API Examples

## Base URL
```
http://localhost:3000/api/v2/shortcuts
```

## Authentication
All endpoints require authentication. Include your auth token in the headers:
```json
{
  "Authorization": "Bearer YOUR_AUTH_TOKEN"
}
```

---

## 1. Create a Personal Shortcut

### Request
```http
POST /api/v2/shortcuts
Content-Type: application/json

{
  "name": "weekly-sales-report",
  "instructions": "Build me a report that pulls in cumulative YTD sales for this week, total deals closed this week, and top rep of this week. I want you to highlight interesting trends and anomalies.",
  "sharedWithWorkspace": false
}
```

### Response (201 Created)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "weekly-sales-report",
  "instructions": "Build me a report that pulls in cumulative YTD sales for this week, total deals closed this week, and top rep of this week. I want you to highlight interesting trends and anomalies.",
  "createdBy": "user-123",
  "updatedBy": "user-123",
  "organizationId": "org-456",
  "sharedWithWorkspace": false,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z",
  "deletedAt": null
}
```

---

## 2. Create a Workspace Shortcut

### Request
```http
POST /api/v2/shortcuts
Content-Type: application/json

{
  "name": "customer-analysis",
  "instructions": "Analyze customer data focusing on: 1) Customer acquisition trends, 2) Churn rate analysis, 3) Customer lifetime value, 4) Segment performance. Present findings with clear visualizations.",
  "sharedWithWorkspace": true
}
```

### Response (201 Created)
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "name": "customer-analysis",
  "instructions": "Analyze customer data focusing on: 1) Customer acquisition trends, 2) Churn rate analysis, 3) Customer lifetime value, 4) Segment performance. Present findings with clear visualizations.",
  "createdBy": "user-123",
  "updatedBy": "user-123",
  "organizationId": "org-456",
  "sharedWithWorkspace": true,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z",
  "deletedAt": null
}
```

---

## 3. List All Shortcuts (Personal + Workspace)

### Request
```http
GET /api/v2/shortcuts
```

### Response (200 OK)
```json
{
  "shortcuts": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "name": "customer-analysis",
      "instructions": "Analyze customer data focusing on: 1) Customer acquisition trends, 2) Churn rate analysis, 3) Customer lifetime value, 4) Segment performance. Present findings with clear visualizations.",
      "createdBy": "admin-user",
      "updatedBy": "admin-user",
      "organizationId": "org-456",
      "sharedWithWorkspace": true,
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T09:00:00.000Z",
      "deletedAt": null
    },
    {
      "id": "789e0123-e89b-12d3-a456-426614174002",
      "name": "daily-standup",
      "instructions": "Generate a summary of: Yesterday's completed tasks, today's priorities, and any blockers. Format as bullet points.",
      "createdBy": "user-123",
      "updatedBy": "user-123",
      "organizationId": "org-456",
      "sharedWithWorkspace": false,
      "createdAt": "2024-01-14T14:30:00.000Z",
      "updatedAt": "2024-01-14T14:30:00.000Z",
      "deletedAt": null
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "weekly-sales-report",
      "instructions": "Build me a report that pulls in cumulative YTD sales for this week, total deals closed this week, and top rep of this week. I want you to highlight interesting trends and anomalies.",
      "createdBy": "user-123",
      "updatedBy": "user-123",
      "organizationId": "org-456",
      "sharedWithWorkspace": false,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "deletedAt": null
    }
  ]
}
```

---

## 4. Get a Single Shortcut

### Request
```http
GET /api/v2/shortcuts/123e4567-e89b-12d3-a456-426614174000
```

### Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "weekly-sales-report",
  "instructions": "Build me a report that pulls in cumulative YTD sales for this week, total deals closed this week, and top rep of this week. I want you to highlight interesting trends and anomalies.",
  "createdBy": "user-123",
  "updatedBy": "user-123",
  "organizationId": "org-456",
  "sharedWithWorkspace": false,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z",
  "deletedAt": null
}
```

---

## 5. Update a Shortcut

### Request
```http
PUT /api/v2/shortcuts/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "name": "weekly-sales-summary",
  "instructions": "Build me a comprehensive sales report including: 1) YTD cumulative sales, 2) Weekly deals closed with breakdown by type, 3) Top 5 performers with their key metrics, 4) Week-over-week comparison. Include charts for visual representation."
}
```

### Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "weekly-sales-summary",
  "instructions": "Build me a comprehensive sales report including: 1) YTD cumulative sales, 2) Weekly deals closed with breakdown by type, 3) Top 5 performers with their key metrics, 4) Week-over-week comparison. Include charts for visual representation.",
  "createdBy": "user-123",
  "updatedBy": "user-123",
  "organizationId": "org-456",
  "sharedWithWorkspace": false,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z",
  "deletedAt": null
}
```

---

## 6. Update Only Name

### Request
```http
PUT /api/v2/shortcuts/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "name": "sales-weekly"
}
```

### Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "sales-weekly",
  "instructions": "Build me a comprehensive sales report including: 1) YTD cumulative sales, 2) Weekly deals closed with breakdown by type, 3) Top 5 performers with their key metrics, 4) Week-over-week comparison. Include charts for visual representation.",
  "createdBy": "user-123",
  "updatedBy": "user-123",
  "organizationId": "org-456",
  "sharedWithWorkspace": false,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T11:30:00.000Z",
  "deletedAt": null
}
```

---

## 7. Delete a Shortcut

### Request
```http
DELETE /api/v2/shortcuts/123e4567-e89b-12d3-a456-426614174000
```

### Response (200 OK)
```json
{
  "success": true
}
```

---

## Error Responses

### 409 Conflict - Duplicate Name
```json
{
  "error": {
    "message": "A shortcut named 'weekly-sales-report' already exists in your personal shortcuts"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "message": "Shortcut not found"
  }
}
```

### 403 Forbidden - Permission Denied
```json
{
  "error": {
    "message": "You can only update your own shortcuts"
  }
}
```

### 400 Bad Request - Validation Error
```json
{
  "error": {
    "issues": [
      {
        "code": "invalid_string",
        "message": "Name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens",
        "path": ["name"]
      }
    ]
  }
}
```

---

## Chat Integration Examples

### Using Shortcut with Pattern in Chat Message

```http
POST /api/v2/chats
Content-Type: application/json

{
  "prompt": "/weekly-sales-report for Q4 2024"
}
```

The system will:
1. Detect the `/weekly-sales-report` pattern
2. Look up the shortcut (personal first, then workspace)
3. Replace the message with: "Build me a report that pulls in cumulative YTD sales for this week, total deals closed this week, and top rep of this week. I want you to highlight interesting trends and anomalies. for Q4 2024"

### Using Shortcut with ID

```http
POST /api/v2/chats
Content-Type: application/json

{
  "prompt": "Focus on enterprise customers only",
  "shortcut_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

The system will prepend the shortcut instructions to the prompt.

---

## Validation Rules

### Name Requirements
- Must start with a lowercase letter
- Can only contain lowercase letters, numbers, and hyphens
- Cannot have consecutive hyphens (--)
- Minimum 1 character, maximum 255 characters
- Examples of valid names:
  - `weekly-report`
  - `sales-q3`
  - `customer-360-view`
  - `kpi-dashboard`
  
### Invalid Names (will be rejected)
- `Weekly-Report` (uppercase letters)
- `weekly_report` (underscores not allowed)
- `weekly--report` (consecutive hyphens)
- `123-report` (starts with number)
- `report!` (special characters)

### Instructions Requirements
- Minimum 1 character
- Maximum 10,000 characters
- Can contain any text, including newlines and special characters

---

## CURL Examples

### Create Shortcut
```bash
curl -X POST http://localhost:3000/api/v2/shortcuts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "market-analysis",
    "instructions": "Analyze market trends and competitor positioning",
    "sharedWithWorkspace": false
  }'
```

### List Shortcuts
```bash
curl http://localhost:3000/api/v2/shortcuts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Shortcut
```bash
curl -X PUT http://localhost:3000/api/v2/shortcuts/SHORTCUT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": "Updated analysis instructions with more detail"
  }'
```

### Delete Shortcut
```bash
curl -X DELETE http://localhost:3000/api/v2/shortcuts/SHORTCUT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```