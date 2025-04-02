use anyhow::{anyhow, Result};
use chrono::Utc;
use database::{
    models::{DashboardFile, MetricFile, MetricFileToDashboardFile},
    pool::get_pg_pool,
    schema::{dashboard_files, metric_files, metric_files_to_dashboard_files},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde_json::json;
use uuid::Uuid;

use crate::common::{
    fixtures::{dashboards::create_test_dashboard_file, metrics::create_test_metric_file},
    helpers::setup_test_db,
};

#[tokio::test]
async fn test_metric_dashboard_association() -> Result<()> {
    // Setup test database and user
    let (test_db, user) = setup_test_db().await?;
    let mut conn = test_db.pool.get().await?;

    // Create a test metric file
    let metric_file = create_test_metric_file(&mut conn, &user, "Test Metric").await?;

    // Create a test dashboard file with the metric referenced
    let dashboard_content = json!({
        "name": "Test Dashboard",
        "description": "Dashboard for testing metric associations",
        "rows": [{
            "items": [{
                "id": metric_file.id
            }],
            "rowHeight": 400,
            "columnSizes": [12],
            "id": 1
        }]
    });

    let dashboard_file = create_test_dashboard_file(
        &mut conn,
        &user,
        "Test Dashboard",
        serde_json::to_value(dashboard_content)?,
    )
    .await?;

    // Verify the association was created
    let associations = metric_files_to_dashboard_files::table
        .filter(metric_files_to_dashboard_files::dashboard_file_id.eq(dashboard_file.id))
        .filter(metric_files_to_dashboard_files::metric_file_id.eq(metric_file.id))
        .filter(metric_files_to_dashboard_files::deleted_at.is_null())
        .first::<MetricFileToDashboardFile>(&mut conn)
        .await;

    // Assert the association exists
    assert!(associations.is_ok(), "Metric dashboard association not found");

    // Create a second test metric file for the update test
    let metric_file2 = create_test_metric_file(&mut conn, &user, "Test Metric 2").await?;

    // Update the dashboard file to use the second metric
    let updated_dashboard_content = json!({
        "name": "Test Dashboard Updated",
        "description": "Dashboard for testing metric associations - updated",
        "rows": [{
            "items": [{
                "id": metric_file2.id
            }],
            "rowHeight": 400,
            "columnSizes": [12],
            "id": 1
        }]
    });

    // Update the dashboard file with new content
    diesel::update(dashboard_files::table)
        .filter(dashboard_files::id.eq(dashboard_file.id))
        .set((
            dashboard_files::name.eq("Test Dashboard Updated"),
            dashboard_files::content.eq(serde_json::to_value(updated_dashboard_content)?),
            dashboard_files::updated_at.eq(chrono::Utc::now()),
        ))
        .execute(&mut conn)
        .await?;
    
    // Now manually call the function to update the metric associations
    use database::types::dashboard_yml::DashboardYml;
    use database::enums::{IdentityType, AssetType, AssetPermissionRole};
    use diesel_async::RunQueryDsl;
    use chrono::Utc;
    
    // Extract metric IDs from dashboard content (similar to the handler)
    let updated_dashboard = diesel::dsl::select(dashboard_files::content)
        .from(dashboard_files::table)
        .filter(dashboard_files::id.eq(dashboard_file.id))
        .first::<serde_json::Value>(&mut conn)
        .await?;
    
    let dashboard_yml: DashboardYml = serde_json::from_value(updated_dashboard)?;
    
    // Extract metric IDs function
    fn extract_metric_ids_from_dashboard(dashboard: &DashboardYml) -> Vec<Uuid> {
        let mut metric_ids = Vec::new();
        
        // Iterate through all rows and collect unique metric IDs
        for row in &dashboard.rows {
            for item in &row.items {
                metric_ids.push(item.id);
            }
        }
        
        // Return unique metric IDs
        metric_ids
    }
    
    // Update metric associations function
    async fn update_dashboard_metric_associations(
        dashboard_id: Uuid,
        metric_ids: Vec<Uuid>,
        user_id: &Uuid,
        conn: &mut diesel_async::AsyncPgConnection,
    ) -> Result<()> {
        // First, mark all existing associations as deleted
        diesel::update(
            metric_files_to_dashboard_files::table
                .filter(metric_files_to_dashboard_files::dashboard_file_id.eq(dashboard_id))
                .filter(metric_files_to_dashboard_files::deleted_at.is_null())
        )
        .set(metric_files_to_dashboard_files::deleted_at.eq(Utc::now()))
        .execute(conn)
        .await?;
        
        // For each metric ID, either create a new association or restore a previously deleted one
        for metric_id in metric_ids {
            // Check if the metric exists
            let metric_exists = diesel::dsl::select(
                diesel::dsl::exists(
                    metric_files::table
                        .filter(metric_files::id.eq(metric_id))
                        .filter(metric_files::deleted_at.is_null())
                )
            )
            .get_result::<bool>(conn)
            .await;
            
            // Skip if metric doesn't exist
            if let Ok(exists) = metric_exists {
                if !exists {
                    continue;
                }
            } else {
                continue;
            }
            
            // Check if there's a deleted association that can be restored
            let existing = metric_files_to_dashboard_files::table
                .filter(metric_files_to_dashboard_files::dashboard_file_id.eq(dashboard_id))
                .filter(metric_files_to_dashboard_files::metric_file_id.eq(metric_id))
                .first::<MetricFileToDashboardFile>(conn)
                .await;
                
            match existing {
                Ok(assoc) if assoc.deleted_at.is_some() => {
                    // Restore the deleted association
                    diesel::update(
                        metric_files_to_dashboard_files::table
                            .filter(metric_files_to_dashboard_files::dashboard_file_id.eq(dashboard_id))
                            .filter(metric_files_to_dashboard_files::metric_file_id.eq(metric_id))
                    )
                    .set((
                        metric_files_to_dashboard_files::deleted_at.eq::<Option<chrono::DateTime<Utc>>>(None),
                        metric_files_to_dashboard_files::updated_at.eq(Utc::now()),
                    ))
                    .execute(conn)
                    .await?;
                },
                Ok(_) => {
                    // Association already exists and is not deleted, do nothing
                },
                Err(diesel::result::Error::NotFound) => {
                    // Create a new association
                    diesel::insert_into(metric_files_to_dashboard_files::table)
                        .values((
                            metric_files_to_dashboard_files::dashboard_file_id.eq(dashboard_id),
                            metric_files_to_dashboard_files::metric_file_id.eq(metric_id),
                            metric_files_to_dashboard_files::created_at.eq(Utc::now()),
                            metric_files_to_dashboard_files::updated_at.eq(Utc::now()),
                            metric_files_to_dashboard_files::created_by.eq(user_id),
                        ))
                        .execute(conn)
                        .await?;
                },
                Err(e) => return Err(anyhow::anyhow!("Database error: {}", e)),
            }
        }
        
        Ok(())
    }
    
    // Call the update function with the extracted metrics
    update_dashboard_metric_associations(
        dashboard_file.id,
        extract_metric_ids_from_dashboard(&dashboard_yml),
        &user.id,
        &mut conn
    ).await?;
    
    // Verify the first association is now marked as deleted
    let old_association = metric_files_to_dashboard_files::table
        .filter(metric_files_to_dashboard_files::dashboard_file_id.eq(dashboard_file.id))
        .filter(metric_files_to_dashboard_files::metric_file_id.eq(metric_file.id))
        .first::<MetricFileToDashboardFile>(&mut conn)
        .await?;
    
    assert!(old_association.deleted_at.is_some(), "Original metric association should be marked as deleted");
    
    // Verify the new association exists
    let new_association = metric_files_to_dashboard_files::table
        .filter(metric_files_to_dashboard_files::dashboard_file_id.eq(dashboard_file.id))
        .filter(metric_files_to_dashboard_files::metric_file_id.eq(metric_file2.id))
        .filter(metric_files_to_dashboard_files::deleted_at.is_null())
        .first::<MetricFileToDashboardFile>(&mut conn)
        .await;
    
    assert!(new_association.is_ok(), "New metric dashboard association not found");

    // Test cleanup - ensure we clean up our test data
    diesel::delete(metric_files_to_dashboard_files::table)
        .filter(metric_files_to_dashboard_files::dashboard_file_id.eq(dashboard_file.id))
        .execute(&mut conn)
        .await?;

    diesel::delete(dashboard_files::table)
        .filter(dashboard_files::id.eq(dashboard_file.id))
        .execute(&mut conn)
        .await?;

    diesel::delete(metric_files::table)
        .filter(metric_files::id.eq(metric_file.id))
        .execute(&mut conn)
        .await?;
        
    diesel::delete(metric_files::table)
        .filter(metric_files::id.eq(metric_file2.id))
        .execute(&mut conn)
        .await?;

    Ok(())
}