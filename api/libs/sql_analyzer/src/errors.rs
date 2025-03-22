use thiserror::Error;

#[derive(Error, Debug)]
pub enum SqlAnalyzerError {
    #[error("SQL parsing failed: {0}")]
    ParseError(String),

    #[error("Vague references detected:\n{0}")]
    VagueReferences(String),

    #[error("Internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

impl From<sqlparser::parser::ParserError> for SqlAnalyzerError {
    fn from(err: sqlparser::parser::ParserError) -> Self {
        SqlAnalyzerError::ParseError(err.to_string())
    }
}