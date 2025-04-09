use colored::*;
use reqwest::Client;
use semver::Version;
use serde::Deserialize;
use std::time::Duration;

const CRATES_IO_API_URL: &str = "https://crates.io/api/v1/crates/";
const CRATE_NAME: &str = env!("CARGO_PKG_NAME"); // Read crate name from Cargo.toml
const CURRENT_VERSION: &str = env!("CARGO_PKG_VERSION"); // Read current version from Cargo.toml

// Simplified struct to deserialize only the version field from the crates.io response
#[derive(Deserialize, Debug)]
struct CrateInfo {
    #[serde(rename = "crate")]
    krate: CrateData,
}

#[derive(Deserialize, Debug)]
struct CrateData {
    max_stable_version: String,
}

/// Checks crates.io for a newer version of the CLI.
/// Prints a message to stderr indicating if an update is available or if the CLI is up-to-date.
/// Fails silently if there's an error checking (e.g., network issues).
pub async fn check_for_updates() {
    // Use a short timeout to avoid blocking the CLI for too long
    let client = Client::builder()
        .timeout(Duration::from_secs(3))
        .build();

    let client = match client {
        Ok(c) => c,
        Err(e) => {
            // Using eprintln to avoid interfering with potential stdout parsing
            eprintln!(
                "{}",
                format!("Failed to build HTTP client for update check: {}", e).yellow()
            );
            return;
        }
    };

    let url = format!("{}{}", CRATES_IO_API_URL, CRATE_NAME);

    let response = match client.get(&url).send().await {
        Ok(resp) => resp,
        Err(e) => {
            // Log network errors subtly to stderr
            eprintln!("{}", format!("Update check failed: {}", e).yellow());
            return;
        }
    };

    if !response.status().is_success() {
        eprintln!(
            "{}",
            format!(
                "Update check received non-success status: {}",
                response.status()
            )
            .yellow()
        );
        return;
    }

    let crate_info = match response.json::<CrateInfo>().await {
        Ok(info) => info,
        Err(e) => {
            eprintln!(
                "{}",
                format!("Failed to parse update check response: {}", e).yellow()
            );
            return;
        }
    };

    let latest_version_str = &crate_info.krate.max_stable_version;

    match (
        Version::parse(CURRENT_VERSION),
        Version::parse(latest_version_str),
    ) {
        (Ok(current), Ok(latest)) => {
            if latest > current {
                eprintln!(
                    "\n{}", // Add newline for spacing
                    format!(
                        "A new version of buster ({}) is available! You have {}.",
                        latest, current
                    )
                    .red()
                    .bold()
                );
                eprintln!(
                    "{}",
                    "Please run `buster update` to get the latest version.".red()
                );
            } else {
                // Optionally print the up-to-date message, or keep it silent
                // eprintln!("{}", "buster is up-to-date.".green());
            }
        }
        (Err(e), _) => {
            eprintln!(
                "{}",
                format!("Failed to parse current version ({}): {}", CURRENT_VERSION, e).yellow()
            );
        }
        (_, Err(e)) => {
            eprintln!(
                "{}",
                format!(
                    "Failed to parse latest version ({}): {}",
                    latest_version_str, e
                )
                .yellow()
            );
        }
    }
} 