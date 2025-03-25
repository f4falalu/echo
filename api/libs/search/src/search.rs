use anyhow::{anyhow, Result};
use sqlx::Row;
use tokio_stream::StreamExt;
use uuid::Uuid;

use database::pool::get_sqlx_pool;

use crate::types::{
    GenericSearchResult, MessageSearchResult, SearchObject, SearchObjectType, SearchOptions,
};

pub async fn search(
    user_id: Uuid,
    organization_id: Uuid,
    query: String,
    options: SearchOptions,
) -> Result<Vec<SearchObject>> {
    if query.is_empty() {
        return list_recent_assets(user_id, options).await;
    }

    let mut conn = get_sqlx_pool().acquire().await?;

    let search_terms: Vec<String> = query
        .split_whitespace()
        .map(|term| sanitize_search_term(term.to_lowercase()))
        .collect();

    let query = format!(
        r#"
        SELECT DISTINCT ON (asset_search.content, asset_search.asset_type)
            asset_search.asset_id,
            asset_search.content,
            asset_search.updated_at,
            asset_search.asset_type,
            pgroonga_score(asset_search.tableoid, asset_search.ctid) AS rank
        FROM 
            asset_search
        INNER JOIN
            asset_permissions
        ON 
            asset_search.asset_id = asset_permissions.asset_id
        WHERE 
            asset_search.asset_type IN ({})
            AND asset_search.content &@~ '{}'
            AND (asset_permissions.identity_id = '{}' OR asset_permissions.identity_id = '{}')
            AND asset_permissions.deleted_at IS NULL
            AND asset_search.deleted_at IS NULL
        ORDER BY asset_search.content, asset_search.asset_type, rank DESC
        LIMIT {};
        "#,
        options.asset_types_to_string(),
        search_terms
            .iter()
            .map(|term| term.replace('\'', "''"))
            .collect::<Vec<_>>()
            .join(" OR "),
        user_id,
        organization_id,
        options.num_results
    );

    let mut results = sqlx::query(&query).fetch(&mut *conn);
    let mut results_vec = Vec::new();
    
    while let Some(row) = results.try_next().await? {
        let content: String = match row.try_get("content") {
            Ok(content) => content,
            Err(e) => return Err(anyhow!("Error getting content: {:?}", e)),
        };

        // Skip empty content
        if content.trim().is_empty() {
            continue;
        }

        let id: Uuid = match row.try_get("asset_id") {
            Ok(id) => id,
            Err(e) => return Err(anyhow!("Error getting asset_id: {:?}", e)),
        };

        let updated_at = match row.try_get("updated_at") {
            Ok(updated_at) => updated_at,
            Err(e) => return Err(anyhow!("Error getting updated_at: {:?}", e)),
        };

        let asset_type: String = match row.try_get("asset_type") {
            Ok(asset_type) => asset_type,
            Err(e) => return Err(anyhow!("Error getting asset_type: {:?}", e)),
        };

        let rank: f64 = match row.try_get("rank") {
            Ok(rank) => rank,
            Err(_) => 0.0,
        };

        let highlights = find_highlights(&content, &search_terms);

        let search_object = match asset_type.as_str() {
            "thread" => {
                let content_json: serde_json::Value =
                    serde_json::from_str(&content).unwrap_or_default();
                
                let title = content_json["title"]
                    .as_str()
                    .unwrap_or("Untitled Thread")
                    .to_string();
                
                let summary_question = content_json["summary_question"]
                    .as_str()
                    .unwrap_or("")
                    .to_string();

                SearchObject::Message(MessageSearchResult {
                    id,
                    title,
                    summary_question,
                    updated_at,
                    highlights,
                    score: rank,
                    type_: SearchObjectType::Thread,
                })
            }
            "collection" => SearchObject::Collection(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::Collection,
            }),
            "dashboard" => SearchObject::Dashboard(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::Dashboard,
            }),
            "data_source" => SearchObject::DataSource(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::DataSource,
            }),
            "dataset" => SearchObject::Dataset(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::Dataset,
            }),
            "permission_group" => SearchObject::PermissionGroup(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::PermissionGroup,
            }),
            "team" => SearchObject::Team(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::Team,
            }),
            "term" => SearchObject::Term(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights,
                score: rank,
                type_: SearchObjectType::Term,
            }),
            _ => continue,
        };

        results_vec.push(search_object);
    }

    // Only filter when we have a query
    if !query.is_empty() {
        results_vec = results_vec
            .into_iter()
            .filter(|result| match result {
                SearchObject::Message(message) => !message.highlights.is_empty(),
                SearchObject::Collection(collection) => !collection.highlights.is_empty(),
                SearchObject::Dashboard(dashboard) => !dashboard.highlights.is_empty(),
                SearchObject::DataSource(data_source) => !data_source.highlights.is_empty(),
                SearchObject::Dataset(dataset) => !dataset.highlights.is_empty(),
                SearchObject::PermissionGroup(permission_group) => {
                    !permission_group.highlights.is_empty()
                }
                SearchObject::Team(team) => !team.highlights.is_empty(),
                SearchObject::Term(term) => !term.highlights.is_empty(),
            })
            .collect();
    }

    Ok(results_vec)
}

pub async fn list_recent_assets(
    user_id: Uuid,
    options: SearchOptions,
) -> Result<Vec<SearchObject>> {
    let mut conn = get_sqlx_pool().acquire().await?;

    // Default to 50 results if not specified for empty query listing
    let num_results = if options.num_results <= 0 { 50 } else { options.num_results };

    let query = format!(
        r#"
        WITH distinct_assets AS (
            SELECT DISTINCT ON (content, asset_type)
                asset_search.asset_id,
                asset_search.content,
                asset_search.updated_at,
                asset_search.asset_type
            FROM 
                asset_search
            INNER JOIN
                asset_permissions
            ON 
                asset_search.asset_id = asset_permissions.asset_id
            WHERE 
                asset_search.asset_type IN ({})
                AND (asset_permissions.identity_id = '{}')
                AND asset_search.deleted_at IS NULL
                AND asset_permissions.deleted_at IS NULL
        )
        SELECT *
        FROM distinct_assets
        ORDER BY updated_at DESC
        LIMIT {};
        "#,
        options.asset_types_to_string(),
        user_id,
        num_results
    );

    let mut results = sqlx::query(&query).fetch(&mut *conn);
    let mut results_vec = Vec::new();
    
    while let Some(row) = results.try_next().await? {
        let id: Uuid = match row.try_get("asset_id") {
            Ok(id) => id,
            Err(e) => return Err(anyhow!("Error getting asset_id: {:?}", e)),
        };

        let content: String = match row.try_get("content") {
            Ok(content) => content,
            Err(e) => return Err(anyhow!("Error getting content: {:?}", e)),
        };

        // Skip empty content
        if content.trim().is_empty() {
            continue;
        }

        let updated_at = match row.try_get("updated_at") {
            Ok(updated_at) => updated_at,
            Err(e) => return Err(anyhow!("Error getting updated_at: {:?}", e)),
        };

        let asset_type: String = match row.try_get("asset_type") {
            Ok(asset_type) => asset_type,
            Err(e) => return Err(anyhow!("Error getting asset_type: {:?}", e)),
        };

        let search_object = match asset_type.as_str() {
            "thread" => {
                let content_json: serde_json::Value =
                    serde_json::from_str(&content).unwrap_or_default();
                
                let title = content_json["title"]
                    .as_str()
                    .unwrap_or("Untitled Thread")
                    .to_string();
                
                let summary_question = content_json["summary_question"]
                    .as_str()
                    .unwrap_or("")
                    .to_string();

                SearchObject::Message(MessageSearchResult {
                    id,
                    title,
                    summary_question,
                    updated_at,
                    highlights: vec![],
                    score: 0.0,
                    type_: SearchObjectType::Thread,
                })
            }
            "collection" => SearchObject::Collection(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::Collection,
            }),
            "dashboard" => SearchObject::Dashboard(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::Dashboard,
            }),
            "data_source" => SearchObject::DataSource(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::DataSource,
            }),
            "dataset" => SearchObject::Dataset(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::Dataset,
            }),
            "permission_group" => SearchObject::PermissionGroup(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::PermissionGroup,
            }),
            "team" => SearchObject::Team(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::Team,
            }),
            "term" => SearchObject::Term(GenericSearchResult {
                id,
                name: extract_name_from_content(&content),
                updated_at,
                highlights: vec![],
                score: 0.0,
                type_: SearchObjectType::Term,
            }),
            _ => continue,
        };

        results_vec.push(search_object);
    }

    Ok(results_vec)
}

fn extract_name_from_content(content: &str) -> String {
    match serde_json::from_str::<serde_json::Value>(content) {
        Ok(json) => {
            if let Some(name) = json["name"].as_str() {
                return name.to_string();
            }
            if let Some(title) = json["title"].as_str() {
                return title.to_string();
            }
            "Untitled".to_string()
        }
        Err(_) => "Untitled".to_string(),
    }
}

fn find_highlights(content: &str, search_terms: &[String]) -> Vec<String> {
    let mut highlights = Vec::new();
    
    // Try to parse the content as JSON first
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(content) {
        // Convert the JSON back to a string for highlighting
        let content_str = json.to_string().to_lowercase();
        
        for term in search_terms {
            if content_str.contains(term) {
                // Here you would extract context around the match
                let term_start = content_str.find(term).unwrap_or(0);
                let context_start = term_start.saturating_sub(20);
                let context_end = (term_start + term.len() + 20).min(content_str.len());
                let highlight = content_str[context_start..context_end].to_string();
                highlights.push(highlight);
            }
        }
    } else {
        // If not JSON, treat as plain text
        let content_lower = content.to_lowercase();
        
        for term in search_terms {
            if content_lower.contains(term) {
                let term_start = content_lower.find(term).unwrap_or(0);
                let context_start = term_start.saturating_sub(20);
                let context_end = (term_start + term.len() + 20).min(content_lower.len());
                let highlight = content_lower[context_start..context_end].to_string();
                highlights.push(highlight);
            }
        }
    }
    
    highlights
}

fn sanitize_search_term(term: String) -> String {
    // Remove special characters that might interfere with the search
    let term = term.replace(['(', ')', '[', ']', '{', '}', '\\', '*', '+', '.', '?', '^', '$', '|'], "");
    
    // If the term is now empty, use a default that will match nothing
    if term.is_empty() {
        return "NOMATCHPOSSIBLE".to_string();
    }
    
    term
}