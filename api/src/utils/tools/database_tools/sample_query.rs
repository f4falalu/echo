use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use sqlx::PgPool;

use crate::utils::tools::ToolCall;
use crate::utils::tools::ToolExecutor;
use crate::database::get_pg_pool;

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResults {
    columns: Vec<String>,
    rows: Vec<Vec<Value>>,
    row_count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResult {
    query: String,
    status: String,  // "success" or "failed"
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
        let pool = get_pg_pool();
        let mut results = Vec::new();

        for query in input.queries {
            // Basic validation - ensure it's a SELECT query and has LIMIT
            if !is_valid_query(&query) {
                results.push(QueryResult {
                    query: query.clone(),
                    status: "failed".to_string(),
                    results: None,
                });
                continue;
            }

            match execute_query(&pool, &query).await {
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

async fn execute_query(pool: &PgPool, query: &str) -> Result<QueryResults> {
    // Execute the query and get results
    let rows = sqlx::query(query)
        .fetch_all(pool)
        .await?;

    if rows.is_empty() {
        return Ok(QueryResults {
            columns: Vec::new(),
            rows: Vec::new(),
            row_count: 0,
        });
    }

    // Extract column names from the first row
    let columns: Vec<String> = rows[0]
        .columns()
        .iter()
        .map(|col| col.name().to_string())
        .collect();

    // Convert rows to Vec<Vec<Value>>
    let rows: Vec<Vec<Value>> = rows
        .iter()
        .map(|row| {
            columns
                .iter()
                .enumerate()
                .map(|(i, _)| row.try_get(i).unwrap_or(Value::Null))
                .collect()
        })
        .collect();

    Ok(QueryResults {
        columns,
        rows: rows,
        row_count: rows.len() as i32,
    })
}