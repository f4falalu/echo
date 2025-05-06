pub mod auth;
pub mod deploy;
pub mod deploy_new;
pub mod init;
pub mod update;
pub mod version;
// pub mod chat;

pub use auth::auth_with_args;
// Still using the old deploy implementation by default; will switch to the new one when fully ready
pub use deploy::deploy;
// Export the new deployment implementation for testing
pub use deploy_new::deploy as deploy_new;
pub use init::init;
pub use update::UpdateCommand;
