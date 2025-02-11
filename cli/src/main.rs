mod commands;
mod error;
mod types;
mod utils;

use clap::{Parser, Subcommand};
use commands::{auth, deploy, deploy_v2, generate, import, init};

pub const APP_NAME: &str = "buster";

#[derive(Subcommand)]
#[clap(rename_all = "kebab-case")]
pub enum Commands {
    Init,
    Auth,
    Generate,
    Import,
    Deploy {
        #[arg(long)]
        path: Option<String>,
        #[arg(long, default_value_t = false)]
        dry_run: bool,
    },
}

#[derive(Parser)]
pub struct Args {
    #[command(subcommand)]
    pub cmd: Commands,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    // TODO: All commands should check for an update.
    let result = match args.cmd {
        Commands::Init => init().await,
        Commands::Auth => auth().await,
        Commands::Generate => generate().await,
        Commands::Import => import().await,
        Commands::Deploy { path, dry_run } => deploy_v2(path.as_deref(), dry_run).await,
    };

    if let Err(e) = result {
        eprintln!("{}", e);
        std::process::exit(1);
    }
}
