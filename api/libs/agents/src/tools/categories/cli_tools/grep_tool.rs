use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use regex::Regex;
use std::fs::File;
use std::io::{BufRead, BufReader};
use crate::{
    agent::Agent,
    tools::ToolExecutor
};

#[derive(Serialize, Deserialize, Debug)]
pub struct SearchFileContentGrepParams {
    pattern: String,
    file_paths: Vec<String>,
    use_regex: Option<bool>,
    case_sensitive: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GrepMatch {
    file_path: String,
    line_number: u64,
    line_content: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SearchFileContentGrepOutput {
    matches: Vec<GrepMatch>,
}

pub struct SearchFileContentGrepTool {
    agent: Arc<Agent>,
}

impl SearchFileContentGrepTool {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for SearchFileContentGrepTool {
    type Output = SearchFileContentGrepOutput;
    type Params = SearchFileContentGrepParams;

    fn get_name(&self) -> String {
        "search_file_content_grep".to_string()
    }

    async fn is_enabled(&self) -> bool {
        true
    }

    async fn execute(&self, params: Self::Params, _tool_call_id: String) -> Result<Self::Output, anyhow::Error> {
        let mut matches = Vec::new();
        let use_regex = params.use_regex.unwrap_or(false);
        let case_sensitive = params.case_sensitive.unwrap_or(true);
        let pattern_str = if case_sensitive { params.pattern.clone() } else { format!("(?i){}", params.pattern) };

        let regex = if use_regex {
            Some(Regex::new(&pattern_str).map_err(|e| anyhow::anyhow!("Invalid regex pattern '{}': {}", params.pattern, e))?)
        } else {
            None
        };

        for file_path in &params.file_paths {
            match File::open(file_path) {
                Ok(file) => {
                    let reader = BufReader::new(file);
                    for (line_num, line_result) in reader.lines().enumerate() {
                        match line_result {
                            Ok(line) => {
                                let is_match = if let Some(ref re) = regex {
                                    re.is_match(&line)
                                } else {
                                    if case_sensitive {
                                        line.contains(&params.pattern)
                                    } else {
                                        line.to_lowercase().contains(&params.pattern.to_lowercase())
                                    }
                                };

                                if is_match {
                                    matches.push(GrepMatch {
                                        file_path: file_path.clone(),
                                        line_number: (line_num + 1) as u64, // User-friendly 1-based indexing
                                        line_content: line,
                                    });
                                }
                            }
                            Err(e) => eprintln!("Error reading line in {}: {}", file_path, e), // Log and continue
                        }
                    }
                }
                Err(e) => eprintln!("Failed to open file {}: {}", file_path, e), // Log and continue
            }
        }

        Ok(SearchFileContentGrepOutput { matches })
    }

    async fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": self.get_name(),
            "description": "Searches for a pattern (string or regex) within the content of specified files. Returns matching lines with file path and line number.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pattern": {
                        "type": "string",
                        "description": "The text pattern or regular expression to search for."
                    },
                    "file_paths": {
                        "type": "array",
                        "description": "A list of file paths to search within.",
                        "items": { "type": "string" }
                    },
                    "use_regex": {
                        "type": "boolean",
                        "description": "Set to true if the pattern is a regular expression. Defaults to false (plain text search)."
                    },
                    "case_sensitive": {
                        "type": "boolean",
                        "description": "Set to false for case-insensitive search. Defaults to true."
                    }
                },
                "required": ["pattern", "file_paths"]
            }
        })
    }
} 