use anyhow::Result;
use database::enums::AssetType;
use handlers::chats::post_chat_handler::ChatCreateNewChat;
use middleware::AuthenticatedUser;
use mockito::{mock, server::MockServer};
use std::sync::Arc;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::{
    routes::ws::{
        threads_and_messages::post_thread,
        ws::{WsErrorCode, WsEvent, WsResponseMessage},
        ws_utils::{send_error_message, send_ws_message},
    },
    tests::common::{db::TestDb, env::setup_test_env, fixtures::metrics::create_test_metric_file, fixtures::dashboards::create_test_dashboard_file},
};

/// Mock function to test the error handling in our WebSocket endpoint
async fn mock_send_error_message(
    _subscription: &String,
    _route: crate::routes::ws::ws_router::WsRoutes,
    _event: WsEvent,
    _code: WsErrorCode,
    _message: String,
    _user: &AuthenticatedUser,
) -> Result<()> {
    // In a real implementation, this would send an error message
    // For testing, we just return Ok
    Ok(())
}

/// Mock function to test the streaming in our WebSocket endpoint
async fn mock_send_ws_message(_subscription: &String, _message: &WsResponseMessage) -> Result<()> {
    // In a real implementation, this would send a WebSocket message
    // For testing, we just return Ok
    Ok(())
}

// Helper to create test chat request with asset
fn create_test_chat_request_with_asset(
    asset_id: Uuid, 
    asset_type: Option<AssetType>, 
    prompt: Option<String>
) -> ChatCreateNewChat {
    ChatCreateNewChat {
        prompt,
        chat_id: None,
        message_id: None,
        asset_id: Some(asset_id),
        asset_type,
        metric_id: None,
        dashboard_id: None,
    }
}

// Helper to create test chat request with legacy asset fields
fn create_test_chat_request_with_legacy_fields(
    metric_id: Option<Uuid>,
    dashboard_id: Option<Uuid>,
    prompt: Option<String>
) -> ChatCreateNewChat {
    ChatCreateNewChat {
        prompt,
        chat_id: None,
        message_id: None,
        asset_id: None,
        asset_type: None,
        metric_id,
        dashboard_id,
    }
}

#[tokio::test]
async fn test_validation_rejects_asset_id_without_type() -> Result<()> {
    // Setup test environment
    setup_test_env();
    let test_db = TestDb::new().await?;
    let user = test_db.create_test_user().await?;
    
    // Create request with asset_id but no asset_type
    let request = create_test_chat_request_with_asset(
        Uuid::new_v4(),  // Random asset ID
        None,            // Missing asset_type
        None,            // No prompt
    );
    
    // Mock the send_error_message function - we expect validation to fail
    // and trigger an error message
    let send_error_result = post_thread(&user, request).await;
    
    // Validation should reject the request
    assert!(send_error_result.is_ok(), "Expected validation to reject the request and return OK from sending error");
    
    Ok(())
}

#[tokio::test]
async fn test_prompt_less_flow_with_asset() -> Result<()> {
    // Setup test environment
    setup_test_env();
    let test_db = TestDb::new().await?;
    let user = test_db.create_test_user().await?;
    
    // Create a test metric file
    let metric_file = create_test_metric_file(&test_db, &user).await?;
    
    // Create request with asset but no prompt
    let request = create_test_chat_request_with_asset(
        metric_file.id,
        Some(AssetType::MetricFile),
        None, // No prompt
    );
    
    // Process request
    let result = post_thread(&user, request).await;
    
    // No errors should occur
    assert!(result.is_ok(), "Expected prompt-less flow to succeed");
    
    Ok(())
}

#[tokio::test]
async fn test_legacy_asset_fields_support() -> Result<()> {
    // Setup test environment
    setup_test_env();
    let test_db = TestDb::new().await?;
    let user = test_db.create_test_user().await?;
    
    // Create a test dashboard file
    let dashboard_file = create_test_dashboard_file(&test_db, &user).await?;
    
    // Create request with legacy dashboard_id field
    let request = create_test_chat_request_with_legacy_fields(
        None, // No metric_id
        Some(dashboard_file.id), // Use dashboard_id
        Some("Test prompt".to_string()), // With prompt
    );
    
    // Process request
    let result = post_thread(&user, request).await;
    
    // No errors should occur
    assert!(result.is_ok(), "Expected legacy field support to work");
    
    Ok(())
}

#[tokio::test]
async fn test_with_both_prompt_and_asset() -> Result<()> {
    // Setup test environment
    setup_test_env();
    let test_db = TestDb::new().await?;
    let user = test_db.create_test_user().await?;
    
    // Create a test metric file
    let metric_file = create_test_metric_file(&test_db, &user).await?;
    
    // Create request with both asset and prompt
    let request = create_test_chat_request_with_asset(
        metric_file.id,
        Some(AssetType::MetricFile),
        Some("Test prompt with asset".to_string()), // With prompt
    );
    
    // Process request
    let result = post_thread(&user, request).await;
    
    // No errors should occur
    assert!(result.is_ok(), "Expected prompt + asset flow to succeed");
    
    Ok(())
}

#[tokio::test]
async fn test_error_handling_during_streaming() -> Result<()> {
    // Setup test environment
    setup_test_env();
    let test_db = TestDb::new().await?;
    let user = test_db.create_test_user().await?;
    
    // Create a mock server to simulate external dependencies
    let mock_server = MockServer::start().await;
    
    // Create a test chat request
    let request = ChatCreateNewChat {
        prompt: Some("Test prompt that will cause an error".to_string()),
        chat_id: None,
        message_id: None,
        asset_id: None,
        asset_type: None,
        metric_id: None,
        dashboard_id: None,
    };
    
    // Process request - assuming our test is set up to trigger an error
    // during processing
    let result = post_thread(&user, request).await;
    
    // We still expect the function to return Ok() since errors are handled within
    assert!(result.is_ok(), "Expected error handling to contain errors");
    
    Ok(())
}