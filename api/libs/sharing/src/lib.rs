//! Sharing Library
//! 
//! This library provides functionality for managing sharing of various resources
//! such as metrics, dashboards, collections, and chats. It handles the creation,
//! verification, and management of sharing records.

use anyhow::Result;

pub mod models;
pub mod utils;
mod errors;

// Re-exports
pub use errors::Error;
pub use models::Share;
pub use utils::{create_share, check_access, remove_share, list_shares};

/// Represents the different types of resources that can be shared
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum ShareableResource {
    /// A metric resource
    Metric(uuid::Uuid),
    /// A dashboard resource
    Dashboard(uuid::Uuid),
    /// A collection resource
    Collection(uuid::Uuid),
    /// A chat resource
    Chat(uuid::Uuid),
}

/// Represents the different levels of sharing permissions
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum SharePermission {
    /// Read-only access
    View,
    /// Can modify the resource
    Edit,
    /// Full control over the resource
    Admin,
}

/// A trait for types that can be shared
pub trait Shareable {
    /// Convert the type into a ShareableResource
    fn into_shareable(&self) -> ShareableResource;
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[test]
    fn test_shareable_resource_serialization() {
        let id = Uuid::new_v4();
        let resource = ShareableResource::Metric(id);
        let serialized = serde_json::to_string(&resource).unwrap();
        let deserialized: ShareableResource = serde_json::from_str(&serialized).unwrap();
        assert_eq!(resource, deserialized);
    }

    #[test]
    fn test_share_permission_serialization() {
        let permission = SharePermission::Edit;
        let serialized = serde_json::to_string(&permission).unwrap();
        let deserialized: SharePermission = serde_json::from_str(&serialized).unwrap();
        assert_eq!(permission, deserialized);
    }
} 