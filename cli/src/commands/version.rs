use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime};
use std::fs;
use std::path::PathBuf;
use dirs::cache_dir;

const GITHUB_API_URL: &str = "https://api.github.com/repos/buster-so/buster/releases/latest";
const CACHE_TTL: Duration = Duration::from_secs(3600); // 1 hour

#[derive(Deserialize)]
struct GitHubRelease {
    tag_name: String,
    body: Option<String>,
}

#[derive(Deserialize, Serialize)]
struct VersionCache {
    version: String,
    timestamp: u64,
}

pub async fn check_latest_version() -> Result<Option<String>> {
    if let Some(cached_version) = get_cached_version()? {
        return Ok(Some(cached_version));
    }

    let client = Client::new();
    let response = client
        .get(GITHUB_API_URL)
        .header("User-Agent", "buster-cli")
        .send()
        .await?;

    let release: GitHubRelease = response.json().await?;
    cache_version(&release.tag_name)?;
    
    Ok(Some(release.tag_name))
}

fn get_cache_path() -> Option<PathBuf> {
    let mut cache_path = cache_dir()?;
    cache_path.push("buster");
    cache_path.push("version_check.json");
    Some(cache_path)
}

fn get_cached_version() -> Result<Option<String>> {
    let cache_path = match get_cache_path() {
        Some(path) => path,
        None => return Ok(None),
    };

    if !cache_path.exists() {
        return Ok(None);
    }

    let cache_content = fs::read_to_string(cache_path)?;
    let cached: VersionCache = serde_json::from_str(&cache_content)?;

    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)?
        .as_secs();

    if now - cached.timestamp > CACHE_TTL.as_secs() {
        return Ok(None);
    }

    Ok(Some(cached.version))
}

fn cache_version(version: &str) -> Result<()> {
    let cache_path = match get_cache_path() {
        Some(path) => path,
        None => return Ok(()),
    };

    if let Some(parent) = cache_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let cache = VersionCache {
        version: version.to_string(),
        timestamp: SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)?
            .as_secs(),
    };

    let cache_content = serde_json::to_string(&cache)?;
    fs::write(cache_path, cache_content)?;

    Ok(())
}

pub fn is_update_available(current: &str, latest: &str) -> bool {
    // Strip 'v' prefix if present
    let current = current.trim_start_matches('v');
    let latest = latest.trim_start_matches('v');

    // Split into version components
    let current_parts: Vec<&str> = current.split('.').collect();
    let latest_parts: Vec<&str> = latest.split('.').collect();

    // Compare version components
    for (c, l) in current_parts.iter().zip(latest_parts.iter()) {
        let c_num: u32 = c.parse().unwrap_or(0);
        let l_num: u32 = l.parse().unwrap_or(0);
        if l_num > c_num {
            return true;
        }
        if c_num > l_num {
            return false;
        }
    }

    // If we get here and latest has more components, it's newer
    latest_parts.len() > current_parts.len()
} 