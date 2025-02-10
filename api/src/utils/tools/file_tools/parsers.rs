use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub name: String,
    pub file_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModificationMetadata {
    pub id: String,
    pub file_type: String,
    pub file_name: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct FileChunk {
    pub text: String,
    pub line_number: usize,
    pub modified: bool,
}

#[derive(Debug)]
pub enum FileStreamEvent {
    Metadata(FileMetadata),
    ContentChunk { lines: Vec<FileChunk> },
    Complete { all_lines: Vec<FileChunk> },
}

pub struct CreateFileParser {
    buffer: String,
    pub current_file: Option<FileMetadata>,
    yml_content_buffer: String,
    line_count: usize,
    in_yml_content: bool,
    in_string: bool,
    quote_char: Option<char>,
}

impl CreateFileParser {
    pub fn new() -> Self {
        Self {
            buffer: String::new(),
            current_file: None,
            yml_content_buffer: String::new(),
            line_count: 0,
            in_yml_content: false,
            in_string: false,
            quote_char: None,
        }
    }

    pub fn process_chunk(&mut self, chunk: &str) -> Result<Option<FileStreamEvent>> {
        self.buffer.push_str(chunk);
        
        // First priority: get file metadata if we don't have it
        if self.current_file.is_none() {
            if let Some(metadata) = self.try_extract_metadata()? {
                return Ok(Some(FileStreamEvent::Metadata(metadata)));
            }
        }

        // Once we have metadata, look for yml_content
        if self.current_file.is_some() {
            let mut new_lines = Vec::new();
            let mut current_line = String::new();

            for c in self.buffer.chars() {
                match c {
                    '"' | '\'' if !self.in_string => {
                        self.in_string = true;
                        self.quote_char = Some(c);
                        
                        // Check if we're entering yml_content
                        if !self.in_yml_content && self.buffer.ends_with("\"yml_content\": ") {
                            self.in_yml_content = true;
                            self.yml_content_buffer.clear();
                            continue;
                        }
                    }
                    c if self.in_string && Some(c) == self.quote_char => {
                        self.in_string = false;
                        self.quote_char = None;
                        
                        if self.in_yml_content {
                            // End of yml_content
                            if !current_line.is_empty() {
                                self.line_count += 1;
                                new_lines.push(FileChunk {
                                    text: current_line.clone(),
                                    line_number: self.line_count,
                                    modified: true,
                                });
                                current_line.clear();
                            }
                            self.in_yml_content = false;
                        }
                    }
                    '\n' if self.in_yml_content => {
                        self.line_count += 1;
                        new_lines.push(FileChunk {
                            text: current_line.clone(),
                            line_number: self.line_count,
                            modified: true,
                        });
                        current_line.clear();
                    }
                    _ if self.in_yml_content => {
                        current_line.push(c);
                    }
                    _ => {}
                }
            }

            // Handle any remaining line
            if !current_line.is_empty() && self.in_yml_content {
                self.line_count += 1;
                new_lines.push(FileChunk {
                    text: current_line,
                    line_number: self.line_count,
                    modified: true,
                });
            }

            if !new_lines.is_empty() {
                return Ok(Some(FileStreamEvent::ContentChunk { lines: new_lines }));
            }
        }

        Ok(None)
    }

    fn try_extract_metadata(&mut self) -> Result<Option<FileMetadata>> {
        // Look for name and file_type in the JSON stream
        if let Some(name) = self.extract_string_field("name") {
            if let Some(file_type) = self.extract_string_field("file_type") {
                let metadata = FileMetadata { name, file_type };
                self.current_file = Some(metadata.clone());
                return Ok(Some(metadata));
            }
        }
        Ok(None)
    }

    fn extract_string_field(&self, field_name: &str) -> Option<String> {
        if let Some(start) = self.buffer.find(&format!("\"{}\":", field_name)) {
            let content_start = self.buffer[start..].find(':')?;
            let mut content = self.buffer[start + content_start + 1..].trim();
            
            if content.starts_with('"') {
                content = &content[1..];
                if let Some(end) = content.find('"') {
                    return Some(content[..end].to_string());
                }
            }
        }
        None
    }
}

pub struct ModifyFileParser {
    buffer: String,
    pub current_modification: Option<ModificationMetadata>,
    new_content_buffer: String,
    line_count: usize,
    in_new_content: bool,
    current_line_range: Option<(usize, usize)>,
    in_string: bool,
    quote_char: Option<char>,
}

impl ModifyFileParser {
    pub fn new() -> Self {
        Self {
            buffer: String::new(),
            current_modification: None,
            new_content_buffer: String::new(),
            line_count: 0,
            in_new_content: false,
            current_line_range: None,
            in_string: false,
            quote_char: None,
        }
    }

    pub fn process_chunk(&mut self, chunk: &str) -> Result<Option<FileStreamEvent>> {
        tracing::debug!("Processing chunk in ModifyFileParser, length: {}", chunk.len());
        self.buffer.push_str(chunk);
        
        // First get modification metadata if we don't have it
        if self.current_modification.is_none() {
            if let Some(metadata) = self.try_extract_metadata()? {
                tracing::debug!("Extracted metadata: {:?}", metadata);
                return Ok(Some(FileStreamEvent::Metadata(metadata)));
            }
        }

        // Then look for modifications array and new_content
        if self.current_modification.is_some() {
            let mut new_lines = Vec::new();
            let mut current_line = String::new();

            // Try to extract line range before processing content
            if self.current_line_range.is_none() {
                self.try_extract_line_range();
                if let Some((start, end)) = self.current_line_range {
                    tracing::debug!("Extracted line range: start={}, end={}", start, end);
                }
            }

            for c in self.buffer.chars() {
                match c {
                    '"' | '\'' if !self.in_string => {
                        self.in_string = true;
                        self.quote_char = Some(c);
                        
                        // Check if we're entering new_content
                        if !self.in_new_content && self.buffer.ends_with("\"new_content\": ") {
                            tracing::debug!("Found new_content field");
                            self.in_new_content = true;
                            self.new_content_buffer.clear();
                            continue;
                        }
                    }
                    c if self.in_string && Some(c) == self.quote_char => {
                        self.in_string = false;
                        self.quote_char = None;
                        
                        if self.in_new_content {
                            // End of new_content
                            if !current_line.is_empty() {
                                self.line_count += 1;
                                if let Some((start, _)) = self.current_line_range {
                                    let chunk = FileChunk {
                                        text: current_line.clone(),
                                        line_number: start + self.line_count - 1,
                                        modified: true,
                                    };
                                    tracing::debug!(
                                        "FILE CHUNK: line={}, modified={}\n{}",
                                        chunk.line_number,
                                        chunk.modified,
                                        chunk.text
                                    );
                                    new_lines.push(chunk);
                                }
                                current_line.clear();
                            }
                            self.in_new_content = false;
                            tracing::debug!("Finished processing new_content");
                        }
                    }
                    '\n' if self.in_new_content => {
                        self.line_count += 1;
                        if let Some((start, _)) = self.current_line_range {
                            let chunk = FileChunk {
                                text: current_line.clone(),
                                line_number: start + self.line_count - 1,
                                modified: true,
                            };
                            tracing::debug!(
                                "FILE CHUNK: line={}, modified={}\n{}",
                                chunk.line_number,
                                chunk.modified,
                                chunk.text
                            );
                            new_lines.push(chunk);
                        }
                        current_line.clear();
                    }
                    _ if self.in_new_content => {
                        current_line.push(c);
                    }
                    _ => {}
                }
            }

            // Handle any remaining line
            if !current_line.is_empty() && self.in_new_content {
                self.line_count += 1;
                if let Some((start, _)) = self.current_line_range {
                    let chunk = FileChunk {
                        text: current_line.clone(),
                        line_number: start + self.line_count - 1,
                        modified: true,
                    };
                    tracing::debug!(
                        "FILE CHUNK: line={}, modified={}\n{}",
                        chunk.line_number,
                        chunk.modified,
                        chunk.text
                    );
                    new_lines.push(chunk);
                }
            }

            if !new_lines.is_empty() {
                tracing::debug!("Returning {} new lines", new_lines.len());
                return Ok(Some(FileStreamEvent::ContentChunk { lines: new_lines }));
            }
        }

        Ok(None)
    }

    fn try_extract_metadata(&mut self) -> Result<Option<FileMetadata>> {
        if let (Some(id), Some(file_type), Some(file_name)) = (
            self.extract_string_field("id"),
            self.extract_string_field("file_type"),
            self.extract_string_field("file_name"),
        ) {
            let metadata = ModificationMetadata {
                id,
                file_type: file_type.clone(),
                file_name: file_name.clone(),
            };
            self.current_modification = Some(metadata);
            return Ok(Some(FileMetadata {
                name: file_name,
                file_type,
            }));
        }
        Ok(None)
    }

    fn try_extract_line_range(&mut self) {
        if let Some(start) = self.buffer.find("\"line_numbers\": [") {
            let content_start = start + "\"line_numbers\": [".len();
            if let Some(content) = self.buffer[content_start..].split(']').next() {
                let numbers: Vec<&str> = content.split(',').collect();
                if numbers.len() == 2 {
                    if let (Ok(start), Ok(end)) = (
                        numbers[0].trim().parse::<usize>(),
                        numbers[1].trim().parse::<usize>(),
                    ) {
                        self.current_line_range = Some((start, end));
                    }
                }
            }
        }
    }

    fn extract_string_field(&self, field_name: &str) -> Option<String> {
        if let Some(start) = self.buffer.find(&format!("\"{}\":", field_name)) {
            let content_start = self.buffer[start..].find(':')?;
            let mut content = self.buffer[start + content_start + 1..].trim();
            
            if content.starts_with('"') {
                content = &content[1..];
                if let Some(end) = content.find('"') {
                    return Some(content[..end].to_string());
                }
            }
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_file_parser_metadata() {
        let mut parser = CreateFileParser::new();
        let chunk = r#"{"name": "test.yml", "file_type": "metric""#;
        
        let result = parser.process_chunk(chunk).unwrap();
        assert!(matches!(result, Some(FileStreamEvent::Metadata(_))));
        if let Some(FileStreamEvent::Metadata(metadata)) = result {
            assert_eq!(metadata.name, "test.yml");
            assert_eq!(metadata.file_type, "metric");
        }
    }

    #[test]
    fn test_create_file_parser_content() {
        let mut parser = CreateFileParser::new();
        
        // First send metadata
        parser.process_chunk(r#"{"name": "test.yml", "file_type": "metric", "yml_content": ""#).unwrap();
        
        // Then send content
        let result = parser.process_chunk("line1\nline2\n").unwrap();
        assert!(matches!(result, Some(FileStreamEvent::ContentChunk { .. })));
        if let Some(FileStreamEvent::ContentChunk { lines }) = result {
            assert_eq!(lines.len(), 2);
            assert_eq!(lines[0].text, "line1");
            assert_eq!(lines[0].line_number, 1);
            assert_eq!(lines[1].text, "line2");
            assert_eq!(lines[1].line_number, 2);
        }
    }

    #[test]
    fn test_modify_file_parser() {
        let mut parser = ModifyFileParser::new();
        
        // Send metadata
        let chunk1 = r#"{"id": "123", "file_type": "metric", "file_name": "test.yml", "modifications": [{"line_numbers": [1,2], "new_content": ""#;
        parser.process_chunk(chunk1).unwrap();
        
        // Send content
        let result = parser.process_chunk("new line1\nnew line2\n").unwrap();
        assert!(matches!(result, Some(FileStreamEvent::ContentChunk { .. })));
        if let Some(FileStreamEvent::ContentChunk { lines }) = result {
            assert_eq!(lines.len(), 2);
            assert_eq!(lines[0].text, "new line1");
            assert_eq!(lines[0].line_number, 1);
            assert_eq!(lines[1].text, "new line2");
            assert_eq!(lines[1].line_number, 2);
        }
    }
} 