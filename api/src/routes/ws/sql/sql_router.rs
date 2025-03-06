use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use middleware::AuthenticatedUser;

use super::run_sql::run_sql;

#[derive(Deserialize, Serialize, Debug, Clone)]
pub enum SqlRoute {
    #[serde(rename = "/sql/run")]
    Run,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub enum SqlEvent {
    RunSql,
}

pub async fn sql_router(route: SqlRoute, data: Value, user: &AuthenticatedUser) -> Result<()> {
    match route {
        SqlRoute::Run => {
            let req = serde_json::from_value(data)?;
            run_sql(user, req).await?;
        }
    };

    Ok(())
}

impl SqlRoute {
    pub fn from_str(path: &str) -> Result<Self> {
        match path {
            "/sql/run" => Ok(Self::Run),
            _ => Err(anyhow!("Invalid path")),
        }
    }
}
