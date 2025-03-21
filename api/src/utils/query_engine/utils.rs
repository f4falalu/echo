use serde::{Deserialize, Serialize};

use database::enums::DataSourceType;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "lowercase")]
pub enum TargetDialect {
    Athena,
    BigQuery,
    Databricks,
    MySql,
    Postgres,
    Redshift,
    Snowflake,
    #[serde(rename = "tsql")]
    SqlServer,
    MariaDb,
    Supabase,
}

impl From<DataSourceType> for TargetDialect {
    fn from(data_source_type: DataSourceType) -> Self {
        match data_source_type {
            DataSourceType::BigQuery => TargetDialect::BigQuery,
            DataSourceType::Databricks => TargetDialect::Databricks,
            DataSourceType::MySql => TargetDialect::MySql,
            DataSourceType::Postgres => TargetDialect::Postgres,
            DataSourceType::Redshift => TargetDialect::Redshift,
            DataSourceType::Snowflake => TargetDialect::Snowflake,
            DataSourceType::SqlServer => TargetDialect::SqlServer,
            DataSourceType::Mariadb => TargetDialect::MariaDb,
            DataSourceType::Supabase => TargetDialect::Supabase,
        }
    }
}
