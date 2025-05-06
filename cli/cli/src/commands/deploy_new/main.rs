use anyhow::Result;
use std::env;

/// Test harness for the new deploy implementation
/// Build and run with: cargo run --bin deploy_new -- [path] [--dry-run] [--recursive]
#[tokio::main]
async fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();
    
    let mut path = None;
    let mut dry_run = false;
    let mut recursive = false;
    
    // Parse command line arguments
    for arg in &args[1..] {
        match arg.as_str() {
            "--dry-run" => dry_run = true,
            "--recursive" => recursive = true,
            _ => path = Some(arg.as_str()),
        }
    }
    
    // Run the deploy function
    match crate::commands::deploy_new::deploy(path, dry_run, recursive).await {
        Ok(_) => {
            println!("Deployment successful!");
            Ok(())
        },
        Err(e) => {
            eprintln!("Deployment failed: {}", e);
            Err(e)
        }
    }
}