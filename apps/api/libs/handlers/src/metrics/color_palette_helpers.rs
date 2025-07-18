use anyhow::{anyhow, Result};
use database::pool::get_pg_pool;
use database::schema::organizations;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde_json::Value;
use uuid::Uuid;

pub const DEFAULT_COLOR_PALETTE: [&str; 10] = [
    "#B399FD", "#FC8497", "#FBBC30", "#279EFF", 
    "#E83562", "#41F8FF", "#F3864F", "#C82184", 
    "#31FCB4", "#E83562"
];

// Define all default palettes to match TypeScript
const SOFT_THEME: [&str; 10] = [
    "#36A2EB", "#4BC0C0", "#9966FF", "#FF9F40", "#C9CBCF",
    "#66FF66", "#FF66B2", "#66B2FF", "#FF6384", "#5C6BC0"
];

const RAINBOW_THEME: [&str; 10] = [
    "#ff595e", "#ff924c", "#ffca3a", "#c5ca30", "#8ac926",
    "#36949d", "#1982c4", "#4267ac", "#565aa0", "#6a4c93"
];

const BOLD_RAINBOW_THEME: [&str; 9] = [
    "#ffcd00", "#faff98", "#bbdd00", "#5a8900", "#009c89",
    "#e31d04", "#ff7b83", "#ffa6a0", "#320e00"
];

const VIBRANT_RAINBOW_THEME: [&str; 9] = [
    "#9b5de5", "#c65ccd", "#f15bb5", "#f8a07b", "#fee440",
    "#7fd09d", "#00bbf9", "#00d8e7", "#00f5d4"
];

const CORPORATE_THEME: [&str; 10] = [
    "#73b7b8", "#52a1a3", "#76c8b1", "#50b99b", "#dc244b",
    "#af1d3c", "#f6cb52", "#f3b816", "#f05a29", "#d23f0f"
];

const EMERALD_SPECTRUM_THEME: [&str; 10] = [
    "#75F0A0", "#6FD5EC", "#6B69E8", "#D064E3", "#DD5F87",
    "#D7995B", "#A8D157", "#53CA67", "#50C3C3", "#4E60BC"
];

const VIBRANT_JEWEL_TONES_THEME: [&str; 10] = [
    "#F07589", "#EB6FEB", "#7F6BE6", "#67B7E0", "#63D99E",
    "#86D260", "#CBB85D", "#C25B5B", "#BA5AA8", "#7759B1"
];

const RED_YELLOW_BLUE_THEME: [&str; 10] = [
    "#f94144", "#f3722c", "#f8961e", "#f9844a", "#f9c74f",
    "#90be6d", "#43aa8b", "#4d908e", "#577590", "#277da1"
];

const PASTEL_RAINBOW_THEME: [&str; 9] = [
    "#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff",
    "#a0c4ff", "#bdb2ff", "#ffc6ff", "#ffd1ff"
];

const DIVERSE_DARK_PALETTE_GREEN_THEME: [&str; 10] = [
    "#669900", "#99cc33", "#ccee66", "#006699", "#3399cc",
    "#990066", "#cc3399", "#ff6600", "#ff9900", "#ffcc00"
];

const DIVERSE_DARK_PALETTE_BLACK_THEME: [&str; 9] = [
    "#303638", "#f0c808", "#5d4b20", "#469374", "#9341b3",
    "#e3427d", "#e68653", "#ebe0b0", "#edfbba"
];

const VIBRANT_PASTEL_THEME: [&str; 10] = [
    "#F07575", "#ECD76F", "#93E869", "#64E3A3", "#5FB3DD",
    "#705BD7", "#D157D1", "#CA5367", "#C39B50", "#86BC4E"
];

const BLUE_TO_ORANGE_GRADIENT: [&str; 10] = [
    "#8ecae6", "#73bfdc", "#58b4d1", "#219ebc", "#126782",
    "#023047", "#ffb703", "#fd9e02", "#fb8500", "#fb9017"
];

const VIBRANT_RAINBOW: [&str; 10] = [
    "#F0DC75", "#98EC6F", "#69E8A8", "#64B8E3", "#745FDD",
    "#D75BD7", "#D1576B", "#CAA153", "#8CC350", "#4EBC70"
];

const FOREST_LAKE_GRADIENT: [&str; 10] = [
    "#40916c", "#52b788", "#74c69d", "#95d5b2", "#b7e4c7",
    "#89c2d9", "#61a5c2", "#468faf", "#2a6f97", "#013a63"
];

const GREENS_THEME: [&str; 10] = [
    "#99e2b4", "#88d4ab", "#78c6a3", "#67b99a", "#56ab91",
    "#469d89", "#358f80", "#248277", "#14746f", "#036666"
];

const MORE_BLUES_DARK_TO_LIGHT_THEME: [&str; 10] = [
    "#03045e", "#023e8a", "#0077b6", "#0096c7", "#00b4d8",
    "#48cae4", "#90e0ef", "#ade8f4", "#caf0f8", "#d5f3f9"
];

const PURPLE_THEME: [&str; 10] = [
    "#4a148c", "#6a1b9a", "#7b1fa2", "#8e24aa", "#9c27b0",
    "#ab47bc", "#ba68c8", "#ce93d8", "#e1bee7", "#f3e5f5"
];

const ORANGE_THEME: [&str; 10] = [
    "#e65100", "#ef6c00", "#f57c00", "#fb8c00", "#ff9800",
    "#ffa726", "#ffb74d", "#ffcc80", "#ffe0b2", "#fff3e0"
];

const RED_THEME: [&str; 10] = [
    "#b71c1c", "#c62828", "#d32f2f", "#e53935", "#f44336",
    "#ef5350", "#e57373", "#e35555", "#d13030", "#b71c1c"
];

const TEAL_THEME: [&str; 10] = [
    "#004d4d", "#006666", "#008080", "#009999", "#00b3b3",
    "#00cccc", "#00b3b3", "#009999", "#008080", "#006666"
];

const BLUE_THEME: [&str; 10] = [
    "#0d47a1", "#1565c0", "#1976d2", "#1e88e5", "#2196f3",
    "#42a5f5", "#2196f3", "#1976d2", "#1565c0", "#0d47a1"
];

const BROWN_THEME: [&str; 10] = [
    "#3e2723", "#4e342e", "#5d4037", "#6d4c41", "#795548",
    "#8d6e63", "#795548", "#6d4c41", "#5d4037", "#4e342e"
];

const PINK_THEME: [&str; 10] = [
    "#880e4f", "#ad1457", "#c2185b", "#d81b60", "#e91e63",
    "#ec407a", "#e91e63", "#d81b60", "#c2185b", "#ad1457"
];

// Map default palette IDs to their color arrays
fn get_default_palette_by_id(palette_id: &str) -> Option<Vec<String>> {
    // Remove the __DEFAULT__ prefix and parse the palette name
    if !palette_id.starts_with("__DEFAULT__") {
        return None;
    }
    
    let palette_suffix = &palette_id[11..]; // Skip "__DEFAULT__"
    
    match palette_suffix {
        "buster-0" => Some(DEFAULT_COLOR_PALETTE.iter().map(|&s| s.to_string()).collect()),
        "rainbow-1" => Some(RAINBOW_THEME.iter().map(|&s| s.to_string()).collect()),
        "soft-2" => Some(SOFT_THEME.iter().map(|&s| s.to_string()).collect()),
        "red-yellow-blue-3" => Some(RED_YELLOW_BLUE_THEME.iter().map(|&s| s.to_string()).collect()),
        "pastel-rainbow-4" => Some(PASTEL_RAINBOW_THEME.iter().map(|&s| s.to_string()).collect()),
        "bold-rainbow-5" => Some(BOLD_RAINBOW_THEME.iter().map(|&s| s.to_string()).collect()),
        "modern-6" => Some(VIBRANT_RAINBOW_THEME.iter().map(|&s| s.to_string()).collect()),
        "corporate-7" => Some(CORPORATE_THEME.iter().map(|&s| s.to_string()).collect()),
        "jewel-tones-8" => Some(VIBRANT_JEWEL_TONES_THEME.iter().map(|&s| s.to_string()).collect()),
        "soft-pastel-9" => Some(VIBRANT_PASTEL_THEME.iter().map(|&s| s.to_string()).collect()),
        "diverse-dark-10" => Some(DIVERSE_DARK_PALETTE_BLACK_THEME.iter().map(|&s| s.to_string()).collect()),
        "emerald-spectrum-11" => Some(EMERALD_SPECTRUM_THEME.iter().map(|&s| s.to_string()).collect()),
        "deep-forest-12" => Some(DIVERSE_DARK_PALETTE_GREEN_THEME.iter().map(|&s| s.to_string()).collect()),
        "vibrant-rainbow-13" => Some(VIBRANT_RAINBOW.iter().map(|&s| s.to_string()).collect()),
        // Monochrome themes
        "greens-0" => Some(GREENS_THEME.iter().map(|&s| s.to_string()).collect()),
        "blue---orange-1" => Some(BLUE_TO_ORANGE_GRADIENT.iter().map(|&s| s.to_string()).collect()),
        "forest-sunset-2" => Some(FOREST_LAKE_GRADIENT.iter().map(|&s| s.to_string()).collect()),
        "more-blues-3" => Some(MORE_BLUES_DARK_TO_LIGHT_THEME.iter().map(|&s| s.to_string()).collect()),
        "purple-4" => Some(PURPLE_THEME.iter().map(|&s| s.to_string()).collect()),
        "orange-5" => Some(ORANGE_THEME.iter().map(|&s| s.to_string()).collect()),
        "red-6" => Some(RED_THEME.iter().map(|&s| s.to_string()).collect()),
        "teal-7" => Some(TEAL_THEME.iter().map(|&s| s.to_string()).collect()),
        "brown-8" => Some(BROWN_THEME.iter().map(|&s| s.to_string()).collect()),
        "pink-9" => Some(PINK_THEME.iter().map(|&s| s.to_string()).collect()),
        "blue-10" => Some(BLUE_THEME.iter().map(|&s| s.to_string()).collect()),
        _ => None,
    }
}

pub async fn get_organization_color_palette(organization_id: &Uuid) -> Result<Option<Vec<String>>> {
    let mut conn = get_pg_pool().get().await?;
    
    // Query the organizations table directly using Diesel query builder
    let org_result = organizations::table
        .select(organizations::organization_color_palettes)
        .filter(organizations::id.eq(organization_id))
        .filter(organizations::deleted_at.is_null())
        .first::<Value>(&mut conn)
        .await;
    
    match org_result {
        Ok(color_palettes_value) => {
            // Check if there's a selectedId field
            if let Some(selected_id) = color_palettes_value.get("selectedId") {
                if let Some(selected_id_str) = selected_id.as_str() {
                    // Check if it's a default palette ID
                    if selected_id_str.starts_with("__DEFAULT__") {
                        // Return the corresponding default palette
                        if let Some(default_palette) = get_default_palette_by_id(selected_id_str) {
                            return Ok(Some(default_palette));
                        }
                    } else {
                        // It's a custom palette ID, look for it in the palettes array
                        if let Some(palettes) = color_palettes_value.get("palettes") {
                            if let Some(palettes_array) = palettes.as_array() {
                                // Find the palette with matching ID
                                for palette in palettes_array {
                                    if let Some(id) = palette.get("id") {
                                        if let Some(id_str) = id.as_str() {
                                            if id_str == selected_id_str {
                                                // Found the selected palette
                                                if let Some(colors) = palette.get("colors") {
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
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            // Legacy fallbacks for older data structures
            // Check for selectedDictionaryPalette
            if let Some(selected_palette) = color_palettes_value.get("selectedDictionaryPalette") {
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
            
            // Fall back to last_used_color_palette if nothing else is available
            if let Some(last_used) = color_palettes_value.get("last_used_color_palette") {
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
            
            Ok(None)
        },
        Err(_) => {
            // Organization not found or no color palettes set
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
