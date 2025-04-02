#[cfg(test)]
mod tests {
    use axum::{
        http::{Request, StatusCode},
        routing::put,
        Router,
    };
    use axum_test::{TestServer, TestServerConfig};
    use serde_json::json;
    use uuid::Uuid;

    use database::enums::UserOrganizationRole;
    use middleware::{AuthenticatedUser, OrganizationMembership};
    use crate::routes::rest::routes::organizations::update_organization::update_organization;

    #[tokio::test]
    async fn test_update_organization_success() {
        // Skip this test in CI because it requires database access
        if std::env::var("CI").is_ok() {
            return;
        }

        // Setup mock user with WorkspaceAdmin role
        let org_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let user = AuthenticatedUser {
            id: user_id,
            email: "test@example.com".to_string(),
            name: Some("Test User".to_string()),
            config: json!({}),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            attributes: json!({}),
            avatar_url: None,
            organizations: vec![OrganizationMembership {
                id: org_id,
                role: UserOrganizationRole::WorkspaceAdmin,
            }],
            teams: vec![],
        };

        // Create router with the update_organization endpoint
        let app = Router::new()
            .route("/:id", put(update_organization))
            .layer(axum::middleware::map_extension(move |_: ()| user.clone()));

        // Create test server
        let config = TestServerConfig::builder()
            .default_content_type("application/json")
            .build();
        let server = TestServer::new_with_config(app, config).unwrap();

        // Make request to update organization name
        let response = server
            .put(&format!("/{}", org_id))
            .json(&json!({
                "name": "Updated Organization Name"
            }))
            .await;

        // Assertions
        assert_eq!(response.status_code(), StatusCode::OK);
        
        // Verify response contains updated name 
        let response_json = response.json::<serde_json::Value>();
        assert_eq!(response_json["data"]["name"], "Updated Organization Name");
        assert_eq!(response_json["data"]["id"], org_id.to_string());
    }

    #[tokio::test]
    async fn test_update_organization_not_admin() {
        // Skip this test in CI because it requires database access
        if std::env::var("CI").is_ok() {
            return;
        }

        // Setup mock user with non-admin role
        let org_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let user = AuthenticatedUser {
            id: user_id,
            email: "test@example.com".to_string(),
            name: Some("Test User".to_string()),
            config: json!({}),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            attributes: json!({}),
            avatar_url: None,
            organizations: vec![OrganizationMembership {
                id: org_id,
                role: UserOrganizationRole::Viewer, // Non-admin role
            }],
            teams: vec![],
        };

        // Create router with the update_organization endpoint
        let app = Router::new()
            .route("/:id", put(update_organization))
            .layer(axum::middleware::map_extension(move |_: ()| user.clone()));

        // Create test server
        let config = TestServerConfig::builder()
            .default_content_type("application/json")
            .build();
        let server = TestServer::new_with_config(app, config).unwrap();

        // Make request to update organization name
        let response = server
            .put(&format!("/{}", org_id))
            .json(&json!({
                "name": "Updated Organization Name"
            }))
            .await;

        // Assert forbidden status
        assert_eq!(response.status_code(), StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn test_update_organization_no_fields() {
        // Skip this test in CI because it requires database access
        if std::env::var("CI").is_ok() {
            return;
        }

        // Setup mock user
        let org_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();
        let user = AuthenticatedUser {
            id: user_id,
            email: "test@example.com".to_string(),
            name: Some("Test User".to_string()),
            config: json!({}),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            attributes: json!({}),
            avatar_url: None,
            organizations: vec![OrganizationMembership {
                id: org_id,
                role: UserOrganizationRole::WorkspaceAdmin,
            }],
            teams: vec![],
        };

        // Create router with the update_organization endpoint
        let app = Router::new()
            .route("/:id", put(update_organization))
            .layer(axum::middleware::map_extension(move |_: ()| user.clone()));

        // Create test server
        let config = TestServerConfig::builder()
            .default_content_type("application/json")
            .build();
        let server = TestServer::new_with_config(app, config).unwrap();

        // Make request with empty payload
        let response = server
            .put(&format!("/{}", org_id))
            .json(&json!({}))
            .await;

        // Assert bad request status
        assert_eq!(response.status_code(), StatusCode::BAD_REQUEST);
    }
}