use database::pool::init_pools;
use lazy_static::lazy_static;

lazy_static! {
    // Initialize test environment once across all tests
    static ref TEST_ENV: () = {
        // Create a runtime for initialization
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        // Initialize pools
        if let Err(e) = rt.block_on(init_pools()) {
            panic!("Failed to initialize test pools: {}", e);
        }
        
        println!("✅ Test environment initialized");
    };
}

// This constructor runs when the test binary loads
#[ctor::ctor]
fn init_test_env() {
    // Force lazy_static initialization
    lazy_static::initialize(&TEST_ENV);
}

// Test modules
pub mod dashboards;
