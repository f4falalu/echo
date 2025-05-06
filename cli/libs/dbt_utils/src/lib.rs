use anyhow::{Context, Result, anyhow};
use colored::*;
use indicatif::{ProgressBar, ProgressStyle};
use std::fs;
use std::path::Path;
use std::process::Command as StdCommand;
use std::time::Duration;

pub mod models;
use models::DbtCatalog;

/// Runs the `dbt docs generate` command for the specified dbt project path.
pub async fn run_dbt_docs_generate(dbt_project_path: &Path) -> Result<()> {
    println!(
        "{}",
        format!("Running 'dbt docs generate' for project at: {}", dbt_project_path.display()).dimmed()
    );
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .template("{spinner:.green} {msg}")
            .context("Failed to create progress style for dbt docs generate spinner")? // Added context
    );
    spinner.set_message("Executing dbt docs generate...");
    spinner.enable_steady_tick(Duration::from_millis(100));

    let output = tokio::process::Command::new("dbt") // Switched to tokio::process::Command for async
        .arg("docs")
        .arg("generate")
        .arg("--project-dir")
        .arg(dbt_project_path.as_os_str())
        .output()
        .await
        .with_context(|| format!("Failed to execute 'dbt docs generate' command for project: {}", dbt_project_path.display()))?;

    spinner.finish_and_clear();

    if output.status.success() {
        println!(
            "{}",
            "✓ 'dbt docs generate' completed successfully.".green()
        );
        // It might be useful to check if catalog.json was actually created/updated here, 
        // but for now, we assume success means it's likely fine.
        Ok(())
    } else {
        eprintln!(
            "{}",
            format!(
                "✗ 'dbt docs generate' failed. Status: {}.\nProject Path: {}\nStdout: {}\nStderr: {}",
                output.status,
                dbt_project_path.display(),
                String::from_utf8_lossy(&output.stdout),
                String::from_utf8_lossy(&output.stderr)
            )
            .red()
        );
        Err(anyhow!(
            "'dbt docs generate' command failed with status: {}",
            output.status
        ))
    }
}

/// Loads and parses the dbt `catalog.json` file from the given path.
pub fn load_and_parse_catalog(catalog_json_path: &Path) -> Result<DbtCatalog> {
    println!(
        "{}",
        format!("Loading dbt catalog from: {}", catalog_json_path.display()).dimmed()
    );
    if !catalog_json_path.exists() {
        return Err(anyhow!(
            "dbt catalog.json not found at {}. Please ensure 'dbt docs generate' was run successfully.",
            catalog_json_path.display()
        ));
    }
    let catalog_content = fs::read_to_string(catalog_json_path)
        .with_context(|| format!("Failed to read catalog.json from {}", catalog_json_path.display()))?;
    
    let mut catalog: DbtCatalog = serde_json::from_str(&catalog_content)
        .map_err(|e| {
            // Log the detailed serde error
            eprintln!("Detailed parsing error for {}: {:#?}", catalog_json_path.display(), e);
            anyhow!(
                "Failed to parse catalog.json from {}. Error: {}. Ensure the file content is valid and matches the expected dbt catalog structure.",
                catalog_json_path.display(),
                e // e.to_string() will give a concise error message from serde
            )
        })?;

    // Post-process nodes to derive resource_type if missing
    for node in catalog.nodes.values_mut() {
        if node.resource_type.is_none() {
            let parts: Vec<&str> = node.unique_id.splitn(2, '.').collect();
            if !parts.is_empty() {
                let potential_type = parts[0];
                if ["model", "source", "seed", "snapshot", "test"].contains(&potential_type) {
                    node.resource_type = Some(potential_type.to_string());
                }
            }
        }

        if node.name.is_none() {
            // Try to derive node.name from the last part of unique_id
            // e.g., model.my_package.my_model_name -> my_model_name
            if let Some(last_part) = node.unique_id.split('.').last() {
                if !last_part.is_empty() {
                    node.name = Some(last_part.to_string());
                }
            }
        }
    }

    Ok(catalog)
}

pub fn add(left: usize, right: usize) -> usize {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
} 