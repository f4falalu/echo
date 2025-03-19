use anyhow::Result;
use std::fmt::Debug;

/// Trait for making assertions on model objects
pub trait ModelAssertions {
    /// Assert that a field has the expected value
    fn assert_field<T: PartialEq + Debug>(&self, field_name: &str, field_value: &T, expected: &T) -> &Self;
    
    /// Assert that a field is not null/none
    fn assert_field_present<T: PartialEq + Debug>(&self, field_name: &str, field_value: &Option<T>) -> &Self;
    
    /// Assert that a string field contains expected content
    fn assert_string_contains(&self, field_name: &str, field_value: &str, expected_content: &str) -> &Self;
    
    /// Assert that a numeric field is in range
    fn assert_numeric_in_range<T: PartialOrd + Debug>(
        &self, 
        field_name: &str, 
        field_value: &T, 
        min: &T, 
        max: &T
    ) -> &Self;
}

/// Implementation for any type
impl<S> ModelAssertions for S {
    fn assert_field<T: PartialEq + Debug>(&self, field_name: &str, field_value: &T, expected: &T) -> &Self {
        assert_eq!(
            field_value, 
            expected, 
            "Expected field '{}' to be {:?}, but got {:?}", 
            field_name, 
            expected, 
            field_value
        );
        self
    }
    
    fn assert_field_present<T: PartialEq + Debug>(&self, field_name: &str, field_value: &Option<T>) -> &Self {
        assert!(
            field_value.is_some(), 
            "Expected field '{}' to be present, but it was None", 
            field_name
        );
        self
    }
    
    fn assert_string_contains(&self, field_name: &str, field_value: &str, expected_content: &str) -> &Self {
        assert!(
            field_value.contains(expected_content),
            "Expected field '{}' to contain '{}', but got '{}'",
            field_name,
            expected_content,
            field_value
        );
        self
    }
    
    fn assert_numeric_in_range<T: PartialOrd + Debug>(
        &self, 
        field_name: &str, 
        field_value: &T, 
        min: &T, 
        max: &T
    ) -> &Self {
        assert!(
            field_value >= min && field_value <= max,
            "Expected field '{}' to be between {:?} and {:?}, but got {:?}",
            field_name,
            min,
            max,
            field_value
        );
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[derive(Debug)]
    struct TestModel {
        id: i32,
        name: String,
        age: u32,
        email: Option<String>,
    }
    
    #[test]
    fn test_assert_field() {
        let model = TestModel {
            id: 123,
            name: "Test User".to_string(),
            age: 30,
            email: Some("test@example.com".to_string()),
        };
        
        // Test valid assertion
        model.assert_field("id", &model.id, &123);
        
        // Test with string
        model.assert_field("name", &model.name, &"Test User".to_string());
    }
    
    #[test]
    fn test_assert_field_present() {
        let model = TestModel {
            id: 123,
            name: "Test User".to_string(),
            age: 30,
            email: Some("test@example.com".to_string()),
        };
        
        model.assert_field_present("email", &model.email);
    }
    
    #[test]
    fn test_assert_string_contains() {
        let model = TestModel {
            id: 123,
            name: "Test User".to_string(),
            age: 30,
            email: Some("test@example.com".to_string()),
        };
        
        model.assert_string_contains("name", &model.name, "User");
    }
    
    #[test]
    fn test_assert_numeric_in_range() {
        let model = TestModel {
            id: 123,
            name: "Test User".to_string(),
            age: 30,
            email: Some("test@example.com".to_string()),
        };
        
        model.assert_numeric_in_range("age", &model.age, &18, &60);
    }
}