// Collections handlers module
mod add_dashboards_to_collection_handler;
mod create_collection_handler;
mod delete_collection_handler;
mod get_collection_handler;
mod list_collections_handler;
mod remove_assets_from_collection_handler;
mod remove_metrics_from_collection_handler;
mod types;
mod update_collection_handler;
pub mod sharing;

// Re-export types
pub use types::*;

// Re-export handlers
pub use add_dashboards_to_collection_handler::add_dashboards_to_collection_handler;
pub use create_collection_handler::create_collection_handler;
pub use delete_collection_handler::delete_collection_handler;
pub use get_collection_handler::get_collection_handler;
pub use list_collections_handler::list_collections_handler;
pub use remove_assets_from_collection_handler::{remove_assets_from_collection_handler, AssetToRemove};
pub use remove_metrics_from_collection_handler::remove_metrics_from_collection_handler;
pub use update_collection_handler::update_collection_handler;
