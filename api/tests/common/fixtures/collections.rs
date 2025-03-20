use chrono::Utc;
use database::models::Collection;
use uuid::Uuid;

/// Creates a test collection with default values
pub async fn create_test_collection(
    conn: &mut diesel_async::AsyncPgConnection,
    user_id: Uuid,
    org_id: Option<Uuid>,
    name: Option<String>,
) -> anyhow::Result<Collection> {
    use database::pool::get_pg_pool;
    use database::schema::collections;
    use diesel::ExpressionMethods;
    use diesel_async::RunQueryDsl;
    
    let collection_name = name.unwrap_or_else(|| format!("Test Collection {}", Uuid::new_v4()));
    let collection_id = Uuid::new_v4();
    let org_id = org_id.unwrap_or_else(Uuid::new_v4);
    
    let collection = Collection {
        id: collection_id,
        name: collection_name,
        description: Some("Test collection description".to_string()),
        created_by: user_id,
        updated_by: user_id,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
        organization_id: org_id,
    };
    
    // Insert the collection into the database
    diesel::insert_into(collections::table)
        .values(&collection)
        .execute(conn)
        .await?;
    
    Ok(collection)
}