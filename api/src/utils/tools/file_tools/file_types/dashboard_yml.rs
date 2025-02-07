use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardYml {
    pub id: Option<Uuid>,
    pub updated_at: Option<DateTime<Utc>>,
    pub name: Option<String>,
    pub rows: Vec<Row>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Row {
    items: Vec<RowItem>,    // max number of items in a row is 4, min is 1
    #[serde(skip_serializing_if = "Option::is_none")]
    row_height: Option<u32>,        // max is 550, min is 320
    #[serde(skip_serializing_if = "Option::is_none")]
    column_sizes: Option<Vec<u32>>, // max sum of elements is 12 min is 3
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RowItem {
    // This id is the id of the metric or item reference that goes here in the dashboard.
    id: Uuid,
}

impl DashboardYml {
    pub fn new(yml_content: String) -> Result<Self> {
        // Oftentimes if the llm is creating a new dashboard, it will not include the id.
        let mut file: DashboardYml = match serde_yaml::from_str(&yml_content) {
            Ok(file) => file,
            Err(e) => return Err(anyhow::anyhow!("Error parsing YAML: {}", e)),
        };

        // If the id is not provided, we will generate a new one.
        if file.id.is_none() {
            file.id = Some(Uuid::new_v4());
        }

        // If the name is not provided, we will use a default name.
        if file.name.is_none() {
            file.name = Some(String::from("New Dashboard"));
        }

        file.updated_at = Some(Utc::now());

        // Validate the file
        match file.validate() {
            Ok(_) => Ok(file),
            Err(e) => Err(anyhow::anyhow!("Error compiling file: {}", e)),
        }
    }

    // TODO: The validate of the dashboard should also be whether metrics exist?
    pub fn validate(&self) -> Result<()> {
        // Validate the id and name
        if self.id.is_none() {
            return Err(anyhow::anyhow!("Dashboard file id is required"));
        }

        if self.name.is_none() {
            return Err(anyhow::anyhow!("Dashboard file name is required"));
        }

        if self.updated_at.is_none() {
            return Err(anyhow::anyhow!("Dashboard file updated_at is required"));
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
}
