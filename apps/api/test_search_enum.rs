use serde_json;
use search::SearchObjectType;

fn main() {
    println!("Testing SearchObjectType deserialization...");
    
    // Test metric_file deserialization
    let metric_result: Result<SearchObjectType, _> = serde_json::from_str("\"metric_file\"");
    match metric_result {
        Ok(SearchObjectType::Metric) => println!("✅ metric_file -> Metric: SUCCESS"),
        Ok(other) => println!("❌ metric_file -> {:?}: WRONG VARIANT", other),
        Err(e) => println!("❌ metric_file failed: {}", e),
    }
    
    // Test dashboard_file deserialization
    let dashboard_result: Result<SearchObjectType, _> = serde_json::from_str("\"dashboard_file\"");
    match dashboard_result {
        Ok(SearchObjectType::Dashboard) => println!("✅ dashboard_file -> Dashboard: SUCCESS"),
        Ok(other) => println!("❌ dashboard_file -> {:?}: WRONG VARIANT", other),
        Err(e) => println!("❌ dashboard_file failed: {}", e),
    }
    
    // Test serialization round-trip
    let metric = SearchObjectType::Metric;
    let serialized = serde_json::to_string(&metric).unwrap();
    println!("✅ Metric serializes to: {}", serialized);
    
    let dashboard = SearchObjectType::Dashboard;
    let serialized = serde_json::to_string(&dashboard).unwrap();
    println!("✅ Dashboard serializes to: {}", serialized);
    
    // Test that old values like "metric" and "dashboard" now fail
    let old_metric_result: Result<SearchObjectType, _> = serde_json::from_str("\"metric\"");
    match old_metric_result {
        Err(_) => println!("✅ Old 'metric' correctly fails to deserialize"),
        Ok(_) => println!("❌ Old 'metric' should fail but didn't"),
    }
    
    let old_dashboard_result: Result<SearchObjectType, _> = serde_json::from_str("\"dashboard\"");
    match old_dashboard_result {
        Err(_) => println!("✅ Old 'dashboard' correctly fails to deserialize"),
        Ok(_) => println!("❌ Old 'dashboard' should fail but didn't"),
    }
    
    println!("Test complete!");
}
