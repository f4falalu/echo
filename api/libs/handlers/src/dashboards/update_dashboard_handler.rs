use anyhow::{anyhow, Result};
use chrono::Utc;
use database::pool::get_pg_pool;
use database::schema::{dashboard_files, asset_permissions};
use database::types::dashboard_yml::DashboardYml;
use database::enums::{AssetPermissionRole, AssetType, IdentityType, Verification};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{get_dashboard_handler, BusterDashboardResponse, DashboardConfig};

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardUpdateRequest {
    /// New name for the dashboard (optional)
    pub name: Option<String>,
    /// New description for the dashboard (optional)
    pub description: Option<Option<String>>,
    /// Updated dashboard configuration (optional)
    pub config: Option<DashboardConfig>,
    /// Updated verification status (optional)
    pub status: Option<Verification>,
    /// IDs of metrics to include
    pub metrics: Option<Vec<String>>,
    /// The file content of the dashboard (optional)
    pub file: Option<String>,
    /// Sharing properties
    pub public: Option<bool>,
    pub public_expiry_date: Option<String>,
    pub public_password: Option<String>,
}

/// Updates an existing dashboard by ID
pub async fn update_dashboard_handler(
    dashboard_id: Uuid,
    request: DashboardUpdateRequest,
    user_id: &Uuid,
) -> Result<BusterDashboardResponse> {
    let mut conn = get_pg_pool().get().await?;
    
    // First, get the current dashboard to ensure it exists and user has permission
    let current_dashboard = get_dashboard_handler(&dashboard_id, user_id).await?;
    
    // Check if user has permission to update the dashboard
    let permission_query = asset_permissions::table
        .filter(asset_permissions::asset_id.eq(dashboard_id))
        .filter(asset_permissions::asset_type.eq(AssetType::DashboardFile))
        .filter(asset_permissions::identity_id.eq(user_id))
        .filter(asset_permissions::identity_type.eq(IdentityType::User))
        .filter(asset_permissions::deleted_at.is_null())
        .select(asset_permissions::role)
        .first::<AssetPermissionRole>(&mut conn)
        .await;
    
    // If no explicit permission, check if user is the owner
    let can_update = match permission_query {
        Ok(role) => role == AssetPermissionRole::Editor || role == AssetPermissionRole::Owner,
        Err(_) => current_dashboard.dashboard.created_by == *user_id,
    };
    
    if !can_update {
        return Err(anyhow!("User does not have permission to update this dashboard"));
    }
    
    // Handle file content update (highest priority - overrides other fields)
    if let Some(file_content) = request.file {
        // Parse the YAML file content
        let dashboard_yml: DashboardYml = serde_yaml::from_str(&file_content)?;
        
        // Update the dashboard file with the new content
        diesel::update(dashboard_files::table)
            .filter(dashboard_files::id.eq(dashboard_id))
            .filter(dashboard_files::deleted_at.is_null())
            .set((
                dashboard_files::name.eq(&dashboard_yml.name),
                dashboard_files::content.eq(dashboard_yml.to_value()?),
                dashboard_files::updated_at.eq(Utc::now()),
            ))
            .execute(&mut conn)
            .await?;
    } else {
        // Otherwise, update individual fields
        let mut has_changes = false;
        
        // Create a dashboard yml structure from the current content
        let mut dashboard_content = serde_yaml::from_str::<DashboardYml>(&current_dashboard.dashboard.file)?;
        
        // Keep track of whether we need to update content
        let mut content_updated = false;
        
        // Update description if provided
        if let Some(description) = request.description {
            dashboard_content.description = description;
            content_updated = true;
        }
        
        // Update content if we have changes to the YAML structure
        if content_updated || request.config.is_some() || request.metrics.is_some() {
            // Update the content field with the modified dashboard_content
            let content_value = dashboard_content.to_value()?;
            
            diesel::update(dashboard_files::table)
                .filter(dashboard_files::id.eq(dashboard_id))
                .filter(dashboard_files::deleted_at.is_null())
                .set(dashboard_files::content.eq(content_value))
                .execute(&mut conn)
                .await?;
                
            has_changes = true;
        }
        
        // Update name if provided
        if let Some(name) = request.name {
            diesel::update(dashboard_files::table)
                .filter(dashboard_files::id.eq(dashboard_id))
                .filter(dashboard_files::deleted_at.is_null())
                .set(dashboard_files::name.eq(name))
                .execute(&mut conn)
                .await?;
                
            has_changes = true;
        }
        
        // Update sharing properties
        if request.public.is_some() {
            diesel::update(dashboard_files::table)
                .filter(dashboard_files::id.eq(dashboard_id))
                .filter(dashboard_files::deleted_at.is_null())
                .set((
                    dashboard_files::publicly_accessible.eq(request.public.unwrap()),
                    dashboard_files::publicly_enabled_by.eq(Some(*user_id)),
                ))
                .execute(&mut conn)
                .await?;
                
            has_changes = true;
        }
        
        // Update expiry date if provided
        if let Some(expiry_date_str) = &request.public_expiry_date {
            if let Ok(expiry_date) = chrono::DateTime::parse_from_rfc3339(expiry_date_str) {
                diesel::update(dashboard_files::table)
                    .filter(dashboard_files::id.eq(dashboard_id))
                    .filter(dashboard_files::deleted_at.is_null())
                    .set(dashboard_files::public_expiry_date.eq(Some(expiry_date.with_timezone(&Utc))))
                    .execute(&mut conn)
                    .await?;
                    
                has_changes = true;
            } else {
                return Err(anyhow!("Invalid date format for public_expiry_date"));
            }
        }
        
        // Update timestamp if any changes were made
        if has_changes {
            diesel::update(dashboard_files::table)
                .filter(dashboard_files::id.eq(dashboard_id))
                .filter(dashboard_files::deleted_at.is_null())
                .set(dashboard_files::updated_at.eq(Utc::now()))
                .execute(&mut conn)
                .await?;
        }
    }
    
    // Return the updated dashboard
    get_dashboard_handler(&dashboard_id, user_id).await
}

#[cfg(test)]
mod tests {
    use super::*;
    
    // Note: These tests would require a test database setup
    // They are placeholder tests to demonstrate the testing pattern
    
    #[tokio::test]
    async fn test_update_dashboard_handler_with_name() {
        // This test would require a test database with a dashboard
        // Mock the database connection and queries for unit testing
    }
    
    #[tokio::test]
    async fn test_update_dashboard_handler_with_file() {
        // This test would require a test database with a dashboard
        // Mock the database connection and queries for unit testing
    }
    
    #[tokio::test]
    async fn test_update_dashboard_handler_permission_denied() {
        // This test would check that a user without permission cannot update a dashboard
        // Mock the database connection and queries for unit testing
    }
}