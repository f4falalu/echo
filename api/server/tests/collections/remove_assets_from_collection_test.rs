use crate::common::{
    assertions::{response::ResponseAssertions, model::ModelAssertions},
    fixtures::{self, collections::CollectionFixtureBuilder, dashboards::DashboardFileFixtureBuilder, metrics::MetricFileFixtureBuilder},
    http::client::TestClient,
};
use database::{
    enums::AssetType,
    models::CollectionToAsset,
    pool::get_pg_pool,
    schema::collections_to_assets,
};
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use diesel_async::RunQueryDsl as AsyncRunQueryDsl;
use serde_json::json;
use uuid::Uuid;

#[tokio::test]
async fn test_remove_assets_from_collection() {
    // Set up test data
    let user = fixtures::users::create_test_user_with_organization().await;
    let client = TestClient::new_authenticated(&user).await;
    
    // Create a collection and assets
    let collection = CollectionFixtureBuilder::new()
        .with_user(&user)
        .with_organization_id(user.organization_id)
        .build()
        .create()
        .await;
    
    let dashboard = DashboardFileFixtureBuilder::new()
        .with_user(&user)
        .with_organization_id(user.organization_id)
        .build()
        .create()
        .await;
    
    let metric = MetricFileFixtureBuilder::new()
        .with_user(&user)
        .with_organization_id(user.organization_id)
        .build()
        .create()
        .await;
    
    // Add assets to collection
    let mut conn = get_pg_pool().get().await.unwrap();
    
    // Create dashboard to collection relationship
    let dashboard_to_collection = CollectionToAsset {
        collection_id: collection.id,
        asset_id: dashboard.id,
        asset_type: AssetType::DashboardFile,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by: user.id,
        updated_by: user.id,
    };
    
    diesel::insert_into(collections_to_assets::table)
        .values(&dashboard_to_collection)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Create metric to collection relationship
    let metric_to_collection = CollectionToAsset {
        collection_id: collection.id,
        asset_id: metric.id,
        asset_type: AssetType::MetricFile,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        deleted_at: None,
        created_by: user.id,
        updated_by: user.id,
    };
    
    diesel::insert_into(collections_to_assets::table)
        .values(&metric_to_collection)
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Verify assets are in collection
    let count = collections_to_assets::table
        .filter(collections_to_assets::collection_id.eq(collection.id))
        .filter(collections_to_assets::deleted_at.is_null())
        .count()
        .get_result::<i64>(&mut conn)
        .await
        .unwrap();
    
    assert_eq!(count, 2, "Setup should have 2 assets in collection");
    
    // Remove the assets from the collection
    let response = client
        .delete(&format!("/collections/{}/assets", collection.id))
        .json(&json!({
            "assets": [
                {
                    "id": dashboard.id,
                    "type": "dashboard"
                },
                {
                    "id": metric.id,
                    "type": "metric"
                }
            ]
        }))
        .send()
        .await;
    
    // Verify the response
    response.assert_status_ok();
    let response_body = response.json_body().await;
    
    assert_eq!(response_body["message"], "Assets processed");
    assert_eq!(response_body["removed_count"], 2);
    assert_eq!(response_body["failed_count"], 0);
    assert!(response_body["failed_assets"].as_array().unwrap().is_empty());
    
    // Verify assets are no longer in collection (soft deleted)
    let count = collections_to_assets::table
        .filter(collections_to_assets::collection_id.eq(collection.id))
        .filter(collections_to_assets::deleted_at.is_null())
        .count()
        .get_result::<i64>(&mut conn)
        .await
        .unwrap();
    
    assert_eq!(count, 0, "All assets should be removed from collection");
    
    // Verify that the records were soft deleted, not hard deleted
    let deleted_count = collections_to_assets::table
        .filter(collections_to_assets::collection_id.eq(collection.id))
        .filter(collections_to_assets::deleted_at.is_not_null())
        .count()
        .get_result::<i64>(&mut conn)
        .await
        .unwrap();
    
    assert_eq!(deleted_count, 2, "Assets should be soft deleted");
}

#[tokio::test]
async fn test_remove_non_existent_asset_from_collection() {
    // Set up test data
    let user = fixtures::users::create_test_user_with_organization().await;
    let client = TestClient::new_authenticated(&user).await;
    
    // Create a collection
    let collection = CollectionFixtureBuilder::new()
        .with_user(&user)
        .with_organization_id(user.organization_id)
        .build()
        .create()
        .await;
    
    // Try to remove a non-existent asset
    let non_existent_id = Uuid::new_v4();
    let response = client
        .delete(&format!("/collections/{}/assets", collection.id))
        .json(&json!({
            "assets": [
                {
                    "id": non_existent_id,
                    "type": "dashboard"
                }
            ]
        }))
        .send()
        .await;
    
    // Verify the response
    response.assert_status_ok();
    let response_body = response.json_body().await;
    
    assert_eq!(response_body["message"], "Assets processed");
    assert_eq!(response_body["removed_count"], 0);
    assert_eq!(response_body["failed_count"], 1);
    
    let failed_assets = response_body["failed_assets"].as_array().unwrap();
    assert_eq!(failed_assets.len(), 1);
    assert_eq!(failed_assets[0]["id"], non_existent_id.to_string());
    assert_eq!(failed_assets[0]["type"], "dashboard");
    assert!(failed_assets[0]["error"].as_str().unwrap().contains("not found"));
}

#[tokio::test]
async fn test_collection_not_found() {
    // Set up test data
    let user = fixtures::users::create_test_user_with_organization().await;
    let client = TestClient::new_authenticated(&user).await;
    
    // Try to remove assets from a non-existent collection
    let non_existent_id = Uuid::new_v4();
    let response = client
        .delete(&format!("/collections/{}/assets", non_existent_id))
        .json(&json!({
            "assets": [
                {
                    "id": Uuid::new_v4(),
                    "type": "dashboard"
                }
            ]
        }))
        .send()
        .await;
    
    // Verify the response
    response.assert_status_not_found();
    let error_text = response.text().await;
    assert!(error_text.contains("Collection not found"));
}