use axum::{
    routing::delete,
    Router,
};

mod delete_message;

use delete_message::delete_message_rest_handler;

/// Create a router for message-related endpoints
pub fn router() -> Router {
    Router::new()
        // Delete a message and all subsequent messages in the same chat
        .route("/:id", delete(delete_message_rest_handler))
} 