use super::args::ChatArgs;
use super::config::{get_config_path, load_chat_config, save_chat_config, ChatConfig};
use anyhow::Result;
use colored::*;
use indicatif::{ProgressBar, ProgressStyle}; // Indicatif for spinner
use litellm::{AgentMessage, ChatCompletionRequest, LiteLLMClient, MessageProgress, Metadata};
use rustyline::error::ReadlineError;
use rustyline::DefaultEditor;
use std::env;
use std::io::{self, Stdout};
use std::time::Instant;
use strip_ansi_escapes::strip; // Add this import near other imports
use thiserror::Error;
use uuid::Uuid;
use tokio::sync::mpsc; // Import mpsc for channels

// Ratatui / Crossterm related imports
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    prelude::*,
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, Wrap},
};

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
fn get_api_credentials(args: &ChatArgs) -> Result<(String, String), ChatError> {
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
            let mut rl =
                DefaultEditor::new().map_err(|e| ChatError::InitializationError(e.to_string()))?;

            let base_url = rl
                .readline_with_initial(
                    &format!(
                        "Enter API Base URL (default: {}): ",
                        DEFAULT_OPENAI_BASE_URL
                    ),
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
        .readline(&format!(
            "Enter new API Base URL (default: {}): ",
            DEFAULT_OPENAI_BASE_URL
        ))
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

// --- Application Event Enum (for channel communication) ---
#[derive(Debug)]
enum AppEvent {
    // Represents the result of the API call
    ApiResponse(Result<AgentMessage, String>), 
}

// --- Ratatui Application State ---
struct AppState {
    input: String,
    messages: Vec<AgentMessage>,
    scroll_offset: u16,
    is_loading: bool,
    should_quit: bool,
    loading_start_time: Option<Instant>, // Add field to track loading start
}

impl AppState {
    fn new() -> Self {
        AppState {
            input: String::new(),
            messages: vec![
                // Remove initial hardcoded messages
            ],
            scroll_offset: 0,
            is_loading: false,
            should_quit: false,
            loading_start_time: None, // Initialize as None
        }
    }

    fn submit_message(&mut self) {
        if !self.input.is_empty() && !self.is_loading {
            let user_message = AgentMessage::User {
                id: None,
                name: None,
                content: self.input.clone(),
            };
            self.messages.push(user_message);
            self.input.clear();
            self.scroll_offset = 0;
            self.is_loading = true; // Set loading state
            self.loading_start_time = Some(Instant::now()); // Record start time
        }
    }

    fn add_response(&mut self, response: Result<AgentMessage, String>) {
        let message_to_add = match response {
            Ok(assistant_message) => assistant_message,
            Err(e) => AgentMessage::Assistant { // Create an error message
                id: None,
                content: Some(format!("Error: {}", e)),
                name: None,
                tool_calls: None,
                progress: MessageProgress::Complete,
                initial: false,
            },
        };
        self.messages.push(message_to_add);
        self.scroll_offset = 0; // Reset scroll on new message
        self.is_loading = false; // Clear loading state
        self.loading_start_time = None; // Clear start time
    }

    fn scroll_up(&mut self) {
        self.scroll_offset = self.scroll_offset.saturating_add(1);
    }

    fn scroll_down(&mut self) {
        self.scroll_offset = self.scroll_offset.saturating_sub(1);
    }
}

// --- Ratatui UI Rendering ---
fn ui(frame: &mut Frame, app: &AppState, cwd: &str) {
    let main_chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(1),    // Main content area (Messages OR Welcome/Tips)
            Constraint::Length(3), // Input area (fixed height)
            Constraint::Length(2), // Bottom spacer (Increased to 2)
        ])
        .split(frame.size());

    // --- Main Content Area (Messages OR Welcome/Tips) --- (Uses main_chunks[0])
    let has_assistant_message = app.messages.iter().any(|m| matches!(m, AgentMessage::Assistant { .. }));
    let should_show_welcome = !has_assistant_message;

    if should_show_welcome {
        // --- Render Welcome/Tips on startup ---
        let welcome_tips_chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(4), // Welcome Box
                Constraint::Length(5), // Tips Section
                Constraint::Min(0),    // Spacer to fill rest of main_chunks[0]
            ])
            .split(main_chunks[0]); // Split the main content area

        // Welcome Box rendering (in welcome_tips_chunks[0])
        let welcome_title = Span::styled("* Welcome to Buster Beta! *", Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD));
        let help_text = Line::from("  /help for help");
        let cwd_text = Line::from(format!("  cwd: {}", cwd));
        let welcome_text = vec![welcome_title.into(), help_text, cwd_text];
        let welcome_box = Paragraph::new(welcome_text)
            .block(Block::default().borders(Borders::ALL).border_style(Style::default().fg(Color::Rgb(255, 165, 0))))
            .alignment(Alignment::Left)
            .wrap(Wrap { trim: false });
        frame.render_widget(welcome_box, welcome_tips_chunks[0]);

        // Tips Section rendering (in welcome_tips_chunks[1])
        let tips_title = Line::from("Tips for getting started:");
        let tip1 = Line::from("1. Run /init to create a BUSTER.md file with instructions for Buster");
        let tip2 = Line::from("2. Use Buster to help with file analysis, editing, bash commands and git");
        let tip3 = Line::from("3. Be as specific as you would with another engineer for the best results");
        let tips_text = vec![Line::from(""), tips_title, tip1, tip2, tip3];
        let tips_widget = Paragraph::new(tips_text)
            .alignment(Alignment::Left)
            .wrap(Wrap { trim: false });
        frame.render_widget(tips_widget, welcome_tips_chunks[1]);

    } else {
        // --- Render Message History --- (in main_chunks[0])
        let mut message_lines: Vec<Line> = Vec::new();
        for msg in app.messages.iter() {
            match msg {
                AgentMessage::User { content, .. } => {
                    message_lines.push(Line::from(vec![
                        Span::styled("> ", Style::default().fg(Color::DarkGray)),
                        Span::styled(content, Style::default().fg(Color::DarkGray)),
                    ]));
                }
                AgentMessage::Assistant {
                    content: Some(content),
                    ..
                } => {
                    message_lines.push(Line::from("")); // BEFORE
                    message_lines.push(Line::from(vec![
                        Span::styled("• ", Style::default().fg(Color::White)),
                        Span::styled(content, Style::default().fg(Color::White)),
                    ]));
                    message_lines.push(Line::from("")); // AFTER
                }
                _ => {}
            }
        }

        // Add loading indicator if necessary
        if app.is_loading {
            if let Some(start_time) = app.loading_start_time {
                let elapsed = start_time.elapsed().as_secs();
                message_lines.push(Line::from("")); // Space before loading
                let loading_line = Line::from(Span::styled(
                    format!("Thinking... {}s", elapsed),
                    Style::default().fg(Color::Yellow),
                ));
                message_lines.push(loading_line);
            }
        }

        let content_height = message_lines.len() as u16;
        let view_height = main_chunks[0].height;
        let max_scroll = content_height.saturating_sub(view_height);
        let current_scroll = app.scroll_offset.min(max_scroll);

        let messages_widget = Paragraph::new(message_lines)
            .scroll((current_scroll, 0))
            .wrap(Wrap { trim: false });
        frame.render_widget(messages_widget, main_chunks[0]);
    }

    // --- Input Area --- (Uses main_chunks[1] now)
    let input_display_text = format!("> {}", app.input);
    let input_widget = Paragraph::new(input_display_text)
        .block(Block::default().borders(Borders::ALL))
        .wrap(Wrap { trim: false });
    frame.render_widget(input_widget, main_chunks[1]);

    // --- Cursor --- (Adjust chunk index)
    if !app.is_loading {
        frame.set_cursor(
            main_chunks[1].x + app.input.chars().count() as u16 + 3,
            main_chunks[1].y + 1,
        )
    } else {
        frame.set_cursor(main_chunks[1].x + 3, main_chunks[1].y + 1)
    }
}

// --- Main Chat Execution Logic (Refactored for Ratatui) ---
pub async fn run_chat(args: ChatArgs) -> Result<()> {
    // --- Initial Setup (Credentials, etc. - Keep this part) ---
    let cwd = env::current_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|_| "<unknown>".to_string());
    // cwd_clone no longer needed for ui
    // let cwd_clone = cwd.clone(); 

    // Get credentials (don't print welcome box here anymore)
    let (base_url, api_key) = get_api_credentials(&args)?;
    if base_url.is_empty() && api_key.is_empty() {
        return Err(ChatError::ConfigError(
            "API Base URL and API Key cannot both be empty.".into(),
        )
        .into());
    }
    
    // --- Initialize Client and Session ID ---
    let llm_client = LiteLLMClient::new(Some(api_key), Some(base_url));
    let session_id = Uuid::new_v4().to_string(); 

    // --- Setup System Message (Use associated function and single format! string) ---
    let system_message_content = format!(
        // Combine into a single string literal
        "You are a helpful assistant running in a command-line interface. The user is currently in the following directory: {}. Respond concisely and format responses appropriately for a terminal (e.g., use markdown for code).",
        cwd // Pass cwd as argument to format!
    );
    let system_message = AgentMessage::developer(system_message_content);

    // --- Setup Terminal ---
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    // --- Create App State (without system message) ---
    let mut app_state = AppState::new();

    // --- Create Communication Channel ---
    let (tx, mut rx) = mpsc::unbounded_channel::<AppEvent>();

    // Ensure terminal cleanup even on panic
    let original_hook = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |panic_info| {
        // Explicitly restore terminal before panicking
        let mut stdout = io::stdout();
        let _ = disable_raw_mode();
        let _ = execute!(stdout, LeaveAlternateScreen, DisableMouseCapture);
        original_hook(panic_info);
    }));

    // Use a variable to store the result from within the loop
    let mut loop_result: Result<()> = Ok(());

    // --- Initialize Tick Rate Variables --- 
    let tick_rate = std::time::Duration::from_millis(100);
    let mut last_tick = Instant::now();

    while !app_state.should_quit {
        // Draw the UI - Pass cwd again
        if let Err(e) = terminal.draw(|f| ui(f, &app_state, &cwd)) {
            loop_result = Err(e.into());
            break; // Exit loop on draw error
        }

        // --- Handle App Events (from API tasks) ---
        match rx.try_recv() {
            Ok(AppEvent::ApiResponse(result)) => {
                app_state.add_response(result);
            }
            Err(mpsc::error::TryRecvError::Empty) => { /* No message */ }
            Err(mpsc::error::TryRecvError::Disconnected) => {
                // Channel closed, should probably exit?
                eprintln!("API communication channel closed unexpectedly.");
                app_state.should_quit = true; // Exit if channel closes
            }
        }
        
        // --- Handle Terminal Input Events ---
        let timeout = tick_rate
            .checked_sub(last_tick.elapsed())
            .unwrap_or_else(|| std::time::Duration::from_secs(0));

        if crossterm::event::poll(timeout)? {
             if let Event::Key(key) = event::read()? {
                if key.kind == KeyEventKind::Press {
                    // Prioritize Ctrl+C
                    if key.modifiers.contains(event::KeyModifiers::CONTROL) && key.code == KeyCode::Char('c') {
                        app_state.should_quit = true;
                        continue;
                    }
                    // Handle other keys
                    match key.code {
                        KeyCode::Enter => {
                            if app_state.input == "/exit" {
                                app_state.should_quit = true;
                            } else if !app_state.input.is_empty() && !app_state.is_loading {
                                // 1. Update state to indicate loading
                                app_state.submit_message(); 
                                
                                // 2. Clone necessary data for the task
                                let messages_history = app_state.messages.clone();
                                let task_system_message = system_message.clone();
                                let task_llm_client = llm_client.clone();
                                let task_session_id = session_id.clone();
                                let task_tx = tx.clone();

                                // 3. Spawn the async task
                                tokio::spawn(async move {
                                    // Prepare request messages (System + History)
                                    let mut request_messages = vec![task_system_message];
                                    request_messages.extend(messages_history.into_iter());

                                    let request = ChatCompletionRequest {
                                        model: "gpt-4o".to_string(), // TODO: Make configurable?
                                        messages: request_messages,
                                        stream: Some(false),
                                        metadata: Some(Metadata {
                                            generation_name: "cli_chat".to_string(),
                                            user_id: "cli_user".to_string(), 
                                            session_id: task_session_id,
                                            trace_id: Uuid::new_v4().to_string(), 
                                        }),
                                        ..Default::default()
                                    };

                                    // 4. Call LLM and process result
                                    let result = match task_llm_client.chat_completion(request).await {
                                        Ok(response) => {
                                            if let Some(choice) = response.choices.first() {
                                                 // Return the actual assistant message
                                                 Ok(choice.message.clone())
                                            } else {
                                                Err("No response choices received from API.".to_string())
                                            }
                                        }
                                        Err(e) => Err(format!("API call failed: {}", e)),
                                    };
                                    
                                    // 5. Send result back via channel
                                    let _ = task_tx.send(AppEvent::ApiResponse(result));
                                });
                            }
                        }
                        KeyCode::Char(c) => {
                            if !app_state.is_loading { app_state.input.push(c); }
                        }
                        KeyCode::Backspace => {
                            if !app_state.is_loading { app_state.input.pop(); }
                        }
                        KeyCode::Up => app_state.scroll_up(),
                        KeyCode::Down => app_state.scroll_down(),
                        KeyCode::Esc => { app_state.should_quit = true; }
                        _ => {}
                    }
                }
            }
        }

        if last_tick.elapsed() >= tick_rate {
            last_tick = Instant::now();
        }
    } // End of while loop

    // --- Restore Terminal --- 
    // This code runs *after* the loop, regardless of how it exited.
    let _ = std::panic::take_hook(); // Restore original panic hook
    
    // Explicitly restore terminal state
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

    // Return the loop result if it's an error, otherwise return the cleanup result
    match loop_result {
        Ok(_) => cleanup_result,
        Err(e) => Err(e), // Prioritize returning the error that broke the loop
    }
}
