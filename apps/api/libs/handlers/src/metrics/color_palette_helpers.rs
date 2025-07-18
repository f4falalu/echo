use anyhow::{anyhow, Result};
use database::pool::get_pg_pool;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde_json::Value;
use uuid::Uuid;

pub const DEFAULT_COLOR_PALETTE: [&str; 10] = [
    "#B399FD", "#FC8497", "#FBBC30", "#279EFF", 
    "#E83562", "#41F8FF", "#F3864F", "#C82184", 
    "#31FCB4", "#6B5B95"
];

pub async fn get_organization_color_palette(organization_id: &Uuid) -> Result<Option<Vec<String>>> {
    let mut conn = get_pg_pool().get().await?;
    
    let config_result = diesel::sql_query(
        "SELECT config FROM users 
         INNER JOIN users_to_organizations ON users.id = users_to_organizations.user_id
         WHERE users_to_organizations.organization_id = $1 
         AND users_to_organizations.deleted_at IS NULL
         ORDER BY users_to_organizations.role = 'admin' DESC, users_to_organizations.created_at ASC
         LIMIT 1"
    )
    .bind::<diesel::sql_types::Uuid, _>(organization_id)
    .get_result::<ConfigResult>(&mut conn)
    .await;
    
    match config_result {
        Ok(config_row) => {
            if let Some(config_value) = config_row.config {
                if let Some(selected_palette) = config_value.get("selectedDictionaryPalette") {
                    if let Some(colors) = selected_palette.get("colors") {
                        if let Some(colors_array) = colors.as_array() {
                            let palette: Vec<String> = colors_array
                                .iter()
                                .filter_map(|c| c.as_str().map(|s| s.to_string()))
                                .collect();
                            
                            if !palette.is_empty() {
                                return Ok(Some(palette));
                            }
                        }
                    }
                }
                
                if let Some(last_used) = config_value.get("last_used_color_palette") {
                    if let Some(colors_array) = last_used.as_array() {
                        let palette: Vec<String> = colors_array
                            .iter()
                            .filter_map(|c| c.as_str().map(|s| s.to_string()))
                            .collect();
                        
                        if !palette.is_empty() {
                            return Ok(Some(palette));
                        }
                    }
                }
            }
            
            Ok(None)
        },
        Err(_) => {
            Ok(None)
        }
    }
}

pub fn get_default_color_palette() -> Vec<String> {
    DEFAULT_COLOR_PALETTE.iter().map(|&s| s.to_string()).collect()
}

pub async fn apply_color_fallback(
    chart_config: &mut database::types::ChartConfig,
    organization_id: &Uuid,
) -> Result<()> {
    let colors_already_set = match chart_config {
        database::types::ChartConfig::Bar(config) => config.base.colors.is_some(),
        database::types::ChartConfig::Line(config) => config.base.colors.is_some(),
        database::types::ChartConfig::Scatter(config) => config.base.colors.is_some(),
        database::types::ChartConfig::Pie(config) => config.base.colors.is_some(),
        database::types::ChartConfig::Combo(config) => config.base.colors.is_some(),
        database::types::ChartConfig::Metric(_) => true, // Metric doesn't use colors
        database::types::ChartConfig::Table(_) => true,  // Table doesn't use colors
    };
    
    if colors_already_set {
        return Ok(());
    }
    
    let org_palette = get_organization_color_palette(organization_id).await?;
    
    let palette = if let Some(palette) = org_palette {
        palette
    } else {
        get_default_color_palette()
    };
    
    match chart_config {
        database::types::ChartConfig::Bar(config) => {
            config.base.colors = Some(palette);
        },
        database::types::ChartConfig::Line(config) => {
            config.base.colors = Some(palette);
        },
        database::types::ChartConfig::Scatter(config) => {
            config.base.colors = Some(palette);
        },
        database::types::ChartConfig::Pie(config) => {
            config.base.colors = Some(palette);
        },
        database::types::ChartConfig::Combo(config) => {
            config.base.colors = Some(palette);
        },
        database::types::ChartConfig::Metric(_) => {}, // No colors to set
        database::types::ChartConfig::Table(_) => {},  // No colors to set
    }
    
    Ok(())
}

#[derive(diesel::QueryableByName, Debug)]
struct ConfigResult {
    #[diesel(sql_type = diesel::sql_types::Jsonb)]
    config: Option<Value>,
}
