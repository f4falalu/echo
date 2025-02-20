use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;
use regex;
use std::sync::Arc;

use crate::utils::{
    tools::ToolExecutor,
    agent::Agent,
};
use litellm::ToolCall;

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResults {
    columns: Vec<String>,
    rows: Vec<Vec<Value>>,
    row_count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResult {
    query: String,
    status: String, // "success" or "failed"
    error: Option<String>,
    results: Option<QueryResults>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SqlQueryOutput {
    queries: Vec<QueryResult>,
}

#[derive(Debug, Deserialize)]
pub struct SqlQueryInput {
    queries: Vec<String>,
}

pub struct SqlQuery {
    agent: Arc<Agent>
}

impl SqlQuery {
    pub fn new(agent: Arc<Agent>) -> Self {
        Self { agent }
    }
}

#[async_trait]
impl ToolExecutor for SqlQuery {
    type Output = SqlQueryOutput;
    type Params = SqlQueryInput;

    fn get_name(&self) -> String {
        "run_sql".to_string()
    }

    async fn execute(&self, params: Self::Params) -> Result<Self::Output> {
        let input = params;
        let mut results = Vec::new();

        for query in input.queries {
            // Basic validation - ensure it's a SELECT query
            if !query.trim().to_lowercase().starts_with("select") {
                results.push(QueryResult {
                    query: query.clone(),
                    status: "failed".to_string(),
                    error: Some("Only SELECT queries are allowed".to_string()),
                    results: None,
                });
                continue;
            }

            // Enforce 25 record limit by appending/replacing LIMIT clause
            let query_with_limit = if query.to_lowercase().contains("limit") {
                // Replace existing LIMIT with LIMIT 25
                let re = regex::Regex::new(r"limit\s+\d+").unwrap();
                re.replace(&query.to_lowercase(), "LIMIT 25").to_string()
            } else {
                format!("{} LIMIT 25", query)
            };

            match execute_query(&query_with_limit).await {
                Ok(query_results) => {
                    results.push(QueryResult {
                        query: query_with_limit,
                        status: "success".to_string(),
                        error: None,
                        results: Some(query_results),
                    });
                }
                Err(e) => {
                    results.push(QueryResult {
                        query: query_with_limit,
                        status: "failed".to_string(),
                        error: Some(e.to_string()),
                        results: None,
                    });
                }
            }
        }

        Ok(SqlQueryOutput { queries: results })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "run_sql",
            "description": "Executes SQL SELECT queries with an enforced 25-record limit for data exploration. Non-SELECT queries are rejected.",
            "parameters": {
                "type": "object",
                "properties": {
                    "queries": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "SQL SELECT query (LIMIT 25 will be automatically applied)"
                        },
                        "description": "Array of SQL SELECT queries to execute"
                    }
                },
                "required": ["queries"]
            }
        })
    }
}

async fn execute_query(query: &str) -> Result<QueryResults> {
    // Execute the query and get results
    Ok(QueryResults {
        columns: Vec::new(),
        rows: Vec::new(),
        row_count: 0,
    })
}
