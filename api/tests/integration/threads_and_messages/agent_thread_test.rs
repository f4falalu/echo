use anyhow::Result;
use chrono::Utc;
use serde_json::json;
use uuid::Uuid;

use crate::database::{
    models::{Message, Thread, User},
    schema::{messages, messages_to_files, metric_files, threads},
};
use crate::routes::ws::threads_and_messages::post_thread::{
    agent_message_transformer::{BusterContainer, ReasoningMessage},
    agent_thread::AgentThreadHandler,
};
use crate::tests::common::{db::TestDb, env::setup_test_env};
use crate::utils::clients::ai::litellm::Message as AgentMessage;

async fn setup_test_thread(test_db: &TestDb, user: &User) -> Result<(Thread, Message)> {
    let thread_id = Uuid::new_v4();
    let message_id = Uuid::new_v4();

    // Create thread
    let thread = Thread {
        id: thread_id,
        title: "Test Thread".to_string(),
        organization_id: Uuid::parse_str(&user.attributes["organization_id"].as_str().unwrap())?,
        created_by: user.id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    diesel::insert_into(threads::table)
        .values(&thread)
        .execute(&mut test_db.pool.get().await?)
        .await?;

    // Create initial message
    let message = Message {
        id: message_id,
        request: "test request".to_string(),
        response: json!({}),
        thread_id,
        created_by: user.id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    diesel::insert_into(messages::table)
        .values(&message)
        .execute(&mut test_db.pool.get().await?)
        .await?;

    Ok((thread, message))
}

#[tokio::test]
async fn test_end_to_end_agent_thread_flow() -> Result<()> {
    // Setup test environment
    setup_test_env();
    let test_db = TestDb::new().await?;
    let user = test_db.create_test_user().await?;
    
    // Setup test thread and message
    let (thread, message) = setup_test_thread(&test_db, &user).await?;

    // Create agent handler
    let handler = AgentThreadHandler::new()?;

    // Create test request
    let request = ChatCreateNewChat {
        prompt: "Test prompt".to_string(),
        chat_id: Some(thread.id),
        message_id: Some(message.id),
    };

    // Process request
    handler.handle_request(request, user.clone()).await?;

    // Verify final state
    let stored_message = messages::table
        .filter(messages::id.eq(message.id))
        .first::<Message>(&mut test_db.pool.get().await?)
        .await?;

    // Message should be updated with final state
    assert!(!stored_message.response.as_array().unwrap().is_empty());

    Ok(())
}

#[tokio::test]
async fn test_file_creation_and_linking() -> Result<()> {
    // Setup test environment
    setup_test_env();
    let test_db = TestDb::new().await?;
    let user = test_db.create_test_user().await?;
    
    // Setup test thread and message
    let (thread, message) = setup_test_thread(&test_db, &user).await?;

    // Create test messages with file creation
    let transformed_messages = vec![
        BusterContainer::ReasoningMessage(ReasoningMessage::File(/* create test file message */)),
    ];

    // Store final state
    AgentThreadHandler::store_final_message_state(
        &message,
        transformed_messages,
        &thread.organization_id,
        &user.id,
    )
    .await?;

    // Verify file was created and linked
    let file_links = messages_to_files::table
        .filter(messages_to_files::message_id.eq(message.id))
        .count()
        .get_result::<i64>(&mut test_db.pool.get().await?)
        .await?;

    assert!(file_links > 0);

    Ok(())
}

#[tokio::test]
async fn test_concurrent_agent_threads() -> Result<()> {
    // Setup test environment
    setup_test_env();
    let test_db = TestDb::new().await?;
    let user = test_db.create_test_user().await?;
    
    // Create multiple threads
    let mut handles = vec![];
    let handler = AgentThreadHandler::new()?;

    for i in 0..3 {
        let (thread, message) = setup_test_thread(&test_db, &user).await?;
        let handler = handler.clone();
        let user = user.clone();

        let request = ChatCreateNewChat {
            prompt: format!("Test prompt {}", i),
            chat_id: Some(thread.id),
            message_id: Some(message.id),
        };

        let handle = tokio::spawn(async move {
            handler.handle_request(request, user).await
        });

        handles.push(handle);
    }

    // Wait for all threads to complete
    for handle in handles {
        handle.await??;
    }

    Ok(())
} 