use super::args::ChatArgs;
use super::config::{load_chat_config, save_chat_config, ChatConfig, get_config_path};
use anyhow::Result;
use colored::*;
use litellm::{
    AgentMessage,
    ChatCompletionRequest,
    LiteLLMClient,
    Metadata,
};
use rustyline::error::ReadlineError;
use rustyline::DefaultEditor;
use std::env;
use std::time::Duration;
use thiserror::Error;
use indicatif::{ProgressBar, ProgressStyle}; // Indicatif for spinner
use uuid::Uuid;
use strip_ansi_escapes::strip; // Add this import near other imports

#[derive(Error, Debug)]
pub enum ChatError {
    #[error("Failed to initialize chat: {0}")]
    InitializationError(String),
    #[error("Failed to read user input: {0}")]
    InputError(String),
    #[error("API call failed: {0}")]
    ApiError(String),
    #[error("Configuration error: {0}")]
    ConfigError(String),
}

const DEFAULT_OPENAI_BASE_URL: &str = "https://api.openai.com/v1";

// Function to get API credentials, now accepting args
async fn get_api_credentials(args: &ChatArgs) -> Result<(String, String), ChatError> {
    // 0. Try loading from config file first
    if let Ok(config) = load_chat_config() {
        if let (Some(base), Some(key)) = (config.base_url, config.api_key) {
            if !base.is_empty() && !key.is_empty() {
                return Ok((base, key));
            }
        }
    }

    // 1. Prioritize arguments
    if let (Some(base), Some(key)) = (&args.base_url, &args.api_key) {
        println!("Using API credentials from command-line arguments.");
        return Ok((base.clone(), key.clone()));
    }
    // Handle cases where only one arg is provided (maybe combine with env later?)
    else if let Some(base) = &args.base_url {
        if let Some(key) = env::var("OPENAI_API_KEY").ok() {
            println!("Using base URL from argument and API key from environment.");
            return Ok((base.clone(), key));
        }
        // Fall through to prompt if key is missing
    } else if let Some(key) = &args.api_key {
        if let Some(base) = env::var("OPENAI_API_BASE").ok() {
            println!("Using API key from argument and base URL from environment.");
            return Ok((base, key.clone()));
        } else {
            println!("Using API key from argument and default base URL.");
            return Ok((DEFAULT_OPENAI_BASE_URL.to_string(), key.clone()));
        }
    }

    // 2. Check environment variables if args are not fully provided
    let api_key_env = env::var("OPENAI_API_KEY");
    let base_url_env = env::var("OPENAI_API_BASE");

    match (api_key_env, base_url_env) {
        (Ok(key), Ok(base)) => {
            println!("Using OpenAI credentials from environment variables.");
            Ok((base, key))
        }
        (Ok(key), Err(_)) => {
            println!("Using OPENAI_API_KEY from environment variable and default base URL.");
            Ok((DEFAULT_OPENAI_BASE_URL.to_string(), key))
        }
        _ => {
            // 3. Prompt user if credentials not found in args or env
            println!("API credentials not found in arguments or environment. Prompting for input.");
            let mut rl = DefaultEditor::new()
                .map_err(|e| ChatError::InitializationError(e.to_string()))?;

            let base_url = rl
                .readline_with_initial(
                    &format!("Enter API Base URL (default: {}): ", DEFAULT_OPENAI_BASE_URL),
                    (DEFAULT_OPENAI_BASE_URL, ""),
                )
                .map_err(|e| ChatError::InputError(e.to_string()))?;
            let base_url = if base_url.trim().is_empty() {
                DEFAULT_OPENAI_BASE_URL
            } else {
                &base_url
            };

            let api_key = rl
                .readline("Enter API Key (leave blank if none): ")
                .map_err(|e| ChatError::InputError(e.to_string()))?;

            Ok((base_url.trim().to_string(), api_key.trim().to_string()))
        }
    }
}

// Function to handle the /config command
async fn handle_config_command(rl: &mut DefaultEditor) -> Result<()> {
    println!("Entering configuration mode...");

    let base_url = rl
        .readline(&format!("Enter new API Base URL (default: {}): ", DEFAULT_OPENAI_BASE_URL))
        .map_err(|e| ChatError::InputError(e.to_string()))?;
    let base_url = if base_url.trim().is_empty() { 
        DEFAULT_OPENAI_BASE_URL.to_string()
    } else { 
        base_url.trim().to_string()
    };

    let api_key = rl
        .readline("Enter new API Key (leave blank if none): ")
        .map_err(|e| ChatError::InputError(e.to_string()))?;

    let new_config = ChatConfig {
        base_url: Some(base_url),
        api_key: Some(api_key.trim().to_string()),
    };

    save_chat_config(&new_config)?;

    match get_config_path() {
        Ok(path) => println!("Configuration saved successfully to: {}", path.display()),
        Err(_) => println!("Configuration saved successfully."), // Fallback message
    }

    println!("Restart the chat for the new configuration to take effect.");
    Ok(())
}

// The main chat execution logic
pub async fn run_chat(args: ChatArgs) -> Result<()> {
    // --- Get Current Working Directory ---
    let cwd = env::current_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|_| "<unknown>".to_string());

    // --- Print Boxed Welcome Message ---
    let welcome_title = format!("{} Welcome to {} Chat!", "*".bright_yellow(), "Buster".bold());
    let help_text = format!("Type {} or {} to quit.", "/exit".cyan(), "Ctrl+C".cyan());
    let cwd_text = format!("{}: {}", "cwd".dimmed(), cwd.dimmed());
    
    // Calculate max_len based on visible width (strip ANSI codes)
    // Convert stripped bytes to string and get character count
    let welcome_len = String::from_utf8_lossy(&strip(&welcome_title)).chars().count();
    let help_len = String::from_utf8_lossy(&strip(&help_text)).chars().count();
    let cwd_len = String::from_utf8_lossy(&strip(&cwd_text)).chars().count();
    let max_len = welcome_len.max(help_len).max(cwd_len);

    println!("╭{}╮", "─".repeat(max_len + 2));
    // Pad using the calculated max_len based on visible character width
    // Calculate padding needed based on difference between original char count and stripped char count
    println!("│ {:<width$} │", welcome_title, width = max_len + (welcome_title.chars().count() - welcome_len));
    println!("│ {:<width$} │", help_text, width = max_len + (help_text.chars().count() - help_len));
    println!("│ {:<width$} │", cwd_text, width = max_len + (cwd_text.chars().count() - cwd_len));
    println!("╰{}╯", "─".repeat(max_len + 2));
    println!(); // Add a blank line after the box

    // --- Print Getting Started Tips ---
    println!("{}", "Tips for getting started:".bold());
    println!("  {}{} Run {} to create a {} file with instructions for Claude", "1.".cyan(), " ".normal(), "/init".cyan(), "CLAUDE.md".cyan()); // Example tip
    println!("  {}{} Use Claude to help with file analysis, editing, bash commands and git", "2.".cyan(), " ".normal()); // Example tip
    println!("  {}{} Be as specific as you would with another engineer for the best results", "3.".cyan(), " ".normal()); // Example tip
    println!(); // Add a blank line after the tips

    // Pass args to get_api_credentials
    let (base_url, api_key) = get_api_credentials(&args).await?;

    // Check if both are empty after attempting to get them
    if base_url.is_empty() && api_key.is_empty() {
        return Err(
            ChatError::ConfigError("API Base URL and API Key cannot both be empty.".into())
                .into(),
        );
    }

    let llm_client = LiteLLMClient::new(Some(api_key), Some(base_url));

    let mut rl = DefaultEditor::new()
        .map_err(|e| ChatError::InitializationError(e.to_string()))?;

    // --- Initialize Conversation History with System Message ---
    let system_message_content = format!(
        "You are a helpful assistant running in a command-line interface. \
        The user is currently in the following directory: {}\
        Respond concisely and format responses appropriately for a terminal (e.g., use markdown for code).",
        cwd
    );
    let system_message = AgentMessage::developer(system_message_content);
    let mut conversation_history: Vec<AgentMessage> = vec![system_message];

    let session_id = Uuid::new_v4(); // Unique ID for this chat session

    loop {
        // Set the prompt
        let readline = rl.readline("> ");
        match readline {
            Ok(line) => {
                let user_input = line.trim();
                if user_input.is_empty() {
                    // If empty line, move cursor up and clear it to avoid blank lines
                    print!("\x1b[1A\x1b[2K");
                    continue;
                }

                // --- Grey out the user input line immediately ---
                // Move cursor up one line, clear it, print dimmed input
                print!("\x1b[1A\x1b[2K"); 
                println!("{} {}", "> ".dimmed(), user_input.dimmed());

                if user_input == "/exit" {
                    break;
                }

                // Handle /config command
                if user_input == "/config" {
                    match handle_config_command(&mut rl).await {
                        Ok(_) => continue, // Go back to prompt after config
                        Err(e) => {
                            println!("Error saving config: {}", e);
                            // Optionally break or just continue?
                            continue;
                        }
                    }
                }

                // Add user message to history
                let user_message = AgentMessage::user(user_input.to_string());
                conversation_history.push(user_message.clone());

                // Prepare request for LLM
                let request = ChatCompletionRequest {
                    model: "gpt-4o".to_string(), // Or allow user to specify model?
                    messages: conversation_history.clone(),
                    stream: Some(false), // Keep it simple for now, no streaming
                    metadata: Some(Metadata {
                        generation_name: "cli_chat".to_string(),
                        user_id: "cli_user".to_string(), // Placeholder user ID
                        session_id: session_id.to_string(),
                        trace_id: Uuid::new_v4().to_string(), // New trace for each turn
                    }),
                    ..Default::default()
                };

                // --- Start Indicatif Spinner ---
                let pb = ProgressBar::new_spinner();
                pb.enable_steady_tick(Duration::from_millis(120));
                pb.set_style(
                    // Template for: Thinking... ( Xs ) 
                    ProgressStyle::with_template("{spinner:.blue} {msg} ({elapsed:>3}s)")
                        .unwrap()
                        // For more spinners check out the cli-spinners project:
                        // https://github.com/sindresorhus/cli-spinners/blob/master/spinners.json
                        .tick_strings(&[
                            "⠋",
                            "⠙",
                            "⠹",
                            "⠸",
                            "⠼",
                            "⠴",
                            "⠦",
                            "⠧",
                            "⠇",
                            "⠏"
                        ])
                );
                pb.set_message("Thinking...");

                // Call the LLM
                match llm_client.chat_completion(request).await {
                    Ok(response) => {
                        // --- Stop Indicatif Spinner ---
                        pb.finish_and_clear(); // Clear the spinner

                        if let Some(choice) = response.choices.first() {
                            match &choice.message {
                                AgentMessage::Assistant { content: Some(content), .. } => {
                                    // Print AI response with prefix (default color)
                                    println!("{} {}", "•".white(), content);

                                    // Add assistant message to history
                                    conversation_history.push(AgentMessage::Assistant {
                                        id: Some(response.id), // Use response ID, wrapped in Some()
                                        content: Some(content.clone()),
                                        tool_calls: None,
                                        progress: litellm::MessageProgress::Complete,
                                        name: None,    // Add missing fields with None
                                        initial: false, // Set to default bool value
                                    });
                                    rl.add_history_entry(user_input).ok(); // Add user input to readline history
                                }
                                _ => {
                                    println!("{}", "Error: Unexpected response format.".red());
                                }
                            }
                        } else {
                            println!("{}", "Error: No response from AI.".red());
                        }
                    }
                    Err(e) => {
                        // --- Stop Indicatif Spinner on Error ---
                        pb.finish_and_clear(); // Clear the spinner

                        println!("{}: {}", "Error".red(), e);
                        // Don't add the failed assistant response, maybe remove user message?
                        // For now, just report error and let user try again.
                        conversation_history.pop(); // Remove the last user message if API call failed
                    }
                }
            }
            Err(ReadlineError::Interrupted) => {
                println!("Ctrl-C pressed, exiting chat.");
                break;
            }
            Err(ReadlineError::Eof) => {
                println!("EOF received, exiting chat.");
                break;
            }
            Err(err) => {
                println!("Error reading input: {}", err);
                break;
            }
        }
    }

    Ok(())
} 