use axum::http::StatusCode;
use diesel::sql_types;
use diesel_async::RunQueryDsl;
use serde_json::json;
use uuid::Uuid;

use crate::common::{
    assertions::response::ResponseAssertions,
    fixtures::builder::UserBuilder,
    http::test_app::TestApp,
};

// Mock DataSourceBuilder since we don't know the exact implementation
struct DataSourceBuilder {
    name: String,
    env: String,
    organization_id: Uuid,
    created_by: Uuid,
    db_type: String,
    credentials: serde_json::Value,
    id: Uuid,
}

impl DataSourceBuilder {
    fn new() -> Self {
        DataSourceBuilder {
            name: "Test Data Source".to_string(),
            env: "dev".to_string(),
            organization_id: Uuid::new_v4(),
            created_by: Uuid::new_v4(),
            db_type: "postgres".to_string(),
            credentials: json!({}),
            id: Uuid::new_v4(),
        }
    }

    fn with_name(mut self, name: &str) -> Self {
        self.name = name.to_string();
        self
    }

    fn with_env(mut self, env: &str) -> Self {
        self.env = env.to_string();
        self
    }

    fn with_organization_id(mut self, organization_id: Uuid) -> Self {
        self.organization_id = organization_id;
        self
    }

    fn with_created_by(mut self, created_by: Uuid) -> Self {
        self.created_by = created_by;
        self
    }

    fn with_type(mut self, db_type: &str) -> Self {
        self.db_type = db_type.to_string();
        self
    }

    fn with_credentials(mut self, credentials: serde_json::Value) -> Self {
        self.credentials = credentials;
        self
    }

    async fn build(self, pool: &diesel_async::pooled_connection::bb8::Pool<diesel_async::AsyncPgConnection>) -> DataSourceResponse {
        // Create data source directly in database using SQL
        let mut conn = pool.get().await.unwrap();
        
        // Insert the data source
        diesel::sql_query("INSERT INTO data_sources (id, name, type, secret_id, organization_id, created_by, updated_by, created_at, updated_at, onboarding_status, env) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), 'notStarted', $8)")
            .bind::<diesel::sql_types::Uuid, _>(&self.id)
            .bind::<diesel::sql_types::Text, _>(&self.name)
            .bind::<diesel::sql_types::Text, _>(&self.db_type)
            .bind::<diesel::sql_types::Uuid, _>(&self.id) // Using the same UUID for both id and secret_id for simplicity
            .bind::<diesel::sql_types::Uuid, _>(&self.organization_id)
            .bind::<diesel::sql_types::Uuid, _>(&self.created_by)
            .bind::<diesel::sql_types::Uuid, _>(&self.created_by)
            .bind::<diesel::sql_types::Text, _>(&self.env)
            .execute(&mut conn)
            .await
            .unwrap();
        
        // Insert the secret
        diesel::sql_query("INSERT INTO vault.secrets (id, secret) VALUES ($1, $2)")
            .bind::<diesel::sql_types::Uuid, _>(&self.id)
            .bind::<diesel::sql_types::Text, _>(&self.credentials.to_string())
            .execute(&mut conn)
            .await
            .unwrap();
        
        // Construct response
        DataSourceResponse {
            id: self.id.to_string(),
        }
    }
}

struct DataSourceResponse {
    id: String,
}

#[tokio::test]
async fn test_update_data_source() {
    let app = TestApp::new().await.unwrap();
    
    // Create a test user with organization
    let user = UserBuilder::new()
        .with_organization("Test Org")
        .build(&app.db.pool)
        .await;
    
    // Create a test data source
    let data_source = DataSourceBuilder::new()
        .with_name("Original DS Name")
        .with_env("dev")
        .with_organization_id(user.organization_id)
        .with_created_by(user.id)
        .with_type("postgres")
        .with_credentials(json!({
            "type": "postgres",
            "host": "localhost",
            "port": 5432,
            "username": "postgres",
            "password": "password",
            "database": "test",
            "schemas": ["public"]
        }))
        .build(&app.db.pool)
        .await;
    
    // Prepare update request
    let update_req = json!({
        "name": "Updated DS Name",
        "env": "prod",
        "type": "postgres",
        "host": "new-host",
        "port": 5433,
        "username": "new-user",
        "password": "new-password",
        "database": "new-db",
        "schemas": ["public", "schema2"]
    });
    
    // Send update request
    let response = app
        .client
        .put(format!("/api/data_sources/{}", data_source.id))
        .header("Authorization", format!("Bearer {}", user.api_key))
        .json(&update_req)
        .send()
        .await
        .unwrap();
    
    // Assert response
    assert_eq!(response.status(), StatusCode::OK);
    
    let body = response.json::<serde_json::Value>().await.unwrap();
    body.assert_has_key_with_value("id", data_source.id);
    body.assert_has_key_with_value("name", "Updated DS Name");
    
    let credentials = &body["credentials"];
    assert!(credentials.is_object());
    
    // Test updating just the name
    let name_only_update = json!({
        "name": "Name Only Update"
    });
    
    let response = app
        .client
        .put(format!("/api/data_sources/{}", data_source.id))
        .header("Authorization", format!("Bearer {}", user.api_key))
        .json(&name_only_update)
        .send()
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let body = response.json::<serde_json::Value>().await.unwrap();
    body.assert_has_key_with_value("name", "Name Only Update");
    
    // Test updating with invalid UUID
    let invalid_id = Uuid::new_v4();
    let response = app
        .client
        .put(format!("/api/data_sources/{}", invalid_id))
        .header("Authorization", format!("Bearer {}", user.api_key))
        .json(&name_only_update)
        .send()
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
}