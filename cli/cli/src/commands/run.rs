use std::fs;
use std::io::{self, Write};
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
#[include = "supabase/.env.example"]
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
    
    let target_dotenv_path = app_base_dir.join(".env");

    // Always use .env.example from embedded assets
    let example_env_filename = "supabase/.env.example";
    let asset = StaticAssets::get(example_env_filename)
        .ok_or_else(|| BusterError::CommandError(format!("Failed to get embedded asset: {}", example_env_filename)))?;
    
    fs::write(&target_dotenv_path, asset.data).map_err(|e| {
        BusterError::CommandError(format!(
            "Failed to write {} to {}: {}",
            example_env_filename,
            target_dotenv_path.display(),
            e
        ))
    })?;

    // Additionally copy the .env to the supabase subdirectory
    let supabase_dotenv_path = app_base_dir.join("supabase/.env");
    fs::copy(&target_dotenv_path, &supabase_dotenv_path).map_err(|e| {
        BusterError::CommandError(format!(
            "Failed to copy .env from {} to {}: {}",
            target_dotenv_path.display(),
            supabase_dotenv_path.display(),
            e
        ))
    })?;

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

pub async fn restart() -> Result<(), BusterError> {
    println!("WARNING: This command will stop all Buster services, attempt to remove their current images, and then restart them.");
    println!("This can lead to a complete wipe of the Buster database and any other local service data.");
    println!("This action is irreversible.");
    print!("Are you sure you want to proceed? (yes/No): ");
    io::stdout().flush().map_err(|e| BusterError::CommandError(format!("Failed to flush stdout: {}", e)))?;

    let mut confirmation = String::new();
    io::stdin().read_line(&mut confirmation).map_err(|e| BusterError::CommandError(format!("Failed to read user input: {}", e)))?;

    if confirmation.trim().to_lowercase() != "yes" {
        println!("Restart cancelled by user.");
        return Ok(());
    }

    let persistent_app_dir = setup_persistent_app_environment().await?;

    let pb = ProgressBar::new_spinner();
    pb.enable_steady_tick(Duration::from_millis(120));
    pb.set_style(
        ProgressStyle::default_spinner()
            .tick_strings(&["▹▹▹▹▹", "▸▹▹▹▹", "▹▸▹▹▹", "▹▹▸▹▹", "▹▹▹▸▹", "▹▹▹▹▸", "✔"])
            .template("{spinner:.blue} {msg}")
            .expect("Failed to set progress bar style"),
    );
    
    pb.set_message("Rebuilding Buster services (step 1/4): Stopping services...");

    let mut down_cmd = Command::new("docker");
    down_cmd.current_dir(&persistent_app_dir)
        .arg("compose")
        .arg("-p")
        .arg("buster")
        .arg("-f")
        .arg("docker-compose.yml")
        .arg("down");

    let down_output = down_cmd.output().map_err(|e| BusterError::CommandError(format!("Failed to execute docker compose down: {}", e)))?;
    if !down_output.status.success() {
        let err_msg = format!(
            "docker compose down failed (status: {}). Logs:
Working directory: {}
Stdout:
{}
Stderr:
{}",
            down_output.status,
            persistent_app_dir.display(),
            String::from_utf8_lossy(&down_output.stdout),
            String::from_utf8_lossy(&down_output.stderr)
        );
        pb.abandon_with_message("Error: docker compose down failed. See console for details.");
        println!("\nDocker Compose Down Error Details:\n{}", err_msg);
        return Err(BusterError::CommandError(err_msg));
    }

    pb.set_message("Rebuilding Buster services (step 2/4): Identifying service images...");
    let mut config_images_cmd = Command::new("docker");
    config_images_cmd.current_dir(&persistent_app_dir)
        .arg("compose")
        .arg("-p")
        .arg("buster")
        .arg("-f")
        .arg("docker-compose.yml")
        .arg("config")
        .arg("--images");

    let config_images_output = config_images_cmd.output().map_err(|e| BusterError::CommandError(format!("Failed to execute docker compose config --images: {}", e)))?;
    if !config_images_output.status.success() {
        let err_msg = format!(
            "docker compose config --images failed (status: {}). Logs:
Working directory: {}
Stdout:
{}
Stderr:
{}",
            config_images_output.status,
            persistent_app_dir.display(),
            String::from_utf8_lossy(&config_images_output.stdout),
            String::from_utf8_lossy(&config_images_output.stderr)
        );
        pb.abandon_with_message("Error: Failed to identify service images. See console for details.");
        println!("\nDocker Compose Config --images Error Details:\n{}", err_msg);
        return Err(BusterError::CommandError(err_msg));
    }

    let image_list_str = String::from_utf8_lossy(&config_images_output.stdout);
    let image_names: Vec<&str> = image_list_str.lines().filter(|line| !line.trim().is_empty()).collect();

    if image_names.is_empty() {
        pb.println("No images identified by docker-compose config --images. Skipping image removal.");
    } else {
        pb.set_message(format!("Rebuilding Buster services (step 3/4): Removing {} service image(s)...", image_names.len()));
        for (index, image_name) in image_names.iter().enumerate() {
            let current_image_name = image_name.trim();
            if current_image_name.is_empty() {
                continue;
            }
            pb.set_message(format!(
                "Rebuilding Buster services (step 3/4): Removing image {}/{} ('{}')...",
                index + 1,
                image_names.len(),
                current_image_name
            ));
            let mut rmi_cmd = Command::new("docker");
            rmi_cmd.arg("image").arg("rm").arg(current_image_name);

            let rmi_output = rmi_cmd.output().map_err(|e| BusterError::CommandError(format!("Failed to execute docker image rm {}: {}", current_image_name, e)))?;
            
            // Log warning on failure but continue, as image might not exist or be in use by other non-project containers
            if !rmi_output.status.success() {
                let rmi_stderr = String::from_utf8_lossy(&rmi_output.stderr);
                if !rmi_stderr.trim().is_empty() && !rmi_stderr.contains("No such image") { // Don't warn if image was already gone
                     pb.println(format!("Warning: Could not remove image '{}'. It might be in use or already removed. Stderr: {}", current_image_name, rmi_stderr.trim()));
                }
            }
        }
    }

    pb.set_message("Rebuilding Buster services (step 4/4): Starting services (pulling images if needed)...");
    let mut up_cmd = Command::new("docker");
    up_cmd.current_dir(&persistent_app_dir)
        .arg("compose")
        .arg("-p")
        .arg("buster")
        .arg("-f")
        .arg("docker-compose.yml")
        .arg("up")
        .arg("-d")
        .arg("--pull") // Ensure latest images are pulled
        .arg("--force-recreate"); // Recreate containers even if config hasn't changed

    let up_output = up_cmd.output().map_err(|e| BusterError::CommandError(format!("Failed to execute docker compose up: {}", e)))?;

    if up_output.status.success() {
        pb.finish_with_message("Buster services rebuilt and started successfully.");
        Ok(())
    } else {
        let err_msg = format!(
            "docker compose up failed after image purge (status: {}). Logs:\nWorking directory: {}\nStdout:\n{}\nStderr:\n{}",
            up_output.status,
            persistent_app_dir.display(),
            String::from_utf8_lossy(&up_output.stdout),
            String::from_utf8_lossy(&up_output.stderr)
        );
        pb.abandon_with_message("Error: docker compose up failed after image purge. See console for details.");
        println!("\nDocker Compose Up Error Details:\n{}", err_msg);
        Err(BusterError::CommandError(err_msg))
    }
} 