# Buster API Test Kit

The `testkit` crate provides standardized database pool initialization for tests across the Buster API workspace, leveraging the existing database pools from the database library.

## Features

- **Automatic Database Pool Configuration**: Uses the database library's pools with test configurations
- **Environment Configuration**: Uses `.env.test` for test database configuration
- **Test ID Generation**: Provides unique IDs for test data isolation

## Getting Started

Add the testkit as a dev-dependency in your workspace crate:

```toml
[dev-dependencies]
testkit = { path = "../../testkit" }
```

## Usage

```rust
use anyhow::Result;

#[tokio::test]
async fn my_test() -> Result<()> {
    // Get database pools - these are initialized from the database library
    let pg_pool = testkit::get_pg_pool();
    let redis_pool = testkit::get_redis_pool();
    
    // Use the pools for testing
    let conn = pg_pool.get().await?;
    
    // Generate a unique test ID for data isolation
    let test_id = testkit::test_id();
    
    // Use test_id to tag and later clean up test data
    
    Ok(())
}
```

## Test Data Isolation

Use the `test_id()` function to generate unique IDs for isolating test data:

```rust
// Get a unique ID
let test_id = testkit::test_id();

// Tag test data with the ID
diesel::sql_query("INSERT INTO users (name, test_id) VALUES ($1, $2)")
    .bind::<diesel::sql_types::Text, _>("Test User")
    .bind::<diesel::sql_types::Text, _>(&test_id)
    .execute(&mut conn)
    .await?;

// Clean up after test
diesel::sql_query("DELETE FROM users WHERE test_id = $1")
    .bind::<diesel::sql_types::Text, _>(&test_id)
    .execute(&mut conn)
    .await?;
```

## Environment Configuration

By default, the testkit checks for and creates a `.env.test` file with:

```
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
TEST_REDIS_URL=redis://localhost:6379
TEST_LOG=true
TEST_LOG_LEVEL=debug
```

When running tests, the testkit automatically sets `DATABASE_URL` to the value of `TEST_DATABASE_URL`, ensuring that tests use the test database. 