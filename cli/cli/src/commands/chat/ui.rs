use ratatui::{
    prelude::*,
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, List, ListItem, Paragraph, Wrap},
};
use crate::commands::chat::state::AppState;

// --- Ratatui UI Rendering ---
pub fn ui(frame: &mut Frame, app: &AppState, cwd: &str) {
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
                    app.active_tool_calls.len() as u16 + 2 // +1 for thinking/error, +1 for border
                },
            ),
            Constraint::Length(3),
            Constraint::Length(1),
        ])
        .split(frame.size());

    let has_any_message = !app.messages.is_empty();

    // --- Main Content Area (Messages or Welcome) ---
    if !has_any_message {
        render_welcome(frame, main_chunks[0], cwd);
    } else {
        render_messages(frame, app, main_chunks[0]);
    }

    // --- Status Area --- 
    render_status(frame, app, main_chunks[1]);

    // --- Input Area ---
    render_input(frame, app, main_chunks[2]);
}

fn render_welcome(frame: &mut Frame, area: Rect, cwd: &str) {
     let welcome_tips_chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([
                Constraint::Length(4),
                Constraint::Length(5),
                Constraint::Min(0),
            ])
            .split(area);

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
}

fn render_messages(frame: &mut Frame, app: &AppState, area: Rect) {
    use litellm::{AgentMessage, MessageProgress};
    let mut message_lines: Vec<Line> = Vec::new();
    let num_messages = app.messages.len();

    for (msg_index, msg) in app.messages.iter().enumerate() {
        match msg {
            AgentMessage::User { content, .. } => {
                message_lines.push(Line::from(vec![
                    Span::styled("> ", Style::default().fg(Color::Green)),
                    Span::styled(content, Style::default().fg(Color::White)),
                ]));
            }
            AgentMessage::Assistant { content, progress, name, .. } => {
                let is_in_progress = *progress == MessageProgress::InProgress;
                let is_last_message = msg_index == num_messages - 1;
                let prev_msg_was_tool_result = if msg_index > 0 {
                    matches!(app.messages.get(msg_index - 1), Some(AgentMessage::Developer { .. }))
                } else {
                    false
                };

                // Omit prefix if it's the last message AND the previous was a tool result
                let show_prefix = !(is_last_message && prev_msg_was_tool_result && !is_in_progress);

                let prefix = if show_prefix {
                     Some(Span::styled(
                        format!(
                            "{} {}: ",
                            if is_in_progress { "…" } else { "•" },
                            name.as_deref().unwrap_or("Assistant")
                        ),
                        Style::default()
                            .fg(Color::Cyan)
                            .add_modifier(Modifier::BOLD),
                    ))
                } else {
                    None // Don't show prefix
                };

                if let Some(c) = content {
                    let lines: Vec<&str> = c.split('\n').collect();
                    for (i, line_content) in lines.iter().enumerate() {
                        let line_span = Span::styled(*line_content, Style::default().fg(Color::White));
                        if i == 0 {
                             if let Some(p) = prefix.clone() {
                                message_lines.push(Line::from(vec![p, line_span]));
                             } else {
                                // No prefix, just the content line
                                message_lines.push(Line::from(line_span));
                             }
                        } else {
                            // Indent subsequent lines (relative to prefix or start)
                            let indent = if prefix.is_some() { "  " } else { "" };
                            message_lines.push(Line::from(vec![
                                Span::raw(indent),
                                line_span,
                            ]));
                        }
                    }
                } else if let Some(p) = prefix {
                    // Show prefix even if content is None (e.g., for InProgress)
                    message_lines.push(Line::from(p));
                }

                if !is_in_progress {
                    message_lines.push(Line::from(""));
                }
            }
            AgentMessage::Developer { content, name, .. } => {
                // Render tool messages/results
                let prefix = Span::styled(
                    format!("{} {}: ", "🔩", name.as_deref().unwrap_or("Tool")), // Use a gear icon
                    Style::default().fg(Color::DarkGray).add_modifier(Modifier::BOLD),
                );
                let content_style = Style::default().fg(Color::DarkGray);

                let lines: Vec<&str> = content.split('\n').collect();
                for (i, line_content) in lines.iter().enumerate() {
                    let line_span = Span::styled(*line_content, content_style);
                    if i == 0 {
                        message_lines.push(Line::from(vec![prefix.clone(), line_span]));
                    } else {
                        message_lines.push(Line::from(vec![
                            Span::raw("  "), // Indent subsequent lines
                            line_span,
                        ]));
                    }
                }
                 message_lines.push(Line::from("")); // Add space after tool message
            }
            _ => {} // Ignore other message types for history display
        }
    }

    // Add "Thinking..." indicator if processing and no tool calls active
    if app.is_agent_processing && app.active_tool_calls.is_empty() && !matches!(app.messages.last(), Some(AgentMessage::Developer { .. })) {
        // Check if the last message isn't already an InProgress Assistant message
        let last_msg_is_thinking = matches!(app.messages.last(), Some(AgentMessage::Assistant { progress: MessageProgress::InProgress, .. }));
        if !last_msg_is_thinking {
            message_lines.push(Line::from(Span::styled(
                "🤔 Thinking...",
                 Style::default().fg(Color::Yellow).add_modifier(Modifier::ITALIC),
            )));
        }
    }

    let content_height = message_lines.len() as u16;
    let view_height = area.height;
    let max_scroll = content_height.saturating_sub(view_height);
    let current_scroll = if app.scroll_offset == 0 {
        max_scroll
    } else {
        app.scroll_offset.min(max_scroll)
    };

    let messages_widget = Paragraph::new(message_lines)
        .scroll((current_scroll, 0))
        .wrap(Wrap { trim: false });
    frame.render_widget(messages_widget, area);
}

fn render_status(frame: &mut Frame, app: &AppState, area: Rect) {
    if area.height == 0 { return; } // Don't render if no space

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

    let status_list = List::new(status_items).block(
        Block::default()
            .borders(Borders::TOP) // Use only top border
            .border_style(Style::default().fg(Color::DarkGray)),
    );
    frame.render_widget(status_list, area);
}

fn render_input(frame: &mut Frame, app: &AppState, area: Rect) {
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
    frame.render_widget(input_widget, area);

    // --- Cursor ---
    if !is_input_disabled {
        frame.set_cursor(
            area.x + 1 + input_prefix.len() as u16 + app.input.chars().count() as u16, // +1 for left border
            area.y + 1,
        )
    }
} 