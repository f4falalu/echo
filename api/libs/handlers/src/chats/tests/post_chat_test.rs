#[cfg(test)]
mod post_chat_handler_tests {
    use chrono::Utc;
    use database::{
        enums::{AssetPermissionRole, AssetType, IdentityType},
        models::{AssetPermission, DashboardFile, MessageToFile, MetricFile, User},
        pool::get_pg_pool,
        schema::{asset_permissions, dashboard_files, messages_to_files, metric_files, users},
    };
    use diesel::prelude::*;
    use diesel::insert_into;
    use diesel_async::RunQueryDsl;
    use middleware::AuthenticatedUser;
    use serde_json::{json, Value};
    use uuid::Uuid;
    use std::collections::HashMap;

    use crate::chats::{
        asset_messages::generate_asset_messages,
        context_loaders::create_asset_context_loader,
        post_chat_handler::ChatCreateNewChat,
        post_chat_handler::post_chat_handler,
    };

    async fn setup_test_user() -> AuthenticatedUser {
        let user_id = Uuid::new_v4();
        let user = User {
            id: user_id,
            name: Some("Test User".to_string()),
            email: "test@example.com".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            avatar_url: None,
            deleted_at: None,
        };
        
        let mut conn = get_pg_pool().get().await.unwrap();
        insert_into(users::table)
            .values(&user)
            .execute(&mut conn)
            .await.unwrap();
        
        let mut attributes = HashMap::new();
        attributes.insert("organization_id".to_string(), Value::String(Uuid::new_v4().to_string()));
        
        AuthenticatedUser {
            id: user_id,
            email: "test@example.com".to_string(),
            name: Some("Test User".to_string()),
            attributes,
        }
    }
    
    async fn setup_test_metric() -> (Uuid, String, AuthenticatedUser) {
        let user = setup_test_user().await;
        let metric_id = Uuid::new_v4();
        let metric_name = "Test Metric";
        
        let metric = MetricFile {
            id: metric_id,
            name: metric_name.to_string(),
            created_by: user.id,
            updated_by: user.id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            content: database::types::metric_yml::MetricYml {
                name: metric_name.to_string(),
                description: Some("Test metric description".to_string()),
                query: "SELECT * FROM test".to_string(),
                dataset_ids: vec![],
                datetime_field: None,
                aggregations: vec![],
                columns: vec![],
                breakdowns: vec![],
                charts: vec![],
                version: None,
            },
        };
        
        let mut conn = get_pg_pool().get().await.unwrap();
        insert_into(metric_files::table)
            .values(&metric)
            .execute(&mut conn)
            .await.unwrap();
            
        // Create permission for the same user
        let permission = AssetPermission {
            asset_id: metric_id,
            asset_type: AssetType::MetricFile,
            identity_id: user.id,
            identity_type: IdentityType::User,
            role: AssetPermissionRole::Owner,
            created_by: user.id,
            updated_by: user.id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
        };
        
        insert_into(asset_permissions::table)
            .values(&permission)
            .execute(&mut conn)
            .await.unwrap();
        
        (metric_id, metric_name.to_string(), user)
    }
    
    async fn setup_test_dashboard() -> (Uuid, String, AuthenticatedUser) {
        let user = setup_test_user().await;
        let dashboard_id = Uuid::new_v4();
        let dashboard_name = "Test Dashboard";
        
        let dashboard = DashboardFile {
            id: dashboard_id,
            name: dashboard_name.to_string(),
            created_by: user.id,
            updated_by: user.id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            content: database::types::dashboard_yml::DashboardYml {
                name: dashboard_name.to_string(),
                description: Some("Test dashboard description".to_string()),
                rows: vec![],
                version: None,
            },
        };
        
        let mut conn = get_pg_pool().get().await.unwrap();
        insert_into(dashboard_files::table)
            .values(&dashboard)
            .execute(&mut conn)
            .await.unwrap();
            
        // Create permission for the same user
        let permission = AssetPermission {
            asset_id: dashboard_id,
            asset_type: AssetType::DashboardFile,
            identity_id: user.id,
            identity_type: IdentityType::User,
            role: AssetPermissionRole::Owner,
            created_by: user.id,
            updated_by: user.id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
        };
        
        insert_into(asset_permissions::table)
            .values(&permission)
            .execute(&mut conn)
            .await.unwrap();
        
        (dashboard_id, dashboard_name.to_string(), user)
    }

    #[tokio::test]
    async fn test_normalize_asset_fields() {
        // Test function to ensure legacy fields are properly normalized
        use crate::chats::post_chat_handler::normalize_asset_fields;
        
        // Test with generic asset fields
        let request = ChatCreateNewChat {
            prompt: None,
            chat_id: None,
            message_id: None,
            asset_id: Some(Uuid::new_v4()),
            asset_type: Some(AssetType::MetricFile),
            metric_id: None,
            dashboard_id: None,
        };
        
        let (asset_id, asset_type) = normalize_asset_fields(&request);
        assert_eq!(asset_id, request.asset_id);
        assert_eq!(asset_type, request.asset_type);
        
        // Test with legacy metric_id
        let metric_id = Uuid::new_v4();
        let request = ChatCreateNewChat {
            prompt: None,
            chat_id: None,
            message_id: None,
            asset_id: None,
            asset_type: None,
            metric_id: Some(metric_id),
            dashboard_id: None,
        };
        
        let (asset_id, asset_type) = normalize_asset_fields(&request);
        assert_eq!(asset_id, Some(metric_id));
        assert_eq!(asset_type, Some(AssetType::MetricFile));
        
        // Test with legacy dashboard_id
        let dashboard_id = Uuid::new_v4();
        let request = ChatCreateNewChat {
            prompt: None,
            chat_id: None,
            message_id: None,
            asset_id: None,
            asset_type: None,
            metric_id: None,
            dashboard_id: Some(dashboard_id),
        };
        
        let (asset_id, asset_type) = normalize_asset_fields(&request);
        assert_eq!(asset_id, Some(dashboard_id));
        assert_eq!(asset_type, Some(AssetType::DashboardFile));
        
        // Test with no asset fields
        let request = ChatCreateNewChat {
            prompt: Some("Test prompt".to_string()),
            chat_id: None,
            message_id: None,
            asset_id: None,
            asset_type: None,
            metric_id: None,
            dashboard_id: None,
        };
        
        let (asset_id, asset_type) = normalize_asset_fields(&request);
        assert_eq!(asset_id, None);
        assert_eq!(asset_type, None);
    }

    #[tokio::test]
    async fn test_validate_context_request() {
        use crate::chats::context_loaders::validate_context_request;
        
        // Test with no context
        let result = validate_context_request(None, None, None, None, None);
        assert!(result.is_ok());
        
        // Test with chat_id only
        let result = validate_context_request(Some(Uuid::new_v4()), None, None, None, None);
        assert!(result.is_ok());
        
        // Test with asset_id and asset_type
        let result = validate_context_request(None, Some(Uuid::new_v4()), Some(AssetType::MetricFile), None, None);
        assert!(result.is_ok());
        
        // Test with asset_id but no asset_type
        let result = validate_context_request(None, Some(Uuid::new_v4()), None, None, None);
        assert!(result.is_err());
        
        // Test with multiple contexts
        let result = validate_context_request(Some(Uuid::new_v4()), Some(Uuid::new_v4()), Some(AssetType::MetricFile), None, None);
        assert!(result.is_err());
        
        // Test with multiple contexts (legacy)
        let result = validate_context_request(None, None, None, Some(Uuid::new_v4()), Some(Uuid::new_v4()));
        assert!(result.is_err());
        
        // Test with mixed contexts
        let result = validate_context_request(None, Some(Uuid::new_v4()), Some(AssetType::MetricFile), Some(Uuid::new_v4()), None);
        assert!(result.is_err());
    }
    
    #[tokio::test]
    async fn test_generate_asset_messages() {
        // Test the asset message generator directly
        let (metric_id, metric_name, user) = setup_test_metric().await;
        
        let messages = generate_asset_messages(metric_id, AssetType::MetricFile, &user).await.unwrap();
        
        // Should generate two messages
        assert_eq!(messages.len(), 2);
        
        // First should be a file message
        let file_message = &messages[0];
        let file_response: Vec<Value> = serde_json::from_value(file_message.response_messages.clone()).unwrap();
        assert_eq!(file_response.len(), 1);
        assert_eq!(file_response[0]["type"], "file");
        assert_eq!(file_response[0]["fileType"], "metric");
        assert_eq!(file_response[0]["fileName"], metric_name);
        assert_eq!(file_response[0]["versionId"], metric_id.to_string());
        
        // Second should be a text message
        let text_message = &messages[1];
        let text_response: Vec<Value> = serde_json::from_value(text_message.response_messages.clone()).unwrap();
        assert_eq!(text_response.len(), 1);
        assert_eq!(text_response[0]["type"], "text");
        assert_eq!(text_response[0]["message"], "DALLIN NEEDS TO PUT VALUE HERE");
    }
    
    #[tokio::test]
    async fn test_create_asset_context_loader() {
        // Test the context loader factory
        let (metric_id, _, _) = setup_test_metric().await;
        
        // Create metric context loader
        let loader = create_asset_context_loader(metric_id, AssetType::MetricFile);
        
        // Type checking isn't possible here easily, but we can verify it doesn't panic
        assert!(loader.is_some()); // This is just checking that the Box isn't null
        
        // Create dashboard context loader
        let (dashboard_id, _, _) = setup_test_dashboard().await;
        let loader = create_asset_context_loader(dashboard_id, AssetType::DashboardFile);
        assert!(loader.is_some());
        
        // Test with unsupported asset type
        let loader = create_asset_context_loader(Uuid::new_v4(), AssetType::Dataset);
        assert!(loader.is_some()); // Should still return a loader, but it might return an error when used
    }
    
    #[tokio::test]
    async fn test_post_chat_handler_with_prompt() {
        let user = setup_test_user().await;
        
        let request = ChatCreateNewChat {
            prompt: Some("Test prompt".to_string()),
            chat_id: None,
            message_id: None,
            asset_id: None,
            asset_type: None,
            metric_id: None,
            dashboard_id: None,
        };
        
        let result = post_chat_handler(request, user, None).await;
        assert!(result.is_ok());
        
        let chat_with_messages = result.unwrap();
        assert!(chat_with_messages.title.contains("Test prompt"));
        assert_eq!(chat_with_messages.message_ids.len(), 1);
        
        let message_id = Uuid::parse_str(&chat_with_messages.message_ids[0]).unwrap();
        let message = chat_with_messages.messages.get(&message_id.to_string()).unwrap();
        assert_eq!(message.request.request, "Test prompt");
    }
    
    #[tokio::test]
    async fn test_post_chat_handler_with_asset_id_no_prompt() {
        let (metric_id, metric_name, user) = setup_test_metric().await;
        
        let request = ChatCreateNewChat {
            prompt: None,
            chat_id: None,
            message_id: None,
            asset_id: Some(metric_id),
            asset_type: Some(AssetType::MetricFile),
            metric_id: None,
            dashboard_id: None,
        };
        
        let result = post_chat_handler(request, user, None).await;
        assert!(result.is_ok());
        
        let chat_with_messages = result.unwrap();
        assert!(chat_with_messages.title.contains(&format!("View {}", metric_name)));
        assert_eq!(chat_with_messages.message_ids.len(), 2); // Should have file and text messages
        
        // Check both messages for correct types
        let mut has_file_message = false;
        let mut has_text_message = false;
        
        for message_id_str in &chat_with_messages.message_ids {
            let message = chat_with_messages.messages.get(message_id_str).unwrap();
            
            // Check response messages
            for response in &message.response_messages {
                if let Some(message_type) = response.get("type") {
                    if message_type == "file" {
                        has_file_message = true;
                        
                        // Verify file metadata
                        assert_eq!(response.get("fileType").unwrap(), "metric");
                        assert_eq!(response.get("fileName").unwrap(), metric_name);
                    } else if message_type == "text" {
                        has_text_message = true;
                        
                        // Verify text content
                        assert_eq!(response.get("message").unwrap(), "DALLIN NEEDS TO PUT VALUE HERE");
                    }
                }
            }
        }
        
        assert!(has_file_message, "Missing file message");
        assert!(has_text_message, "Missing text message");
        
        // Verify file association is created in database
        let mut conn = get_pg_pool().get().await.unwrap();
        
        let file_associations = messages_to_files::table
            .filter(messages_to_files::file_id.eq(metric_id))
            .load::<MessageToFile>(&mut conn)
            .await
            .unwrap();
            
        assert_eq!(file_associations.len(), 1, "Expected one file association");
    }
    
    #[tokio::test]
    async fn test_post_chat_handler_with_legacy_dashboard_id_no_prompt() {
        let (dashboard_id, dashboard_name, user) = setup_test_dashboard().await;
        
        let request = ChatCreateNewChat {
            prompt: None,
            chat_id: None,
            message_id: None,
            asset_id: None,
            asset_type: None,
            metric_id: None,
            dashboard_id: Some(dashboard_id),
        };
        
        let result = post_chat_handler(request, user, None).await;
        assert!(result.is_ok());
        
        let chat_with_messages = result.unwrap();
        assert!(chat_with_messages.title.contains(&format!("View {}", dashboard_name)));
        assert_eq!(chat_with_messages.message_ids.len(), 2); // Should have file and text messages
        
        // Check both messages for correct types
        let mut has_file_message = false;
        let mut has_text_message = false;
        
        for message_id_str in &chat_with_messages.message_ids {
            let message = chat_with_messages.messages.get(message_id_str).unwrap();
            
            // Check response messages
            for response in &message.response_messages {
                if let Some(message_type) = response.get("type") {
                    if message_type == "file" {
                        has_file_message = true;
                        
                        // Verify file metadata
                        assert_eq!(response.get("fileType").unwrap(), "dashboard");
                        assert_eq!(response.get("fileName").unwrap(), dashboard_name);
                    } else if message_type == "text" {
                        has_text_message = true;
                        
                        // Verify text content
                        assert_eq!(response.get("message").unwrap(), "DALLIN NEEDS TO PUT VALUE HERE");
                    }
                }
            }
        }
        
        assert!(has_file_message, "Missing file message");
        assert!(has_text_message, "Missing text message");
        
        // Verify file association is created in database
        let mut conn = get_pg_pool().get().await.unwrap();
        
        let file_associations = messages_to_files::table
            .filter(messages_to_files::file_id.eq(dashboard_id))
            .load::<MessageToFile>(&mut conn)
            .await
            .unwrap();
            
        assert_eq!(file_associations.len(), 1, "Expected one file association");
    }
    
    #[tokio::test]
    async fn test_post_chat_handler_with_asset_and_prompt() {
        let (metric_id, _, user) = setup_test_metric().await;
        
        let request = ChatCreateNewChat {
            prompt: Some("Test prompt with asset".to_string()),
            chat_id: None,
            message_id: None,
            asset_id: Some(metric_id),
            asset_type: Some(AssetType::MetricFile),
            metric_id: None,
            dashboard_id: None,
        };
        
        let result = post_chat_handler(request, user, None).await;
        assert!(result.is_ok());
        
        let chat_with_messages = result.unwrap();
        assert!(chat_with_messages.title.contains("Test prompt with asset"));
        
        // Should have only one message (the prompt) since we provide both prompt and asset
        // The asset will be used as context for the LLM but not as a separate message
        assert_eq!(chat_with_messages.message_ids.len(), 1);
        
        let message_id = Uuid::parse_str(&chat_with_messages.message_ids[0]).unwrap();
        let message = chat_with_messages.messages.get(&message_id.to_string()).unwrap();
        assert_eq!(message.request.request, "Test prompt with asset");
    }
    
    #[tokio::test]
    async fn test_post_chat_handler_with_invalid_asset() {
        let user = setup_test_user().await;
        
        // Test with non-existent asset ID
        let request = ChatCreateNewChat {
            prompt: None,
            chat_id: None,
            message_id: None,
            asset_id: Some(Uuid::new_v4()), // Random non-existent ID
            asset_type: Some(AssetType::MetricFile),
            metric_id: None,
            dashboard_id: None,
        };
        
        let result = post_chat_handler(request, user, None).await;
        assert!(result.is_err(), "Expected error for non-existent asset");
    }
    
    #[tokio::test]
    async fn test_permission_checks() {
        // Setup a metric
        let (metric_id, _, _) = setup_test_metric().await;
        
        // Create a different user without permissions
        let unauthorized_user = setup_test_user().await;
        
        let request = ChatCreateNewChat {
            prompt: None,
            chat_id: None,
            message_id: None,
            asset_id: Some(metric_id),
            asset_type: Some(AssetType::MetricFile),
            metric_id: None,
            dashboard_id: None,
        };
        
        let result = post_chat_handler(request, unauthorized_user, None).await;
        assert!(result.is_err(), "Expected permission error for unauthorized user");
    }
    
    #[tokio::test]
    async fn test_chat_creation_with_specified_message_id() {
        let user = setup_test_user().await;
        let specified_message_id = Uuid::new_v4();
        
        let request = ChatCreateNewChat {
            prompt: Some("Test prompt with specified message ID".to_string()),
            chat_id: None,
            message_id: Some(specified_message_id),
            asset_id: None,
            asset_type: None,
            metric_id: None,
            dashboard_id: None,
        };
        
        let result = post_chat_handler(request, user, None).await;
        assert!(result.is_ok());
        
        let chat_with_messages = result.unwrap();
        
        // Verify the specified message ID was used
        let message_ids: Vec<Uuid> = chat_with_messages.message_ids
            .iter()
            .map(|id| Uuid::parse_str(id).unwrap())
            .collect();
        
        assert!(message_ids.contains(&specified_message_id), 
                "Chat should contain the specified message ID");
    }
}