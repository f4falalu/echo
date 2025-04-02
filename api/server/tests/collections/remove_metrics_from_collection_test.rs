use axum::{
    body::Body,
    http::{Method, Request, StatusCode},
};
use database::enums::{AssetType, AssetPermissionRole, IdentityType};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::common::{
    fixtures::{collections::create_test_collection, metrics::create_test_metric_file, users::create_test_user},
    http::test_app::TestApp,
};

#[tokio::test]
async fn test_remove_metrics_from_collection() {
    let test_app = TestApp::new().await;
    let app = test_app.app();

    // Create test user
    let mut conn = test_app.get_db_conn().await;
    let user = create_test_user(&mut conn).await;
    
    // Create test collection
    let collection = create_test_collection(&mut conn, user.id, None, None).await.unwrap();
    
    // Create test metrics
    let metric1 = create_test_metric_file(&mut conn, user.id, None, None).await.unwrap();
    let metric2 = create_test_metric_file(&mut conn, user.id, None, None).await.unwrap();
    
    // Add metrics to collection
    let mut conn = test_app.get_db_conn().await;
    diesel::insert_into(database::schema::collections_to_assets::table)
        .values(&[
            (
                database::schema::collections_to_assets::collection_id.eq(collection.id),
                database::schema::collections_to_assets::asset_id.eq(metric1.id),
                database::schema::collections_to_assets::asset_type.eq(AssetType::MetricFile),
                database::schema::collections_to_assets::created_by.eq(user.id),
                database::schema::collections_to_assets::updated_by.eq(user.id),
            ),
            (
                database::schema::collections_to_assets::collection_id.eq(collection.id),
                database::schema::collections_to_assets::asset_id.eq(metric2.id),
                database::schema::collections_to_assets::asset_type.eq(AssetType::MetricFile),
                database::schema::collections_to_assets::created_by.eq(user.id),
                database::schema::collections_to_assets::updated_by.eq(user.id),
            ),
        ])
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Create permission for user
    diesel::insert_into(database::schema::asset_permissions::table)
        .values((
            database::schema::asset_permissions::asset_id.eq(collection.id),
            database::schema::asset_permissions::asset_type.eq(AssetType::Collection),
            database::schema::asset_permissions::identity_id.eq(user.id),
            database::schema::asset_permissions::identity_type.eq(IdentityType::User),
            database::schema::asset_permissions::role.eq(AssetPermissionRole::Owner),
            database::schema::asset_permissions::created_by.eq(user.id),
            database::schema::asset_permissions::updated_by.eq(user.id),
        ))
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Make the request to remove metrics
    let request_body = json!({
        "metric_ids": [metric1.id]
    });
    
    let request = Request::builder()
        .method(Method::DELETE)
        .uri(format!("/collections/{}/metrics", collection.id))
        .header("content-type", "application/json")
        .header("authorization", format!("Bearer {}", test_app.create_token_for_user(&user)))
        .body(Body::from(serde_json::to_string(&request_body).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    // Check response status
    assert_eq!(response.status(), StatusCode::OK);
    
    // Verify that metric1 is no longer in the collection
    let metrics_in_collection = database::schema::collections_to_assets::table
        .filter(database::schema::collections_to_assets::collection_id.eq(collection.id))
        .filter(database::schema::collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .filter(database::schema::collections_to_assets::deleted_at.is_null())
        .select(database::schema::collections_to_assets::asset_id)
        .get_results::<Uuid>(&mut conn)
        .await
        .unwrap();
    
    // Should only have metric2
    assert_eq!(metrics_in_collection.len(), 1);
    assert!(!metrics_in_collection.contains(&metric1.id));
    assert!(metrics_in_collection.contains(&metric2.id));
}

#[tokio::test]
async fn test_remove_metrics_from_collection_not_found() {
    let test_app = TestApp::new().await;
    let app = test_app.app();
    
    // Create test user
    let mut conn = test_app.get_db_conn().await;
    let user = create_test_user(&mut conn).await;
    
    // Use a random collection ID that doesn't exist
    let non_existent_collection_id = Uuid::new_v4();
    
    // Make the request to remove metrics
    let request_body = json!({
        "metric_ids": [Uuid::new_v4()]
    });
    
    let request = Request::builder()
        .method(Method::DELETE)
        .uri(format!("/collections/{}/metrics", non_existent_collection_id))
        .header("content-type", "application/json")
        .header("authorization", format!("Bearer {}", test_app.create_token_for_user(&user)))
        .body(Body::from(serde_json::to_string(&request_body).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    // Check response status - should be Not Found
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_remove_metrics_from_collection_unauthorized() {
    let test_app = TestApp::new().await;
    let app = test_app.app();
    
    // Create test users
    let mut conn = test_app.get_db_conn().await;
    let owner = create_test_user(&mut conn).await;
    let unauthorized_user = create_test_user(&mut conn).await;
    
    // Create test collection
    let collection = create_test_collection(&mut conn, owner.id, None, None).await.unwrap();
    
    // Create permission for owner only
    let mut conn = test_app.get_db_conn().await;
    diesel::insert_into(database::schema::asset_permissions::table)
        .values((
            database::schema::asset_permissions::asset_id.eq(collection.id),
            database::schema::asset_permissions::asset_type.eq(AssetType::Collection),
            database::schema::asset_permissions::identity_id.eq(owner.id),
            database::schema::asset_permissions::identity_type.eq(IdentityType::User),
            database::schema::asset_permissions::role.eq(AssetPermissionRole::Owner),
            database::schema::asset_permissions::created_by.eq(owner.id),
            database::schema::asset_permissions::updated_by.eq(owner.id),
        ))
        .execute(&mut conn)
        .await
        .unwrap();
    
    // Make the request to remove metrics with unauthorized user
    let request_body = json!({
        "metric_ids": [Uuid::new_v4()]
    });
    
    let request = Request::builder()
        .method(Method::DELETE)
        .uri(format!("/collections/{}/metrics", collection.id))
        .header("content-type", "application/json")
        .header("authorization", format!("Bearer {}", test_app.create_token_for_user(&unauthorized_user)))
        .body(Body::from(serde_json::to_string(&request_body).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    // Check response status - should be Forbidden
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}