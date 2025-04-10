use super::args::ChatArgs;
use super::config::{load_chat_config, ChatConfig};
use super::state::{AppState, ActiveToolCall};
use super::ui::ui;
use anyhow::Result;
use colored::*;
use litellm::AgentMessage;
use rustyline::error::ReadlineError;
use rustyline::DefaultEditor;
use std::env;
use std::io::{self, Stdout};
use std::time::Instant;
use thiserror::Error;
use tokio::sync::broadcast;
use uuid::Uuid;
use std::process::Command;

// --- Agent Imports ---
use agents::{AgentError, AgentExt, AgentThread, BusterCliAgent};

// Ratatui / Crossterm related imports
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind,
            MouseEventKind},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::prelude::*;

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
    #[error("Agent processing error: {0}")]
    AgentError(String),
}

const DEFAULT_OPENAI_BASE_URL: &str = "https://api.openai.com/v1";

// --- Reinstate Credential Logic (adapted) ---
// Function to get API credentials, now accepting args
fn get_api_credentials(args: &ChatArgs) -> Result<(Option<String>, Option<String>), ChatError> {
    // 0. Try loading from config file first
    if let Ok(config) = load_chat_config() {
        // Return even if one is empty, agent handles None
        if config.base_url.is_some() || config.api_key.is_some() {
             return Ok((config.base_url, config.api_key));
        }
    }

    // 1. Prioritize arguments
    if args.base_url.is_some() || args.api_key.is_some() {
        println!("Using API credentials from command-line arguments/environment/defaults.");
        let key = args.api_key.clone().or_else(|| env::var("OPENAI_API_KEY").ok());
        let base = args.base_url.clone().or_else(|| env::var("OPENAI_API_BASE").ok()).or_else(|| key.as_ref().map(|_| DEFAULT_OPENAI_BASE_URL.to_string())); // Default base only if key is present
        return Ok((base, key));
    }

    // 2. Check environment variables if args are not provided
    let api_key_env = env::var("OPENAI_API_KEY").ok();
    let base_url_env = env::var("OPENAI_API_BASE").ok();

    if api_key_env.is_some() || base_url_env.is_some() {
        println!("Using OpenAI credentials from environment variables/defaults.");
         let base = base_url_env.or_else(|| api_key_env.as_ref().map(|_| DEFAULT_OPENAI_BASE_URL.to_string()));
         return Ok((base, api_key_env));
    }

    // 3. Prompt user if credentials not found anywhere
    println!("API credentials not found. Prompting for input.");
    let mut rl =
        DefaultEditor::new().map_err(|e| ChatError::InitializationError(e.to_string()))?;

    let base_url_input = rl
        .readline_with_initial(
            &format!(
                "Enter API Base URL (optional, default: {} if key provided): ",
                DEFAULT_OPENAI_BASE_URL
            ),
            ("", ""), // No default in prompt itself
        )
        .map_err(|e| ChatError::InputError(e.to_string()))?;
    let base_url = if base_url_input.trim().is_empty() { None } else { Some(base_url_input.trim().to_string()) };

    let api_key_input = rl
        .readline("Enter API Key (optional): ")
        .map_err(|e| ChatError::InputError(e.to_string()))?;
    let api_key = if api_key_input.trim().is_empty() { None } else { Some(api_key_input.trim().to_string()) };

    // Apply default base URL logic if needed
    let final_base_url = base_url.or_else(|| api_key.as_ref().map(|_| DEFAULT_OPENAI_BASE_URL.to_string()));

    Ok((final_base_url, api_key))

}

// --- Main Chat Execution Logic --- (Simplified)
pub async fn run_chat(args: ChatArgs) -> Result<()> {
    // --- Initial Setup ---
    let cwd = env::current_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|_| "<unknown>".to_string());

    // --- Git Repository Check ---
    let git_check = Command::new("git")
        .args(["rev-parse", "--is-inside-work-tree"])
        .output(); // Use output to capture status and stderr/stdout if needed

    if git_check.is_err() || !git_check.unwrap().status.success() {
         println!("{}", colored::Colorize::yellow("Warning: Buster operates best in a git repository."));
    }

    // --- Get Credentials ---
    let (base_url, api_key) = get_api_credentials(&args)?;
    if api_key.is_none() {
         println!("{}", colored::Colorize::yellow("Warning: No API key provided. Requests may fail if required."));
    }

    // --- Agent Initialization ---
    let user_id = Uuid::new_v4();
    let session_id = Uuid::new_v4();
    let cli_agent = BusterCliAgent::new(user_id, session_id, api_key, base_url).await
        .map_err(|e| ChatError::InitializationError(format!("Failed to create agent: {}", e)))?;

    // --- Terminal Setup ---
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    // --- App State & Agent Receiver ---
    let mut app_state = AppState::new(user_id, session_id);
    let mut agent_rx: Option<broadcast::Receiver<Result<AgentMessage, AgentError>>> = None;

    // --- Panic Hook for Cleanup ---
    let original_hook = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |panic_info| {
        // Ensure terminal is restored even on panic
        let mut stdout = io::stdout();
        let _ = disable_raw_mode();
        let _ = execute!(stdout, LeaveAlternateScreen, DisableMouseCapture);
        original_hook(panic_info);
    }));

    // --- Main Event Loop ---
    let mut loop_result: Result<()> = Ok(());
    let tick_rate = std::time::Duration::from_millis(50);
    let mut last_tick = Instant::now();

    while !app_state.should_quit {
        // Draw UI
        if let Err(e) = terminal.draw(|f| ui(f, &app_state, &cwd)) {
            loop_result =
                Err(ChatError::InitializationError(format!("UI draw error: {}", e)).into());
            break;
        }

        // Handle Agent Messages
        if let Some(rx) = agent_rx.as_mut() {
            match rx.try_recv() {
                Ok(msg_result) => {
                    app_state.process_agent_message(msg_result);
                }
                Err(broadcast::error::TryRecvError::Empty) => { /* No message */ }
                Err(broadcast::error::TryRecvError::Closed) => {
                    agent_rx = None; // Stop polling this receiver
                    // Agent might still be processing internally if it calls itself, 
                    // but for this cycle, communication is done.
                    // State flags (is_agent_processing) are managed within AppState methods.
                }
                Err(broadcast::error::TryRecvError::Lagged(n)) => {
                    eprintln!("Warning: Agent message receiver lagged by {} messages.", n);
                    // Consider adding error to app_state.current_error
                }
            }
        }

        // Handle Terminal Input
        let timeout = tick_rate
            .checked_sub(last_tick.elapsed())
            .unwrap_or_else(|| std::time::Duration::from_secs(0));

        if crossterm::event::poll(timeout)? {
            match event::read()? {
                Event::Key(key) => {
                    if key.kind == KeyEventKind::Press {
                        // Quit handlers
                        if key.modifiers.contains(event::KeyModifiers::CONTROL)
                            && key.code == KeyCode::Char('c')
                        {
                            app_state.should_quit = true;
                            continue;
                        }
                        if key.code == KeyCode::Esc {
                            app_state.should_quit = true;
                            continue;
                        }
                        if app_state.input == "/exit" && key.code == KeyCode::Enter {
                            app_state.should_quit = true;
                            continue;
                        }

                        // Check if input allowed
                        let can_input =
                            !app_state.is_agent_processing && app_state.active_tool_calls.is_empty();

                        if can_input {
                            match key.code {
                                KeyCode::Enter => {
                                    // Submit message & trigger agent processing
                                    app_state.submit_message(); 
                                    
                                    // Get the agent receiver immediately
                                    // The agent's run method should quickly setup the stream 
                                    // and return the receiver before heavy processing.
                                    match cli_agent.run(&mut app_state.agent_thread, &cwd).await {
                                        Ok(rx) => {
                                            agent_rx = Some(rx); // Start polling this receiver
                                        }
                                        Err(e) => {
                                            // Report error via AppState
                                            app_state.process_agent_message(Err(AgentError(format!(
                                                "Failed to start agent: {}",
                                                e
                                            ))));
                                        }
                                    }
                                }
                                KeyCode::Char(c) => {
                                    app_state.input.push(c);
                                }
                                KeyCode::Backspace => {
                                    app_state.input.pop();
                                }
                                KeyCode::Up => app_state.scroll_up(),
                                KeyCode::Down => app_state.scroll_down(),
                                _ => {} // Ignore other keys when input is enabled
                            }
                        } else {
                            // Handle scrolling even when input is disabled
                            match key.code {
                                KeyCode::Up => app_state.scroll_up(),
                                KeyCode::Down => app_state.scroll_down(),
                                _ => {} // Ignore other input
                            }
                        }
                    }
                }
                Event::Mouse(mouse_event) => {
                    match mouse_event.kind {
                        MouseEventKind::ScrollUp => {
                            app_state.scroll_up();
                        }
                        MouseEventKind::ScrollDown => {
                            app_state.scroll_down();
                        }
                        _ => {} // Ignore other mouse events (clicks, moves, etc.)
                    }
                }
                _ => {} // Ignore other event types (like resize for now)
            }
        }

        // Tick update
        if last_tick.elapsed() >= tick_rate {
            last_tick = Instant::now();
            // Potential future use: update timers or animations in UI
        }
    }

    // --- Cleanup --- 
    let _ = std::panic::take_hook(); // Restore default panic hook
    
    // Restore terminal
    let cleanup_result = || -> Result<()> {
        disable_raw_mode()?;
        execute!(
            terminal.backend_mut(),
            LeaveAlternateScreen,
            DisableMouseCapture
        )?;
        terminal.show_cursor()?;
        Ok(())
    }();

    // Optional: Explicit agent shutdown if needed
    // let _ = cli_agent.shutdown().await;

    // Return result (prioritizing loop error over cleanup error)
    match loop_result {
        Ok(_) => cleanup_result,
        Err(e) => Err(e), 
    }
}
