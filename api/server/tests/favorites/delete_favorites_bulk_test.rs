use anyhow::Result;
use serde_json::json;
use uuid::Uuid;

use database::enums::AssetType;
use handlers::favorites::{create_favorite, CreateFavoriteReq};
use crate::common::{
    setup_test_env, TestApp, TestDb, TestTaggable, FixtureBuilder,
    assertions::ResponseAssertions,
};

#[tokio::test]
async fn test_delete_single_favorite_by_id() -> Result<()> {
    // Setup
    setup_test_env();
    let test_db = TestDb::new().await?;
    test_db.setup_test_data().await?;
    
    let test_app = TestApp::new().await?;
    let client = test_app.client();
    
    // Create a test user and dashboard to favorite
    let user = FixtureBuilder::create_user().build();
    let dashboard = FixtureBuilder::create_dashboard().with_user(&user).build();
    
    // Save fixtures to database
    let mut conn = test_db.pool.get().await?;
    user.save(&mut conn).await?;
    dashboard.save(&mut conn).await?;
    
    // Create favorite first
    let response = client
        .post(&format!("/api/users/me/favorites"))
        .json(&json!({
            "id": dashboard.id,
            "asset_type": "DashboardFile"
        }))
        .header("x-user-id", user.id.to_string())
        .send()
        .await?;
    
    response.assert_status_ok()?;
    
    // Now delete the favorite using path parameter
    let response = client
        .delete(&format!("/api/users/me/favorites/{}", dashboard.id))
        .header("x-user-id", user.id.to_string())
        .send()
        .await?;
    
    response.assert_status_ok()?;
    let body = response.json::<Vec<serde_json::Value>>().await?;
    
    // Assert that the favorite is no longer in the list
    let still_favorited = body.iter().any(|item| item["id"] == dashboard.id.to_string());
    assert!(!still_favorited, "Dashboard is still in favorites after deletion");
    
    Ok(())
}

#[tokio::test]
async fn test_delete_multiple_favorites_bulk() -> Result<()> {
    // Setup
    setup_test_env();
    let test_db = TestDb::new().await?;
    test_db.setup_test_data().await?;
    
    let test_app = TestApp::new().await?;
    let client = test_app.client();
    
    // Create a test user and multiple assets to favorite
    let user = FixtureBuilder::create_user().build();
    let dashboard1 = FixtureBuilder::create_dashboard().with_user(&user).build();
    let dashboard2 = FixtureBuilder::create_dashboard().with_user(&user).build();
    let collection = FixtureBuilder::create_collection().with_user(&user).build();
    
    // Save fixtures to database
    let mut conn = test_db.pool.get().await?;
    user.save(&mut conn).await?;
    dashboard1.save(&mut conn).await?;
    dashboard2.save(&mut conn).await?;
    collection.save(&mut conn).await?;
    
    // Create favorites first
    let response = client
        .post(&format!("/api/users/me/favorites"))
        .json(&json!([
            {
                "id": dashboard1.id,
                "asset_type": "DashboardFile"
            },
            {
                "id": dashboard2.id,
                "asset_type": "DashboardFile"
            },
            {
                "id": collection.id,
                "asset_type": "Collection"
            }
        ]))
        .header("x-user-id", user.id.to_string())
        .send()
        .await?;
    
    response.assert_status_ok()?;
    
    // Now delete multiple favorites using bulk endpoint
    let response = client
        .delete(&format!("/api/users/me/favorites"))
        .json(&json!([dashboard1.id, dashboard2.id]))
        .header("x-user-id", user.id.to_string())
        .send()
        .await?;
    
    response.assert_status_ok()?;
    let body = response.json::<Vec<serde_json::Value>>().await?;
    
    // Assert that the deleted favorites are no longer in the list
    let dashboard1_found = body.iter().any(|item| item["id"] == dashboard1.id.to_string());
    let dashboard2_found = body.iter().any(|item| item["id"] == dashboard2.id.to_string());
    let collection_found = body.iter().any(|item| item["id"] == collection.id.to_string());
    
    assert!(!dashboard1_found, "Dashboard 1 is still in favorites after deletion");
    assert!(!dashboard2_found, "Dashboard 2 is still in favorites after deletion");
    assert!(collection_found, "Collection should still be in favorites");
    
    Ok(())
}