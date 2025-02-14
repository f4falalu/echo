use crate::database::models::Thread;
use chrono::Utc;
use uuid::Uuid;

/// Creates a test thread with default values
pub fn create_test_thread(organization_id: Uuid, created_by: Uuid) -> Thread {
    Thread {
        id: Uuid::new_v4(),
        title: "Test Thread".to_string(),
        organization_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by,
    }
}

/// Creates a test thread with custom values
pub fn create_custom_test_thread(
    title: &str,
    organization_id: Uuid,
    created_by: Uuid,
) -> Thread {
    Thread {
        id: Uuid::new_v4(),
        title: title.to_string(),
        organization_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        created_by,
    }
}

/// Creates multiple test threads
pub fn create_test_threads(
    count: usize,
    organization_id: Uuid,
    created_by: Uuid,
) -> Vec<Thread> {
    (0..count)
        .map(|i| {
            Thread {
                id: Uuid::new_v4(),
                title: format!("Test Thread {}", i),
                organization_id,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                deleted_at: None,
                created_by,
            }
        })
        .collect()
} 