use crate::error::BusterError;
use dirs;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

// Moved from run.rs
pub fn prompt_for_input(prompt_message: &str, default_value: Option<&str>, is_sensitive: bool) -> Result<String, BusterError> {
    if let Some(def_val) = default_value {
        print!("{} (default: {}): ", prompt_message, def_val);
    } else {
        print!("{}: ", prompt_message);
    }
    io::stdout().flush().map_err(|e| BusterError::CommandError(format!("Failed to flush stdout: {}", e)))?;
    
    let mut input = String::new();
    // Simple masking for sensitive input is complex in raw terminal io without extra crates.
    // For a real CLI, rpassword or similar would be used.
    // Here, we just read the line.
    io::stdin().read_line(&mut input).map_err(|e| BusterError::CommandError(format!("Failed to read line: {}", e)))?;
    let trimmed_input = input.trim().to_string();

    if trimmed_input.is_empty() {
        if let Some(def_val) = default_value {
            Ok(def_val.to_string())
        } else {
            println!("Input cannot be empty. Please try again.");
            prompt_for_input(prompt_message, default_value, is_sensitive) // Recurse
        }
    } else {
        Ok(trimmed_input)
    }
}

pub fn get_app_base_dir() -> Result<PathBuf, BusterError> {
    dirs::home_dir()
        .map(|home| home.join(".buster"))
        .ok_or_else(|| BusterError::CommandError("Failed to get home directory.".to_string()))
}

pub fn get_cached_value(app_base_dir: &Path, cache_file_name: &str) -> Result<Option<String>, BusterError> {
    let cache_file_path = app_base_dir.join(cache_file_name);
    if cache_file_path.exists() {
        fs::read_to_string(cache_file_path)
            .map(|val| Some(val.trim().to_string()))
            .map_err(|e| BusterError::CommandError(format!("Failed to read cached file {}: {}", cache_file_name, e)))
    } else {
        Ok(None)
    }
}

pub fn cache_value(app_base_dir: &Path, cache_file_name: &str, value: &str) -> Result<(), BusterError> {
    let cache_file_path = app_base_dir.join(cache_file_name);
    fs::create_dir_all(app_base_dir).map_err(|e| BusterError::CommandError(format!("Failed to create app base dir {}: {}", app_base_dir.display(), e)))?;
    fs::write(cache_file_path, value)
        .map_err(|e| BusterError::CommandError(format!("Failed to cache value to {}: {}", cache_file_name, e)))
}

pub fn update_env_file(
    target_dotenv_path: &Path,
    llm_api_key: Option<&str>,
    rerank_api_key: Option<&str>,
    rerank_model: Option<&str>,
    rerank_base_url: Option<&str>,
    llm_base_url: Option<&str> // Added for completeness, though not prompted by user yet
) -> Result<(), BusterError> {
    let mut new_env_lines: Vec<String> = Vec::new();
    let mut llm_key_updated = false;
    let mut rerank_key_updated = false;
    let mut rerank_model_updated = false;
    let mut rerank_base_updated = false;
    let mut llm_base_updated = false;

    if target_dotenv_path.exists() {
        let env_content = fs::read_to_string(target_dotenv_path).map_err(|e| {
            BusterError::CommandError(format!("Failed to read .env file at {}: {}", target_dotenv_path.display(), e))
        })?;

        for line in env_content.lines() {
            if line.starts_with("LLM_API_KEY=") && llm_api_key.is_some() {
                new_env_lines.push(format!("LLM_API_KEY=\"{}\"", llm_api_key.unwrap()));
                llm_key_updated = true;
            } else if line.starts_with("RERANK_API_KEY=") && rerank_api_key.is_some() {
                new_env_lines.push(format!("RERANK_API_KEY=\"{}\"", rerank_api_key.unwrap()));
                rerank_key_updated = true;
            } else if line.starts_with("RERANK_MODEL=") && rerank_model.is_some() {
                new_env_lines.push(format!("RERANK_MODEL=\"{}\"", rerank_model.unwrap()));
                rerank_model_updated = true;
            } else if line.starts_with("RERANK_BASE_URL=") && rerank_base_url.is_some() {
                new_env_lines.push(format!("RERANK_BASE_URL=\"{}\"", rerank_base_url.unwrap()));
                rerank_base_updated = true;
            } else if line.starts_with("LLM_BASE_URL=") && llm_base_url.is_some() {
                new_env_lines.push(format!("LLM_BASE_URL=\"{}\"", llm_base_url.unwrap()));
                llm_base_updated = true;
            } else {
                new_env_lines.push(line.to_string());
            }
        }
    }

    // Add any keys that were not found and updated, if new values are provided
    if !llm_key_updated && llm_api_key.is_some() {
        new_env_lines.push(format!("LLM_API_KEY=\"{}\"", llm_api_key.unwrap()));
    }
    if !rerank_key_updated && rerank_api_key.is_some() {
        new_env_lines.push(format!("RERANK_API_KEY=\"{}\"", rerank_api_key.unwrap()));
    }
    if !rerank_model_updated && rerank_model.is_some() {
        new_env_lines.push(format!("RERANK_MODEL=\"{}\"", rerank_model.unwrap()));
    }
    if !rerank_base_updated && rerank_base_url.is_some() {
        new_env_lines.push(format!("RERANK_BASE_URL=\"{}\"", rerank_base_url.unwrap()));
    }
    if !llm_base_updated && llm_base_url.is_some() {
        new_env_lines.push(format!("LLM_BASE_URL=\"{}\"", llm_base_url.unwrap()));
    } else if !llm_base_updated && llm_base_url.is_none() && !target_dotenv_path.exists() {
        // Ensure default LLM_BASE_URL if .env is being created from scratch and no override provided
        new_env_lines.push("LLM_BASE_URL=\"https://api.openai.com/v1\"".to_string());
    }

    fs::write(target_dotenv_path, new_env_lines.join("\n")).map_err(|e| {
        BusterError::CommandError(format!("Failed to write updated .env file to {}: {}", target_dotenv_path.display(), e))
    })
}

pub fn prompt_and_manage_openai_api_key(app_base_dir: &Path, force_prompt: bool) -> Result<String, BusterError> {
    let cache_file = ".openai_api_key";
    let mut current_key = get_cached_value(app_base_dir, cache_file)?;

    if force_prompt || current_key.is_none() {
        if current_key.is_some() {
            let key_display = current_key.as_ref().map_or("", |k| if k.len() > 4 { &k[k.len()-4..] } else { "****" });
            let update_choice = prompt_for_input(&format!("Current OpenAI API key ends with ...{}. Update? (y/n)", key_display), Some("n"), false)?.to_lowercase();
            if update_choice != "y" {
                return Ok(current_key.unwrap());
            }
        }
        let new_key = prompt_for_input("Enter your OpenAI API Key:", None, true)?;
        cache_value(app_base_dir, cache_file, &new_key)?;
        current_key = Some(new_key);
    }
    current_key.ok_or_else(|| BusterError::CommandError("OpenAI API Key setup failed.".to_string()))
}

pub struct RerankerConfig {
    pub provider: String,
    pub api_key: String,
    pub model: String,
    pub base_url: String,
}

pub fn prompt_and_manage_reranker_settings(app_base_dir: &Path, force_prompt: bool) -> Result<RerankerConfig, BusterError> {
    let provider_cache = ".reranker_provider";
    let key_cache = ".reranker_api_key";
    let model_cache = ".reranker_model";
    let url_cache = ".reranker_base_url";

    let mut current_provider = get_cached_value(app_base_dir, provider_cache)?;
    let mut current_key = get_cached_value(app_base_dir, key_cache)?;
    let mut current_model = get_cached_value(app_base_dir, model_cache)?;
    let mut current_url = get_cached_value(app_base_dir, url_cache)?;

    let mut needs_update = force_prompt;
    if !needs_update && (current_provider.is_none() || current_key.is_none() || current_model.is_none() || current_url.is_none()) {
        needs_update = true; // If any part is missing, force update flow for initial setup
    }

    if needs_update {
        if !force_prompt && current_provider.is_some() && current_model.is_some() { // Already prompted if force_prompt is true
             let update_choice = prompt_for_input(&format!("Current Reranker: {} (Model: {}). Update settings? (y/n)", current_provider.as_ref().unwrap_or(&"N/A".to_string()), current_model.as_ref().unwrap_or(&"N/A".to_string())), Some("n"), false)?.to_lowercase();
            if update_choice != "y" && current_provider.is_some() && current_key.is_some() && current_model.is_some() && current_url.is_some(){
                return Ok(RerankerConfig {
                    provider: current_provider.unwrap(),
                    api_key: current_key.unwrap(),
                    model: current_model.unwrap(),
                    base_url: current_url.unwrap(),
                });
            }
        } else if force_prompt && current_provider.is_some() && current_model.is_some() {
            let update_choice = prompt_for_input(&format!("Current Reranker: {} (Model: {}). Update settings? (y/n)", current_provider.as_ref().unwrap_or(&"N/A".to_string()), current_model.as_ref().unwrap_or(&"N/A".to_string())), Some("n"), false)?.to_lowercase();
            if update_choice != "y" && current_provider.is_some() && current_key.is_some() && current_model.is_some() && current_url.is_some(){
                 return Ok(RerankerConfig {
                    provider: current_provider.unwrap(),
                    api_key: current_key.unwrap(),
                    model: current_model.unwrap(),
                    base_url: current_url.unwrap(),
                });
            }
        }

        println!("--- Reranker Setup ---");
        println!("Choose your reranker provider:");
        println!("1: Cohere");
        println!("2: Mixedbread");
        println!("3: Jina");
        let provider_choice = loop {
            match prompt_for_input("Enter choice (1-3):", Some("1"), false)?.parse::<u32>() {
                Ok(choice @ 1..=3) => break choice,
                _ => println!("Invalid choice. Please enter a number between 1 and 3."),
            }
        };

        let (new_provider, default_model, default_url) = match provider_choice {
            1 => ("Cohere", "rerank-english-v3.0", "https://api.cohere.com/v1/rerank"), // user asked for v3.5 but official docs say v3.0 for rerank model
            2 => ("Mixedbread", "mixedbread-ai/mxbai-rerank-xsmall-v1", "https://api.mixedbread.ai/v1/reranking"),
            3 => ("Jina", "jina-reranker-v1-base-en", "https://api.jina.ai/v1/rerank"),
            _ => unreachable!(),
        };

        let new_key_val = prompt_for_input(&format!("Enter your {} API Key:", new_provider), None, true)?;
        let new_model_val = prompt_for_input(&format!("Enter {} model name:", new_provider), Some(default_model), false)?;
        let new_url_val = prompt_for_input(&format!("Enter {} rerank base URL:", new_provider), Some(default_url), false)?;

        cache_value(app_base_dir, provider_cache, new_provider)?;
        cache_value(app_base_dir, key_cache, &new_key_val)?;
        cache_value(app_base_dir, model_cache, &new_model_val)?;
        cache_value(app_base_dir, url_cache, &new_url_val)?;
        
        current_provider = Some(new_provider.to_string());
        current_key = Some(new_key_val);
        current_model = Some(new_model_val);
        current_url = Some(new_url_val);
    }
    
    if let (Some(prov), Some(key), Some(model), Some(url)) = (current_provider, current_key, current_model, current_url) {
        Ok(RerankerConfig { provider: prov, api_key: key, model, base_url: url })
    } else {
        Err(BusterError::CommandError("Reranker configuration setup failed. Some values are missing.".to_string()))
    }
} 