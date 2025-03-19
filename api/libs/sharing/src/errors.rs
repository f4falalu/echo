use thiserror::Error;

#[derive(Error, Debug)]
pub enum SharingError {
    #[error("User not found: {0}")]
    UserNotFound(String),
    
    #[error("Invalid permission role: {0}")]
    InvalidPermissionRole(String),
    
    #[error("Asset type {0:?} is deprecated")]
    DeprecatedAssetType(String),
    
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    
    #[error("Database error: {0}")]
    DatabaseError(#[from] diesel::result::Error),
    
    #[error("Unknown error: {0}")]
    Unknown(String),
}