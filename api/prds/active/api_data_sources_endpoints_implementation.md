# Data Source Endpoints Implementation PRD

## 1. Overview and Business Context

### 1.1 Problem Statement
The application currently has incomplete REST API endpoints for managing data sources. While GET, LIST, and UPDATE operations are implemented, we need to create POST (create) and DELETE operations, and ensure all endpoints follow the established best practices. These endpoints are critical for users to manage their data connections within the application.

### 1.2 Background
Data sources are a foundational entity in our application, representing connections to various databases (PostgreSQL, MySQL, BigQuery, etc.). Each data source is associated with credentials that are securely stored in a vault. The current implementation doesn't fully support the complete lifecycle management of data sources.

### 1.3 Business Goals
- Enable users to create, update, retrieve, and delete data sources through consistent REST endpoints
- Ensure proper security and isolation between organizations
- Maintain credential security by properly managing vault secrets
- Follow established architectural patterns for consistency with other REST endpoints

## 2. Technical Requirements

### 2.1 Data Source Entity Structure
```rust
pub struct DataSource {
    pub id: Uuid,
    pub name: String,
    pub type_: DataSourceType,
    pub secret_id: Uuid,
    pub onboarding_status: DataSourceOnboardingStatus,
    pub onboarding_error: Option<String>,
    pub organization_id: Uuid,
    pub created_by: Uuid,
    pub updated_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
    pub env: String,
}
```

### 2.2 Credential Types
The application supports multiple types of credentials, all stored as an enum:
```rust
pub enum Credential {
    Postgres(PostgresCredentials),
    MySql(MySqlCredentials),
    Bigquery(BigqueryCredentials),
    SqlServer(SqlServerCredentials),
    Redshift(RedshiftCredentials),
    Databricks(DatabricksCredentials),
    Snowflake(SnowflakeCredentials),
}
```

Each credential type has its own structure with specific fields appropriate for that database type.

### 2.3 Vault Integration
The data source credentials are stored in a secure vault with the following operations:
- `create_secret(data_source_id: &Uuid, secret_value: &String) -> Result<()>`
- `read_secret(secret_id: &Uuid) -> Result<String>`
- `update_secret(secret_id: &Uuid, secret_value: &String) -> Result<()>`
- `delete_secret(secret_id: &Uuid) -> Result<()>`

## 3. Endpoint Specifications

### 3.1 POST /data_sources
#### Purpose
Create a new data source with its associated credentials.

#### Request
```json
{
  "name": "Production PostgreSQL",
  "env": "production",
  "type": "postgres",
  "host": "db.example.com",
  "port": 5432,
  "username": "db_user",
  "password": "db_password",
  "default_database": "main_db",
  "default_schema": "public",
  "jump_host": "jump.example.com",
  "ssh_username": "ssh_user",
  "ssh_private_key": "-----BEGIN RSA PRIVATE KEY-----..."
}
```

> Note: Fields after "type" vary based on the credential type.

#### Response
Status: 201 Created
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Production PostgreSQL",
  "db_type": "postgres",
  "created_at": "2025-03-24T00:00:00Z",
  "updated_at": "2025-03-24T00:00:00Z",
  "created_by": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "email": "user@example.com",
    "name": "Test User"
  },
  "credentials": {
    "host": "db.example.com",
    "port": 5432,
    "username": "db_user",
    "password": "[REDACTED]",
    "database": "main_db",
    "schemas": ["public"],
    "jump_host": "jump.example.com",
    "ssh_username": "ssh_user",
    "ssh_private_key": "[REDACTED]"
  },
  "data_sets": []
}
```

#### Implementation Details
1. Extract request parameters and validate them
2. Check if a data source with the same name, organization_id, and env already exists (enforce uniqueness)
3. Create the data source record in the database with status `NotStarted`
4. Store credentials in the vault using the data source's UUID as the secret ID (not a separate secret_id)
5. Return the newly created data source with credential information (with sensitive values redacted)

#### Error Handling
- 400 Bad Request: If required fields are missing or invalid
- 401 Unauthorized: If the user is not authenticated
- 403 Forbidden: If the user doesn't have permission to create data sources
- 409 Conflict: If a data source with the same name already exists in the organization
- 500 Internal Server Error: For any server-side errors

### 3.2 PUT /data_sources/:id
#### Purpose
Update an existing data source and/or its credentials.

#### Request
```json
{
  "name": "Updated PostgreSQL",
  "env": "staging",
  "host": "new-db.example.com",
  "port": 5433,
  "password": "new_password"
}
```

> Note: All fields are optional. Only provided fields will be updated.

#### Response
Status: 200 OK
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Updated PostgreSQL",
  "db_type": "postgres",
  "created_at": "2025-03-24T00:00:00Z",
  "updated_at": "2025-03-24T01:00:00Z",
  "created_by": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "email": "user@example.com",
    "name": "Test User"
  },
  "credentials": {
    "host": "new-db.example.com",
    "port": 5433,
    "username": "db_user",
    "password": "[REDACTED]",
    "database": "main_db",
    "schemas": ["public"],
    "jump_host": "jump.example.com",
    "ssh_username": "ssh_user",
    "ssh_private_key": "[REDACTED]"
  },
  "data_sets": []
}
```

#### Implementation Details
1. Extract parameters and data source ID
2. Verify the data source exists and belongs to the user's organization
3. Update database fields (name, env) if provided
4. If credential fields are provided, read the existing secret, merge it with the updates, and store it back
5. Update the updated_at and updated_by fields
6. Return the updated data source with credential information

#### Error Handling
- 400 Bad Request: If any fields are invalid
- 401 Unauthorized: If the user is not authenticated
- 403 Forbidden: If the user doesn't have permission to update this data source
- 404 Not Found: If the data source doesn't exist
- 500 Internal Server Error: For any server-side errors

### 3.3 DELETE /data_sources/:id
#### Purpose
Soft-delete a data source and delete its credentials from the vault.

#### Request
No request body, just the ID in the URL path.

#### Response
Status: 204 No Content

#### Implementation Details
1. Extract data source ID from the path
2. Verify the data source exists and belongs to the user's organization
3. Soft-delete the data source by setting the deleted_at timestamp
4. Delete the credentials from the vault using the data source ID
5. Return a 204 No Content response

#### Error Handling
- 401 Unauthorized: If the user is not authenticated
- 403 Forbidden: If the user doesn't have permission to delete this data source
- 404 Not Found: If the data source doesn't exist
- 500 Internal Server Error: For any server-side errors

### 3.4 GET /data_sources/:id
#### Purpose
Retrieve a specific data source by ID.

#### Request
No request body, just the ID in the URL path.

#### Response
Same as POST response (already implemented correctly).

### 3.5 GET /data_sources
#### Purpose
List all data sources for the user's organization.

#### Request
Query parameters:
- page: Optional page number (default: 0)
- page_size: Optional page size (default: 25)

#### Response
Status: 200 OK
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Production PostgreSQL",
    "type": "postgres",
    "updated_at": "2025-03-24T00:00:00Z"
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "name": "Analytics BigQuery",
    "type": "bigquery",
    "updated_at": "2025-03-23T00:00:00Z"
  }
]
```

## 4. Security Considerations

### 4.1 Authentication and Authorization
- All endpoints require a valid authentication token
- Users can only access data sources belonging to their organization
- For creating and updating data sources, the user must have an admin role in the organization
- Data source operations should be logged for audit purposes

### 4.2 Credential Security
- Sensitive credential fields (passwords, private keys) should be redacted in responses
- All credentials must be stored in the vault, not in the main database
- The vault uses encryption at rest for the credentials
- Credentials are never logged, even in error scenarios

### 4.3 Input Validation
- All input fields must be validated for correct types and reasonable limits
- SQL injection prevention through parameterized queries
- Credential validation based on data source type (ensure all required fields are present)

## 5. Implementation Plan

### 5.1 New Files to Create

#### 5.1.1 `/api/libs/handlers/src/data_sources/create_data_source_handler.rs`
```rust
use anyhow::{anyhow, Result};
use chrono::Utc;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::{
    enums::{DataSourceOnboardingStatus, DataSourceType, UserOrganizationRole},
    models::{DataSource, User, UserToOrganization},
    pool::get_pg_pool,
    schema::{data_sources, users, users_to_organizations},
    vault::create_secret,
};
use query_engine::credentials::Credential;

#[derive(Deserialize)]
pub struct CreateDataSourceRequest {
    pub name: String,
    pub env: String,
    #[serde(flatten)]
    pub credential: Credential,
}

#[derive(Serialize)]
pub struct CreateDataSourceResponse {
    pub id: String,
    pub name: String,
    pub db_type: String,
    pub created_at: String,
    pub updated_at: String,
    pub created_by: CreatedByResponse,
    pub credentials: Credential,
    pub data_sets: Vec<DatasetResponse>,
}

#[derive(Serialize)]
pub struct CreatedByResponse {
    pub id: String,
    pub email: String,
    pub name: String,
}

#[derive(Serialize)]
pub struct DatasetResponse {
    pub id: String,
    pub name: String,
}

pub async fn create_data_source_handler(
    user_id: &Uuid,
    request: CreateDataSourceRequest,
) -> Result<CreateDataSourceResponse> {
    let mut conn = get_pg_pool().get().await?;

    // Verify user has appropriate permissions (admin role)
    let user_org = users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .filter(
            users_to_organizations::role
                .eq(UserOrganizationRole::WorkspaceAdmin)
                .or(users_to_organizations::role.eq(UserOrganizationRole::DataAdmin)),
        )
        .first::<UserToOrganization>(&mut conn)
        .await
        .map_err(|_| anyhow!("User does not have appropriate permissions to create data sources"))?;

    // Check if data source with same name already exists in the organization
    let existing_data_source = data_sources::table
        .filter(data_sources::name.eq(&request.name))
        .filter(data_sources::organization_id.eq(user_org.organization_id))
        .filter(data_sources::env.eq(&request.env))
        .filter(data_sources::deleted_at.is_null())
        .first::<DataSource>(&mut conn)
        .await
        .ok();

    if existing_data_source.is_some() {
        return Err(anyhow!(
            "A data source with this name already exists in this organization and environment"
        ));
    }

    // Create new data source
    let data_source_id = Uuid::new_v4();
    let now = Utc::now();
    let data_source = DataSource {
        id: data_source_id,
        name: request.name.clone(),
        type_: request.credential.get_type(),
        secret_id: data_source_id, // Use same ID for data source and secret
        onboarding_status: DataSourceOnboardingStatus::NotStarted,
        onboarding_error: None,
        organization_id: user_org.organization_id,
        created_by: *user_id,
        updated_by: *user_id,
        created_at: now,
        updated_at: now,
        deleted_at: None,
        env: request.env.clone(),
    };

    // Insert the data source
    diesel::insert_into(data_sources::table)
        .values(&data_source)
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Error creating data source: {}", e))?;

    // Store credentials in vault
    let credential_json = serde_json::to_string(&request.credential)
        .map_err(|e| anyhow!("Error serializing credentials: {}", e))?;
    
    create_secret(&data_source_id, &credential_json)
        .await
        .map_err(|e| anyhow!("Error storing credentials in vault: {}", e))?;

    // Get creator information
    let creator = users::table
        .filter(users::id.eq(*user_id))
        .first::<User>(&mut conn)
        .await
        .map_err(|e| anyhow!("Error fetching user information: {}", e))?;

    // Build response
    let response = CreateDataSourceResponse {
        id: data_source.id.to_string(),
        name: data_source.name,
        db_type: data_source.type_.to_string(),
        created_at: data_source.created_at.to_rfc3339(),
        updated_at: data_source.updated_at.to_rfc3339(),
        created_by: CreatedByResponse {
            id: creator.id.to_string(),
            email: creator.email,
            name: creator.name.unwrap_or_default(),
        },
        credentials: request.credential,
        data_sets: Vec::new(), // Empty for new data sources
    };

    Ok(response)
}
```

#### 5.1.2 `/api/libs/handlers/src/data_sources/delete_data_source_handler.rs`
```rust
use anyhow::{anyhow, Result};
use chrono::Utc;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::{
    models::{DataSource, UserToOrganization},
    pool::get_pg_pool,
    schema::{data_sources, users_to_organizations},
    vault::delete_secret,
};

#[derive(Deserialize)]
pub struct DeleteDataSourceRequest {
    pub id: Uuid,
}

#[derive(Serialize)]
pub struct DeleteDataSourceResponse {
    pub success: bool,
}

pub async fn delete_data_source_handler(
    user_id: &Uuid,
    data_source_id: &Uuid,
) -> Result<DeleteDataSourceResponse> {
    let mut conn = get_pg_pool().get().await?;

    // Verify user has access to the organization
    let user_org = users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .first::<UserToOrganization>(&mut conn)
        .await
        .map_err(|_| anyhow!("User not found in any organization"))?;

    // Get the data source to verify it exists and belongs to the user's organization
    let data_source = data_sources::table
        .filter(data_sources::id.eq(data_source_id))
        .filter(data_sources::organization_id.eq(user_org.organization_id))
        .filter(data_sources::deleted_at.is_null())
        .first::<DataSource>(&mut conn)
        .await
        .map_err(|_| anyhow!("Data source not found or you don't have access to it"))?;

    // Soft delete the data source
    diesel::update(data_sources::table)
        .filter(data_sources::id.eq(data_source_id))
        .set(data_sources::deleted_at.eq(Some(Utc::now())))
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Error deleting data source: {}", e))?;

    // Delete credentials from vault
    delete_secret(data_source_id)
        .await
        .map_err(|e| anyhow!("Error deleting credentials from vault: {}", e))?;

    Ok(DeleteDataSourceResponse { success: true })
}
```

#### 5.1.3 `/api/src/routes/rest/routes/data_sources/create_data_source.rs`
```rust
use anyhow::Result;
use axum::{http::StatusCode, Extension, Json};
use middleware::AuthenticatedUser;

use crate::routes::rest::ApiResponse;
use handlers::data_sources::{create_data_source_handler, CreateDataSourceRequest, CreateDataSourceResponse};

pub async fn create_data_source(
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<CreateDataSourceRequest>,
) -> Result<ApiResponse<CreateDataSourceResponse>, (StatusCode, &'static str)> {
    match create_data_source_handler(&user.id, payload).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error creating data source: {:?}", e);
            let error_msg = e.to_string();
            
            if error_msg.contains("already exists") {
                return Err((StatusCode::CONFLICT, "Data source already exists"));
            } else if error_msg.contains("permissions") {
                return Err((StatusCode::FORBIDDEN, "Insufficient permissions"));
            } else {
                return Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to create data source"));
            }
        }
    }
}
```

#### 5.1.4 `/api/src/routes/rest/routes/data_sources/delete_data_source.rs`
```rust
use axum::{extract::Path, http::StatusCode, Extension};
use middleware::AuthenticatedUser;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;
use handlers::data_sources::delete_data_source_handler;

pub async fn delete_data_source(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    // Convert string id to UUID
    let uuid = match Uuid::parse_str(&id) {
        Ok(uuid) => uuid,
        Err(_) => {
            return Err((StatusCode::BAD_REQUEST, "Invalid UUID format"));
        }
    };

    match delete_data_source_handler(&user.id, &uuid).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error deleting data source: {:?}", e);
            let error_msg = e.to_string();
            
            if error_msg.contains("not found") {
                return Err((StatusCode::NOT_FOUND, "Data source not found"));
            } else if error_msg.contains("access") {
                return Err((StatusCode::FORBIDDEN, "Insufficient permissions"));
            } else {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Failed to delete data source",
                ));
            }
        }
    }
}
```

### 5.2 Files to Modify

#### 5.2.1 `/api/libs/handlers/src/data_sources/mod.rs`
Add the new handlers to the exports:
```rust
mod list_data_sources_handler;
mod get_data_source_handler;
mod update_data_source_handler;
mod create_data_source_handler;
mod delete_data_source_handler;

// Explicitly re-export the specific items from each module
pub use list_data_sources_handler::{list_data_sources_handler, ListDataSourcesRequest, DataSourceListItem};
pub use get_data_source_handler::{get_data_source_handler, GetDataSourceRequest, DataSourceResponse, CreatedByResponse, DatasetResponse};
pub use update_data_source_handler::{update_data_source_handler, UpdateDataSourceRequest, DataSourceResponse as UpdateDataSourceResponse, CreatedBy, Credentials};
pub use create_data_source_handler::{create_data_source_handler, CreateDataSourceRequest, CreateDataSourceResponse};
pub use delete_data_source_handler::{delete_data_source_handler, DeleteDataSourceRequest, DeleteDataSourceResponse};
```

#### 5.2.2 `/api/src/routes/rest/routes/data_sources/mod.rs`
Register the new route handlers:
```rust
mod post_data_sources;
mod list_data_sources;
mod get_data_source;
mod update_data_source;
mod create_data_source;
mod delete_data_source;

use axum::{
    routing::{get, post, put, delete},
    Router,
};

pub fn router() -> Router {
    Router::new()
        .route("/", post(create_data_source::create_data_source))
        .route("/", get(list_data_sources::list_data_sources))
        .route("/:id", get(get_data_source::get_data_source))
        .route("/:id", put(update_data_source::update_data_source))
        .route("/:id", delete(delete_data_source::delete_data_source))
}
```

## 6. Testing Plan

### 6.1 Unit Tests
- Test each handler function with mocked dependencies
- Test validation logic
- Test error handling for various scenarios

### 6.2 Integration Tests
Create integration tests in the `/api/tests/integration/data_sources/` directory:
- `create_data_source_test.rs`: Test creating data sources
- `delete_data_source_test.rs`: Test deleting data sources

### 6.3 Test Cases
1. Create a data source successfully
2. Try to create a duplicate data source (should fail)
3. Create a data source with invalid credentials (should fail)
4. Update a data source successfully
5. Update a data source with invalid data (should fail)
6. Delete a data source successfully
7. Try to delete a non-existent data source (should fail)
8. Try to access a deleted data source (should fail)

## 7. Performance and Scalability

### 7.1 Database Considerations
- Ensure proper indexing on data_sources table (name, organization_id, env)
- All operations should be optimized for minimal database round trips

### 7.2 Vault Considerations
- Vault operations should be isolated from main transaction to prevent locks
- Error handling for vault operations should be robust

## 8. Documentation

### 8.1 API Documentation
Update the API documentation to include the new endpoints:
- POST /data_sources
- DELETE /data_sources/:id

### 8.2 Code Documentation
Ensure all new code is well-documented with comments explaining:
- Purpose of each function
- Expected inputs and outputs
- Error handling strategy
- Important business logic

## 9. Success Criteria
- All endpoints implement the correct behavior
- Tests pass for all scenarios
- Error handling is robust and user-friendly
- Code follows established patterns in the codebase
- Documentation is complete and accurate

## 10. Future Considerations

### 10.1 Immediate Follow-up Tasks
- Add test connection functionality to validate credentials
- Implement proper data source onboarding status updates
- Support bulk operations in REST endpoints

### 10.2 Long-term Improvements
- Add support for additional data source types
- Implement data source templates
- Add support for connection pooling configuration

## 11. Ownership and Timeline
- Implementation Owner: Assigned developer
- Reviewer: Senior engineer
- Implementation Timeline: 1 week
- Testing Timeline: 2-3 days
- Deployment Timeline: 1 day