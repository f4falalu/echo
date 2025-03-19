use thiserror::Error;

#[derive(Error, Debug)]
pub enum SharingError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] diesel::result::Error),

    #[error("User not found with email: {0}")]
    UserNotFound(String),

    #[error("Permission not found for asset {0}")]
    PermissionNotFound(String),

    #[error("Insufficient permissions to perform this action")]
    InsufficientPermissions,

    #[error("Asset not found")]
    AssetNotFound,

    #[error("Internal server error: {0}")]
    InternalServerError(String),
}