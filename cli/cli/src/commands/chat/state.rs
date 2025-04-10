use litellm::{AgentMessage, MessageProgress, ToolCall};
use uuid::Uuid;
use agents::{AgentThread, AgentError};
use std::time::Instant;

// --- Application State Structs ---
#[derive(Debug, Clone)]
pub struct ActiveToolCall {
    pub id: String,
    pub name: String,
    pub status: String,
    pub content: Option<String>,
}

pub struct AppState {
    pub input: String,
    pub messages: Vec<AgentMessage>,
    pub scroll_offset: u16,
    pub should_quit: bool,
    pub active_tool_calls: Vec<ActiveToolCall>,
    pub current_error: Option<String>,
    pub agent_thread: AgentThread,
    pub is_agent_processing: bool,
}

// --- AppState Implementation ---
impl AppState {
    pub fn new(user_id: Uuid, session_id: Uuid) -> Self {
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

    pub fn submit_message(&mut self) {
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

    pub fn process_agent_message(&mut self, msg_result: Result<AgentMessage, AgentError>) {
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
        _initial: Option<bool>, // Parameter name changed to avoid conflict
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
                            initial: false, // Assuming false for new in-progress messages
                            name: Some(agent_name),
                        });
                    }
                } else {
                    self.messages.push(AgentMessage::Assistant {
                        id: _id,
                        content,
                        tool_calls,
                        progress,
                        initial: false, // Assuming false for the first message
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
                                initial: false, // Assuming final message is not initial
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
        let _name = tool_name.unwrap_or_else(|| "Unknown Tool".to_string()); // Use _name to avoid warning
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

    pub fn scroll_up(&mut self) {
        self.scroll_offset = self.scroll_offset.saturating_add(1);
    }

    pub fn scroll_down(&mut self) {
        self.scroll_offset = self.scroll_offset.saturating_sub(1);
    }
} 