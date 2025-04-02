# Testkit Library Usage Guide

## Overview
The testkit library initializes database pools during build time and provides utilities for test isolation. The pools themselves are accessed directly from the database library.

## Key Features
- Pre-initialized database connections at build time
- Environment variable management for test-specific configurations
- Test ID generation for test isolation

## Usage

### Basic Usage
```rust
use database::pool::get_pg_pool;
use testkit::test_id;
use anyhow::Result;

#[tokio::test]
async fn test_database_operations() -> Result<()> {
    // Create a unique test ID for isolation
    let test_id = test_id();
    
    // Pools are already initialized during build time
    // Get the pool from the database library
    let pool = get_pg_pool();
    
    // Use the pool in your test
    let conn = pool.get().await?;
    
    // Perform database operations...
    
    Ok(())
}
```

### Environment Configuration
The testkit automatically loads environment variables from `.env.test` if available, otherwise from `.env` during the build process. Key environment variables include:

- `TEST_DATABASE_URL` - PostgreSQL connection string for tests
- `TEST_POOLER_URL` - Connection string for the SQL pooler
- `TEST_REDIS_URL` - Redis connection string
- `TEST_DATABASE_POOL_SIZE` - Maximum connections in Diesel pool (default: 10)
- `TEST_SQLX_POOL_SIZE` - Maximum connections in SQLx pool (default: 10)

### Accessing Database Pools
Access the pre-initialized database pools directly through the database library:

```rust
// Get the Diesel PostgreSQL pool (AsyncPgConnection)
let pg_pool = database::pool::get_pg_pool();

// Get the SQLx PostgreSQL pool
let sqlx_pool = database::pool::get_sqlx_pool();

// Get the Redis pool
let redis_pool = database::pool::get_redis_pool();
```

### Test ID Generation
For test isolation, you can generate unique IDs to tag test data:

```rust
let test_id = testkit::test_id();

// Use this ID to mark test data for cleanup
diesel::insert_into(users::table)
    .values((
        users::name.eq("Test User"),
        users::email.eq("test@example.com"),
        users::test_id.eq(test_id), // Use the test ID for later cleanup
    ))
    .execute(&mut conn)
    .await?;
```

## Implementation Details

### Pool Initialization
The testkit initializes pools during the build process using `build.rs`. This ensures pools are always available when your tests run, with no initialization overhead or risk of connection timing issues.

### Error Handling
- Build-time initialization failures are reported as warnings but don't fail the build
- Unit tests that don't need database access will run fine even if pool initialization failed
- Integration tests that need database access will fail fast if the database isn't available

### Database Reset (Optional Feature)
For clearing test data, use the `db_reset` feature:

```rust
// Only available when the `db_reset` feature is enabled
#[cfg(feature = "db_reset")]
testkit::reset_test_database().await?;
```

## Best Practices

1. **Direct Pool Access**: Always use `get_pg_pool()`, `get_sqlx_pool()`, or `get_redis_pool()` directly
2. **Use Test IDs**: Generate and use test IDs for proper test isolation
3. **Cleanup After Tests**: Always clean up test data after tests
4. **Connection Pooling**: Reuse connections from the pool instead of creating new ones
5. **Environment Variables**: Use the `.env.test` file for test-specific configuration
6. **Avoid Database in Unit Tests**: Unit tests should mock database operations

## Example Integration Test Pattern

```rust
#[tokio::test]
async fn test_example() -> Result<()> {
    // Generate unique test ID
    let test_id = testkit::test_id();
    
    // Get pre-initialized database connection directly from database lib
    let pool = database::pool::get_pg_pool();
    let mut conn = pool.get().await?;
    
    // Setup test data with test_id for tracking
    let test_user = create_test_user(&mut conn, &test_id).await?;
    
    // Run the test against the test data
    let result = your_function_under_test(test_user.id).await?;
    assert_eq!(result.name, test_user.name);
    
    // Clean up test data using test_id
    cleanup_test_data(&mut conn, &test_id).await?;
    
    Ok(())
}

async fn create_test_user(conn: &mut PgConnection, test_id: &str) -> Result<User> {
    // Insert user with test_id
    // ...
}

async fn cleanup_test_data(conn: &mut PgConnection, test_id: &str) -> Result<()> {
    // Delete all data with matching test_id
    // ...
}
```