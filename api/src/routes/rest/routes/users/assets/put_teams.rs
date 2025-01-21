use anyhow::Result;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::{Extension, Json};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use tokio::spawn;
use uuid::Uuid;

use crate::database::lib::get_pg_pool;
use crate::database::models::User;
use crate::database::schema::teams_to_users;
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use crate::utils::user::user_info::get_user_organization_id;

#[derive(Debug, Serialize, Deserialize)]
pub struct TeamAssignment {
    pub id: Uuid,
    pub assigned: bool,
}

pub async fn put_teams(
    Extension(user): Extension<User>,
    Path(user_id): Path<Uuid>,
    Json(assignments): Json<Vec<TeamAssignment>>,
) -> Result<ApiResponse<()>, (StatusCode, &'static str)> {
    match put_teams_handler(user, user_id, assignments).await {
        Ok(_) => Ok(ApiResponse::NoContent),
        Err(e) => {
            tracing::error!("Error listing teams: {:?}", e);
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "Error listing teams"));
        }
    }
}

async fn put_teams_handler(
    user: User,
    user_id: Uuid,
    assignments: Vec<TeamAssignment>,
) -> Result<()> {
    let organization_id = get_user_organization_id(&user_id).await?;

    if !is_user_workspace_admin_or_data_admin(&user, &organization_id).await? {
        return Err(anyhow::anyhow!("User is not authorized to list teams"));
    };

    let (to_assign, to_unassign): (Vec<_>, Vec<_>) =
        assignments.into_iter().partition(|a| a.assigned);

    let assign_handle = {
        let user_id = user_id;
        spawn(async move {
            if !to_assign.is_empty() {
                let mut conn = get_pg_pool().get().await?;
                for team in to_assign {
                    diesel::insert_into(teams_to_users::table)
                        .values((
                            teams_to_users::team_id.eq(team.id),
                            teams_to_users::user_id.eq(user_id),
                        ))
                        .on_conflict((teams_to_users::team_id, teams_to_users::user_id))
                        .do_update()
                        .set(teams_to_users::deleted_at.eq(None::<chrono::DateTime<chrono::Utc>>))
                        .execute(&mut *conn)
                        .await?;
                }
            }
            Ok::<_, anyhow::Error>(())
        })
    };

    let unassign_handle = {
        let user_id = user_id;
        spawn(async move {
            if !to_unassign.is_empty() {
                let mut conn = get_pg_pool().get().await?;
                diesel::update(teams_to_users::table)
                    .filter(
                        teams_to_users::team_id
                            .eq_any(to_unassign.iter().map(|a| a.id))
                            .and(teams_to_users::user_id.eq(user_id)),
                    )
                    .set(teams_to_users::deleted_at.eq(chrono::Utc::now()))
                    .execute(&mut *conn)
                    .await?;
            }
            Ok::<_, anyhow::Error>(())
        })
    };

    let (assign_result, unassign_result) = tokio::try_join!(assign_handle, unassign_handle)?;
    assign_result?;
    unassign_result?;

    Ok(())
}
