//! Library for handling dataset security and permissions.

use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use database::enums::UserOrganizationRole;
use diesel::prelude::Queryable;
use diesel::{
    BoolExpressionMethods, ExpressionMethods, JoinOnDsl, QueryDsl, Selectable, SelectableHelper,
};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use database::{
    pool::{get_pg_pool, PgPool},
    schema::{
        datasets, datasets_to_permission_groups, permission_groups,
        permission_groups_to_identities, teams_to_users, users_to_organizations,
    },
};

// Define the new struct mirroring the one in search_data_catalog.rs
#[derive(Queryable, Selectable, Clone, Debug)]
#[diesel(table_name = datasets)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct PermissionedDataset {
    pub id: Uuid,
    pub name: String,
    #[diesel(column_name = "yml_file")]
    pub yml_content: Option<String>, // Matches the local struct field name
    #[allow(dead_code)]
    pub created_at: DateTime<Utc>,
    #[allow(dead_code)]
    pub updated_at: DateTime<Utc>,
    #[allow(dead_code)]
    pub deleted_at: Option<DateTime<Utc>>,
}

pub async fn get_permissioned_datasets(
    user_id: &Uuid,
    page: i64,
    page_size: i64,
) -> Result<Vec<PermissionedDataset>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    // Fetch user's organization and role
    let user_org_info = users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .select((
            users_to_organizations::organization_id,
            users_to_organizations::role,
        ))
        .first::<(Uuid, UserOrganizationRole)>(&mut conn)
        .await;

    let datasets_query = match user_org_info {
        Ok((organization_id, role)) => {
            // Check if user has admin/querier role
            if matches!(
                role,
                UserOrganizationRole::WorkspaceAdmin
                    | UserOrganizationRole::DataAdmin
                    | UserOrganizationRole::Querier
            ) {
                // User is admin/querier, return all org datasets
                datasets::table
                    .filter(datasets::organization_id.eq(organization_id))
                    .filter(datasets::deleted_at.is_null())
                    .select(PermissionedDataset::as_select())
                    .limit(page_size)
                    .offset(page * page_size)
                    .load::<PermissionedDataset>(&mut conn)
                    .await
            } else {
                // User is not admin/querier, use permission group logic
                datasets::table
                    .select(PermissionedDataset::as_select())
                    .inner_join(
                        datasets_to_permission_groups::table
                            .on(datasets::id.eq(datasets_to_permission_groups::dataset_id)),
                    )
                    .inner_join(
                        permission_groups::table
                            .on(datasets_to_permission_groups::permission_group_id
                                .eq(permission_groups::id)),
                    )
                    .inner_join(
                        permission_groups_to_identities::table.on(permission_groups::id
                            .eq(permission_groups_to_identities::permission_group_id)),
                    )
                    .inner_join(teams_to_users::table.on(
                        teams_to_users::team_id.eq(permission_groups_to_identities::identity_id),
                    ))
                    .filter(
                        teams_to_users::user_id
                            .eq(user_id)
                            .or(permission_groups_to_identities::identity_id.eq(user_id)),
                    )
                    .filter(datasets::deleted_at.is_null())
                    // Ensure related permission records are not deleted (important for non-admins)
                    .filter(
                        datasets_to_permission_groups::deleted_at
                            .is_null()
                            .and(permission_groups::deleted_at.is_null())
                            .and(permission_groups_to_identities::deleted_at.is_null())
                            .and(teams_to_users::deleted_at.is_null()),
                    )
                    .distinct() // Ensure unique datasets if multiple paths grant access
                    .limit(page_size)
                    .offset(page * page_size)
                    .load::<PermissionedDataset>(&mut conn)
                    .await
            }
        }
        Err(diesel::NotFound) => {
            // User not found in any organization, return empty vec or error?
            // Returning empty for now, indicating no datasets accessible.
            Ok(Vec::new())
        }
        Err(e) => {
            // Other database error fetching user role
            return Err(anyhow!("Error fetching user organization role: {}", e));
        }
    };

    match datasets_query {
        Ok(datasets) => Ok(datasets),
        Err(e) => Err(anyhow!("Unable to get datasets from database: {}", e)),
    }
}

pub async fn has_dataset_access(user_id: &Uuid, dataset_id: &Uuid) -> Result<bool> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    // First, check if the user is an admin/querier for the dataset's organization
    let admin_access = match datasets::table
        .filter(datasets::id.eq(dataset_id))
        .inner_join(
            users_to_organizations::table
                .on(datasets::organization_id.eq(users_to_organizations::organization_id)),
        )
        .filter(users_to_organizations::user_id.eq(user_id))
        .select(users_to_organizations::role)
        .first::<UserOrganizationRole>(&mut conn)
        .await
    {
        Ok(role) => matches!(
            role,
            UserOrganizationRole::WorkspaceAdmin
                | UserOrganizationRole::DataAdmin
                | UserOrganizationRole::Querier
        ),
        Err(diesel::NotFound) => false, // User not in the dataset's organization or dataset doesn't exist
        Err(e) => return Err(anyhow!("Error checking admin access for dataset: {}", e)),
    };

    if admin_access {
        return Ok(true);
    }

    // If not admin, check permission group access (existing logic)
    let group_access = match datasets::table
        .select(datasets::id)
        .inner_join(
            datasets_to_permission_groups::table
                .on(datasets::id.eq(datasets_to_permission_groups::dataset_id)),
        )
        .inner_join(
            permission_groups::table
                .on(datasets_to_permission_groups::permission_group_id.eq(permission_groups::id)),
        )
        .inner_join(
            permission_groups_to_identities::table
                .on(permission_groups::id.eq(permission_groups_to_identities::permission_group_id)),
        )
        .inner_join(
            teams_to_users::table
                .on(teams_to_users::team_id.eq(permission_groups_to_identities::identity_id)),
        )
        .filter(
            teams_to_users::user_id
                .eq(&user_id)
                .or(permission_groups_to_identities::identity_id.eq(&user_id)),
        )
        .filter(datasets::id.eq(&dataset_id))
        .filter(datasets::deleted_at.is_null())
        .filter(
            datasets_to_permission_groups::deleted_at
                .is_null()
                .and(permission_groups::deleted_at.is_null())
                .and(permission_groups_to_identities::deleted_at.is_null())
                .and(teams_to_users::deleted_at.is_null()),
        )
        .first::<Uuid>(&mut conn)
        .await
    {
        Ok(_) => true,
        Err(diesel::NotFound) => false,
        Err(e) => return Err(anyhow!("Unable to get team datasets from database: {}", e)),
    };

    Ok(group_access)
}
