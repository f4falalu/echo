use anyhow::Result;
use axum::http::StatusCode;
use database::enums::{AssetPermissionRole, AssetType, UserOrganizationRole, Verification};
use database::tests::common::assets::AssetTestHelpers;
use database::tests::common::db::DbTestHelpers;
use database::tests::common::permissions::PermissionTestHelpers;
use database::tests::common::users::UserTestHelpers;
use futures::future::try_join_all;
use handlers::metrics::{BulkUpdateMetricsRequest, BulkUpdateMetricsResponse, MetricStatusUpdate};
use middleware::AuthenticatedUser;
use uuid::Uuid;
use database::types::VersionHistory;

/// Test the bulk update endpoint with authorization
#[tokio::test]
async fn test_bulk_update_metrics_endpoint() -> Result<()> {
    // Initialize test app with auth
    let (app, test_db, _auth_token, user) = DbTestHelpers::init_test_app_with_auth().await?;
    
    // Create authenticated user with admin role
    let admin_authenticated_user = AuthenticatedUser {
        id: user.id,
        email: user.email.clone(),
        name: user.name.clone().unwrap_or_default(),
        organizations: vec![middleware::Organization {
            id: test_db.organization_id,
            role: UserOrganizationRole::WorkspaceAdmin,
        }],
    };

    // Create test metrics
    let metric_count = 5;
    let metric_ids = try_join_all((0..metric_count).map(|i| {
        AssetTestHelpers::create_test_metric(
            &test_db, 
            &format!("Test Metric {}", i),
            Some(user.id),
            Some(test_db.organization_id),
        )
    })).await?;
    
    // Add permissions for the user
    for metric_id in &metric_ids {
        PermissionTestHelpers::create_permission(
            &test_db,
            *metric_id,
            AssetType::MetricFile,
            user.id,
            AssetPermissionRole::Owner,
        ).await?;
    }
    
    // Create update request
    let updates = metric_ids
        .iter()
        .map(|id| MetricStatusUpdate {
            id: *id,
            verification: Verification::Verified,
        })
        .collect();
    
    let request = BulkUpdateMetricsRequest {
        updates,
        batch_size: 5,
    };
    
    // Test successful update
    let response = reqwest::Client::new()
        .put(format!("{}/metrics", app.address))
        .header("Authorization", format!("Bearer {}", _auth_token))
        .json(&request)
        .send()
        .await?;
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let body: BulkUpdateMetricsResponse = response.json().await?;
    assert_eq!(body.success_count, metric_count);
    assert_eq!(body.failure_count, 0);
    assert!(body.failed_updates.is_empty());
    
    // Verify database state
    let mut conn = test_db.get_conn().await?;
    for id in &metric_ids {
        let metric_file = database::schema::metric_files::table
            .filter(database::schema::metric_files::id.eq(id))
            .first::<database::models::MetricFile>(&mut conn)
            .await?;
            
        assert_eq!(metric_file.verification, Verification::Verified);
    }
    
    // Test invalid batch size
    let request = BulkUpdateMetricsRequest {
        updates: vec![MetricStatusUpdate {
            id: metric_ids[0],
            verification: Verification::InReview,
        }],
        batch_size: 101, // Exceeds max allowed batch size
    };
    
    let response = reqwest::Client::new()
        .put(format!("{}/metrics", app.address))
        .header("Authorization", format!("Bearer {}", _auth_token))
        .json(&request)
        .send()
        .await?;
    
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    
    // Test unauthorized access
    let other_user = UserTestHelpers::create_test_user(&test_db).await?;
    let other_metric = AssetTestHelpers::create_test_metric(
        &test_db,
        "Other User's Metric",
        Some(other_user.id),
        Some(test_db.organization_id),
    ).await?;
    
    // Try to update a mix of allowed and forbidden metrics
    let request = BulkUpdateMetricsRequest {
        updates: vec![
            MetricStatusUpdate {
                id: metric_ids[0],
                verification: Verification::InReview,
            },
            MetricStatusUpdate {
                id: other_metric,
                verification: Verification::InReview,
            },
        ],
        batch_size: 10,
    };
    
    let response = reqwest::Client::new()
        .put(format!("{}/metrics", app.address))
        .header("Authorization", format!("Bearer {}", _auth_token))
        .json(&request)
        .send()
        .await?;
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let body: BulkUpdateMetricsResponse = response.json().await?;
    assert_eq!(body.success_count, 1, "Should only update the authorized metric");
    assert_eq!(body.failure_count, 1, "Should fail to update the unauthorized metric");
    assert_eq!(body.failed_updates.len(), 1);
    assert_eq!(body.failed_updates[0].metric_id, other_metric);
    assert_eq!(body.failed_updates[0].error_code, "PERMISSION_DENIED");
    
    // Test with nonexistent metrics
    let request = BulkUpdateMetricsRequest {
        updates: vec![
            MetricStatusUpdate {
                id: Uuid::new_v4(),
                verification: Verification::Verified,
            },
        ],
        batch_size: 10,
    };
    
    let response = reqwest::Client::new()
        .put(format!("{}/metrics", app.address))
        .header("Authorization", format!("Bearer {}", _auth_token))
        .json(&request)
        .send()
        .await?;
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let body: BulkUpdateMetricsResponse = response.json().await?;
    assert_eq!(body.success_count, 0);
    assert_eq!(body.failure_count, 1);
    assert_eq!(body.failed_updates[0].error_code, "NOT_FOUND");
    
    // Test with empty updates list
    let request = BulkUpdateMetricsRequest {
        updates: vec![],
        batch_size: 10,
    };
    
    let response = reqwest::Client::new()
        .put(format!("{}/metrics", app.address))
        .header("Authorization", format!("Bearer {}", _auth_token))
        .json(&request)
        .send()
        .await?;
    
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    
    // Cleanup
    for id in &metric_ids {
        database::tests::helpers::test_utils::cleanup_test_data(&mut conn, &[*id]).await?;
    }
    database::tests::helpers::test_utils::cleanup_test_data(&mut conn, &[other_metric]).await?;
    
    Ok(())
}

/// Test for rate limiting of the bulk update endpoint
#[tokio::test]
async fn test_bulk_update_concurrency() -> Result<()> {
    // Initialize test app with auth
    let (app, test_db, _auth_token, user) = DbTestHelpers::init_test_app_with_auth().await?;
    
    // Create authenticated user with admin role
    let admin_authenticated_user = AuthenticatedUser {
        id: user.id,
        email: user.email.clone(),
        name: user.name.clone().unwrap_or_default(),
        organizations: vec![middleware::Organization {
            id: test_db.organization_id,
            role: UserOrganizationRole::WorkspaceAdmin,
        }],
    };

    // Create test metrics (a larger batch)
    let metric_count = 25;
    let metric_ids = try_join_all((0..metric_count).map(|i| {
        AssetTestHelpers::create_test_metric(
            &test_db, 
            &format!("Test Metric {}", i),
            Some(user.id),
            Some(test_db.organization_id),
        )
    })).await?;
    
    // Add permissions for the user
    for metric_id in &metric_ids {
        PermissionTestHelpers::create_permission(
            &test_db,
            *metric_id,
            AssetType::MetricFile,
            user.id,
            AssetPermissionRole::Owner,
        ).await?;
    }
    
    // Create update request
    let updates = metric_ids
        .iter()
        .map(|id| MetricStatusUpdate {
            id: *id,
            verification: Verification::Verified,
        })
        .collect();
    
    // Test different batch sizes
    let batch_sizes = vec![5, 10, 25];
    
    for batch_size in batch_sizes {
        let request = BulkUpdateMetricsRequest {
            updates: updates.clone(),
            batch_size,
        };
        
        let start = std::time::Instant::now();
        let response = reqwest::Client::new()
            .put(format!("{}/metrics", app.address))
            .header("Authorization", format!("Bearer {}", _auth_token))
            .json(&request)
            .send()
            .await?;
        let duration = start.elapsed();
        
        assert_eq!(response.status(), StatusCode::OK);
        
        println!("Batch size {} took {:?} for {} metrics", batch_size, duration, metric_count);
        
        let body: BulkUpdateMetricsResponse = response.json().await?;
        assert_eq!(body.success_count, metric_count);
    }
    
    // Cleanup
    let mut conn = test_db.get_conn().await?;
    for id in &metric_ids {
        database::tests::helpers::test_utils::cleanup_test_data(&mut conn, &[*id]).await?;
    }
    
    Ok(())
}