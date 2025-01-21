use anyhow::Result;
use axum::{extract::Path, Extension};
use diesel_async::RunQueryDsl;
use futures::future::try_join_all;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    database::{
        enums::{IdentityType, UserOrganizationRole, UserOrganizationStatus},
        lib::get_pg_pool,
        models::User,
        schema::{
            dataset_permissions, datasets, permission_groups, permission_groups_to_identities,
            users, users_to_organizations,
        },
    },
    routes::rest::ApiResponse,
    utils::clients::sentry_utils::send_sentry_error,
};
use axum::http::StatusCode;
use diesel::{
    BoolExpressionMethods, ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl,
};

#[derive(Serialize, Deserialize, Clone)]
pub struct DatasetLineage {
    pub id: Option<Uuid>,
    #[serde(rename = "type")]
    pub type_: String,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DatasetInfo {
    pub id: Uuid,
    pub name: String,
    pub can_query: bool,
    pub lineage: Vec<Vec<DatasetLineage>>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UserResponse {
    pub id: Uuid,
    pub name: Option<String>,
    pub email: String,
    pub role: UserOrganizationRole,
    pub status: UserOrganizationStatus,
    pub datasets: Vec<DatasetInfo>,
}

pub async fn get_user_by_id(
    Extension(user): Extension<User>,
    Path(user_id): Path<Uuid>,
) -> Result<ApiResponse<UserResponse>, (StatusCode, &'static str)> {
    let user_info = match get_user_information(&user_id).await {
        Ok(user_info) => user_info,
        Err(e) => {
            tracing::error!("Error getting user information: {:?}", e);
            send_sentry_error(&e.to_string(), Some(&user.id));
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error getting user information",
            ));
        }
    };

    Ok(ApiResponse::JsonData(user_info))
}

pub async fn get_user_information(user_id: &Uuid) -> Result<UserResponse> {
    let user_id = *user_id;

    // Spawn user info query
    let user_info_future = {
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting database connection: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            let user_info = match users::table
                .inner_join(
                    users_to_organizations::table.on(users::id.eq(users_to_organizations::user_id)),
                )
                .select((
                    (users::id, users::email, users::name.nullable()),
                    (users_to_organizations::role, users_to_organizations::status),
                    users_to_organizations::organization_id,
                ))
                .filter(users::id.eq(user_id))
                .first::<(
                    (Uuid, String, Option<String>),
                    (UserOrganizationRole, UserOrganizationStatus),
                    Uuid,
                )>(&mut conn)
                .await
            {
                Ok(user_info) => user_info,
                Err(e) => {
                    tracing::error!("Error getting user information: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            Ok(user_info)
        })
    };

    // Spawn direct datasets query
    let direct_datasets_future = {
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting database connection: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            let direct_datasets = match dataset_permissions::table
                .inner_join(datasets::table.on(dataset_permissions::dataset_id.eq(datasets::id)))
                .filter(dataset_permissions::permission_id.eq(user_id))
                .filter(dataset_permissions::permission_type.eq("user"))
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .select((datasets::id, datasets::name))
                .load::<(Uuid, String)>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => {
                    tracing::error!("Error getting direct datasets: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            Ok(direct_datasets)
        })
    };

    // Spawn permission group datasets query
    let permission_group_datasets_future = {
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting database connection: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            let permission_group_datasets = match permission_groups_to_identities::table
                .inner_join(permission_groups::table.on(
                    permission_groups_to_identities::permission_group_id.eq(permission_groups::id),
                ))
                .inner_join(
                    dataset_permissions::table.on(
                        permission_groups_to_identities::permission_group_id
                            .eq(dataset_permissions::permission_id)
                            .and(dataset_permissions::permission_type.eq("permission_group")),
                    ),
                )
                .inner_join(datasets::table.on(dataset_permissions::dataset_id.eq(datasets::id)))
                .filter(permission_groups_to_identities::identity_id.eq(user_id))
                .filter(permission_groups_to_identities::identity_type.eq(IdentityType::User))
                .filter(dataset_permissions::deleted_at.is_null())
                .filter(permission_groups::deleted_at.is_null())
                .filter(datasets::deleted_at.is_null())
                .select((
                    datasets::id,
                    datasets::name,
                    permission_groups::id,
                    permission_groups::name,
                ))
                .load::<(Uuid, String, Uuid, String)>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => {
                    tracing::error!("Error getting permission group datasets: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            Ok(permission_group_datasets)
        })
    };

    // Spawn all organization datasets query
    let org_datasets_future = {
        tokio::spawn(async move {
            let mut conn = match get_pg_pool().get().await {
                Ok(conn) => conn,
                Err(e) => {
                    tracing::error!("Error getting database connection: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            let org_datasets = match datasets::table
                .inner_join(
                    users_to_organizations::table.on(
                        datasets::organization_id.eq(users_to_organizations::organization_id),
                    ),
                )
                .filter(users_to_organizations::user_id.eq(user_id))
                .filter(datasets::deleted_at.is_null())
                .select((datasets::id, datasets::name))
                .load::<(Uuid, String)>(&mut conn)
                .await
            {
                Ok(datasets) => datasets,
                Err(e) => {
                    tracing::error!("Error getting organization datasets: {:?}", e);
                    return Err(anyhow::anyhow!(e));
                }
            };

            Ok(org_datasets)
        })
    };

    // Await all futures
    let (user_result, direct_datasets, permission_group_datasets, org_datasets) = futures::try_join!(
        user_info_future,
        direct_datasets_future,
        permission_group_datasets_future,
        org_datasets_future,
    )?;

    let ((user, (role, status), _org_id), direct_datasets, permission_group_datasets, org_datasets) = (
        user_result?,
        direct_datasets?,
        permission_group_datasets?,
        org_datasets?,
    );

    let (id, email, name) = user;

    let can_query = matches!(
        role,
        UserOrganizationRole::WorkspaceAdmin
            | UserOrganizationRole::DataAdmin
            | UserOrganizationRole::Querier
    );

    let mut datasets = Vec::new();
    let mut processed_dataset_ids = std::collections::HashSet::new();

    // Add datasets with direct access
    for (dataset_id, dataset_name) in direct_datasets {
        processed_dataset_ids.insert(dataset_id);
        let mut lineage = vec![];
        let mut org_lineage = vec![DatasetLineage {
            id: Some(id),
            type_: String::from("user"),
            name: Some(String::from("Direct Access")),
        }];

        match role {
            UserOrganizationRole::WorkspaceAdmin => {
                org_lineage.push(DatasetLineage {
                    id: Some(id),
                    type_: String::from("user"),
                    name: Some(String::from("Workspace Admin")),
                });
            }
            UserOrganizationRole::DataAdmin => {
                org_lineage.push(DatasetLineage {
                    id: Some(id),
                    type_: String::from("user"),
                    name: Some(String::from("Data Admin")),
                });
            }
            UserOrganizationRole::Querier => {
                org_lineage.push(DatasetLineage {
                    id: Some(id),
                    type_: String::from("user"),
                    name: Some(String::from("Querier")),
                });
            }
            _ => {}
        }

        lineage.push(org_lineage);
        lineage.push(vec![
            DatasetLineage {
                id: None,
                type_: String::from("datasets"),
                name: Some(String::from("Datasets")),
            },
            DatasetLineage {
                id: Some(dataset_id),
                type_: String::from("datasets"),
                name: Some(dataset_name.clone()),
            },
        ]);

        datasets.push(DatasetInfo {
            id: dataset_id,
            name: dataset_name,
            can_query,
            lineage,
        });
    }

    // Add datasets with permission group access
    for (dataset_id, dataset_name, group_id, group_name) in permission_group_datasets {
        if processed_dataset_ids.contains(&dataset_id) {
            continue;
        }
        processed_dataset_ids.insert(dataset_id);
        let mut lineage = vec![];
        let mut org_lineage = vec![DatasetLineage {
            id: Some(id),
            type_: String::from("user"),
            name: Some(String::from("Permission Group Access")),
        }];

        match role {
            UserOrganizationRole::WorkspaceAdmin => {
                org_lineage.push(DatasetLineage {
                    id: Some(id),
                    type_: String::from("user"),
                    name: Some(String::from("Workspace Admin")),
                });
            }
            UserOrganizationRole::DataAdmin => {
                org_lineage.push(DatasetLineage {
                    id: Some(id),
                    type_: String::from("user"),
                    name: Some(String::from("Data Admin")),
                });
            }
            UserOrganizationRole::Querier => {
                org_lineage.push(DatasetLineage {
                    id: Some(id),
                    type_: String::from("user"),
                    name: Some(String::from("Querier")),
                });
            }
            _ => {}
        }

        lineage.push(org_lineage);
        lineage.push(vec![
            DatasetLineage {
                id: None,
                type_: String::from("permissionGroups"),
                name: Some(String::from("Permission Groups")),
            },
            DatasetLineage {
                id: Some(group_id),
                type_: String::from("permissionGroups"),
                name: Some(group_name),
            },
        ]);
        lineage.push(vec![
            DatasetLineage {
                id: None,
                type_: String::from("datasets"),
                name: Some(String::from("Datasets")),
            },
            DatasetLineage {
                id: Some(dataset_id),
                type_: String::from("datasets"),
                name: Some(dataset_name.clone()),
            },
        ]);

        datasets.push(DatasetInfo {
            id: dataset_id,
            name: dataset_name,
            can_query,
            lineage,
        });
    }

    // Add remaining organization datasets with no access
    for (dataset_id, dataset_name) in org_datasets {
        if processed_dataset_ids.contains(&dataset_id) {
            continue;
        }
        datasets.push(DatasetInfo {
            id: dataset_id,
            name: dataset_name,
            can_query: false,
            lineage: vec![],
        });
    }

    Ok(UserResponse {
        id,
        name,
        email,
        role,
        status,
        datasets,
    })
}
