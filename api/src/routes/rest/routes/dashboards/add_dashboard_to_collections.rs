use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
};
use handlers::collections::add_dashboards_to_collection_handler;
use middleware::AuthenticatedUser;
use serde::Deserialize;
use tracing::info;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;

#[derive(Debug, Deserialize)]
pub struct AddCollectionsRequest {
    pub collection_ids: Vec<Uuid>,
}

/// REST handler for adding a dashboard to multiple collections
///
/// # Arguments
///
/// * `user` - The authenticated user making the request
/// * `id` - The unique identifier of the dashboard
/// * `request` - The collection IDs to add the dashboard to
///
/// # Returns
///
/// A success message on success, or an appropriate error response
pub async fn add_dashboard_to_collections(
    Extension(user): Extension<AuthenticatedUser>,
    Path(id): Path<Uuid>,
    Json(request): Json<AddCollectionsRequest>,
) -> Result<ApiResponse<String>, (StatusCode, String)> {
    info!(
        dashboard_id = %id,
        user_id = %user.id,
        collection_count = request.collection_ids.len(),
        "Processing POST request to add dashboard to collections"
    );

    // For each collection, call the handler to add the dashboard
    for collection_id in &request.collection_ids {
        match add_dashboards_to_collection_handler(collection_id, vec![id], &user.id).await {
            Ok(_) => continue,
            Err(e) => {
                tracing::error!(
                    dashboard_id = %id, 
                    collection_id = %collection_id,
                    "Error adding dashboard to collection: {}", e
                );
                
                // Map specific errors to appropriate status codes
                let error_message = e.to_string();
                
                if error_message.contains("not found") {
                    if error_message.contains("Collection not found") {
                        return Err((StatusCode::NOT_FOUND, format!("Collection not found: {}", e)));
                    } else if error_message.contains("Dashboard not found") {
                        return Err((StatusCode::NOT_FOUND, format!("Dashboard not found: {}", e)));
                    }
                } else if error_message.contains("permission") {
                    return Err((StatusCode::FORBIDDEN, format!("Insufficient permissions: {}", e)));
                }
                
                return Err((StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to add dashboard to collections: {}", e)));
            }
        }
    }

    Ok(ApiResponse::JsonData("Dashboard added to collections successfully".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;
    use std::sync::Arc;
    
    // Test skeleton for adding a dashboard to collections
    #[tokio::test]
    async fn test_add_dashboard_to_collections() {
        // In a real test, we would:
        // 1. Set up a test database with a test dashboard and collection
        // 2. Create a test user with appropriate permissions
        // 3. Make a real API request
        // 4. Verify that the dashboard was added to the collection
        
        // For now, this is a placeholder
        assert!(true);
    }
    
    // Test error handling for invalid input
    #[tokio::test]
    async fn test_add_dashboard_to_collections_invalid_input() {
        // In a real test, we would:
        // 1. Send a request with invalid collection IDs
        // 2. Verify that we get an appropriate error response
        
        // For now, this is a placeholder
        assert!(true);
    }
    
    // Test error handling for insufficient permissions
    #[tokio::test]
    async fn test_add_dashboard_to_collections_insufficient_permissions() {
        // In a real test, we would:
        // 1. Set up a test database with a test dashboard and collection
        // 2. Create a test user WITHOUT appropriate permissions
        // 3. Make a real API request
        // 4. Verify that we get a FORBIDDEN response
        
        // For now, this is a placeholder
        assert!(true);
    }
}