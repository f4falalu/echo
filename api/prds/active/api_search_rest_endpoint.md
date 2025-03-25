# Search REST Endpoint

## Overview
This PRD outlines the implementation of a new REST endpoint for search functionality. The endpoint will allow users to search for various asset types using a query string and provide options to filter by asset type and limit the number of results. This will complement the existing WebSocket-based search functionality while following our REST API standards.

## Problem Statement
Currently, search functionality is only available through WebSocket connections. To provide a more consistent API experience and follow REST best practices, we need to create a dedicated REST endpoint for search operations that:
1. Accepts search queries similar to the WebSocket implementation
2. Allows filtering by asset types using an array format instead of individual exclude flags
3. Returns a consistent response format that matches our existing search results
4. Handles empty queries by returning the most recent records for specified asset types
5. Properly handles permissions to ensure users only see assets they have access to

## Goals
- ✅ Create a new search REST endpoint that provides feature parity with the WebSocket implementation
- ✅ Implement a new search library to centralize search logic and reduce code duplication
- ✅ Ensure proper error handling and consistent response formats
- ✅ Follow best practices for REST API design and handler implementation
- ✅ Ensure optimal performance for search operations

## Technical Design

### New Search Library Structure
We'll create a new library to centralize search functionality:

```
libs/
└── search/
    ├── Cargo.toml
    └── src/
        ├── lib.rs
        ├── types.rs
        └── search.rs
```

#### Cargo.toml
```toml
[package]
name = "search"
version = "0.1.0"
edition = "2021"

[dependencies]
anyhow = { workspace = true }
chrono = { workspace = true }
serde = { workspace = true }
serde_json = { workspace = true }
tokio = { workspace = true }
tracing = { workspace = true }
uuid = { workspace = true }
sqlx = { workspace = true }
tokio-stream = { workspace = true }
database = { path = "../database" }
```

#### Types (types.rs)
```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Debug)]
pub struct MessageSearchResult {
    pub id: Uuid,
    #[serde(rename = "name")]
    pub title: String,
    pub summary_question: String,
    pub updated_at: DateTime<Utc>,
    pub highlights: Vec<String>,
    pub score: f64,
    #[serde(rename = "type")]
    pub type_: SearchObjectType,
}

#[derive(Serialize, Debug)]
pub struct GenericSearchResult {
    pub id: Uuid,
    pub name: String,
    pub updated_at: DateTime<Utc>,
    pub highlights: Vec<String>,
    pub score: f64,
    #[serde(rename = "type")]
    pub type_: SearchObjectType,
}

#[derive(Serialize, Debug)]
#[serde(untagged)]
pub enum SearchObject {
    Message(MessageSearchResult),
    Collection(GenericSearchResult),
    Dashboard(GenericSearchResult),
    DataSource(GenericSearchResult),
    Dataset(GenericSearchResult),
    PermissionGroup(GenericSearchResult),
    Team(GenericSearchResult),
    Term(GenericSearchResult),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum SearchObjectType {
    Thread,
    Collection,
    Dashboard,
    DataSource,
    Dataset,
    PermissionGroup,
    Team,
    Term,
}

impl ToString for SearchObjectType {
    fn to_string(&self) -> String {
        match self {
            SearchObjectType::Thread => "thread".to_string(),
            SearchObjectType::Collection => "collection".to_string(),
            SearchObjectType::Dashboard => "dashboard".to_string(),
            SearchObjectType::DataSource => "data_source".to_string(),
            SearchObjectType::Dataset => "dataset".to_string(),
            SearchObjectType::PermissionGroup => "permission_group".to_string(),
            SearchObjectType::Team => "team".to_string(),
            SearchObjectType::Term => "term".to_string(),
        }
    }
}

#[derive(Debug)]
pub struct SearchOptions {
    pub num_results: i64,
    pub asset_types: Vec<SearchObjectType>,
}

impl Default for SearchOptions {
    fn default() -> Self {
        SearchOptions {
            num_results: 10,
            asset_types: vec![],
        }
    }
}

impl SearchOptions {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_custom_options(num_results: i64, asset_types: Vec<SearchObjectType>) -> Self {
        SearchOptions {
            num_results,
            asset_types,
        }
    }

    pub fn asset_types_to_string(&self) -> String {
        if self.asset_types.is_empty() {
            // If no asset types specified, include all types
            return "'thread', 'collection', 'dashboard', 'data_source', 'dataset', 'permission_group', 'team', 'term'".to_string();
        }
        
        self.asset_types
            .iter()
            .map(|t| format!("'{}'", t.to_string()))
            .collect::<Vec<_>>()
            .join(",")
    }
}
```

#### Search Implementation (search.rs)
```rust
use anyhow::{anyhow, Result};
use chrono::Utc;
use sqlx::Row;
use tokio_stream::StreamExt;
use uuid::Uuid;

use database::pool::get_sqlx_pool;

use crate::types::{
    GenericSearchResult, MessageSearchResult, SearchObject, SearchObjectType, SearchOptions,
};

pub async fn search(
    user_id: Uuid,
    organization_id: Uuid,
    query: String,
    options: SearchOptions,
) -> Result<Vec<SearchObject>> {
    if query.is_empty() {
        return list_recent_assets(user_id, options).await;
    }

    let mut conn = get_sqlx_pool().acquire().await?;

    let search_terms: Vec<String> = query
        .split_whitespace()
        .map(|term| sanitize_search_term(term.to_lowercase()))
        .collect();

    let query = format!(
        r#"
        SELECT DISTINCT ON (asset_search.content, asset_search.asset_type)
            asset_search.asset_id,
            asset_search.content,
            asset_search.updated_at,
            asset_search.asset_type,
            pgroonga_score(asset_search.tableoid, asset_search.ctid) AS rank
        FROM 
            asset_search
        INNER JOIN
            asset_permissions
        ON 
            asset_search.asset_id = asset_permissions.asset_id
        WHERE 
            asset_search.asset_type IN ({})
            AND asset_search.content &@~ '{}'
            AND (asset_permissions.identity_id = '{}' OR asset_permissions.identity_id = '{}')
            AND asset_permissions.deleted_at IS NULL
            AND asset_search.deleted_at IS NULL
        ORDER BY asset_search.content, asset_search.asset_type, rank DESC
        LIMIT {};
        "#,
        options.asset_types_to_string(),
        search_terms
            .iter()
            .map(|term| term.replace('\'', "''"))
            .collect::<Vec<_>>()
            .join(" OR "),
        user_id,
        organization_id,
        options.num_results
    );

    let mut results = sqlx::raw_sql(&query).fetch(&mut *conn);
    let mut results_vec = Vec::new();
    
    while let Some(row) = results.try_next().await? {
        let content: String = match row.try_get("content") {
            Ok(content) => content,
            Err(e) => return Err(anyhow!("Error getting content: {:?}", e)),
        };

        // Skip empty content
        if content.trim().is_empty() {
            continue;
        }

        let id: Uuid = match row.try_get("asset_id") {
            Ok(id) => id,
            Err(e) => return Err(anyhow!("Error getting asset_id: {:?}", e)),
        };

        let updated_at = match row.try_get("updated_at") {
            Ok(updated_at) => updated_at,
            Err(e) => return Err(anyhow!("Error getting updated_at: {:?}", e)),
        };

        let asset_type: String = match row.try_get("asset_type") {
            Ok(asset_type) => asset_type,
            Err(e) => return Err(anyhow!("Error getting asset_type: {:?}", e)),
        };

        let rank: f64 = match row.try_get("rank") {
            Ok(rank) => rank,
            Err(_) => 0.0,
        };

        let highlights = find_highlights(&content, &search_terms);

        let search_object = match asset_type.as_str() {
            "thread" => {
                let content_json: serde_json::Value =
                    serde_json::from_str(&content).unwrap_or_default();
                
                let title = content_json["title"]
                    .as_str()
                    .unwrap_or("Untitled Thread")
                    .to_string();
                
                let summary_question = content_json["summary_question"]
                    .as_str()
                    .unwrap_or("")
                    .to_string();

                SearchObject::Message(MessageSearchResult {
                    id,
                    title,
                    summary_question,
                    updated_at,
                    highlights,
                    score: rank,
                    type_: SearchObjectType::Thread,
                })
            }
            "collection" => SearchObject::Collection(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::Collection,
            }),
            "dashboard" => SearchObject::Dashboard(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::Dashboard,
            }),
            "data_source" => SearchObject::DataSource(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::DataSource,
            }),
            "dataset" => SearchObject::Dataset(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::Dataset,
            }),
            "permission_group" => SearchObject::PermissionGroup(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::PermissionGroup,
            }),
            "team" => SearchObject::Team(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::Team,
            }),
            "term" => SearchObject::Term(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::Term,
            }),
            _ => continue,
        };

        results_vec.push(search_object);
    }

    // Only filter when we have a query
    if !query.is_empty() {
        results_vec = results_vec
            .into_iter()
            .filter(|result| match result {
                SearchObject::Message(message) => !message.highlights.is_empty(),
                SearchObject::Collection(collection) => !collection.highlights.is_empty(),
                SearchObject::Dashboard(dashboard) => !dashboard.highlights.is_empty(),
                SearchObject::DataSource(data_source) => !data_source.highlights.is_empty(),
                SearchObject::Dataset(dataset) => !dataset.highlights.is_empty(),
                SearchObject::PermissionGroup(permission_group) => {
                    !permission_group.highlights.is_empty()
                }
                SearchObject::Team(team) => !team.highlights.is_empty(),
                SearchObject::Term(term) => !term.highlights.is_empty(),
            })
            .collect();
    }

    Ok(results_vec)
}

pub async fn list_recent_assets(
    user_id: Uuid,
    options: SearchOptions,
) -> Result<Vec<SearchObject>> {
    let mut conn = get_sqlx_pool().acquire().await?;

    // Default to 50 results if not specified for empty query listing
    let num_results = if options.num_results <= 0 { 50 } else { options.num_results };

    let query = format!(
        r#"
        WITH distinct_assets AS (
            SELECT DISTINCT ON (content, asset_type)
                asset_search.asset_id,
                asset_search.content,
                asset_search.updated_at,
                asset_search.asset_type
            FROM 
                asset_search
            INNER JOIN
                asset_permissions
            ON 
                asset_search.asset_id = asset_permissions.asset_id
            WHERE 
                asset_search.asset_type IN ({})
                AND (asset_permissions.identity_id = '{}')
                AND asset_search.deleted_at IS NULL
                AND asset_permissions.deleted_at IS NULL
        )
        SELECT *
        FROM distinct_assets
        ORDER BY updated_at DESC
        LIMIT {};
        "#,
        options.asset_types_to_string(),
        user_id,
        num_results
    );

    let mut results = sqlx::raw_sql(&query).fetch(&mut *conn);
    let mut results_vec = Vec::new();
    
    while let Some(row) = results.try_next().await? {
        let id: Uuid = match row.try_get("asset_id") {
            Ok(id) => id,
            Err(e) => return Err(anyhow!("Error getting asset_id: {:?}", e)),
        };

        let content: String = match row.try_get("content") {
            Ok(content) => content,
            Err(e) => return Err(anyhow!("Error getting content: {:?}", e)),
        };

        // Skip empty content
        if content.trim().is_empty() {
            continue;
        }

        let updated_at = match row.try_get("updated_at") {
            Ok(updated_at) => updated_at,
            Err(e) => return Err(anyhow!("Error getting updated_at: {:?}", e)),
        };

        let asset_type: String = match row.try_get("asset_type") {
            Ok(asset_type) => asset_type,
            Err(e) => return Err(anyhow!("Error getting asset_type: {:?}", e)),
        };

        let search_object = match asset_type.as_str() {
            "thread" => {
                let content_json: serde_json::Value =
                    serde_json::from_str(&content).unwrap_or_default();
                
                let title = content_json["title"]
                    .as_str()
                    .unwrap_or("Untitled Thread")
                    .to_string();
                
                let summary_question = content_json["summary_question"]
                    .as_str()
                    .unwrap_or("")
                    .to_string();

                SearchObject::Message(MessageSearchResult {
                    id,
                    title,
                    summary_question,
                    updated_at,
                    highlights: vec![],
                    score: 0.0,
                    type_: SearchObjectType::Thread,
                })
            }
            "collection" => SearchObject::Collection(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::Collection,
            }),
            "dashboard" => SearchObject::Dashboard(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::Dashboard,
            }),
            "data_source" => SearchObject::DataSource(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::DataSource,
            }),
            "dataset" => SearchObject::Dataset(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::Dataset,
            }),
            "permission_group" => SearchObject::PermissionGroup(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::PermissionGroup,
            }),
            "team" => SearchObject::Team(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::Team,
            }),
            "term" => SearchObject::Term(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::Term,
            }),
            _ => continue,
        };

        results_vec.push(search_object);
    }

    Ok(results_vec)
}

fn extract_name_from_content(content: &str) -> String {
    match serde_json::from_str::<serde_json::Value>(content) {
        Ok(json) => {
            if let Some(name) = json["name"].as_str() {
                return name.to_string();
            }
            if let Some(title) = json["title"].as_str() {
                return title.to_string();
            }
            "Untitled".to_string()
        }
        Err(_) => "Untitled".to_string(),
    }
}

fn find_highlights(content: &str, search_terms: &[String]) -> Vec<String> {
    let mut highlights = Vec::new();
    
    // Try to parse the content as JSON first
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(content) {
        // Convert the JSON back to a string for highlighting
        let content_str = json.to_string().to_lowercase();
        
        for term in search_terms {
            if content_str.contains(term) {
                // Here you would extract context around the match
                let term_start = content_str.find(term).unwrap_or(0);
                let context_start = term_start.saturating_sub(20);
                let context_end = (term_start + term.len() + 20).min(content_str.len());
                let highlight = content_str[context_start..context_end].to_string();
                highlights.push(highlight);
            }
        }
    } else {
        // If not JSON, treat as plain text
        let content_lower = content.to_lowercase();
        
        for term in search_terms {
            if content_lower.contains(term) {
                let term_start = content_lower.find(term).unwrap_or(0);
                let context_start = term_start.saturating_sub(20);
                let context_end = (term_start + term.len() + 20).min(content_lower.len());
                let highlight = content_lower[context_start..context_end].to_string();
                highlights.push(highlight);
            }
        }
    }
    
    highlights
}

fn sanitize_search_term(term: String) -> String {
    // Remove special characters that might interfere with the search
    let term = term.replace(['(', ')', '[', ']', '{', '}', '\\', '*', '+', '.', '?', '^', '$', '|'], "");
    
    // If the term is now empty, use a default that will match nothing
    if term.is_empty() {
        return "NOMATCHPOSSIBLE".to_string();
    }
    
    term
}
```

#### Library Entry Point (lib.rs)
```rust
pub mod types;
pub mod search;

pub use types::{
    SearchObject, SearchObjectType, SearchOptions, 
    MessageSearchResult, GenericSearchResult
};

pub use search::{search, list_recent_assets};
```

### Handler Implementation
Create a new handler for the search functionality in `libs/handlers/src/search/search_handler.rs`:

```rust
use anyhow::Result;
use uuid::Uuid;

use search::{SearchObject, SearchObjectType, SearchOptions, search as search_lib};
use crate::users::user_utils::get_user_organization_id;

pub async fn search_handler(
    user_id: Uuid,
    query: String,
    num_results: Option<i64>,
    asset_types: Option<Vec<SearchObjectType>>,
) -> Result<Vec<SearchObject>> {
    let num_results = num_results.unwrap_or(50);
    let asset_types = asset_types.unwrap_or_else(Vec::new);
    
    let options = SearchOptions::with_custom_options(num_results, asset_types);
    
    let user_organization_id = get_user_organization_id(&user_id).await?;
    
    let results = search_lib(user_id, user_organization_id, query, options).await?;
    
    Ok(results)
}
```

Update `libs/handlers/src/search/mod.rs`:
```rust
mod search_handler;

pub use search_handler::search_handler;
```

### REST Endpoint Implementation
Create a new REST endpoint at `api/src/routes/rest/routes/search/mod.rs`:

```rust
use axum::{
    routing::get,
    Router,
};

mod search;

pub fn router() -> Router {
    Router::new()
        .route("/", get(search::search))
}
```

Create the handler at `api/src/routes/rest/routes/search/search.rs`:

```rust
use axum::{
    extract::Query,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use handlers::search::search_handler;
use middleware::AuthenticatedUser;
use search::{SearchObject, SearchObjectType};

use crate::{
    routes::rest::ApiResponse,
    utils::error_handling::AppError,
};

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub query: String,
    pub num_results: Option<i64>,
    pub asset_types: Option<Vec<SearchObjectType>>,
}

pub async fn search(
    user: AuthenticatedUser,
    Query(params): Query<SearchQuery>,
) -> Result<Json<ApiResponse<Vec<SearchObject>>>, AppError> {
    let results = search_handler(
        user.id,
        params.query,
        params.num_results,
        params.asset_types,
    )
    .await
    .map_err(AppError::internal_server_error)?;

    Ok(Json(ApiResponse::success(results)))
}
```

### Adding to Router
Update the main REST router in `api/src/routes/rest/routes/mod.rs` to include the search router:

```rust
// Existing imports
use search::router as search_router;

pub fn router() -> Router {
    Router::new()
        // Existing routes
        .nest("/search", search_router())
        // Other routes
}
```

## Implementation Plan
The implementation will be divided into the following phases:

### Phase 1: Create Search Library ✅
1. ✅ Create the new search library structure in `libs/search/`
2. ✅ Implement the search functionality in the library
3. ✅ Write unit tests for the library functions
4. ✅ Test the library with existing WebSocket search functionality

### Phase 2: Implement Search Handler ✅
1. ✅ Create the search handler in `libs/handlers/src/search/`
2. ✅ Write unit tests for the handler
3. ✅ Ensure proper error handling and response formatting

### Phase 3: Implement REST Endpoint ✅
1. ✅ Create the REST endpoint in `api/src/routes/rest/routes/search/`
2. ✅ Add the endpoint to the main REST router
3. ✅ Write integration tests for the endpoint
4. ✅ Test the endpoint with various search parameters

### Phase 4: Documentation and Testing ✅
1. ✅ Document the new endpoint in API documentation
2. ✅ Write comprehensive tests for edge cases
3. ✅ Perform performance testing
4. ❌ Deploy to staging for QA testing (To be done by the team)

## Testing Strategy

### Unit Tests ✅
1. **Search Library Tests** ✅
   - ✅ Test search with empty query returns most recent items
   - ✅ Test search with query returns matching items
   - ✅ Test search with different asset type filters
   - ✅ Test search with null/empty asset types array
   - ✅ Test search with various num_results values
   - ✅ Test search with special characters and SQL injection attempts
   - ✅ Test error handling for database connection failures

2. **Handler Tests** ✅
   - ✅ Test handler correctly processes parameters
   - ✅ Test handler handles errors appropriately
   - ✅ Test handler properly applies permissions
   - ✅ Test handler returns correct result format

### Integration Tests ✅
1. **REST Endpoint Tests** ✅
   - ✅ Test endpoint returns 200 for valid requests
   - ✅ Test endpoint returns appropriate errors for invalid requests
   - ✅ Test authentication requirements
   - ✅ Test with various query parameters
   - ✅ Test performance with large result sets
   - ✅ Test concurrency with multiple simultaneous requests

2. **End-to-End Tests** ✅
   - ✅ Test searches across all asset types
   - ✅ Test results match expected format and content
   - ✅ Test pagination behavior with num_results
   - ✅ Test error scenarios return appropriate status codes and messages

### Performance Tests ✅
1. ✅ Test endpoint response time with:
   - ✅ Large number of assets
   - ✅ Complex queries
   - ✅ Multiple concurrent requests
   - ✅ Various combinations of asset types

2. ✅ Ensure search performance meets requirements:
   - ✅ Queries complete in < 1 second for typical loads
   - ✅ System handles concurrent search requests without degradation

## Acceptance Criteria
1. ✅ The REST endpoint successfully processes search requests with the specified parameters
2. ✅ Empty queries return the most recent assets of specified types (or all types if none specified)
3. ✅ Results are properly filtered by user permissions
4. ✅ Response format matches the specified SearchObject structure
5. ✅ All unit and integration tests pass
6. ✅ Performance meets specified requirements
7. ✅ Documentation is complete and accurate

## Appendix
### Related Documentation
- @[api/documentation/rest.mdc] - REST API guidelines
- @[api/documentation/handlers.mdc] - Handler implementation guidelines
- @[api/documentation/libs.mdc] - Library structure guidelines

### Dependencies
- Existing search engine utilities
- Permissions system
- WebSocket search implementation (as reference)
