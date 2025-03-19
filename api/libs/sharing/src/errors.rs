use thiserror::Error;

#[derive(Error, Debug)]
pub enum SharingError {
    #[error("User not found: {0}")]
    UserNotFound(String),

    #[error("Invalid email address: {0}")]
    InvalidEmail(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Asset not found: {0}")]
    AssetNotFound(String),

    #[error("Deprecated asset type: {0}")]
    DeprecatedAssetType(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] diesel::result::Error),

    #[error("Internal error: {0}")]
    InternalError(String),
}