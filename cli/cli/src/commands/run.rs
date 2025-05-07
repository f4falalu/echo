use std::process::{Command, Stdio};
use crate::error::BusterError;

const DOCKER_COMPOSE_FILE: &str = "docker-compose.yml"; // Or the path you decide for it

pub async fn start() -> Result<(), BusterError> {
    println!("Attempting to start services with docker-compose...");

    let mut cmd = Command::new("docker-compose");
    cmd.arg("-f")
        .arg(DOCKER_COMPOSE_FILE)
        .arg("up")
        .arg("-d");

    cmd.stdout(Stdio::inherit());
    cmd.stderr(Stdio::inherit());

    let status = cmd.status().map_err(|e| {
        BusterError::CommandError(format!("Failed to execute docker-compose up: {}", e))
    })?;

    if status.success() {
        println!("Services started successfully in detached mode.");
        Ok(())
    } else {
        Err(BusterError::CommandError(
            format!("docker-compose up -d failed with status: {}", status)
        ))
    }
}

pub async fn stop() -> Result<(), BusterError> {
    println!("Attempting to stop services with docker-compose...");

    let mut cmd = Command::new("docker-compose");
    cmd.arg("-f")
        .arg(DOCKER_COMPOSE_FILE)
        .arg("down");

    cmd.stdout(Stdio::inherit());
    cmd.stderr(Stdio::inherit());

    let status = cmd.status().map_err(|e| {
        BusterError::CommandError(format!("Failed to execute docker-compose down: {}", e))
    })?;

    if status.success() {
        println!("Services stopped successfully.");
        Ok(())
    } else {
        Err(BusterError::CommandError(
            format!("docker-compose down failed with status: {}", status)
        ))
    }
} 