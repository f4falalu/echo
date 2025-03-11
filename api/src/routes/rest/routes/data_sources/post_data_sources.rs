use std::collections::HashMap;

use anyhow::{anyhow, Result};
use axum::http::StatusCode;
use axum::Extension;
use axum::Json;
use chrono::DateTime;
use chrono::Utc;
use database::vault::create_secret;
use diesel::insert_into;
use diesel::upsert::excluded;
use diesel::BoolExpressionMethods;
use diesel::ExpressionMethods;
use diesel::QueryDsl;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use middleware::AuthenticatedUser;

use crate::routes::rest::ApiResponse;
use crate::utils::query_engine::credentials::Credential;
use database::enums::DataSourceOnboardingStatus;
use database::enums::UserOrganizationRole;
use database::models::DataSource;
use database::pool::get_pg_pool;
use database::schema::data_sources;
use database::schema::users_to_organizations;

#[derive(Debug, Deserialize)]
pub struct CreateDataSourceRequest {
    pub name: String,
    pub env: String,
    #[serde(flatten)]
    pub credential: Credential,
}

#[derive(Debug, Serialize)]
pub struct CreateDataSourceResponse {
    pub ids: Vec<Uuid>,
}

pub async fn post_data_sources(
    Extension(user): Extension<AuthenticatedUser>,
    Json(payload): Json<Vec<CreateDataSourceRequest>>,
) -> Result<ApiResponse<CreateDataSourceResponse>, (StatusCode, &'static str)> {
    let ids = match post_data_sources_handler(&user.id, payload).await {
        Ok(ids) => ids,
        Err(e) => {
            tracing::error!("Error creating data sources: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error creating data sources",
            ));
        }
    };

    Ok(ApiResponse::JsonData(CreateDataSourceResponse { ids }))
}

async fn post_data_sources_handler(
    user_id: &Uuid,
    requests: Vec<CreateDataSourceRequest>,
) -> Result<Vec<Uuid>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            return Err(anyhow!("Error getting postgres connection: {}", e));
        }
    };

    let organization_id = match users_to_organizations::table
        .select(users_to_organizations::organization_id)
        .filter(users_to_organizations::deleted_at.is_null())
        .filter(
            users_to_organizations::role
                .eq(UserOrganizationRole::WorkspaceAdmin)
                .or(users_to_organizations::role.eq(UserOrganizationRole::DataAdmin)),
        )
        .filter(users_to_organizations::user_id.eq(user_id))
        .first::<Uuid>(&mut conn)
        .await
    {
        Ok(user_org) => user_org,
        Err(diesel::NotFound) => {
            return Err(anyhow!("User does not have appropriate permissions"));
        }
        Err(e) => {
            return Err(anyhow!("Error getting user organization: {}", e));
        }
    };

    let data_sources = requests
        .iter()
        .map(|request| DataSource {
            id: Uuid::new_v4(),
            name: request.name.clone(),
            type_: request.credential.get_type(),
            secret_id: Uuid::new_v4(),
            organization_id,
            created_by: *user_id,
            updated_by: *user_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            onboarding_status: DataSourceOnboardingStatus::NotStarted,
            onboarding_error: None,
            env: request.env.clone(),
        })
        .collect::<Vec<DataSource>>();

    match insert_into(data_sources::table)
        .values(&data_sources)
        .on_conflict((
            data_sources::name,
            data_sources::organization_id,
            data_sources::env,
        ))
        .do_update()
        .set((
            data_sources::type_.eq(excluded(data_sources::type_)),
            data_sources::updated_by.eq(excluded(data_sources::updated_by)),
            data_sources::secret_id.eq(excluded(data_sources::secret_id)),
            data_sources::updated_at.eq(chrono::Utc::now()),
            data_sources::deleted_at.eq(Option::<DateTime<Utc>>::None),
            data_sources::env.eq(excluded(data_sources::env)),
        ))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => {
            return Err(anyhow!("Error inserting data source: {}", e));
        }
    };

    let secret_values = requests
        .iter()
        .map(|request| {
            (
                request.name.clone(),
                serde_json::to_string(&request.credential).unwrap(),
            )
        })
        .collect::<HashMap<String, String>>();

    for data_source in data_sources.iter() {
        if let Some(secret_value) = secret_values.get(&data_source.name) {
            match create_secret(&data_source.id, secret_value).await {
                Ok(_) => (),
                Err(e) => {
                    return Err(anyhow!("Error creating secret: {}", e));
                }
            };
        }
    }

    Ok(data_sources.iter().map(|ds| ds.id).collect())
}
