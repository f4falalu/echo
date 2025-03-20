use crate::common::{
    fixtures::{collections::create_collection, dashboards::create_dashboard, metrics::create_metric, users::create_user},
    http::test_app::create_test_app,
    matchers::json::json_eq,
};
use axum::{body::Body, http::Request};
use database::{
    enums::{AssetPermissionRole, AssetType, IdentityType},
    pool::get_pg_pool,
    schema::{asset_permissions, collections, collections_to_assets},
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use http::StatusCode;
use serde_json::{json, Value};
use sharing::create_asset_permission::create_asset_permission;
use uuid::Uuid;

#[tokio::test]
async fn test_add_assets_to_collection() {
    // Create a test app and database connection
    let app = create_test_app().await;
    let pool = get_pg_pool();
    let mut conn = pool.get().await.unwrap();

    // Create test user, collection, dashboard, and metric
    let user = create_user(None).await;
    let collection = create_collection(user.id, None).await;
    let dashboard = create_dashboard(user.id, None).await;
    let metric = create_metric(user.id, None).await;

    // Give the user permission to the collection as owner
    create_asset_permission(
        user.id,
        IdentityType::User,
        collection.id,
        AssetType::Collection,
        AssetPermissionRole::Owner,
        user.id,
    )
    .await
    .unwrap();

    // Give the user permission to the dashboard and metric
    create_asset_permission(
        user.id,
        IdentityType::User,
        dashboard.id,
        AssetType::DashboardFile,
        AssetPermissionRole::CanView,
        user.id,
    )
    .await
    .unwrap();

    create_asset_permission(
        user.id,
        IdentityType::User,
        metric.id,
        AssetType::MetricFile,
        AssetPermissionRole::CanView,
        user.id,
    )
    .await
    .unwrap();

    // Build request to add assets to collection
    let request = Request::builder()
        .uri(format!("/collections/{}/assets", collection.id))
        .method("POST")
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", user.id))
        .body(Body::from(
            json!({
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
            })
            .to_string(),
        ))
        .unwrap();

    // Send the request
    let response = app.oneshot(request).await.unwrap();

    // Check the response
    assert_eq!(response.status(), StatusCode::OK);

    // Parse the response body
    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let response_json: Value = serde_json::from_slice(&body).unwrap();

    // Verify the response structure
    assert!(json_eq(
        &response_json,
        &json!({
            "message": "Assets processed",
            "added_count": 2,
            "failed_count": 0,
            "failed_assets": []
        })
    ));

    // Verify that the assets were added to the database
    let dashboard_asset = collections_to_assets::table
        .filter(collections_to_assets::collection_id.eq(collection.id))
        .filter(collections_to_assets::asset_id.eq(dashboard.id))
        .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
        .filter(collections_to_assets::deleted_at.is_null())
        .first::<database::models::CollectionToAsset>(&mut conn)
        .await;

    let metric_asset = collections_to_assets::table
        .filter(collections_to_assets::collection_id.eq(collection.id))
        .filter(collections_to_assets::asset_id.eq(metric.id))
        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .filter(collections_to_assets::deleted_at.is_null())
        .first::<database::models::CollectionToAsset>(&mut conn)
        .await;

    // Assert that both assets exist in the collection
    assert!(dashboard_asset.is_ok());
    assert!(metric_asset.is_ok());
}

#[tokio::test]
async fn test_add_assets_to_collection_permission_denied() {
    // Create a test app
    let app = create_test_app().await;

    // Create test user, collection, dashboard, and metric
    let user = create_user(None).await;
    let other_user = create_user(None).await;
    let collection = create_collection(other_user.id, None).await;
    let dashboard = create_dashboard(user.id, None).await;

    // No permissions are given to the user for the collection

    // Build request to add assets to collection
    let request = Request::builder()
        .uri(format!("/collections/{}/assets", collection.id))
        .method("POST")
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", user.id))
        .body(Body::from(
            json!({
                "assets": [
                    {
                        "id": dashboard.id,
                        "type": "dashboard"
                    }
                ]
            })
            .to_string(),
        ))
        .unwrap();

    // Send the request
    let response = app.oneshot(request).await.unwrap();

    // Check that permission is denied
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn test_add_assets_to_collection_not_found() {
    // Create a test app
    let app = create_test_app().await;

    // Create test user and dashboard
    let user = create_user(None).await;
    let dashboard = create_dashboard(user.id, None).await;

    // Create a non-existent collection ID
    let non_existent_collection_id = Uuid::new_v4();

    // Build request to add assets to a non-existent collection
    let request = Request::builder()
        .uri(format!("/collections/{}/assets", non_existent_collection_id))
        .method("POST")
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", user.id))
        .body(Body::from(
            json!({
                "assets": [
                    {
                        "id": dashboard.id,
                        "type": "dashboard"
                    }
                ]
            })
            .to_string(),
        ))
        .unwrap();

    // Send the request
    let response = app.oneshot(request).await.unwrap();

    // Check that collection not found
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_add_nonexistent_assets_to_collection() {
    // Create a test app
    let app = create_test_app().await;

    // Create test user and collection
    let user = create_user(None).await;
    let collection = create_collection(user.id, None).await;

    // Give the user permission to the collection
    create_asset_permission(
        user.id,
        IdentityType::User,
        collection.id,
        AssetType::Collection,
        AssetPermissionRole::Owner,
        user.id,
    )
    .await
    .unwrap();

    // Create a non-existent dashboard ID
    let non_existent_dashboard_id = Uuid::new_v4();

    // Build request to add non-existent assets to collection
    let request = Request::builder()
        .uri(format!("/collections/{}/assets", collection.id))
        .method("POST")
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", user.id))
        .body(Body::from(
            json!({
                "assets": [
                    {
                        "id": non_existent_dashboard_id,
                        "type": "dashboard"
                    }
                ]
            })
            .to_string(),
        ))
        .unwrap();

    // Send the request
    let response = app.oneshot(request).await.unwrap();

    // Check the response - should return 200 but with failed assets
    assert_eq!(response.status(), StatusCode::OK);

    // Parse the response body
    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let response_json: Value = serde_json::from_slice(&body).unwrap();

    // Verify the response contains the failed asset
    assert!(json_eq(
        &response_json,
        &json!({
            "message": "Assets processed",
            "added_count": 0,
            "failed_count": 1,
            "failed_assets": [
                {
                    "id": non_existent_dashboard_id,
                    "type": "dashboard",
                    "error": "Dashboard not found"
                }
            ]
        })
    ));
}

#[tokio::test]
async fn test_add_duplicate_assets_to_collection() {
    // Create a test app and database connection
    let app = create_test_app().await;
    let pool = get_pg_pool();
    let mut conn = pool.get().await.unwrap();

    // Create test user, collection, and dashboard
    let user = create_user(None).await;
    let collection = create_collection(user.id, None).await;
    let dashboard = create_dashboard(user.id, None).await;

    // Give the user permission to the collection and dashboard
    create_asset_permission(
        user.id,
        IdentityType::User,
        collection.id,
        AssetType::Collection,
        AssetPermissionRole::Owner,
        user.id,
    )
    .await
    .unwrap();

    create_asset_permission(
        user.id,
        IdentityType::User,
        dashboard.id,
        AssetType::DashboardFile,
        AssetPermissionRole::CanView,
        user.id,
    )
    .await
    .unwrap();

    // First, add the dashboard to the collection
    diesel::insert_into(collections_to_assets::table)
        .values((
            collections_to_assets::collection_id.eq(collection.id),
            collections_to_assets::asset_id.eq(dashboard.id),
            collections_to_assets::asset_type.eq(AssetType::DashboardFile),
            collections_to_assets::created_at.eq(chrono::Utc::now()),
            collections_to_assets::created_by.eq(user.id),
            collections_to_assets::updated_at.eq(chrono::Utc::now()),
            collections_to_assets::updated_by.eq(user.id),
        ))
        .execute(&mut conn)
        .await
        .unwrap();

    // Build request to add the same dashboard again
    let request = Request::builder()
        .uri(format!("/collections/{}/assets", collection.id))
        .method("POST")
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", user.id))
        .body(Body::from(
            json!({
                "assets": [
                    {
                        "id": dashboard.id,
                        "type": "dashboard"
                    }
                ]
            })
            .to_string(),
        ))
        .unwrap();

    // Send the request
    let response = app.oneshot(request).await.unwrap();

    // Check the response - should return 200 as the asset is already in the collection
    assert_eq!(response.status(), StatusCode::OK);

    // Parse the response body
    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let response_json: Value = serde_json::from_slice(&body).unwrap();

    // Verify the response structure (added_count is 1 because we consider existing assets as "added")
    assert!(json_eq(
        &response_json,
        &json!({
            "message": "Assets processed",
            "added_count": 1,
            "failed_count": 0,
            "failed_assets": []
        })
    ));
}