use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::hash::{Hash, Hasher};

#[derive(Serialize, Debug, Clone)]
pub struct TableInfo {
    pub database_identifier: Option<String>,
    pub schema_identifier: Option<String>,
    pub table_identifier: String,
    pub alias: Option<String>,
    pub columns: HashSet<String>, // Deduped columns used from this table
}

#[derive(Serialize, Debug, Clone)]
pub struct JoinInfo {
    pub left_table: String,
    pub right_table: String,
    pub condition: String, // e.g., "users.id = orders.user_id"
}

impl Hash for JoinInfo {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.left_table.hash(state);
        self.right_table.hash(state);
        self.condition.hash(state);
    }
}

impl PartialEq for JoinInfo {
    fn eq(&self, other: &Self) -> bool {
        self.left_table == other.left_table &&
        self.right_table == other.right_table &&
        self.condition == other.condition
    }
}

impl Eq for JoinInfo {}

#[derive(Serialize, Debug, Clone)]
pub struct CteSummary {
    pub name: String,
    pub summary: QuerySummary,
    pub column_mappings: HashMap<String, (String, String)>, // Output col -> (table, source_col)
}

#[derive(Serialize, Debug, Clone)]
pub struct QuerySummary {
    pub tables: Vec<TableInfo>,
    pub joins: HashSet<JoinInfo>,
    pub ctes: Vec<CteSummary>,
}