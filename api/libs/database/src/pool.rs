use anyhow::{anyhow, Result};
use diesel_async::{pooled_connection::AsyncDieselConnectionManager, AsyncPgConnection};
use diesel_async::pooled_connection::bb8::Pool;
use once_cell::sync::OnceCell;
use std::env;
use std::time::Duration;

pub type PgPool = Pool<AsyncPgConnection>;

static DIESEL_POOL: OnceCell<PgPool> = OnceCell::new();

pub fn get_pg_pool() -> &'static PgPool {
    DIESEL_POOL.get().expect("Database pool not initialized")
}

pub async fn init_pool() -> Result<()> {
    let db_url = env::var("DATABASE_URL")
        .unwrap_or("postgresql://postgres:postgres@127.0.0.1:54322/postgres".to_string());

    let max_pool_size: u32 = env::var("DATABASE_POOL_SIZE")
        .unwrap_or("30".to_string())
        .parse()
        .expect("DATABASE_POOL_SIZE must be a valid u32");

    let manager = AsyncDieselConnectionManager::<AsyncPgConnection>::new(db_url);
    let pool = Pool::builder()
        .max_size(max_pool_size)
        .min_idle(Some(5))
        .max_lifetime(Some(Duration::from_secs(60 * 60 * 24)))
        .idle_timeout(Some(Duration::from_secs(60 * 2)))
        .test_on_check_out(true)
        .build(manager)
        .await
        .map_err(|e| anyhow!("Failed to create database pool: {}", e))?;

    DIESEL_POOL
        .set(pool)
        .map_err(|_| anyhow!("Database pool already initialized"))?;

    Ok(())
} 