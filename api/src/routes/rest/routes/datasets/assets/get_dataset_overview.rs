use anyhow::Result;
use axum::http::StatusCode;
use axum::{extract::Path, Extension};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use serde::Serialize;
use uuid::Uuid;

use crate::database::enums::IdentityType;
use crate::database::schema::{datasets, permission_groups, permission_groups_to_identities};
use crate::database::{
    enums::{UserOrganizationRole, UserOrganizationStatus},
    lib::get_pg_pool,
    models::User,
    schema::{dataset_permissions, users, users_to_organizations},
};
use crate::routes::rest::ApiResponse;
use crate::utils::security::checks::is_user_workspace_admin_or_data_admin;
use crate::utils::user::user_info::get_user_organization_id;

#[derive(Debug, Serialize)]
pub struct UserPermissionLineage {
    pub id: Option<Uuid>,
    #[serde(rename = "type")]
    pub type_: String,
    pub name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct UserOverviewItem {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub can_query: bool,
    pub lineage: Vec<Vec<UserPermissionLineage>>,
}

#[derive(Debug, Serialize)]
pub struct DatasetOverview {
    pub dataset_id: Uuid,
    pub users: Vec<UserOverviewItem>,
}

pub async fn get_dataset_overview(
    Extension(user): Extension<User>,
    Path(dataset_id): Path<Uuid>,
) -> Result<ApiResponse<DatasetOverview>, (StatusCode, &'static str)> {
    // Check if user is workspace admin or data admin
    let organization_id = get_user_organization_id(&user.id).await.map_err(|e| {
        tracing::error!("Error getting user organization id: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Error getting user organization id")
    })?;

    match is_user_workspace_admin_or_data_admin(&user, &organization_id).await {
        Ok(true) => (),
        Ok(false) => return Err((StatusCode::FORBIDDEN, "Insufficient permissions")),
        Err(e) => {
            tracing::error!("Error checking user permissions: {:?}", e);
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error checking user permissions",
            ));
        }
    }

    let mut conn = get_pg_pool().get().await.map_err(|e| {
        tracing::error!("Error getting database connection: {:?}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
    })?;

    // Get all active users in the organization
    let users = users_to_organizations::table
        .inner_join(users::table.on(users_to_organizations::user_id.eq(users::id)))
        .filter(users_to_organizations::status.eq(UserOrganizationStatus::Active))
        .filter(users_to_organizations::deleted_at.is_null())
        .filter(users_to_organizations::organization_id.eq(organization_id))
        .select((
            users::id,
            users::email,
            users_to_organizations::role,
            users::name.nullable(),
        ))
        .load::<(Uuid, String, UserOrganizationRole, Option<String>)>(&mut conn)
        .await
        .map_err(|e| {
            tracing::error!("Error getting users: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
        })?;

    let user_ids = users.iter().map(|(id, _, _, _)| *id).collect::<Vec<_>>();

    let datasets_query: Vec<(Uuid, String, Uuid)> = dataset_permissions::table
        .inner_join(datasets::table.on(dataset_permissions::dataset_id.eq(datasets::id)))
        .filter(dataset_permissions::dataset_id.eq(dataset_id))
        .filter(dataset_permissions::permission_type.eq("user"))
        .filter(dataset_permissions::deleted_at.is_null())
        .filter(dataset_permissions::permission_id.eq_any(&user_ids))
        .select((
            datasets::id,
            datasets::name,
            dataset_permissions::permission_id,
        ))
        .load::<(Uuid, String, Uuid)>(&mut conn)
        .await
        .map_err(|e| {
            tracing::error!("Error getting datasets: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
        })?;

    let permission_groups_query: Vec<(Uuid, String, Uuid)> = permission_groups_to_identities::table
        .inner_join(
            permission_groups::table
                .on(permission_groups_to_identities::permission_group_id.eq(permission_groups::id)),
        )
        .inner_join(
            dataset_permissions::table.on(permission_groups_to_identities::permission_group_id
                .eq(dataset_permissions::permission_id)
                .and(dataset_permissions::permission_type.eq("permission_group"))),
        )
        .filter(permission_groups_to_identities::identity_id.eq_any(&user_ids))
        .filter(permission_groups_to_identities::identity_type.eq(IdentityType::User))
        .filter(dataset_permissions::deleted_at.is_null())
        .filter(dataset_permissions::dataset_id.eq(dataset_id))
        .filter(permission_groups::deleted_at.is_null())
        .select((
            permission_groups::id,
            permission_groups::name,
            permission_groups_to_identities::identity_id,
        ))
        .load::<(Uuid, String, Uuid)>(&mut conn)
        .await
        .map_err(|e| {
            tracing::error!("Error getting permission groups: {:?}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Database error")
        })?;

    println!("datasets_query: {:?}", datasets_query);
    println!("permission_groups_query: {:?}", permission_groups_query);

    // TODO: will need to add dataset groups here when we turn them on.

    let users = users
        .into_iter()
        .map(|(id, email, role, name)| {
            let can_query = match role {
                UserOrganizationRole::WorkspaceAdmin => true,
                UserOrganizationRole::DataAdmin => true,
                UserOrganizationRole::Querier => true,
                _ => false,
            };

            let mut lineage = vec![];
            let mut org_lineage = vec![UserPermissionLineage {
                id: Some(id),
                type_: String::from("user"),
                name: Some(String::from("Default Access")),
            }];

            match role {
                UserOrganizationRole::WorkspaceAdmin => {
                    org_lineage.push(UserPermissionLineage {
                        id: Some(id),
                        type_: String::from("user"),
                        name: Some(String::from("Workspace Admin")),
                    });
                }
                UserOrganizationRole::DataAdmin => {
                    org_lineage.push(UserPermissionLineage {
                        id: Some(id),
                        type_: String::from("user"),
                        name: Some(String::from("Data Admin")),
                    });
                }
                UserOrganizationRole::Querier => {
                    org_lineage.push(UserPermissionLineage {
                        id: Some(id),
                        type_: String::from("user"),
                        name: Some(String::from("Querier")),
                    });
                }
                UserOrganizationRole::RestrictedQuerier => {
                    org_lineage.push(UserPermissionLineage {
                        id: Some(id),
                        type_: String::from("user"),
                        name: Some(String::from("Restricted Querier")),
                    });
                }
                UserOrganizationRole::Viewer => {
                    org_lineage.push(UserPermissionLineage {
                        id: Some(id),
                        type_: String::from("user"),
                        name: Some(String::from("Viewer")),
                    });
                }
            }

            lineage.push(org_lineage);

            // Add direct dataset access lineage
            if let Some((dataset_id, dataset_name, _)) =
                datasets_query.iter().find(|(_, _, user_id)| *user_id == id)
            {
                lineage.push(vec![
                    UserPermissionLineage {
                        id: None,
                        type_: String::from("datasets"),
                        name: Some(String::from("Datasets")),
                    },
                    UserPermissionLineage {
                        id: Some(*dataset_id),
                        type_: String::from("datasets"),
                        name: Some(dataset_name.clone()),
                    },
                ]);
            }

            // Add permission group lineage
            if let Some((group_id, group_name, _)) = permission_groups_query
                .iter()
                .find(|(_, _, user_id)| *user_id == id)
            {
                lineage.push(vec![
                    UserPermissionLineage {
                        id: None,
                        type_: String::from("permissionGroups"),
                        name: Some(String::from("Permission Groups")),
                    },
                    UserPermissionLineage {
                        id: Some(*group_id),
                        type_: String::from("permissionGroups"),
                        name: Some(group_name.clone()),
                    },
                ]);
            }

            return UserOverviewItem {
                id,
                name: name.unwrap_or(email.clone()),
                can_query,
                lineage,
                email,
            };
        })
        .collect();

    let overview = DatasetOverview { dataset_id, users };

    Ok(ApiResponse::JsonData(overview))
}
