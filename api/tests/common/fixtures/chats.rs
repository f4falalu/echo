use anyhow::Result;
use chrono::Utc;
use database::{
    enums::AssetType,
    models::{Chat, MessageToFile, Message, MetricFile, DashboardFile},
    pool::get_pg_pool,
    schema::{chats, messages, messages_to_files, metric_files, dashboard_files},
};
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use super::builder::TestFixtureBuilder;

impl TestFixtureBuilder {
    /// Create a test chat owned by a specific user
    pub async fn create_chat(&mut self, user_id: &Uuid) -> Result<Chat> {
        let mut conn = get_pg_pool().get().await?;
        
        let chat = Chat {
            id: Uuid::new_v4(),
            title: format!("Test Chat {}", Uuid::new_v4()),
            organization_id: Uuid::new_v4(), // In a real fixture, we'd use a proper organization id
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            created_by: *user_id,
            updated_by: *user_id,
            publicly_accessible: false,
            publicly_enabled_by: None,
            public_expiry_date: None,
        };
        
        insert_into(chats::table)
            .values(&chat)
            .get_result(&mut conn)
            .await
            .map_err(Into::into)
    }
}