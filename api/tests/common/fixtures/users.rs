use crate::common::http::test_app::TestApp;
use crate::database::{
    enums::AssetType,
    models::{User, Chat, Message, MessageToFile, MetricFile, DashboardFile},
    pool::get_pg_pool,
    schema::{users, chats, messages, messages_to_files, metric_files, dashboard_files},
};
use chrono::Utc;
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use serde_json::json;
use uuid::Uuid;

/// Creates a test user with default values
pub fn create_test_user() -> User {
    User {
        id: Uuid::new_v4(),
        email: "test@example.com".to_string(),
        name: Some("Test User".to_string()),
        config: json!({}),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes: json!({}),
        avatar_url: None,
    }
}

/// Creates a test user with custom values
pub fn create_custom_test_user(
    email: &str,
    name: Option<&str>,
    attributes: serde_json::Value,
) -> User {
    User {
        id: Uuid::new_v4(),
        email: email.to_string(),
        name: name.map(String::from),
        config: json!({}),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        attributes,
        avatar_url: None,
    }
}

/// Creates multiple test users
pub fn create_test_users(count: usize) -> Vec<User> {
    (0..count)
        .map(|i| {
            User {
                id: Uuid::new_v4(),
                email: format!("test{}@example.com", i),
                name: Some(format!("Test User {}", i)),
                config: json!({}),
                created_at: Utc::now(),
                updated_at: Utc::now(),
                attributes: json!({}),
                avatar_url: None,
            }
        })
        .collect()
}

/// Creates a test user in the database
pub async fn create_user(app: &TestApp) -> User {
    let user = create_test_user();
    let mut conn = get_pg_pool().get().await.unwrap();
    
    insert_into(users::table)
        .values(&user)
        .execute(&mut conn)
        .await
        .unwrap();
    
    user
}

/// Creates a chat for testing
pub async fn create_chat(app: &TestApp, user: &User, title: &str) -> Chat {
    let chat = Chat {
        id: Uuid::new_v4(),
        title: title.to_string(),
        organization_id: Uuid::new_v4(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: user.id,
        updated_by: user.id,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        most_recent_file_id: None,
        most_recent_file_type: None,
    };
    
    let mut conn = get_pg_pool().get().await.unwrap();
    
    insert_into(chats::table)
        .values(&chat)
        .execute(&mut conn)
        .await
        .unwrap();
    
    chat
}

/// Creates a chat with associated files for testing
pub async fn create_chat_with_files(
    app: &TestApp,
    user: &User,
    file_type: AssetType,
    title: &str,
) -> (Chat, Uuid) {
    // First create the chat
    let chat = Chat {
        id: Uuid::new_v4(),
        title: title.to_string(),
        organization_id: Uuid::new_v4(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: user.id,
        updated_by: user.id,
        publicly_accessible: false,
        publicly_enabled_by: None,
        public_expiry_date: None,
        most_recent_file_id: None,
        most_recent_file_type: None,
    };
    
    let mut conn = get_pg_pool().get().await.unwrap();
    
    insert_into(chats::table)
        .values(&chat)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Create message
    let message = Message {
        id: Uuid::new_v4(),
        request_message: Some("Test message".to_string()),
        response_messages: json!([]),
        reasoning: json!([]),
        title: "Test message".to_string(),
        raw_llm_messages: json!([]),
        final_reasoning_message: None,
        chat_id: chat.id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by: user.id,
        feedback: None,
    };
    
    insert_into(messages::table)
        .values(&message)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Create file based on type
    let file_id = Uuid::new_v4();
    let file_type_str = match file_type {
        AssetType::MetricFile => {
            let metric_file = MetricFile {
                id: file_id,
                name: "Test Metric".to_string(),
                file_name: "test_metric.yml".to_string(),
                content: json!({}),
                verification: database::enums::Verification::NotVerified,
                evaluation_obj: None,
                evaluation_summary: None,
                evaluation_score: None,
                organization_id: Uuid::new_v4(),
                created_by: user.id,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                deleted_at: None,
                publicly_accessible: false,
                publicly_enabled_by: None,
                public_expiry_date: None,
                version_history: json!({}),
            };
            
            insert_into(metric_files::table)
                .values(&metric_file)
                .execute(&mut conn)
                .await
                .unwrap();
            
            "metric"
        },
        AssetType::DashboardFile => {
            let dashboard_file = DashboardFile {
                id: file_id,
                name: "Test Dashboard".to_string(),
                file_name: "test_dashboard.yml".to_string(),
                content: json!({}),
                filter: None,
                organization_id: Uuid::new_v4(),
                created_by: user.id,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                deleted_at: None,
                publicly_accessible: false,
                publicly_enabled_by: None,
                public_expiry_date: None,
                version_history: json!({}),
            };
            
            insert_into(dashboard_files::table)
                .values(&dashboard_file)
                .execute(&mut conn)
                .await
                .unwrap();
            
            "dashboard"
        },
        _ => panic!("Unsupported file type"),
    };
    
    // Create message-to-file association
    let message_to_file = MessageToFile {
        id: Uuid::new_v4(),
        message_id: message.id,
        file_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };
    
    insert_into(messages_to_files::table)
        .values(&message_to_file)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Update chat with most recent file info
    let updated_chat = Chat {
        most_recent_file_id: Some(file_id),
        most_recent_file_type: Some(file_type_str.to_string()),
        ..chat
    };
    
    diesel::update(chats::table.find(chat.id))
        .set((
            chats::most_recent_file_id.eq(Some(file_id)),
            chats::most_recent_file_type.eq(Some(file_type_str.to_string())),
        ))
        .execute(&mut conn)
        .await
        .unwrap();
    
    (updated_chat, file_id)
}