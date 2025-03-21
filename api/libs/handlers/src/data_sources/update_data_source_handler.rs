use std::str::FromStr;

use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use diesel::{AsChangeset, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::{
    enums::DataSourceType,
    models::{DataSource, User, UserToOrganization},
    pool::get_pg_pool,
    schema::{data_sources, users, users_to_organizations},
    vault::{read_secret, update_secret},
};

/// Request for updating a data source
#[derive(Debug, Deserialize)]
pub struct UpdateDataSourceRequest {
    pub name: Option<String>,
    pub env: Option<String>,
    #[serde(flatten)]
    pub credential: Option<serde_json::Value>,
}

/// Changeset for updating a data source
#[derive(AsChangeset)]
#[diesel(table_name = data_sources)]
struct DataSourceChangeset {
    name: Option<String>,
    env: Option<String>,
    updated_at: DateTime<Utc>,
    updated_by: Uuid,
    #[diesel(column_name = type_)]
    type_field: Option<String>,
}

/// Part of the response showing the user who created the data source
#[derive(Serialize)]
pub struct CreatedBy {
    pub id: String,
    pub email: String,
    pub name: String,
}

/// Credentials information in the response
#[derive(Serialize)]
pub struct Credentials {
    pub database: Option<String>,
    pub host: String,
    pub jump_host: Option<String>,
    pub password: String,
    pub port: u64,
    pub schemas: Option<Vec<String>>,
    pub ssh_private_key: Option<String>,
    pub ssh_username: Option<String>,
    pub username: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dataset_ids: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub credentials_json: Option<serde_json::Value>,
}

/// Response for a data source
#[derive(Serialize)]
pub struct DataSourceResponse {
    pub id: String,
    pub name: String,
    pub db_type: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: CreatedBy,
    pub credentials: Credentials,
    pub data_sets: Vec<serde_json::Value>, // Empty for now, could be populated if needed
}

/// Handler for updating a data source
pub async fn update_data_source_handler(
    user_id: &Uuid,
    data_source_id: &Uuid,
    request: UpdateDataSourceRequest,
) -> Result<DataSourceResponse> {
    let mut conn = get_pg_pool().get().await?;

    // Verify user has access to the data source
    let user_org = users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .select(users_to_organizations::all_columns)
        .first::<UserToOrganization>(&mut conn)
        .await
        .map_err(|e| anyhow!("Unable to get user organization: {}", e))?;

    // Get current data source
    let mut data_source = data_sources::table
        .filter(data_sources::id.eq(data_source_id))
        .filter(data_sources::organization_id.eq(user_org.organization_id))
        .filter(data_sources::deleted_at.is_null())
        .first::<DataSource>(&mut conn)
        .await
        .map_err(|e| anyhow!("Data source not found: {}", e))?;

    // Extract type from credentials if present
    let type_field = request
        .credential
        .as_ref()
        .and_then(|cred| cred.get("type"))
        .and_then(|t| t.as_str())
        .map(|s| s.to_string());

    // Only perform database update if there are changes to make
    if request.name.is_some() || request.env.is_some() || type_field.is_some() {
        // Create changeset for update
        let changeset = DataSourceChangeset {
            name: request.name.clone(),
            env: request.env.clone(),
            updated_at: Utc::now(),
            updated_by: *user_id,
            type_field: type_field.clone(),
        };

        // Execute the update
        diesel::update(data_sources::table)
            .filter(data_sources::id.eq(data_source_id))
            .set(changeset)
            .execute(&mut conn)
            .await
            .map_err(|e| anyhow!("Failed to update data source: {}", e))?;

        // Update local variable
        if let Some(name) = &request.name {
            data_source.name = name.clone();
        }

        if let Some(env) = &request.env {
            data_source.env = env.clone();
        }

        if let Some(type_str) = &type_field {
            data_source.type_ = DataSourceType::from_str(type_str).unwrap();
        }
    }

    // Update credentials if provided
    if let Some(credentials) = &request.credential {
        // Read existing secret
        let existing_secret = read_secret(data_source_id).await?;
        let mut existing_credential: serde_json::Value = serde_json::from_str(&existing_secret)?;

        // Merge credential fields
        if let (Some(existing_obj), Some(new_obj)) =
            (existing_credential.as_object_mut(), credentials.as_object())
        {
            for (key, value) in new_obj {
                existing_obj.insert(key.clone(), value.clone());
            }
        }

        // Update the secret
        let secret_json = serde_json::to_string(&existing_credential)?;
        update_secret(data_source_id, &secret_json).await?;
    }

    // Get the creator's information
    let creator = users::table
        .filter(users::id.eq(data_source.created_by))
        .first::<User>(&mut conn)
        .await
        .map_err(|e| anyhow!("Unable to get creator information: {}", e))?;

    // Fetch the current credential data
    let secret = read_secret(data_source_id).await?;
    let credential_json: serde_json::Value = serde_json::from_str(&secret)?;

    // Build credentials based on the data source type
    let db_type = data_source.type_.to_string();
    let credentials = parse_credentials(&db_type, &credential_json)?;

    // Build the response
    Ok(DataSourceResponse {
        id: data_source.id.to_string(),
        name: data_source.name,
        db_type: db_type.to_string(),
        created_at: data_source.created_at,
        updated_at: data_source.updated_at,
        created_by: CreatedBy {
            id: creator.id.to_string(),
            email: creator.email,
            name: creator.name.unwrap_or_else(|| "".to_string()),
        },
        credentials,
        data_sets: Vec::new(),
    })
}

/// Helper function to parse credentials based on data source type
fn parse_credentials(db_type: &str, credential_json: &serde_json::Value) -> Result<Credentials> {
    // Determine port based on database type
    let default_port = match db_type {
        "postgres" | "supabase" => 5432,
        "mysql" | "mariadb" => 3306,
        "redshift" => 5439,
        "sqlserver" => 1433,
        "snowflake" | "bigquery" | "databricks" => 443,
        _ => 5432, // default
    };

    // Extract common credentials with type-specific defaults
    let host = match db_type {
        "bigquery" => "bigquery.googleapis.com".to_string(),
        "snowflake" => credential_json
            .get("account_id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        _ => credential_json
            .get("host")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
    };

    let username = match db_type {
        "bigquery" => "bigquery".to_string(),
        "databricks" => "databricks".to_string(),
        _ => credential_json
            .get("username")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
    };

    let password = match db_type {
        "bigquery" => "".to_string(),
        "databricks" => credential_json
            .get("api_key")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        _ => credential_json
            .get("password")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
    };

    // Handle special database field names by type
    let database = match db_type {
        "mysql" | "mariadb" => None,
        "snowflake" => credential_json
            .get("database_id")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        _ => credential_json
            .get("database")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
    };

    // Handle schemas/databases field based on type
    let schemas = match db_type {
        "mysql" | "mariadb" => credential_json.get("databases").and_then(|v| {
            v.as_array().map(|arr| {
                arr.iter()
                    .filter_map(|s| s.as_str().map(|s| s.to_string()))
                    .collect()
            })
        }),
        _ => credential_json.get("schemas").and_then(|v| {
            v.as_array().map(|arr| {
                arr.iter()
                    .filter_map(|s| s.as_str().map(|s| s.to_string()))
                    .collect()
            })
        }),
    };

    // Get port from credentials or use default
    let port = credential_json
        .get("port")
        .and_then(|v| v.as_u64())
        .unwrap_or(default_port);

    // Handle optional fields
    let project_id = credential_json
        .get("project_id")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    // Extract dataset IDs for BigQuery
    let dataset_ids = if db_type == "bigquery" {
        credential_json
            .get("dataset_ids")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect::<Vec<String>>()
            })
    } else {
        None
    };

    // Handle credentials_json for BigQuery
    let credentials_json = if db_type == "bigquery" {
        credential_json.get("credentials_json").cloned()
    } else {
        None
    };

    // Create Credentials struct
    Ok(Credentials {
        host,
        port,
        username,
        password,
        database,
        schemas,
        jump_host: credential_json
            .get("jump_host")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        ssh_username: credential_json
            .get("ssh_username")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        ssh_private_key: credential_json
            .get("ssh_private_key")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        project_id,
        dataset_ids,
        credentials_json,
    })
}
