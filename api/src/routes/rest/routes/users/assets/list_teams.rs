use anyhow::Result;
use axum::http::StatusCode;
use axum::Extension;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use crate::database::lib::get_pg_pool;
use crate::database::models::{Team, User};
use crate::database::schema::teams;
use crate::routes::rest::ApiResponse;
use crate::utils::user::user_info::get_user_organization_id;

#[derive(Debug, Serialize)]
pub struct TeamInfo {
    pub id: Uuid,
    pub name: String,
    pub organization_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn list_teams(
    Extension(user): Extension<User>,
) -> Result<ApiResponse<Vec<TeamInfo>>, (StatusCode, &'static str)> {
    let teams = match list_teams_handler(user).await {
        Ok(teams) => teams,
        Err(e) => {
            tracing::error!("Error listing teams: {:?}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Error listing teams"));
        }
    };

    Ok(ApiResponse::JsonData(teams))
}

async fn list_teams_handler(user: User) -> Result<Vec<TeamInfo>> {
    let mut conn = get_pg_pool().get().await?;
    let organization_id = get_user_organization_id(&user.id).await?;

    let teams: Vec<Team> = teams::table
        .filter(teams::organization_id.eq(organization_id))
        .filter(teams::deleted_at.is_null())
        .order_by(teams::created_at.desc())
        .load(&mut *conn)
        .await?;

    Ok(teams
        .into_iter()
        .map(|team| TeamInfo {
            id: team.id,
            name: team.name,
            organization_id: team.organization_id,
            created_at: team.created_at,
            updated_at: team.updated_at,
        })
        .collect())
}
