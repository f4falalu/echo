use thiserror::Error;

#[derive(Error, Debug)]
pub enum Error {
    #[error("Resource not found: {0}")]
    ResourceNotFound(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Invalid sharing configuration: {0}")]
    InvalidConfiguration(String),

    #[error("Resource already shared with user: {0}")]
    AlreadyShared(String),

    #[error(transparent)]
    Database(#[from] diesel::result::Error),

    #[error(transparent)]
    Other(#[from] anyhow::Error),
} 