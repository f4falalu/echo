use anyhow::Result;
use dirs::home_dir;
use query_engine::credentials::{Credential, BigqueryCredentials, PostgresCredentials, RedshiftCredentials};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::fs;

use crate::utils::{BusterClient, PostDataSourcesRequest};

use super::{buster_credentials::BusterCredentials, project_files::get_current_project};

#[derive(Debug, Serialize, Deserialize)]
pub struct DbtProfiles {
    #[serde(flatten)]
    pub profiles: HashMap<String, Profile>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Profile {
    pub target: String,
    pub outputs: HashMap<String, Output>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Output {
    pub threads: Option<u32>,
    // TODO: Make this a struct for each of the different db types
    #[serde(flatten)]
    pub credential: Credential,
}

// Using shared Credential enum from query_engine now
// All credential structs are imported from query_engine

pub async fn get_dbt_profiles_yml() -> Result<DbtProfiles> {
    let mut path = home_dir().unwrap_or_default();
    path.push(".dbt");
    path.push("profiles.yml");

    if !fs::try_exists(&path).await? {
        return Err(anyhow::anyhow!("File not found: {}", path.display()));
    }

    let contents = fs::read_to_string(path).await?;
    Ok(serde_yaml::from_str(&contents)?)
}

// Returns a list of tuples containing the profile name, environment, and credentials.
pub async fn get_dbt_profile_credentials(
    profile_names: &Vec<String>,
) -> Result<Vec<(String, String, Credential)>> {
    let profiles = get_dbt_profiles_yml().await?;

    let mut credentials = Vec::new();
    for name in profile_names {
        if let Some(profile) = profiles.profiles.get(name) {
            for (env, output) in &profile.outputs {
                credentials.push((name.clone(), env.clone(), output.credential.clone()));
            }
        }
    }

    Ok(credentials)
}

pub async fn upload_dbt_profiles_to_buster(
    credentials: Vec<(String, String, Credential)>,
    buster_creds: BusterCredentials,
) -> Result<()> {
    let buster = BusterClient::new(buster_creds.url, buster_creds.api_key)?;

    for (name, env, cred) in credentials {
        let type_str = match &cred {
            Credential::Postgres(_) => "postgres",
            Credential::MySql(_) => "mysql",
            Credential::Bigquery(_) => "bigquery",
            Credential::SqlServer(_) => "sqlserver",
            Credential::Redshift(_) => "redshift",
            Credential::Databricks(_) => "databricks",
            Credential::Snowflake(_) => "snowflake",
        };

        // Create a request with the appropriate fields based on credential type
        let mut request = PostDataSourcesRequest {
            name,
            env,
            type_: type_str.to_string(),
            host: None,
            port: None,
            username: None,
            password: None,
            default_database: None,
            default_schema: None,
            jump_host: None,
            ssh_username: None,
            ssh_private_key: None,
            credentials_json: None,
            project_id: None,
            dataset_id: None,
            account_id: None,
            warehouse_id: None,
            role: None,
            api_key: None,
            default_catalog: None,
        };

        // Fill in fields based on credential type
        match cred {
            Credential::Postgres(postgres) => {
                request.host = Some(postgres.host);
                request.port = Some(postgres.port);
                request.username = Some(postgres.username);
                request.password = Some(postgres.password);
                request.default_database = Some(postgres.default_database);
                request.default_schema = postgres.default_schema;
                request.jump_host = postgres.jump_host;
                request.ssh_username = postgres.ssh_username;
                request.ssh_private_key = postgres.ssh_private_key;
            },
            Credential::Redshift(redshift) => {
                request.host = Some(redshift.host);
                request.port = Some(redshift.port);
                request.username = Some(redshift.username);
                request.password = Some(redshift.password);
                request.default_database = Some(redshift.default_database);
                request.default_schema = redshift.default_schema;
            },
            Credential::Bigquery(bigquery) => {
                request.credentials_json = Some(bigquery.credentials_json);
                request.project_id = Some(bigquery.default_project_id);
                request.dataset_id = Some(bigquery.default_dataset_id);
            },
            // Add other credential types as needed
            _ => {
                // For unsupported types, we can't properly fill in the fields
                // This would need to be extended for other database types
            }
        }

        if let Err(e) = buster.post_data_sources(request).await {
            return Err(anyhow::anyhow!(
                "Failed to upload dbt profile to Buster: {}",
                e
            ));
        }
    }

    Ok(())
}

pub async fn get_project_profile() -> Result<(String, Profile)> {
    let project_config = get_current_project().await?;

    let dbt_profiles = get_dbt_profiles_yml().await?;

    let profile = dbt_profiles
        .profiles
        .get(&project_config.profile)
        .ok_or(anyhow::anyhow!(
            "Profile not found: {}",
            project_config.profile
        ))?;

    Ok((project_config.profile, profile.clone()))
}
