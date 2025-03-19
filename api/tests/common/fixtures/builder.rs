/// Generic builder pattern for test fixtures
pub trait FixtureBuilder<T> {
    /// Create a default instance of the fixture builder
    fn default() -> Self;
    
    /// Build the final model from the builder
    fn build(self) -> T;
    
    /// Build and return a vector of `count` fixtures
    fn build_many(self, count: usize) -> Vec<T> where Self: Sized + Clone {
        (0..count).map(|_| self.clone().build()).collect()
    }
}

/// Marker trait for a model that can be used as a fixture
pub trait TestFixture: Sized {
    type Builder: FixtureBuilder<Self>;
    
    /// Create a builder with default values
    fn builder() -> Self::Builder {
        Self::Builder::default()
    }
}

use anyhow::Result;
use uuid::Uuid;
use crate::common::fixtures::users::create_test_user;
use diesel::result::Error as DieselError;
use database::{
    models::User,
    pool::get_pg_pool,
    schema::users,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;

/// Simplified user structure for tests
#[derive(Debug, Clone)]
pub struct TestUser {
    pub id: Uuid,
    pub email: String,
    pub organization_id: Uuid,
}

/// Simple fixture builder for integration tests
pub struct TestFixtureBuilder;

impl TestFixtureBuilder {
    /// Create a new test fixture builder
    pub fn new() -> Self {
        Self
    }
    
    /// Create a test user with proper database entry
    pub async fn create_user(&mut self) -> Result<TestUser> {
        // Create a user model
        let model_user = create_test_user();
        
        // Insert into database
        let mut conn = get_pg_pool().get().await?;
        diesel::insert_into(users::table)
            .values(&model_user)
            .execute(&mut conn)
            .await?;
            
        // Return simplified test user
        Ok(TestUser {
            id: model_user.id,
            email: model_user.email,
            organization_id: Uuid::new_v4(), // In a real implementation, this would be properly set
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;
    
    // Example model
    #[derive(Debug, Clone, PartialEq)]
    pub struct TestUser {
        pub id: Uuid,
        pub email: String,
        pub name: Option<String>,
    }
    
    // Builder for the model
    #[derive(Clone)]
    pub struct TestUserBuilder {
        id: Option<Uuid>,
        email: Option<String>,
        name: Option<String>,
    }
    
    impl FixtureBuilder<TestUser> for TestUserBuilder {
        fn default() -> Self {
            Self {
                id: None,
                email: None,
                name: None,
            }
        }
        
        fn build(self) -> TestUser {
            TestUser {
                id: self.id.unwrap_or_else(Uuid::new_v4),
                email: self.email.unwrap_or_else(|| format!("user-{}@example.com", Uuid::new_v4())),
                name: self.name,
            }
        }
    }
    
    // Builder methods
    impl TestUserBuilder {
        pub fn id(mut self, id: Uuid) -> Self {
            self.id = Some(id);
            self
        }
        
        pub fn email(mut self, email: impl Into<String>) -> Self {
            self.email = Some(email.into());
            self
        }
        
        pub fn name(mut self, name: impl Into<String>) -> Self {
            self.name = Some(name.into());
            self
        }
    }
    
    // Implement the TestFixture trait
    impl TestFixture for TestUser {
        type Builder = TestUserBuilder;
    }
    
    #[test]
    fn test_builder_pattern() {
        // Create a user with default values
        let user1 = TestUser::builder().build();
        assert!(user1.email.contains("@example.com"));
        assert_eq!(user1.name, None);
        
        // Create a user with specific values
        let user2 = TestUser::builder()
            .email("test@example.com")
            .name("Test User")
            .build();
            
        assert_eq!(user2.email, "test@example.com");
        assert_eq!(user2.name, Some("Test User".to_string()));
        
        // Create multiple users
        let users = TestUser::builder()
            .name("Same Name")
            .build_many(3);
            
        assert_eq!(users.len(), 3);
        assert_eq!(users[0].name, Some("Same Name".to_string()));
        assert_eq!(users[1].name, Some("Same Name".to_string()));
        assert_eq!(users[2].name, Some("Same Name".to_string()));
        
        // Each user should have a unique email
        assert_ne!(users[0].email, users[1].email);
        assert_ne!(users[1].email, users[2].email);
    }
}