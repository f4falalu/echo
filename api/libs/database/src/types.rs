use std::io::Write;

use diesel::{
    deserialize::FromSql,
    pg::Pg,
    serialize::{IsNull, Output, ToSql},
    sql_types::Jsonb,
    AsExpression, FromSqlRow,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize, FromSqlRow, AsExpression, Clone)]
#[diesel(sql_type = Jsonb)]
#[serde(transparent)]
pub struct VersionHistory(pub std::collections::HashMap<String, Version>);

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Version {
    pub version_number: i32,
    pub content: Value,
}

impl VersionHistory {
    pub fn new(version_number: i32, content: Value) -> Self {
        Self(std::collections::HashMap::from([(
            version_number.to_string(),
            Version {
                content,
                version_number,
            },
        )]))
    }

    pub fn add_version(&mut self, version_number: i32, content: Value) {
        self.0.insert(
            version_number.to_string(),
            Version {
                content,
                version_number,
            },
        );
    }

    pub fn get_version(&self, version_number: i32) -> Option<&Version> {
        self.0.get(&version_number.to_string())
    }

    pub fn get_latest_version(&self) -> Option<&Version> {
        self.0.values().max_by_key(|v| v.version_number)
    }
}

impl FromSql<Jsonb, Pg> for VersionHistory {
    fn from_sql(bytes: diesel::pg::PgValue) -> diesel::deserialize::Result<Self> {
        let value = <serde_json::Value as FromSql<Jsonb, Pg>>::from_sql(bytes)?;
        Ok(serde_json::from_value(value)?)
    }
}

impl ToSql<Jsonb, Pg> for VersionHistory {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> diesel::serialize::Result {
        out.write_all(&[1])?; // JSONB version 1 header
        out.write_all(&serde_json::to_vec(self)?)?;
        Ok(IsNull::No)
    }
}
