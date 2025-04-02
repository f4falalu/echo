use anyhow::Result;
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
#[serde(rename_all = "camelCase")]
pub struct DashboardYml {
    #[serde(alias = "name")]
    pub name: String,
    
    #[serde(alias = "description")]
    pub description: Option<String>,
    
    #[serde(alias = "rows")]
    pub rows: Vec<Row>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Row {
    pub items: Vec<RowItem>, // max number of items in a row is 4, min is 1
    
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "row_height")]
    pub row_height: Option<u32>, // max is 550, min is 320
    
    #[serde(alias = "column_sizes")]
    pub column_sizes: Vec<u32>, // sum of elements must be exactly 12, min size is 3
    
    #[serde(alias = "id")]
    pub id: u32, // incremental id for rows
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RowItem {
    // This id is the id of the metric or item reference that goes here in the dashboard.
    #[serde(alias = "id")]
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

        // Add row IDs if they don't exist
        for (index, row) in file.rows.iter_mut().enumerate() {
            if row.id == 0 {
                row.id = (index + 1) as u32;
            }
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
                if !(320..=550).contains(&row_height) {
                    return Err(anyhow::anyhow!(
                        "Row height must be between 320 and 550, got {}",
                        row_height
                    ));
                }
            }

            // Check number of items constraint
            if row.items.is_empty() || row.items.len() > 4 {
                return Err(anyhow::anyhow!(
                    "Number of items in row must be between 1 and 4, got {}",
                    row.items.len()
                ));
            }

            // Check column sizes sum to valid amount
            if row.column_sizes.is_empty() || row.column_sizes.len() > 4 {
                return Err(anyhow::anyhow!(
                    "Number of column sizes must be between 1 and 4, got {}",
                    row.column_sizes.len()
                ));
            }

            // Check column sizes match number of items
            if row.column_sizes.len() != row.items.len() {
                return Err(anyhow::anyhow!(
                    "Number of column sizes ({}) must match number of items ({})",
                    row.column_sizes.len(),
                    row.items.len()
                ));
            }

            // Validate sum of column_sizes is exactly 12
            let sum: u32 = row.column_sizes.iter().sum();
            if sum != 12 {
                return Err(anyhow::anyhow!(
                    "Sum of column sizes must be exactly 12, got {}",
                    sum
                ));
            }

            // Check individual column sizes are at least 3
            for &size in &row.column_sizes {
                if size < 3 {
                    return Err(anyhow::anyhow!(
                        "Each column size must be at least 3, got {}",
                        size
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
    
    /// Returns the next available row ID based on existing rows
    pub fn get_next_row_id(&self) -> u32 {
        self.rows
            .iter()
            .map(|row| row.id)
            .max()
            .map_or(1, |max_id| max_id + 1)
    }
    
    /// Adds a new row with provided items and auto-generates the row ID
    pub fn add_row(&mut self, items: Vec<RowItem>, row_height: Option<u32>, column_sizes: Vec<u32>) {
        let next_id = self.get_next_row_id();
        self.rows.push(Row {
            items,
            row_height,
            column_sizes,
            id: next_id,
        });
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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_dashboard_yml_camel_case_serialization() {
        // Test case: Verify that DashboardYml serializes to camelCase
        // Expected: JSON fields should be in camelCase format
        
        // Create a dashboard with one row
        let dashboard = DashboardYml {
            name: "Test Dashboard".to_string(),
            description: Some("This is a test dashboard".to_string()),
            rows: vec![
                Row {
                    items: vec![
                        RowItem {
                            id: Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap(),
                        }
                    ],
                    row_height: Some(400),
                    column_sizes: vec![12],
                    id: 1,
                }
            ],
        };
        
        // Serialize to JSON
        let json = serde_json::to_value(&dashboard).unwrap();
        
        // Verify camelCase field names in the output
        assert!(json.get("name").is_some());
        assert!(json.get("description").is_some());
        assert!(json.get("rows").is_some());
        
        // Check row fields are in camelCase
        let row = &json["rows"][0];
        assert!(row.get("items").is_some());
        assert!(row.get("rowHeight").is_some());
        assert!(row.get("columnSizes").is_some());
        assert!(row.get("id").is_some());
        
        // Verify snake_case field names are NOT present
        assert!(row.get("row_height").is_none());
        assert!(row.get("column_sizes").is_none());
    }
    
    #[test]
    fn test_dashboard_yml_snake_case_deserialization() {
        // Test case: Verify that DashboardYml deserializes from snake_case
        // Expected: Both snake_case and camelCase fields should be accepted
        
        // Create JSON with snake_case fields
        let json = json!({
            "name": "Test Dashboard",
            "description": "This is a test dashboard",
            "rows": [
                {
                    "id": 1,
                    "items": [
                        {
                            "id": "00000000-0000-0000-0000-000000000001"
                        }
                    ],
                    "row_height": 400,
                    "column_sizes": [12]
                }
            ]
        });
        
        // Convert to YAML and use the new method to assign IDs
        let yaml = serde_yaml::to_string(&json).unwrap();
        let dashboard = DashboardYml::new(yaml).unwrap();
        
        // Verify fields were properly deserialized
        assert_eq!(dashboard.name, "Test Dashboard");
        assert_eq!(dashboard.description, Some("This is a test dashboard".to_string()));
        assert_eq!(dashboard.rows.len(), 1);
        assert_eq!(dashboard.rows[0].row_height, Some(400));
        assert_eq!(dashboard.rows[0].column_sizes, vec![12]);
        
        // Check that a row ID was assigned
        assert_eq!(dashboard.rows[0].id, 1);
    }
    

    #[test]
    fn test_dashboard_yml_camel_case_deserialization() {
        // Test case: Verify that DashboardYml deserializes from camelCase
        // Expected: camelCase fields should be properly deserialized
        
        // Create JSON with camelCase fields
        let json = json!({
            "name": "Test Dashboard",
            "description": "This is a test dashboard",
            "rows": [
                {
                    "id": 1,
                    "items": [
                        {
                            "id": "00000000-0000-0000-0000-000000000001"
                        }
                    ],
                    "rowHeight": 400,
                    "columnSizes": [12]
                }
            ]
        });
        
        // Convert to YAML and use the new method to assign IDs
        let yaml = serde_yaml::to_string(&json).unwrap();
        let dashboard = DashboardYml::new(yaml).unwrap();
        
        // Verify fields were properly deserialized
        assert_eq!(dashboard.name, "Test Dashboard");
        assert_eq!(dashboard.description, Some("This is a test dashboard".to_string()));
        assert_eq!(dashboard.rows.len(), 1);
        assert_eq!(dashboard.rows[0].row_height, Some(400));
        assert_eq!(dashboard.rows[0].column_sizes, vec![12]);
        
        // Check that a row ID was assigned
        assert_eq!(dashboard.rows[0].id, 1);
    }
    
    #[test]
    fn test_row_id_generation() {
        // Test case: Verify that row IDs are properly generated
        // Expected: Row IDs should increment by 1 for each row
        
        // Create a dashboard from YAML without row IDs
        let yaml = r#"
name: Test Dashboard
description: This is a test dashboard
rows:
  - id: 0  # using 0 as a signal to generate a new ID
    items:
      - id: 00000000-0000-0000-0000-000000000001
    rowHeight: 400
    columnSizes: [12]
  - id: 0  # using 0 as a signal to generate a new ID
    items:
      - id: 00000000-0000-0000-0000-000000000002
    rowHeight: 320
    columnSizes: [12]
  - id: 0  # using 0 as a signal to generate a new ID
    items:
      - id: 00000000-0000-0000-0000-000000000003
    rowHeight: 550
    columnSizes: [12]
"#;
        
        // Create dashboard using the new method (which should assign row IDs)
        let dashboard = DashboardYml::new(yaml.to_string()).unwrap();
        
        // Verify that row IDs were assigned in sequence
        assert_eq!(dashboard.rows[0].id, 1);
        assert_eq!(dashboard.rows[1].id, 2);
        assert_eq!(dashboard.rows[2].id, 3);
    }
    
    #[test]
    fn test_add_row_method() {
        // Test case: Verify that the add_row method assigns the next available ID
        // Expected: New rows get the next sequential ID
        
        // Create a dashboard with one row
        let mut dashboard = DashboardYml {
            name: "Test Dashboard".to_string(),
            description: None,
            rows: vec![
                Row {
                    items: vec![RowItem { id: Uuid::new_v4() }],
                    row_height: None,
                    column_sizes: vec![12], // Must sum to 12
                    id: 1,
                }
            ],
        };
        
        // Add a second row using the add_row method
        dashboard.add_row(
            vec![RowItem { id: Uuid::new_v4() }],
            Some(400),
            vec![12], // Must sum to 12
        );
        
        // Add a third row
        dashboard.add_row(
            vec![RowItem { id: Uuid::new_v4() }],
            Some(320),
            vec![12], // Must sum to 12
        );
        
        // Verify that row IDs were assigned in sequence
        assert_eq!(dashboard.rows[0].id, 1);
        assert_eq!(dashboard.rows[1].id, 2);
        assert_eq!(dashboard.rows[2].id, 3);
        
        // Verify that get_next_row_id returns the expected value
        assert_eq!(dashboard.get_next_row_id(), 4);
    }
    
    #[test]
    fn test_non_sequential_row_ids() {
        // Test case: Verify that get_next_row_id works with non-sequential IDs
        // Expected: Next ID should be max(id) + 1
        
        // Create a dashboard with rows that have non-sequential IDs
        let dashboard = DashboardYml {
            name: "Test Dashboard".to_string(),
            description: None,
            rows: vec![
                Row {
                    items: vec![RowItem { id: Uuid::new_v4() }],
                    row_height: None,
                    column_sizes: vec![12], // Must sum to 12
                    id: 1,
                },
                Row {
                    items: vec![RowItem { id: Uuid::new_v4() }],
                    row_height: None,
                    column_sizes: vec![12], // Must sum to 12
                    id: 5, // Intentionally out of sequence
                },
                Row {
                    items: vec![RowItem { id: Uuid::new_v4() }],
                    row_height: None,
                    column_sizes: vec![12], // Must sum to 12
                    id: 3,
                }
            ],
        };
        
        // Verify that get_next_row_id returns max(id) + 1
        assert_eq!(dashboard.get_next_row_id(), 6);
    }
    
    #[test]
    fn test_explicitly_provided_id() {
        // Test case: Verify that explicitly provided IDs are preserved during deserialization
        // Expected: Row ID should match the provided value
        
        // Create JSON with an explicit ID field
        let json = json!({
            "name": "Test Dashboard",
            "description": "This is a test dashboard",
            "rows": [
                {
                    "items": [
                        {
                            "id": "00000000-0000-0000-0000-000000000001"
                        }
                    ],
                    "rowHeight": 400,
                    "columnSizes": [12],
                    "id": 42  // Explicitly set ID
                }
            ]
        });
        
        // Convert to YAML and use the new method
        let yaml = serde_yaml::to_string(&json).unwrap();
        let dashboard = DashboardYml::new(yaml).unwrap();
        
        // Verify the explicit ID was preserved
        assert_eq!(dashboard.rows[0].id, 42);
    }
}
