mod routes;
pub mod utils;

use std::env;
use std::sync::Arc;

use axum::{Extension, Router, extract::Request};
use middleware::cors::cors;
use database::{self, pool::init_pools};
use diesel::{Connection, PgConnection};
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use dotenv::dotenv;
use rustls::crypto::ring;
use tokio::sync::broadcast;
use tower::ServiceBuilder;
use tower_http::{compression::CompressionLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!();

#[tokio::main]
#[allow(unused)]
async fn main() {
    dotenv().ok();

    let environment = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());
    let is_development = environment == "development";

    ring::default_provider()
        .install_default()
        .expect("Failed to install default crypto provider");

    // Only initialize Sentry if not in development environment
    let _guard = if !is_development {
        Some(sentry::init((
            "https://a417fbed1de30d2714a8afbe38d5bc1b@o4505360096428032.ingest.us.sentry.io/4507360721043456", 
            sentry::ClientOptions {
                release: sentry::release_name!(),
                environment: Some(environment.clone().into()),
                traces_sample_rate: 1.0,
                ..Default::default()
            }
        )))
    } else {
        None
    };

    tracing_subscriber::registry()
        .with(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| {
                    let log_level = env::var("LOG_LEVEL")
                        .unwrap_or_else(|_| "warn".to_string())
                        .to_uppercase();
                    EnvFilter::new(log_level)
                }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    if let Err(e) = init_pools().await {
        tracing::error!("Failed to initialize database pools: {}", e);
        return;
    }

    tracing::info!("Running database migrations");

    if let Err(e) = run_migrations().await {
        tracing::error!("Failed to run database migrations: {}", e);
        return;
    }

    tracing::info!("Successfully ran database migrations");

    let protected_router = Router::new().nest("/api/v1", routes::protected_router());
    let public_router = Router::new().route("/health", axum::routing::get(|| async { "OK" }));

    let (shutdown_tx, _) = broadcast::channel::<()>(1);
    let shutdown_tx = Arc::new(shutdown_tx);

    // Build the router with or without Sentry layers based on environment
    let app = Router::new()
        .merge(protected_router)
        .merge(public_router)
        .layer(TraceLayer::new_for_http())
        .layer(cors())
        .layer(CompressionLayer::new())
        .layer(Extension(shutdown_tx.clone()));

    // Add Sentry layers if not in development
    let app = if !is_development {
        app.layer(
            ServiceBuilder::new()
                .layer(sentry_tower::NewSentryLayer::<Request>::new_from_top())
                .layer(sentry_tower::SentryHttpLayer::with_transaction())
        )
    } else {
        app
    };

    let port_number: u16 = env::var("PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse()
        .unwrap();

    let listener = match tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port_number)).await {
        Ok(listener) => listener,
        Err(e) => {
            tracing::error!("Failed to bind to port {}: {}", port_number, e);
            return;
        }
    };

    let server = axum::serve(listener, app);

    tokio::select! {
        _ = server => {},
        _ = tokio::signal::ctrl_c() => {
            tracing::info!("Shutdown signal received, starting graceful shutdown");
            shutdown_tx.send(()).unwrap_or_default();
        }
    }
}

async fn run_migrations() -> Result<(), anyhow::Error> {
    let database_url = std::env::var("DATABASE_URL")
        .map_err(|e| anyhow::anyhow!("Failed to get DATABASE_URL: {}", e))?;

    let mut connection = PgConnection::establish(&database_url)
        .map_err(|e| anyhow::anyhow!("Failed to establish database connection: {}", e))?;

    connection
        .run_pending_migrations(MIGRATIONS)
        .map_err(|e| anyhow::anyhow!("Failed to run migrations: {}", e))?;

    Ok(())
}
