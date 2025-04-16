use anyhow::{Context, Result};
use chrono::Utc;
use database::{
    self,
    enums::{SharingSetting, UserOrganizationRole, UserOrganizationStatus},
    models::{User, UserToOrganization},
    pool::get_pg_pool,
    schema::{users, users_to_organizations},
};
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use middleware::AuthenticatedUser;
use serde_json::json;
use uuid::Uuid;

/// Invites multiple users by creating user records and adding them to the inviter's organization.
/// This function requires an active database transaction.
pub async fn invite_user_handler(
    inviting_user: &AuthenticatedUser,
    emails: Vec<String>,
) -> Result<()> {
    let organization_id = inviting_user
        .organizations
        .get(0) // Accessing the vector of organizations
        .map(|m| m.id) // Use .id as confirmed by search
        .context("Inviting user is not associated with any organization")?;

    let inviter_id = inviting_user.id; // For created_by/updated_by
    let now = Utc::now();

    for email in emails {
        // 1. Generate ID and construct attributes first
        let new_user_id = Uuid::new_v4();
        let user_email = email.clone(); // Clone email for ownership
        let assigned_role = UserOrganizationRole::RestrictedQuerier;
        let user_attributes = json!({
          "user_id": new_user_id.to_string(),
          "user_email": user_email,
          "organization_id": organization_id.to_string(),
          "organization_role": format!("{:?}", assigned_role) // Use variable for role
        });

        // 2. Create User struct instance using the generated ID and attributes
        let user_to_insert = User {
            id: new_user_id,      // Use the generated ID
            email: email.clone(), // Use the original email variable again or the cloned one
            name: None,
            config: json!({}),
            created_at: now,
            updated_at: now,
            attributes: user_attributes, // Use the constructed attributes
            avatar_url: None,
        };

        let mut conn = match get_pg_pool().get().await {
            Ok(mut conn) => conn,
            Err(e) => {
                return Err(e.into());
            }
        };

        // 3. Insert user
        match diesel::insert_into(users::table)
            .values(&user_to_insert)
            .execute(&mut conn)
            .await
        {
            Ok(_) => (),
            Err(e) => {
                return Err(e.into());
            }
        };

        // 4. Create UserToOrganization struct instance
        let user_org_to_insert = UserToOrganization {
            user_id: new_user_id, // Use the generated ID
            organization_id,
            role: assigned_role,                   // Use the role variable
            sharing_setting: SharingSetting::None, // Default setting
            edit_sql: false,                       // Default permission
            upload_csv: false,                     // Default permission
            export_assets: false,                  // Default permission
            email_slack_enabled: false,            // Default setting
            created_at: now,
            updated_at: now,
            deleted_at: None,
            created_by: inviter_id,
            updated_by: inviter_id,
            deleted_by: None,
            status: UserOrganizationStatus::Active, // Default status
        };

        // 5. Insert user organization mapping
        match diesel::insert_into(users_to_organizations::table)
            .values(&user_org_to_insert)
            .execute(&mut conn)
            .await
        {
            Ok(_) => (),
            Err(e) => {
                return Err(e.into());
            }
        };
    }

    Ok(())
}
