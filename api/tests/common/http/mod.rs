// Re-export HTTP utilities
mod mock_server;
mod client;

pub use mock_server::MockServer;
pub use client::TestHttpClient;