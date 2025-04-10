use super::args::ChatArgs;
use super::config::{get_config_path, load_chat_config, save_chat_config, ChatConfig};
use anyhow::Result;
use colored::*;
use litellm::{AgentMessage, MessageProgress, ToolCall};
use rustyline::error::ReadlineError;
use rustyline::DefaultEditor;
use std::env;
use std::io::{self, Stdout};
use std::time::Instant;
use strip_ansi_escapes::strip;
use thiserror::Error;
use tokio::sync::broadcast;
use uuid::Uuid;

// --- Agent Imports ---
use agents::{AgentError, AgentExt, AgentThread, BusterCliAgent};

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
    widgets::{Block, Borders, List, ListItem, Paragraph, Wrap},
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
    #[error("Agent processing error: {0}")]
    AgentError(String),
}

const DEFAULT_OPENAI_BASE_URL: &str = "https://api.openai.com/v1";

// --- Ratatui Application State ---
#[derive(Debug, Clone)]
struct ActiveToolCall {
    id: String,
    name: String,
    status: String,
    content: Option<String>,
}

struct AppState {
    input: String,
    messages: Vec<AgentMessage>,
    scroll_offset: u16,
    should_quit: bool,
    active_tool_calls: Vec<ActiveToolCall>,
    current_error: Option<String>,
    agent_thread: AgentThread,
    is_agent_processing: bool,
}

impl AppState {
    fn new(user_id: Uuid, session_id: Uuid) -> Self {
        AppState {
            input: String::new(),
            messages: vec![],
            scroll_offset: 0,
            should_quit: false,
            active_tool_calls: Vec::new(),
            current_error: None,
            agent_thread: AgentThread::new(Some(session_id), user_id, vec![]),
            is_agent_processing: false,
        }
    }

    fn submit_message(&mut self) {
        if !self.input.is_empty() && !self.is_agent_processing && self.active_tool_calls.is_empty()
        {
            let user_message = AgentMessage::user(self.input.clone());
            self.messages.push(user_message.clone());
            self.agent_thread.messages.push(user_message);

            self.input.clear();
            self.scroll_offset = 0;
            self.is_agent_processing = true;
            self.current_error = None;
        }
    }

    fn process_agent_message(&mut self, msg_result: Result<AgentMessage, AgentError>) {
        match msg_result {
            Ok(msg) => {
                self.current_error = None;
                match msg {
                    AgentMessage::Assistant {
                        id,
                        content,
                        tool_calls,
                        progress,
                        initial,
                        name,
                    } => {
                        self.handle_assistant_message(
                            id, content, tool_calls, progress, Some(initial), name, 
                        );
                    }
                    AgentMessage::Tool {
                        id,
                        name: tool_name,
                        content,
                        tool_call_id,
                        progress,
                    } => {
                        self.handle_tool_message(id, content, tool_call_id, tool_name, progress);
                    }
                    AgentMessage::Done => {
                        self.is_agent_processing = false;
                        self.active_tool_calls.clear();
                    }
                    AgentMessage::User { .. } | AgentMessage::Developer { .. } => {}
                }
            }
            Err(e) => {
                self.current_error = Some(format!("Agent Error: {}", e.0));
                self.is_agent_processing = false;
                self.active_tool_calls.clear();
                self.messages.push(AgentMessage::Assistant {
                    id: None,
                    content: Some(format!("Error: {}", e.0)),
                    name: Some("System".to_string()),
                    tool_calls: None,
                    progress: MessageProgress::Complete,
                    initial: false,
                });
            }
        }
        self.scroll_offset = 0;
    }

    fn handle_assistant_message(
        &mut self,
        _id: Option<String>,
        content: Option<String>,
        tool_calls: Option<Vec<ToolCall>>,
        progress: MessageProgress,
        initial: Option<bool>,
        name: Option<String>,
    ) {
        let agent_name = name.unwrap_or_else(|| "Assistant".to_string());
        match progress {
            MessageProgress::InProgress => {
                self.is_agent_processing = true;
                if let Some(calls) = &tool_calls {
                    self.active_tool_calls = calls
                        .iter()
                        .map(|tc| ActiveToolCall {
                            id: tc.id.clone(),
                            name: tc.function.name.clone(),
                            status: "Starting".to_string(),
                            content: None,
                        })
                        .collect();
                }
                if let Some(AgentMessage::Assistant {
                    content: existing_content,
                    progress: existing_progress,
                    ..
                }) = self.messages.last_mut()
                {
                    if *existing_progress == MessageProgress::InProgress {
                        if let Some(new_content) = content {
                            *existing_content = Some(new_content);
                        }
                    } else {
                        self.messages.push(AgentMessage::Assistant {
                            id: _id,
                            content,
                            tool_calls,
                            progress,
                            initial: false,
                            name: Some(agent_name),
                        });
                    }
                } else {
                    self.messages.push(AgentMessage::Assistant {
                        id: _id,
                        content,
                        tool_calls,
                        progress,
                        initial: false,
                        name: Some(agent_name),
                    });
                }
            }
            MessageProgress::Complete => {
                if tool_calls.is_none() {
                    if let Some(AgentMessage::Assistant {
                        progress: existing_progress,
                        ..
                    }) = self.messages.last_mut()
                    {
                        if *existing_progress == MessageProgress::InProgress {
                            *self.messages.last_mut().unwrap() = AgentMessage::Assistant {
                                id: _id,
                                content,
                                tool_calls,
                                progress,
                                initial: false,
                                name: Some(agent_name),
                            };
                        } else {
                            self.messages.push(AgentMessage::Assistant {
                                id: _id,
                                content,
                                tool_calls,
                                progress,
                                initial: false,
                                name: Some(agent_name),
                            });
                        }
                    } else {
                        self.messages.push(AgentMessage::Assistant {
                            id: _id,
                            content,
                            tool_calls,
                            progress,
                            initial: false,
                            name: Some(agent_name),
                        });
                    }
                    self.is_agent_processing = false;
                    self.active_tool_calls.clear();
                } else {
                    self.active_tool_calls = tool_calls
                        .unwrap_or_default()
                        .iter()
                        .map(|tc| ActiveToolCall {
                            id: tc.id.clone(),
                            name: tc.function.name.clone(),
                            status: "Pending Execution".to_string(),
                            content: None,
                        })
                        .collect();
                    self.is_agent_processing = true;
                }
            }
        }
    }

    fn handle_tool_message(
        &mut self,
        _id: Option<String>,
        content: String,
        tool_call_id: String,
        tool_name: Option<String>,
        progress: MessageProgress,
    ) {
        let name = tool_name.unwrap_or_else(|| "Unknown Tool".to_string());
        if let Some(tool) = self
            .active_tool_calls
            .iter_mut()
            .find(|t| t.id == tool_call_id)
        {
            match progress {
                MessageProgress::InProgress => {
                    tool.status = "Running".to_string();
                    tool.content = Some(content);
                    self.is_agent_processing = true;
                }
                MessageProgress::Complete => {
                    self.active_tool_calls.retain(|t| t.id != tool_call_id);
                    if self.active_tool_calls.is_empty() {
                        self.is_agent_processing = true;
                    }
                }
            }
        } else {
            eprintln!(
                "Warning: Received tool message for unknown or completed call ID: {}",
                tool_call_id
            );
        }
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
            Constraint::Min(1),
            Constraint::Length(
                if app.active_tool_calls.is_empty()
                    && !app.is_agent_processing
                    && app.current_error.is_none()
                {
                    0
                } else {
                    app.active_tool_calls.len() as u16 + 2
                },
            ),
            Constraint::Length(3),
            Constraint::Length(1),
        ])
        .split(frame.size());

    let has_any_message = !app.messages.is_empty();

    if !has_any_message {
        let welcome_tips_chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(4),
                Constraint::Length(5),
                Constraint::Min(0),
            ])
            .split(main_chunks[0]);

        let welcome_title = Span::styled(
            "* Welcome to Buster CLI! *",
            Style::default()
                .fg(Color::Yellow)
                .add_modifier(Modifier::BOLD),
        );
        let cwd_text = Line::from(format!("  cwd: {}", cwd).fg(Color::DarkGray));
        let welcome_text = vec![
            welcome_title.into(),
            Line::from(""),
            Line::from("  Type your request and press Enter."),
            cwd_text,
        ];
        let welcome_box = Paragraph::new(welcome_text).block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(Style::default().fg(Color::Rgb(255, 165, 0))),
        );
        frame.render_widget(welcome_box, welcome_tips_chunks[0]);

        let tips_title = Line::from("Tips:");
        let tip1 = Line::from("1. Ask questions about files (e.g., 'summarize README.md')");
        let tip2 = Line::from("2. Ask to edit files (e.g., 'replace foo with bar in main.rs')");
        let tip3 = Line::from("3. Run commands (e.g., 'run git status')");
        let tips_text = vec![Line::from(""), tips_title, tip1, tip2, tip3];
        let tips_widget = Paragraph::new(tips_text);
        frame.render_widget(tips_widget, welcome_tips_chunks[1]);
    } else {
        let mut message_lines: Vec<Line> = Vec::new();
        for msg in app.messages.iter() {
            match msg {
                AgentMessage::User { content, .. } => {
                    message_lines.push(Line::from(vec![
                        Span::styled("> ", Style::default().fg(Color::Green)),
                        Span::styled(content, Style::default().fg(Color::White)),
                    ]));
                }
                AgentMessage::Assistant {
                    content,
                    progress,
                    tool_calls,
                    name,
                    ..
                } => {
                    let is_in_progress = *progress == MessageProgress::InProgress;
                    let prefix = Span::styled(
                        format!(
                            "{} {}: ",
                            if is_in_progress { "…" } else { "•" },
                            name.as_deref().unwrap_or("Assistant")
                        ),
                        Style::default()
                            .fg(Color::Cyan)
                            .add_modifier(Modifier::BOLD),
                    );

                    let mut lines_for_msg = vec![prefix];
                    if let Some(c) = content {
                        lines_for_msg.push(Span::styled(c, Style::default().fg(Color::White)));
                    }

                    message_lines.push(Line::from(lines_for_msg));

                    if !is_in_progress {
                        message_lines.push(Line::from(""));
                    }
                }
                _ => {}
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

    if main_chunks[1].height > 0 {
        let mut status_items: Vec<ListItem> = Vec::new();

        for tool in &app.active_tool_calls {
            let content_preview = tool.content.as_deref().unwrap_or("");
            let display_content = if content_preview.len() > 50 {
                format!("{}...", &content_preview[..50])
            } else {
                content_preview.to_string()
            };
            status_items.push(ListItem::new(Line::from(vec![
                Span::styled("Tool: ", Style::default().fg(Color::Magenta)),
                Span::styled(
                    format!("{} ({})", tool.name, tool.status),
                    Style::default().fg(Color::Yellow),
                ),
                Span::styled(
                    format!(" {}", display_content),
                    Style::default().fg(Color::DarkGray),
                ),
            ])));
        }

        if app.is_agent_processing && app.active_tool_calls.is_empty() {
            status_items.push(ListItem::new(Line::from(Span::styled(
                "Agent is thinking...",
                Style::default().fg(Color::Yellow),
            ))));
        }

        if let Some(err) = &app.current_error {
            status_items.push(ListItem::new(Line::from(Span::styled(
                err,
                Style::default().fg(Color::Red),
            ))));
        }

        if !status_items.is_empty() {
            let status_list = List::new(status_items).block(
                Block::default()
                    .borders(Borders::TOP)
                    .border_style(Style::default().fg(Color::DarkGray)),
            );
            frame.render_widget(status_list, main_chunks[1]);
        }
    }

    let input_prefix = "> ";
    let is_input_disabled = app.is_agent_processing || !app.active_tool_calls.is_empty();
    let input_style = if is_input_disabled {
        Style::default().fg(Color::DarkGray)
    } else {
        Style::default().fg(Color::White)
    };

    let input_widget = Paragraph::new(Line::from(vec![
        Span::styled(input_prefix, input_style),
        Span::styled(&app.input, input_style),
    ]))
    .block(
        Block::default()
            .borders(Borders::ALL)
            .border_style(input_style),
    )
    .wrap(Wrap { trim: false });
    frame.render_widget(input_widget, main_chunks[2]);

    if !is_input_disabled {
        frame.set_cursor(
            main_chunks[2].x + input_prefix.len() as u16 + app.input.chars().count() as u16,
            main_chunks[2].y + 1,
        )
    }
}

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

// --- Main Chat Execution Logic ---
pub async fn run_chat(args: ChatArgs) -> Result<()> {
    // --- Initial Setup ---
    let cwd = env::current_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|_| "<unknown>".to_string());

    // --- Get Credentials ---
    let (base_url, api_key) = get_api_credentials(&args)?;
    // Note: Agent/LiteLLMClient might handle the case where both are None, but good practice to check.
    if api_key.is_none() {
         println!("{}", colored::Colorize::yellow("Warning: No API key provided. Requests may fail if required."));
         // Potentially return Err here if key is strictly required
         // return Err(ChatError::ConfigError("API Key is required but not found.".into()).into());
    }

    // --- Agent Initialization ---
    let user_id = Uuid::new_v4();
    let session_id = Uuid::new_v4();
    // Pass credentials to agent
    let cli_agent = BusterCliAgent::new(user_id, session_id, api_key, base_url).await
        .map_err(|e| ChatError::InitializationError(format!("Failed to create agent: {}", e)))?;

    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut app_state = AppState::new(user_id, session_id);

    let mut agent_rx: Option<broadcast::Receiver<Result<AgentMessage, AgentError>>> = None;

    let original_hook = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |panic_info| {
        let mut stdout = io::stdout();
        let _ = disable_raw_mode();
        let _ = execute!(stdout, LeaveAlternateScreen, DisableMouseCapture);
        original_hook(panic_info);
    }));

    let mut loop_result: Result<()> = Ok(());
    let tick_rate = std::time::Duration::from_millis(50);
    let mut last_tick = Instant::now();

    while !app_state.should_quit {
        if let Err(e) = terminal.draw(|f| ui(f, &app_state, &cwd)) {
            loop_result =
                Err(ChatError::InitializationError(format!("UI draw error: {}", e)).into());
            break;
        }

        if let Some(rx) = agent_rx.as_mut() {
            match rx.try_recv() {
                Ok(msg_result) => {
                    app_state.process_agent_message(msg_result);
                }
                Err(broadcast::error::TryRecvError::Empty) => { /* No message */ }
                Err(broadcast::error::TryRecvError::Closed) => {
                    agent_rx = None;
                    app_state.is_agent_processing = false;
                    app_state.active_tool_calls.clear();
                }
                Err(broadcast::error::TryRecvError::Lagged(n)) => {
                    eprintln!("Warning: Agent message receiver lagged by {} messages.", n);
                }
            }
        }

        let timeout = tick_rate
            .checked_sub(last_tick.elapsed())
            .unwrap_or_else(|| std::time::Duration::from_secs(0));

        if crossterm::event::poll(timeout)? {
            if let Event::Key(key) = event::read()? {
                if key.kind == KeyEventKind::Press {
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

                    let can_input =
                        !app_state.is_agent_processing && app_state.active_tool_calls.is_empty();

                    if can_input {
                        match key.code {
                            KeyCode::Enter => {
                                app_state.submit_message();

                                let agent_clone = cli_agent.clone();
                                let mut thread_clone = app_state.agent_thread.clone();
                                let cwd_clone = cwd.clone();

                                tokio::spawn(async move {
                                    match agent_clone.run(&mut thread_clone, &cwd_clone).await {
                                        Ok(rx) => {}
                                        Err(e) => {
                                            eprintln!("Error starting agent processing: {}", e);
                                        }
                                    }
                                });

                                match cli_agent.run(&mut app_state.agent_thread, &cwd).await {
                                    Ok(rx) => {
                                        agent_rx = Some(rx);
                                    }
                                    Err(e) => {
                                        app_state.process_agent_message(Err(AgentError(format!(
                                            "Failed to start agent: {}",
                                            e
                                        ))));
                                        app_state.is_agent_processing = false;
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
                            _ => {}
                        }
                    } else {
                        match key.code {
                            KeyCode::Up => app_state.scroll_up(),
                            KeyCode::Down => app_state.scroll_down(),
                            _ => {}
                        }
                    }
                }
            }
        }

        if last_tick.elapsed() >= tick_rate {
            last_tick = Instant::now();
        }
    }

    let _ = std::panic::take_hook();
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

    match loop_result {
        Ok(_) => cleanup_result,
        Err(e) => Err(e),
    }
}
