use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use crate::error::BusterError;
use indicatif::{ProgressBar, ProgressStyle};
use std::time::Duration;
use tempfile::TempDir;
use rust_embed::RustEmbed;

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

async fn setup_temporary_compose_environment() -> Result<TempDir, BusterError> {
    let temp_dir = TempDir::new().map_err(|e| {
        BusterError::CommandError(format!("Failed to create temporary directory: {}", e))
    })?;
    let base_path = temp_dir.path();

    for filename_cow in StaticAssets::iter() {
        let filename = filename_cow.as_ref();
        let asset = StaticAssets::get(filename).ok_or_else(|| BusterError::CommandError(format!("Failed to get embedded asset: {}", filename)))?;
        let target_file_path = base_path.join(filename);

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

    let supabase_volumes_path = base_path.join("supabase/volumes");
    fs::create_dir_all(supabase_volumes_path.join("functions")).map_err(|e| BusterError::CommandError(format!("Failed to create supabase/volumes/functions: {}", e)))?;
    
    let local_dotenv_path = PathBuf::from("/Users/dallin/buster/buster/.env");
    if local_dotenv_path.exists() {
        let target_dotenv_path = base_path.join(".env");
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

    Ok(temp_dir)
}

async fn run_docker_compose_command(args: &[&str], operation_name: &str) -> Result<(), BusterError> {
    let temp_dir = setup_temporary_compose_environment().await?;
    let temp_dir_path = temp_dir.path();

    let persistent_project_path = PathBuf::from("/Users/dallin/buster/buster");

    let supabase_volumes_persistent_path = persistent_project_path.join("supabase/volumes");
    fs::create_dir_all(supabase_volumes_persistent_path.join("db/data"))
        .map_err(|e| BusterError::CommandError(format!("Failed to create persistent supabase/volumes/db/data: {}", e)))?;
    fs::create_dir_all(supabase_volumes_persistent_path.join("storage"))
        .map_err(|e| BusterError::CommandError(format!("Failed to create persistent supabase/volumes/storage: {}", e)))?;

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
    cmd.arg("compose")
        .arg("-p")
        .arg("buster")
        .arg("--project-directory")
        .arg(persistent_project_path)
        .arg("-f") 
        .arg(temp_dir_path.join("docker-compose.yml"))
        .args(args)
        .stdout(Stdio::null()) 
        .stderr(Stdio::null());

    let status_result = cmd.status();

    match status_result {
        Ok(status) => {
            if status.success() {
                pb.finish_with_message(format!(
                    "Buster services {} successfully.",
                    operation_name.to_lowercase()
                ));
                Ok(())
            } else {
                let err_msg = format!(
                    "docker compose {} failed (status: {}). Check Docker logs for details (context: {}).",
                    args.join(" "),
                    status,
                    temp_dir_path.display()
                );
                pb.abandon_with_message(format!("Error: {}", err_msg));
                Err(BusterError::CommandError(err_msg))
            }
        }
        Err(e) => {
            let err_msg = format!("Failed to execute docker compose {}: {}", args.join(" "), e);
            pb.abandon_with_message(format!("Error: {}", err_msg));
            Err(BusterError::CommandError(err_msg))
        }
    }
}

pub async fn start() -> Result<(), BusterError> {
    run_docker_compose_command(&["up", "-d"], "Starting").await
}

pub async fn stop() -> Result<(), BusterError> {
    run_docker_compose_command(&["down"], "Stopping").await
} 