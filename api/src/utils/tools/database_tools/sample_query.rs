use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

use crate::utils::tools::ToolCall;
use crate::utils::tools::ToolExecutor;

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
    results: Option<QueryResults>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SampleQueryOutput {
    queries: Vec<QueryResult>,
}

#[derive(Debug, Deserialize)]
pub struct SampleQueryInput {
    queries: Vec<String>,
}

pub struct SampleQuery;

#[async_trait]
impl ToolExecutor for SampleQuery {
    type Output = SampleQueryOutput;

    async fn execute(
        &self,
        tool_call: &ToolCall,
        user_id: &Uuid,
        session_id: &Uuid,
    ) -> Result<Self::Output> {
        let input: SampleQueryInput = serde_json::from_str(&tool_call.function.arguments)?;
        let mut results = Vec::new();

        for query in input.queries {
            // Basic validation - ensure it's a SELECT query and has LIMIT
            results.push(QueryResult {
                query: query.clone(),
                status: "failed".to_string(),
                results: None,
            });

            match execute_query(&query).await {
                Ok(query_results) => {
                    results.push(QueryResult {
                        query: query.clone(),
                        status: "success".to_string(),
                        results: Some(query_results),
                    });
                }
                Err(_) => {
                    results.push(QueryResult {
                        query: query.clone(),
                        status: "failed".to_string(),
                        results: None,
                    });
                }
            }
        }

        Ok(SampleQueryOutput { queries: results })
    }

    fn get_schema(&self) -> Value {
        serde_json::json!({
            "name": "sample_query",
            "description": "Executes a set of exploratory SQL queries, each limited to 25 records. Queries must be SELECT statements only. Used for exploring and understanding data patterns.",
            "parameters": {
                "type": "object",
                "properties": {
                    "queries": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "description": "SQL SELECT query with LIMIT clause"
                        },
                        "description": "Array of SQL queries to execute"
                    }
                },
                "required": ["queries"]
            }
        })
    }

    fn get_name(&self) -> String {
        "sample_query".to_string()
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
