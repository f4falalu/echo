use anyhow::Result;
use axum::{
    body::Body,
    extract::{Extension, Path},
    http::{Request, StatusCode},
    routing::delete,
    Router,
};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    models::{CollectionToAsset, DashboardFile},
    pool::get_pg_pool,
    schema::{collections, collections_to_assets, dashboard_files},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::dashboards::remove_dashboard_from_collections_handler;
use middleware::AuthenticatedUser;
use serde_json::{json, Value};
use sharing::check_asset_permission::has_permission;
use std::str::FromStr;
use tokio::test;
use tower::ServiceExt;
use uuid::Uuid;

use crate::common::{db::TestDb, helpers::create_test_user};

#[test]
async fn test_remove_dashboard_from_collections() -> Result<()> {
    let test_db = TestDb::new().await?;
    
    // Create test user
    let user = create_test_user(&test_db.pool).await?;
    
    // Create test dashboard
    let dashboard_id = Uuid::new_v4();
    let dashboard = DashboardFile {
        id: dashboard_id,
        name: "Test Dashboard".to_string(),
        created_by: user.id,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        content: serde_json::from_str(r#"{"name": "Test Dashboard", "rows": []}"#)?,
        filter: None,
        version_history: None,
        organization_id: user.organization_id,
        status: None,
    };
    
    // Create test collection
    let collection_id = Uuid::new_v4();
    diesel::insert_into(collections::table)
        .values((
            collections::id.eq(collection_id),
            collections::name.eq("Test Collection"),
            collections::created_by.eq(user.id),
            collections::created_at.eq(chrono::Utc::now()),
            collections::updated_at.eq(chrono::Utc::now()),
            collections::organization_id.eq(user.organization_id),
        ))
        .execute(&mut test_db.pool.get().await?)
        .await?;
    
    // Add dashboard to collection
    let collection_to_asset = CollectionToAsset {
        id: Uuid::new_v4(),
        collection_id,
        asset_id: dashboard_id,
        asset_type: AssetType::DashboardFile,
        created_by: user.id,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        updated_by: user.id,
        deleted_at: None,
    };
    
    diesel::insert_into(collections_to_assets::table)
        .values(&collection_to_asset)
        .execute(&mut test_db.pool.get().await?)
        .await?;
    
    // Test removing the dashboard from the collection
    let result = remove_dashboard_from_collections_handler(
        &dashboard_id,
        vec![collection_id],
        &user.id,
    )
    .await?;
    
    assert_eq!(result.removed_count, 1);
    assert_eq!(result.failed_count, 0);
    assert!(result.failed_ids.is_empty());
    
    // Verify the dashboard was removed from the collection
    let removed = collections_to_assets::table
        .filter(collections_to_assets::collection_id.eq(collection_id))
        .filter(collections_to_assets::asset_id.eq(dashboard_id))
        .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
        .filter(collections_to_assets::deleted_at.is_not_null())
        .count()
        .get_result::<i64>(&mut test_db.pool.get().await?)
        .await?;
    
    assert_eq!(removed, 1);
    
    // Test the REST endpoint
    let app = Router::new().route(
        "/:id/collections",
        delete(crate::src::routes::rest::routes::dashboards::remove_dashboard_from_collections::remove_dashboard_from_collections),
    );
    
    let request_body = json!({
        "collection_ids": [collection_id]
    });
    
    let request = Request::builder()
        .uri(format!("/{}/collections", dashboard_id))
        .method("DELETE")
        .header("Content-Type", "application/json")
        .body(Body::from(serde_json::to_string(&request_body)?))?;
    
    let response = app
        .oneshot(request)
        .await?;
    
    assert_eq!(response.status(), StatusCode::OK);
    
    Ok(())
}