use anyhow::Result;
use chrono::{DateTime, Utc};
use diesel::{
    deserialize::FromSql,
    pg::Pg,
    serialize::{IsNull, Output, ToSql},
    sql_types::Jsonb,
    AsExpression, FromSqlRow,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::Write;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone, FromSqlRow, AsExpression)]
#[diesel(sql_type = Jsonb)]
pub struct DashboardYml {
    pub name: String,
    pub description: Option<String>,
    pub rows: Vec<Row>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Row {
    pub items: Vec<RowItem>, // max number of items in a row is 4, min is 1
    #[serde(skip_serializing_if = "Option::is_none")]
    pub row_height: Option<u32>, // max is 550, min is 320
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column_sizes: Option<Vec<u32>>, // max sum of elements is 12 min is 3
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RowItem {
    // This id is the id of the metric or item reference that goes here in the dashboard.
    pub id: Uuid,
}

impl DashboardYml {
    pub fn new(yml_content: String) -> Result<Self> {
        // Oftentimes if the llm is creating a new dashboard, it will not include the id.
        let mut file: DashboardYml = match serde_yaml::from_str(&yml_content) {
            Ok(file) => file,
            Err(e) => return Err(anyhow::anyhow!("Error parsing YAML: {}", e)),
        };

        // If the name is not provided, we will use a default name.
        if file.name.is_empty() {
            file.name = String::from("New Dashboard");
        }

        // Validate the file
        match file.validate() {
            Ok(_) => Ok(file),
            Err(e) => Err(anyhow::anyhow!("Error compiling file: {}", e)),
        }
    }

    // TODO: The validate of the dashboard should also be whether metrics exist?
    pub fn validate(&self) -> Result<()> {
        // Validate the id and name
        if self.name.is_empty() {
            return Err(anyhow::anyhow!("Dashboard file name is required"));
        }

        // Validate each row
        for row in &self.rows {
            // Check row height constraints
            if let Some(row_height) = row.row_height {
                if row_height < 320 || row_height > 550 {
                    return Err(anyhow::anyhow!(
                        "Row height must be between 320 and 550, got {}",
                        row_height
                    ));
                }
            }

            // Check number of items constraint
            if row.items.len() < 1 || row.items.len() > 4 {
                return Err(anyhow::anyhow!(
                    "Number of items in row must be between 1 and 4, got {}",
                    row.items.len()
                ));
            }

            // Check column sizes sum to valid amount
            if let Some(column_sizes) = &row.column_sizes {
                let sum: u32 = column_sizes.iter().sum();
                if sum < 3 || sum > 12 {
                    return Err(anyhow::anyhow!(
                        "Sum of column sizes must be between 3 and 12, got {}",
                        sum
                    ));
                }

                // Check column sizes match number of items
                if column_sizes.len() != row.items.len() {
                    return Err(anyhow::anyhow!(
                        "Number of column sizes ({}) must match number of items ({})",
                        column_sizes.len(),
                        row.items.len()
                    ));
                }
            }
        }

        Ok(())
    }

    pub fn to_value(&self) -> Result<Value> {
        serde_json::to_value(self)
            .map_err(|e| anyhow::anyhow!("Failed to serialize dashboard yml: {}", e))
    }
}

impl FromSql<Jsonb, Pg> for DashboardYml {
    fn from_sql(bytes: diesel::pg::PgValue) -> diesel::deserialize::Result<Self> {
        let value = <serde_json::Value as FromSql<Jsonb, Pg>>::from_sql(bytes)?;
        Ok(serde_json::from_value(value)?)
    }
}

impl ToSql<Jsonb, Pg> for DashboardYml {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> diesel::serialize::Result {
        out.write_all(&[1])?; // JSONB version 1 header
        out.write_all(&serde_json::to_vec(self)?)?;
        Ok(IsNull::No)
    }
}
