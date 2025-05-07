use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use crate::error::BusterError;
use indicatif::{ProgressBar, ProgressStyle};
use std::time::Duration;
use rust_embed::RustEmbed;
use dirs;

#[derive(RustEmbed)]
#[folder = "../../"]
#[include = "docker-compose.yml"]
#[include = "supabase/**/*"]
#[exclude = "supabase/volumes/db/data/**/*"]
#[exclude = "supabase/volumes/storage/**/*"]
#[exclude = "supabase/.env"]
#[exclude = "supabase/test.http"]
#[exclude = "supabase/docker-compose.override.yml"]
struct StaticAssets;

async fn setup_persistent_app_environment() -> Result<PathBuf, BusterError> {
    let home_dir = dirs::home_dir()
        .ok_or_else(|| BusterError::CommandError("Failed to get home directory. Cannot set up persistent app path.".to_string()))?;
    let app_base_dir = home_dir.join(".buster");

    fs::create_dir_all(&app_base_dir).map_err(|e| {
        BusterError::CommandError(format!(
            "Failed to create persistent app directory at {}: {}",
            app_base_dir.display(),
            e
        ))
    })?;

    for filename_cow in StaticAssets::iter() {
        let filename = filename_cow.as_ref();
        let asset = StaticAssets::get(filename)
            .ok_or_else(|| BusterError::CommandError(format!("Failed to get embedded asset: {}", filename)))?;
        let target_file_path = app_base_dir.join(filename);

        if let Some(parent) = target_file_path.parent() {
            fs::create_dir_all(parent).map_err(|e| {
                BusterError::CommandError(format!(
                    "Failed to create directory {}: {}",
                    parent.display(),
                    e
                ))
            })?;
        }

        fs::write(&target_file_path, asset.data).map_err(|e| {
            BusterError::CommandError(format!(
                "Failed to write embedded file {} to {}: {}",
                filename,
                target_file_path.display(),
                e
            ))
        })?;
    }

    let supabase_volumes_functions_path = app_base_dir.join("supabase/volumes/functions");
    fs::create_dir_all(supabase_volumes_functions_path).map_err(|e| BusterError::CommandError(format!("Failed to create supabase/volumes/functions in persistent app dir: {}", e)))?;
    
    let local_dotenv_path = PathBuf::from("/Users/dallin/buster/buster/.env");
    if local_dotenv_path.exists() {
        let target_dotenv_path = app_base_dir.join(".env");
        fs::copy(&local_dotenv_path, &target_dotenv_path).map_err(|e| {
            BusterError::CommandError(format!(
                "Failed to copy local .env from {} to {}: {}",
                local_dotenv_path.display(),
                target_dotenv_path.display(),
                e
            ))
        })?;
    } else {
        println!("Warning: Specified .env file not found at {}. Services might not configure correctly if .env is required by docker-compose.yml.", local_dotenv_path.display());
    }

    Ok(app_base_dir)
}

async fn run_docker_compose_command(args: &[&str], operation_name: &str) -> Result<(), BusterError> {
    let persistent_app_dir = setup_persistent_app_environment().await?;

    let data_db_path = persistent_app_dir.join("supabase/volumes/db/data");
    fs::create_dir_all(&data_db_path)
        .map_err(|e| BusterError::CommandError(format!("Failed to create persistent data directory at {}: {}", data_db_path.display(), e)))?;

    let data_storage_path = persistent_app_dir.join("supabase/volumes/storage");
    fs::create_dir_all(&data_storage_path)
        .map_err(|e| BusterError::CommandError(format!("Failed to create persistent data directory at {}: {}", data_storage_path.display(), e)))?;

    let pb = ProgressBar::new_spinner();
    pb.enable_steady_tick(Duration::from_millis(120));
    pb.set_style(
        ProgressStyle::default_spinner()
            .tick_strings(&["▹▹▹▹▹", "▸▹▹▹▹", "▹▸▹▹▹", "▹▹▸▹▹", "▹▹▹▸▹", "▹▹▹▹▸", "✔"])
            .template("{spinner:.blue} {msg}")
            .expect("Failed to set progress bar style"),
    );
    if operation_name == "Starting" {
        pb.set_message(format!("{} Buster services... (this may take a few minutes)", operation_name));
    } else {
        pb.set_message(format!("{} Buster services...", operation_name));
    }

    let mut cmd = Command::new("docker");
    cmd.current_dir(&persistent_app_dir);
    cmd.arg("compose")
        .arg("-p")
        .arg("buster")
        .arg("-f")
        .arg("docker-compose.yml")
        .args(args);

    let output = cmd.output().map_err(|e| {
        BusterError::CommandError(format!("Failed to execute docker compose {}: {}", args.join(" "), e))
    })?;

    if output.status.success() {
        pb.finish_with_message(format!(
            "Buster services {} successfully.",
            operation_name.to_lowercase()
        ));
        Ok(())
    } else {
        let err_msg = format!(
            "docker compose {} failed (status: {}). Logs:\nWorking directory: {}\nStdout:\n{}\nStderr:\n{}",
            args.join(" "),
            output.status,
            persistent_app_dir.display(),
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
        pb.abandon_with_message(format!("Error: docker compose {} failed. See console for details.", args.join(" ")));
        println!("\nDocker Compose Error Details:\n{}", err_msg);
        Err(BusterError::CommandError(err_msg))
    }
}

pub async fn start() -> Result<(), BusterError> {
    run_docker_compose_command(&["up", "-d"], "Starting").await
}

pub async fn stop() -> Result<(), BusterError> {
    run_docker_compose_command(&["down"], "Stopping").await
} 