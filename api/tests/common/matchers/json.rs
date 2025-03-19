use serde_json::Value;
use mockito::Matcher;

/// Create a matcher for JSON payloads that checks for subset matching
///
/// This will match if the JSON payload contains all of the fields in the expected
/// value, but may also contain additional fields. Useful for asserting on the
/// essential parts of a JSON payload without requiring an exact match.
///
/// Example:
/// ```
/// let matcher = json_contains(json!({"name": "Test", "age": 30}));
/// // This will match a payload with name and age, plus other fields
/// ```
pub fn json_contains<T: serde::Serialize>(expected: T) -> Matcher {
    let expected_json = serde_json::to_value(expected)
        .expect("Failed to serialize expected value to JSON");
    
    Matcher::Func(Box::new(move |body: &[u8]| {
        if body.is_empty() {
            return false;
        }
        
        let body_str = String::from_utf8_lossy(body);
        
        match serde_json::from_str::<Value>(&body_str) {
            Ok(actual_json) => {
                json_contains_subset(&expected_json, &actual_json)
            }
            Err(_) => false,
        }
    }))
}

/// Check if a JSON value contains another JSON value as a subset
///
/// This is a recursive function that checks if the actual JSON value
/// contains all the fields from the expected JSON value.
fn json_contains_subset(expected: &Value, actual: &Value) -> bool {
    match expected {
        Value::Object(expected_obj) => {
            match actual {
                Value::Object(actual_obj) => {
                    for (k, v) in expected_obj {
                        match actual_obj.get(k) {
                            Some(actual_val) => {
                                if !json_contains_subset(v, actual_val) {
                                    return false;
                                }
                            }
                            None => return false,
                        }
                    }
                    true
                }
                _ => false,
            }
        }
        Value::Array(expected_arr) => {
            match actual {
                Value::Array(actual_arr) => {
                    if expected_arr.len() > actual_arr.len() {
                        return false;
                    }
                    
                    // Simple case: check each expected item exists in the actual array
                    for expected_item in expected_arr {
                        if !actual_arr.iter().any(|actual_item| {
                            json_contains_subset(expected_item, actual_item)
                        }) {
                            return false;
                        }
                    }
                    true
                }
                _ => false,
            }
        }
        _ => expected == actual,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    
    #[test]
    fn test_json_contains_subset_exact_match() {
        let expected = json!({
            "name": "Test User",
            "age": 30
        });
        
        let actual = json!({
            "name": "Test User",
            "age": 30
        });
        
        assert!(json_contains_subset(&expected, &actual));
    }
    
    #[test]
    fn test_json_contains_subset_additional_fields() {
        let expected = json!({
            "name": "Test User",
            "age": 30
        });
        
        let actual = json!({
            "id": 123,
            "name": "Test User",
            "age": 30,
            "email": "test@example.com"
        });
        
        assert!(json_contains_subset(&expected, &actual));
    }
    
    #[test]
    fn test_json_contains_subset_missing_field() {
        let expected = json!({
            "name": "Test User",
            "age": 30,
            "email": "test@example.com"
        });
        
        let actual = json!({
            "name": "Test User",
            "age": 30
        });
        
        assert!(!json_contains_subset(&expected, &actual));
    }
    
    #[test]
    fn test_json_contains_subset_mismatched_value() {
        let expected = json!({
            "name": "Test User",
            "age": 42
        });
        
        let actual = json!({
            "name": "Test User",
            "age": 30
        });
        
        assert!(!json_contains_subset(&expected, &actual));
    }
    
    #[test]
    fn test_json_contains_subset_nested_objects() {
        let expected = json!({
            "user": {
                "name": "Test User",
                "address": {
                    "city": "Test City"
                }
            }
        });
        
        let actual = json!({
            "id": 123,
            "user": {
                "name": "Test User",
                "age": 30,
                "address": {
                    "city": "Test City",
                    "street": "Test Street"
                }
            },
            "status": "active"
        });
        
        assert!(json_contains_subset(&expected, &actual));
    }
    
    #[test]
    fn test_json_contains_subset_arrays() {
        let expected = json!({
            "items": [
                {"id": 1},
                {"id": 2}
            ]
        });
        
        let actual = json!({
            "items": [
                {"id": 1, "name": "Item 1"},
                {"id": 2, "name": "Item 2"},
                {"id": 3, "name": "Item 3"}
            ]
        });
        
        assert!(json_contains_subset(&expected, &actual));
    }
    
    #[test]
    fn test_json_contains_subset_array_missing_item() {
        let expected = json!({
            "items": [
                {"id": 1},
                {"id": 2},
                {"id": 4} // This doesn't exist in actual
            ]
        });
        
        let actual = json!({
            "items": [
                {"id": 1, "name": "Item 1"},
                {"id": 2, "name": "Item 2"},
                {"id": 3, "name": "Item 3"}
            ]
        });
        
        assert!(!json_contains_subset(&expected, &actual));
    }
}