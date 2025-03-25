use anyhow::Result;
use database::enums::AssetType;
use uuid::Uuid;
use chrono::Utc;
use serde_json::json;

use crate::common::{
    assertions::response::ResponseAssertion,
    fixtures::chats::ChatFixtureBuilder,
    fixtures::dashboards::DashboardFixtureBuilder,
    fixtures::metrics::MetricFixtureBuilder,
    fixtures::users::UserFixtureBuilder,
    http::client::TestClient,
};

#[tokio::test]
async fn test_restore_metric_in_chat() -> Result<()> {
    // Create test client
    let client = TestClient::new().await?;
    
    // Create test user
    let user = UserFixtureBuilder::new()
        .with_name("Test User")
        .with_email("test@example.com")
        .create(&client)
        .await?;
    
    // Create a metric with initial content
    let metric = MetricFixtureBuilder::new()
        .with_name("Test Metric")
        .with_created_by(user.id)
        .with_organization_id(user.organization_id)
        .with_sql("SELECT * FROM test_table")
        .create(&client)
        .await?;
    
    // Create a chat
    let chat = ChatFixtureBuilder::new()
        .with_title("Test Chat")
        .with_created_by(user.id)
        .with_organization_id(user.organization_id)
        .create(&client)
        .await?;
    
    // Update the metric to create version 2
    let update_response = client
        .put(&format!("/api/v1/metrics/{}", metric.id))
        .json(&json!({
            "name": "Updated Metric",
            "sql": "SELECT * FROM updated_table"
        }))
        .with_auth(&user)
        .send()
        .await;
    
    update_response.assert_status_ok()?;
    
    // Now restore the metric to version 1 via the chat restoration endpoint
    let restore_response = client
        .put(&format!("/api/v1/chats/{}/restore", chat.id))
        .json(&json!({
            "asset_id": metric.id,
            "asset_type": "metric_file",
            "version_number": 1
        }))
        .with_auth(&user)
        .send()
        .await;
    
    restore_response.assert_status_ok()?;
    
    // Extract the updated chat from the response
    let chat_with_messages = restore_response.json::<serde_json::Value>()?;
    
    // Verify that messages were created in the chat
    let messages = chat_with_messages["data"]["messages"].as_object().unwrap();
    assert!(messages.len() >= 2, "Expected at least 2 messages in the chat");
    
    // Verify that at least one text message mentions restoring a version
    let has_restoration_message = messages.values().any(|msg| {
        msg["message_type"].as_str() == Some("text") &&
        msg["request_message"].as_str().unwrap_or("").contains("was created by restoring")
    });
    assert!(has_restoration_message, "Expected a restoration message in the chat");
    
    // Verify that there's a file message referencing the metric
    let has_file_message = messages.values().any(|msg| {
        msg["message_type"].as_str() == Some("file") &&
        msg["file_type"].as_str() == Some("metric")
    });
    assert!(has_file_message, "Expected a file message referencing the metric");
    
    // Get the metric to verify that a new version was created
    let metric_response = client
        .get(&format!("/api/v1/metrics/{}", metric.id))
        .with_auth(&user)
        .send()
        .await;
    
    metric_response.assert_status_ok()?;
    let metric_data = metric_response.json::<serde_json::Value>()?;
    let version = metric_data["data"]["version"].as_i64().unwrap();
    
    // The version should be 3 (initial + update + restore)
    assert_eq!(version, 3, "Expected version to be 3 after restoration");
    
    Ok(())
}

#[tokio::test]
async fn test_restore_dashboard_in_chat() -> Result<()> {
    // Create test client
    let client = TestClient::new().await?;
    
    // Create test user
    let user = UserFixtureBuilder::new()
        .with_name("Test User")
        .with_email("test2@example.com")
        .create(&client)
        .await?;
    
    // Create a dashboard with initial content
    let dashboard = DashboardFixtureBuilder::new()
        .with_name("Test Dashboard")
        .with_created_by(user.id)
        .with_organization_id(user.organization_id)
        .create(&client)
        .await?;
    
    // Create a chat
    let chat = ChatFixtureBuilder::new()
        .with_title("Test Chat for Dashboard")
        .with_created_by(user.id)
        .with_organization_id(user.organization_id)
        .create(&client)
        .await?;
    
    // Update the dashboard to create version 2
    let update_response = client
        .put(&format!("/api/v1/dashboards/{}", dashboard.id))
        .json(&json!({
            "name": "Updated Dashboard"
        }))
        .with_auth(&user)
        .send()
        .await;
    
    update_response.assert_status_ok()?;
    
    // Now restore the dashboard to version 1 via the chat restoration endpoint
    let restore_response = client
        .put(&format!("/api/v1/chats/{}/restore", chat.id))
        .json(&json!({
            "asset_id": dashboard.id,
            "asset_type": "dashboard_file",
            "version_number": 1
        }))
        .with_auth(&user)
        .send()
        .await;
    
    restore_response.assert_status_ok()?;
    
    // Extract the updated chat from the response
    let chat_with_messages = restore_response.json::<serde_json::Value>()?;
    
    // Verify that messages were created in the chat
    let messages = chat_with_messages["data"]["messages"].as_object().unwrap();
    assert!(messages.len() >= 2, "Expected at least 2 messages in the chat");
    
    // Verify that at least one text message mentions restoring a version
    let has_restoration_message = messages.values().any(|msg| {
        msg["message_type"].as_str() == Some("text") &&
        msg["request_message"].as_str().unwrap_or("").contains("was created by restoring")
    });
    assert!(has_restoration_message, "Expected a restoration message in the chat");
    
    // Verify that there's a file message referencing the dashboard
    let has_file_message = messages.values().any(|msg| {
        msg["message_type"].as_str() == Some("file") &&
        msg["file_type"].as_str() == Some("dashboard")
    });
    assert!(has_file_message, "Expected a file message referencing the dashboard");
    
    // Get the dashboard to verify that a new version was created
    let dashboard_response = client
        .get(&format!("/api/v1/dashboards/{}", dashboard.id))
        .with_auth(&user)
        .send()
        .await;
    
    dashboard_response.assert_status_ok()?;
    let dashboard_data = dashboard_response.json::<serde_json::Value>()?;
    let version = dashboard_data["data"]["dashboard"]["version"].as_i64().unwrap();
    
    // The version should be 3 (initial + update + restore)
    assert_eq!(version, 3, "Expected version to be 3 after restoration");
    
    Ok(())
}

#[tokio::test]
async fn test_restore_wrong_version_in_chat() -> Result<()> {
    // Create test client
    let client = TestClient::new().await?;
    
    // Create test user
    let user = UserFixtureBuilder::new()
        .with_name("Test User")
        .with_email("test3@example.com")
        .create(&client)
        .await?;
    
    // Create a metric
    let metric = MetricFixtureBuilder::new()
        .with_name("Test Metric")
        .with_created_by(user.id)
        .with_organization_id(user.organization_id)
        .with_sql("SELECT * FROM test_table")
        .create(&client)
        .await?;
    
    // Create a chat
    let chat = ChatFixtureBuilder::new()
        .with_title("Test Chat for Error Case")
        .with_created_by(user.id)
        .with_organization_id(user.organization_id)
        .create(&client)
        .await?;
    
    // Try to restore a non-existent version (version 999)
    let restore_response = client
        .put(&format!("/api/v1/chats/{}/restore", chat.id))
        .json(&json!({
            "asset_id": metric.id,
            "asset_type": "metric_file",
            "version_number": 999
        }))
        .with_auth(&user)
        .send()
        .await;
    
    // This should fail with a 404 Not Found
    assert_eq!(restore_response.status().as_u16(), 404);
    
    Ok(())
}

#[tokio::test]
async fn test_restore_invalid_asset_type_in_chat() -> Result<()> {
    // Create test client
    let client = TestClient::new().await?;
    
    // Create test user
    let user = UserFixtureBuilder::new()
        .with_name("Test User")
        .with_email("test4@example.com")
        .create(&client)
        .await?;
    
    // Create a chat
    let chat = ChatFixtureBuilder::new()
        .with_title("Test Chat for Invalid Asset Type")
        .with_created_by(user.id)
        .with_organization_id(user.organization_id)
        .create(&client)
        .await?;
    
    // Try to restore with an invalid asset type
    let restore_response = client
        .put(&format!("/api/v1/chats/{}/restore", chat.id))
        .json(&json!({
            "asset_id": Uuid::new_v4(),
            "asset_type": "chat",  // This is invalid for restoration
            "version_number": 1
        }))
        .with_auth(&user)
        .send()
        .await;
    
    // This should fail with a 400 Bad Request
    assert_eq!(restore_response.status().as_u16(), 400);
    
    Ok(())
}

#[tokio::test]
async fn test_restore_without_permission() -> Result<()> {
    // Create test client
    let client = TestClient::new().await?;
    
    // Create test users
    let owner = UserFixtureBuilder::new()
        .with_name("Owner User")
        .with_email("owner@example.com")
        .create(&client)
        .await?;
    
    let other_user = UserFixtureBuilder::new()
        .with_name("Other User")
        .with_email("other@example.com")
        .create(&client)
        .await?;
    
    // Create a metric owned by the owner
    let metric = MetricFixtureBuilder::new()
        .with_name("Owner's Metric")
        .with_created_by(owner.id)
        .with_organization_id(owner.organization_id)
        .with_sql("SELECT * FROM owner_table")
        .create(&client)
        .await?;
    
    // Create a chat owned by the owner
    let chat = ChatFixtureBuilder::new()
        .with_title("Owner's Chat")
        .with_created_by(owner.id)
        .with_organization_id(owner.organization_id)
        .create(&client)
        .await?;
    
    // Try to restore as the other user who doesn't have permission
    let restore_response = client
        .put(&format!("/api/v1/chats/{}/restore", chat.id))
        .json(&json!({
            "asset_id": metric.id,
            "asset_type": "metric_file",
            "version_number": 1
        }))
        .with_auth(&other_user)
        .send()
        .await;
    
    // This should fail with a 403 Forbidden or 404 Not Found
    // (Depending on implementation, it may be Not Found if the user can't see the resources at all)
    let status = restore_response.status().as_u16();
    assert!(status == 403 || status == 404, "Expected status code 403 or 404, got {}", status);
    
    Ok(())
}