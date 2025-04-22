use anyhow::{Context, Result};
use chrono::Utc;
use database::{
    self,
    enums::{SharingSetting, UserOrganizationRole, UserOrganizationStatus},
    models::{Organization, User, UserToOrganization},
    pool::get_pg_pool,
    schema::{organizations, users, users_to_organizations},
};
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use email::{send_email, EmailType, InviteToBuster};
use middleware::AuthenticatedUser;
use serde_json::json;
use std::collections::HashSet;
use tracing;
use uuid::Uuid;

/// Invites multiple users by creating user records, adding them to the inviter's organization,
/// and sending an invitation email.
pub async fn invite_user_handler(
    inviting_user: &AuthenticatedUser,
    emails: Vec<String>,
) -> Result<()> {
    let pool = get_pg_pool();
    let mut conn = pool
        .get()
        .await
        .context("Failed to get database connection")?;

    // Fetch inviter details
    let inviter = users::table
        .find(inviting_user.id)
        .select(User::as_select())
        .first::<User>(&mut conn)
        .await
        .context("Failed to find inviting user")?;
    let inviter_name = inviter.name.unwrap_or_else(|| inviter.email.clone()); // Use email if name is None

    let organization_id = inviting_user
        .organizations
        .get(0)
        .map(|m| m.id)
        .context("Inviting user is not associated with any organization")?;

    // Fetch organization details
    let organization = organizations::table
        .first::<Organization>(&mut conn)
        .await
        .context("Failed to find organization")?;
    let organization_name = organization.name;

    let inviter_id = inviting_user.id;
    let now = Utc::now();
    let mut successful_emails: Vec<String> = Vec::new();

    for email in emails {
        // Use a separate connection for each user to avoid holding one connection for the whole loop
        let mut user_conn = match pool.get().await {
            Ok(conn) => conn,
            Err(e) => {
                tracing::error!(error = %e, email = %email, "Failed to get DB connection for inviting user");
                continue; // Skip this user if connection fails
            }
        };

        // 1. Generate ID and construct attributes first
        let new_user_id = Uuid::new_v4();
        let user_email = email.clone();
        let assigned_role = UserOrganizationRole::RestrictedQuerier;
        let user_attributes = json!({
          "user_id": new_user_id.to_string(),
          "user_email": user_email,
          "organization_id": organization_id.to_string(),
          "organization_role": format!("{:?}", assigned_role)
        });

        // 2. Create User struct instance
        let user_to_insert = User {
            id: new_user_id,
            email: email.clone(),
            name: None,
            config: json!({}),
            created_at: now,
            updated_at: now,
            attributes: user_attributes,
            avatar_url: None,
        };

        // 3. Insert user
        let user_insert_result = diesel::insert_into(users::table)
            .values(&user_to_insert)
            .execute(&mut user_conn)
            .await;

        if let Err(e) = user_insert_result {
            tracing::error!(error = %e, email = %email, "Failed to insert user record");
            continue; // Skip this user if insertion fails
        }

        // 4. Create UserToOrganization struct instance
        let user_org_to_insert = UserToOrganization {
            user_id: new_user_id,
            organization_id,
            role: assigned_role,
            sharing_setting: SharingSetting::None,
            edit_sql: false,
            upload_csv: false,
            export_assets: false,
            email_slack_enabled: false,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            created_by: inviter_id,
            updated_by: inviter_id,
            deleted_by: None,
            status: UserOrganizationStatus::Active,
        };

        // 5. Insert user organization mapping
        let user_org_insert_result = diesel::insert_into(users_to_organizations::table)
            .values(&user_org_to_insert)
            .execute(&mut user_conn)
            .await;

        match user_org_insert_result {
            Ok(_) => {
                // Only add email if both inserts were successful
                successful_emails.push(email.clone());
            }
            Err(e) => {
                tracing::error!(error = %e, email = %email, user_id = %new_user_id, "Failed to insert user_to_organization record");
                // Consider rolling back the user insert here if desired, although it's complex without a transaction per user.
                // For now, we just log and don't add the email to the success list.
            }
        };
    }

    // 6. Send batch email if there were any successful invites
    if !successful_emails.is_empty() {
        let invite_details = InviteToBuster {
            inviter_name,      // Use fetched inviter name
            organization_name, // Use fetched organization name
        };

        let emails_set: HashSet<String> = successful_emails.into_iter().collect();

        if let Err(e) = send_email(emails_set, EmailType::InviteToBuster(invite_details)).await {
            // Log the error but don't fail the entire handler,
            // as the core user creation logic succeeded.
            tracing::error!(error = %e, "Failed to send invitation emails");
            // Optionally, return a specific error or warning here if needed.
        } else {
            tracing::info!("Successfully sent invitation emails");
        }
    }

    Ok(())
}
