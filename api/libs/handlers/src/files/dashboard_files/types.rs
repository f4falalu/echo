use database::enums::{AssetPermissionRole, Verification};
use serde::{Deserialize, Serialize};

use crate::files::BusterMetric;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterDashboardListItem {
    pub created_at: String,
    pub id: String,
    pub last_edited: String,
    pub members: Vec<DashboardMember>,
    pub name: String,
    pub owner: DashboardMember,
    pub status: Verification,
    pub is_shared: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardMember {
    pub avatar_url: Option<String>,
    pub id: String,
    pub name: String,
}

// Note: This extends BusterShare which needs to be defined
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterDashboardResponse {
    pub access: AssetPermissionRole,
    pub metrics: Vec<BusterMetric>,
    pub dashboard: BusterDashboard,
    pub permission: AssetPermissionRole,
    pub public_password: Option<String>,
    pub collections: Vec<Collection>,
}

// Note: This extends BusterShare but omits certain fields
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BusterDashboard {
    pub config: DashboardConfig,
    pub created_at: String,
    pub created_by: String,
    pub deleted_at: Option<String>,
    pub description: Option<String>,
    pub id: String,
    pub name: String,
    pub updated_at: Option<String>,
    pub updated_by: String,
    pub status: Verification,
    pub version_number: i32,
    pub file: String, // yaml file
    pub file_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Collection {
    pub id: String,
    pub name: String,
}

// Note: This is a placeholder for DashboardConfig which needs to be defined based on your specific needs
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardConfig {
    pub rows: Vec<DashboardRow>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardRow {
    pub items: Vec<DashboardRowItem>,
    pub row_height: Option<u32>,
    pub column_sizes: Option<Vec<u32>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardRowItem {
    pub id: String,
}
