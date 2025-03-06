//! Middleware Library
//!
//! This library provides common middleware components for the Buster web server,
//! including authentication and CORS handling.

pub mod auth;
pub mod cors;
pub mod types;

// Re-export commonly used types
pub use auth::auth;
pub use cors::cors;
pub use types::{AuthenticatedUser, OrganizationMembership, TeamMembership};
