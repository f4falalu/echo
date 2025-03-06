use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{ShareableResource, SharePermission};

#[derive(Debug, Clone, Queryable, Insertable, Serialize, Deserialize)]
#[diesel(table_name = sharing)]
pub struct Share {
    pub id: Uuid,
    pub resource_type: String,
    pub resource_id: Uuid,
    pub shared_by: Uuid,
    pub shared_with: Uuid,
    pub permission: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
}

impl Share {
    pub fn new(
        resource: ShareableResource,
        shared_by: Uuid,
        shared_with: Uuid,
        permission: SharePermission,
        expires_at: Option<DateTime<Utc>>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            resource_type: match &resource {
                ShareableResource::Metric(_) => "metric",
                ShareableResource::Dashboard(_) => "dashboard",
                ShareableResource::Collection(_) => "collection",
                ShareableResource::Chat(_) => "chat",
            }.to_string(),
            resource_id: match resource {
                ShareableResource::Metric(id) |
                ShareableResource::Dashboard(id) |
                ShareableResource::Collection(id) |
                ShareableResource::Chat(id) => id,
            },
            shared_by,
            shared_with,
            permission: match permission {
                SharePermission::View => "view",
                SharePermission::Edit => "edit",
                SharePermission::Admin => "admin",
            }.to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            expires_at,
        }
    }
}

// Diesel schema definition
table! {
    sharing (id) {
        id -> Uuid,
        resource_type -> Text,
        resource_id -> Uuid,
        shared_by -> Uuid,
        shared_with -> Uuid,
        permission -> Text,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        expires_at -> Nullable<Timestamptz>,
    }
} 