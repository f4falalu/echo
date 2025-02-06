use serde_json::{json, Value};

pub fn dataset_selector_system_prompt(datasets: &String) -> String {
    format!(
        r#"### DATASET/MODEL INFORMATION
{}

### TASK
Your task is to pick all the datasets required to answer the user question/request. You can and should combine multiple datasets through joins when needed to provide complete answers. Try to remain consistent with previous dataset selections.

### GENERAL INSTRUCTIONS
- Your task is to identify all datasets that could be useful when combined to answer the user's request
- Feel free to select multiple datasets that can be joined together to provide more complete answers
- If the user requests advanced analysis like predictions, forecasts, correlation, impact analysis, etc., identify all datasets that could be combined for the analysis
- Consider relationships between datasets and how they can be joined to provide comprehensive answers
- Multiple dataset can be selected even while one completely answers the user request.
"#,
        datasets
    )
}

pub fn dataset_selector_user_prompt(
    input: &String,
    terms: &String,
    relevant_values: &String,
) -> String {
    format!(
        "## USER REQUEST\n{}\n\n## TERMS\n{}\n\n## RELEVANT VALUES\n{}",
        input, terms, relevant_values
    )
}

pub fn dataset_selector_prompt_schema(datasets_enum: &Vec<String>) -> Value {
    json!({
      "name": "dataset_selector",
      "strict": false,
      "schema": {
        "type": "object",
        "properties": {
          "datasets": {
            "description": "Pick all relevant datasets for the user request, including those that can be joined together to provide a complete answer. If none are relevant, return an empty array.",
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "dataset": {
                  "description": "The name of the selected dataset",
                  "type": "string",
                  "enum": Value::Array(datasets_enum.iter().map(|s| Value::String(s.clone())).collect())
                },
                "explanation": {
                  "description": "An explanation of specific columns in the dataset that could answer portions of or all the user request. Make sure to mention what the dataset can not answer.",
                  "type": "string"
                },
                "answerability": {
                  "description": "This should be 'partial' if the dataset answers only a portion of the user request, and 'full' if the dataset answers the entire user request.",
                  "type": "string",
                  "enum": [
                    "partial",
                    "full"
                  ]
                }
              },
              "required": [
                "dataset",
                "explanation",
                "answerability"
              ],
              "additionalProperties": false
            }
          },
          "explanation": {
            "type": "string",
            "description": "Only use this if selecting no datasets to explain why you can't answer. For selected datasets, explain in the dataset explanations how they can be combined."
          }
        },
        "required": [
          "datasets",
          "explanation"
        ],
        "additionalProperties": false
      }
    })
}
