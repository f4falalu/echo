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
async fn test_list_data_sources() {
    let app = TestApp::new().await.unwrap();
    
    // Create a test user with organization and proper role
    let admin_user = UserBuilder::new()
        .with_organization("Test Org")
        .with_org_role(UserOrganizationRole::WorkspaceAdmin)
        .build(&app.db.pool)
        .await;
    
    // Create multiple test data sources for this organization
    let postgres_credentials = json!({
        "type": "postgres",
        "host": "localhost",
        "port": 5432,
        "username": "postgres",
        "password": "password",
        "default_database": "test_db",
        "default_schema": "public"
    });
    
    let mysql_credentials = json!({
        "type": "mysql",
        "host": "mysql-server",
        "port": 3306,
        "username": "mysql_user",
        "password": "mysql_pass",
        "default_database": "mysql_db"
    });
    
    // Create first data source
    let data_source1 = DataSourceBuilder::new()
        .with_name("Postgres DB 1")
        .with_env("dev")
        .with_organization_id(admin_user.organization_id)
        .with_created_by(admin_user.id)
        .with_type("postgres")
        .with_credentials(postgres_credentials.clone())
        .build(&app.db.pool)
        .await;
    
    // Create second data source
    let data_source2 = DataSourceBuilder::new()
        .with_name("MySQL DB")
        .with_env("dev")
        .with_organization_id(admin_user.organization_id)
        .with_created_by(admin_user.id)
        .with_type("mysql")
        .with_credentials(mysql_credentials)
        .build(&app.db.pool)
        .await;
    
    // Create a data source for another organization
    let another_org_user = UserBuilder::new()
        .with_organization("Another Org")
        .with_org_role(UserOrganizationRole::WorkspaceAdmin)
        .build(&app.db.pool)
        .await;
    
    let data_source_other_org = DataSourceBuilder::new()
        .with_name("Other Org DB")
        .with_env("dev")
        .with_organization_id(another_org_user.organization_id)
        .with_created_by(another_org_user.id)
        .with_type("postgres")
        .with_credentials(postgres_credentials)
        .build(&app.db.pool)
        .await;
    
    // Test listing data sources - admin user should see both their organization's data sources
    let response = app
        .client
        .get("/api/data_sources")
        .header("Authorization", format!("Bearer {}", admin_user.api_key))
        .send()
        .await
        .unwrap();
    
    response.assert_status(StatusCode::OK);
    
    let body = response.json::<serde_json::Value>().await.unwrap();
    let data_sources = body.as_array().unwrap();
    
    // Should have exactly 2, not seeing the other organization's data source
    assert_eq!(data_sources.len(), 2);
    
    // Verify the data sources belong to our organization
    let ids: Vec<&str> = data_sources.iter()
        .map(|ds| ds["id"].as_str().unwrap())
        .collect();
    
    assert!(ids.contains(&data_source1.id.as_str()));
    assert!(ids.contains(&data_source2.id.as_str()));
    assert!(!ids.contains(&data_source_other_org.id.as_str()));
    
    // Create a data viewer role user
    let viewer_user = UserBuilder::new()
        .with_organization("Test Org")
        .with_org_role(UserOrganizationRole::DataViewer)
        .build(&app.db.pool)
        .await;
    
    // Test listing data sources with viewer role - should succeed
    let response = app
        .client
        .get("/api/data_sources")
        .header("Authorization", format!("Bearer {}", viewer_user.api_key))
        .send()
        .await
        .unwrap();
    
    response.assert_status(StatusCode::OK);
    
    // Create a regular user (no data access)
    let regular_user = UserBuilder::new()
        .with_organization("Test Org")
        .with_org_role(UserOrganizationRole::User)
        .build(&app.db.pool)
        .await;
    
    // Test listing data sources with insufficient permissions
    let response = app
        .client
        .get("/api/data_sources")
        .header("Authorization", format!("Bearer {}", regular_user.api_key))
        .send()
        .await
        .unwrap();
    
    response.assert_status(StatusCode::FORBIDDEN);
    
    // Test pagination
    let response = app
        .client
        .get("/api/data_sources?page=0&page_size=1")
        .header("Authorization", format!("Bearer {}", admin_user.api_key))
        .send()
        .await
        .unwrap();
    
    response.assert_status(StatusCode::OK);
    
    let body = response.json::<serde_json::Value>().await.unwrap();
    let data_sources = body.as_array().unwrap();
    
    assert_eq!(data_sources.len(), 1, "Pagination should limit to 1 result");
}