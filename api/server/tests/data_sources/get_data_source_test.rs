use axum::http::StatusCode;
use diesel::sql_types;
use diesel_async::RunQueryDsl;
use serde_json::json;
use uuid::Uuid;
use database::enums::UserOrganizationRole;

use crate::common::{
    assertions::response::ResponseAssertions,
    fixtures::builder::UserBuilder,
    http::test_app::TestApp,
};

// DataSourceBuilder for setting up test data
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
            credentials: json!({
                "type": "postgres",
                "host": "localhost",
                "port": 5432,
                "username": "postgres",
                "password": "password",
                "default_database": "test_db",
                "default_schema": "public"
            }),
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
async fn test_get_data_source() {
    let app = TestApp::new().await.unwrap();
    
    // Create a test user with organization and proper role
    let admin_user = UserBuilder::new()
        .with_organization("Test Org")
        .with_org_role(UserOrganizationRole::WorkspaceAdmin)
        .build(&app.db.pool)
        .await;
    
    // Create a test data source
    let postgres_credentials = json!({
        "type": "postgres",
        "host": "localhost",
        "port": 5432,
        "username": "postgres",
        "password": "secure_password",
        "default_database": "test_db",
        "default_schema": "public"
    });
    
    let data_source = DataSourceBuilder::new()
        .with_name("Test Postgres DB")
        .with_env("dev")
        .with_organization_id(admin_user.organization_id)
        .with_created_by(admin_user.id)
        .with_type("postgres")
        .with_credentials(postgres_credentials)
        .build(&app.db.pool)
        .await;
    
    // Test successful get by admin
    let response = app
        .client
        .get(format!("/api/data_sources/{}", data_source.id))
        .header("Authorization", format!("Bearer {}", admin_user.api_key))
        .send()
        .await
        .unwrap();
    
    response.assert_status(StatusCode::OK);
    
    let body = response.json::<serde_json::Value>().await.unwrap();
    assert_eq!(body["id"], data_source.id);
    assert_eq!(body["name"], "Test Postgres DB");
    assert_eq!(body["db_type"], "postgres");
    
    // Verify credentials in response
    let credentials = &body["credentials"];
    assert_eq!(credentials["type"], "postgres");
    assert_eq!(credentials["host"], "localhost");
    assert_eq!(credentials["port"], 5432);
    assert_eq!(credentials["username"], "postgres");
    assert_eq!(credentials["password"], "secure_password"); // Credentials are returned in API
    
    // Create a data viewer user for testing
    let viewer_user = UserBuilder::new()
        .with_organization("Test Org")
        .with_org_role(UserOrganizationRole::DataViewer)
        .build(&app.db.pool)
        .await;
    
    // Test successful get by viewer
    let response = app
        .client
        .get(format!("/api/data_sources/{}", data_source.id))
        .header("Authorization", format!("Bearer {}", viewer_user.api_key))
        .send()
        .await
        .unwrap();
    
    response.assert_status(StatusCode::OK);
    
    // Create a regular user for testing permissions
    let regular_user = UserBuilder::new()
        .with_organization("Test Org")
        .with_org_role(UserOrganizationRole::User) // Regular user with no data access
        .build(&app.db.pool)
        .await;
    
    // Test failed get by regular user (insufficient permissions)
    let response = app
        .client
        .get(format!("/api/data_sources/{}", data_source.id))
        .header("Authorization", format!("Bearer {}", regular_user.api_key))
        .send()
        .await
        .unwrap();
    
    response.assert_status(StatusCode::FORBIDDEN);
    
    // Test with non-existent data source
    let non_existent_id = Uuid::new_v4();
    let response = app
        .client
        .get(format!("/api/data_sources/{}", non_existent_id))
        .header("Authorization", format!("Bearer {}", admin_user.api_key))
        .send()
        .await
        .unwrap();
    
    response.assert_status(StatusCode::NOT_FOUND);
    
    // Create an organization for cross-org test
    let another_org_user = UserBuilder::new()
        .with_organization("Another Org")
        .with_org_role(UserOrganizationRole::WorkspaceAdmin)
        .build(&app.db.pool)
        .await;
    
    // Test cross-organization access (should fail)
    let response = app
        .client
        .get(format!("/api/data_sources/{}", data_source.id))
        .header("Authorization", format!("Bearer {}", another_org_user.api_key))
        .send()
        .await
        .unwrap();
    
    response.assert_status(StatusCode::NOT_FOUND);
}