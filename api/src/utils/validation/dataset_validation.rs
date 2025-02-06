use anyhow::Result;
use tracing;

use crate::{
    database::models::DataSource,
    utils::{
        query_engine::{
            credentials::get_data_source_credentials,
            import_dataset_columns::retrieve_dataset_columns,
        },
        validation::{
            types::{ValidationError, ValidationResult},
            type_mapping::{normalize_type, types_compatible},
        },
    },
};

pub async fn validate_model(
    model_name: &str,
    model_database_name: &str,
    schema: &str,
    data_source: &DataSource,
    columns: &[(&str, &str)], // (name, type)
    expressions: Option<&[(&str, &str)]>, // (column_name, expr)
    relationships: Option<&[(&str, &str, &str)]>, // (from_model, to_model, type)
) -> Result<ValidationResult> {
    let mut result = ValidationResult::new(
        model_name.to_string(),
        data_source.name.clone(),
        schema.to_string(),
    );

    // Get credentials
    let credentials = match get_data_source_credentials(
        &data_source.secret_id,
        &data_source.type_,
        false,
    )
    .await
    {
        Ok(creds) => creds,
        Err(e) => {
            tracing::error!("Failed to get data source credentials: {}", e);
            result.add_error(ValidationError::data_source_error(format!(
                "Failed to get data source credentials: {}",
                e
            )));
            return Ok(result);
        }
    };

    // Get data source columns
    let ds_columns = match retrieve_dataset_columns(
        &model_database_name.to_string(),
        &schema.to_string(),
        &credentials,
    )
    .await
    {
        Ok(cols) => cols,
        Err(e) => {
            tracing::error!("Failed to get columns from data source: {}", e);
            result.add_error(ValidationError::data_source_error(format!(
                "Failed to get columns from data source: {}",
                e
            )));
            return Ok(result);
        }
    };

    // If no columns found, table doesn't exist
    if ds_columns.is_empty() {
        result.add_error(ValidationError::table_not_found(model_database_name));
        return Ok(result);
    }

    // Validate each column
    for (col_name, col_type) in columns {
        if let Some(ds_col) = ds_columns.iter().find(|c| c.name == *col_name) {
            if !types_compatible(data_source.type_, &ds_col.type_, col_type) {
                let ds_type = normalize_type(data_source.type_, &ds_col.type_);
                let model_type = normalize_type(data_source.type_, col_type);
                result.add_error(ValidationError::type_mismatch(
                    col_name,
                    &model_type.to_string(),
                    &ds_type.to_string(),
                ));
            }
        } else {
            result.add_error(ValidationError::column_not_found(col_name));
        }
    }

    // Validate expressions if provided
    if let Some(exprs) = expressions {
        for (col_name, expr) in exprs {
            // Check if expression references valid columns
            let expr_cols: Vec<&str> = expr
                .split_whitespace()
                .filter(|word| !word.chars().all(|c| c.is_ascii_punctuation()))
                .collect();

            for expr_col in expr_cols {
                if !columns.iter().any(|(name, _)| *name == expr_col) {
                    result.add_error(ValidationError::expression_error(
                        col_name,
                        expr,
                        &format!("Referenced column '{}' not found in model definition", expr_col),
                    ));
                }
            }
        }
    }

    // Validate relationships if provided
    if let Some(rels) = relationships {
        for (from_model, to_model, rel_type) in rels {
            // For now, just validate that both models exist
            // TODO: Add more sophisticated relationship validation
            if !ds_columns.iter().any(|c| c.name == *from_model) {
                result.add_error(ValidationError::invalid_relationship(
                    from_model,
                    to_model,
                    "Source model not found",
                ));
            }
            if !ds_columns.iter().any(|c| c.name == *to_model) {
                result.add_error(ValidationError::invalid_relationship(
                    from_model,
                    to_model,
                    "Target model not found",
                ));
            }
        }
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{database::enums::DataSourceType, utils::validation::ValidationErrorType};
    use uuid::Uuid;

    fn create_test_data_source() -> DataSource {
        DataSource {
            id: Uuid::new_v4(),
            name: "test_source".to_string(),
            type_: DataSourceType::Postgres,
            secret_id: Uuid::new_v4(),
            organization_id: Uuid::new_v4(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            deleted_at: None,
            env: "dev".to_string(),
            onboarding_status: crate::database::enums::DataSourceOnboardingStatus::InProgress,
            onboarding_error: None,
            created_by: Uuid::new_v4(),
            updated_by: Uuid::new_v4(),
        }
    }

    #[tokio::test]
    async fn test_validate_model_data_source_error() {
        let data_source = create_test_data_source();
        let result = validate_model(
            "test_model",
            "test_db",
            "test_schema",
            &data_source,
            &[("col1", "text")],
            None,
            None,
        )
        .await
        .unwrap();

        assert!(!result.success);
        assert_eq!(result.errors.len(), 1);
        assert_eq!(
            result.errors[0].error_type,
            ValidationErrorType::DataSourceError
        );
    }

    #[tokio::test]
    async fn test_validate_model_with_expressions() {
        let data_source = create_test_data_source();
        let result = validate_model(
            "test_model",
            "test_db",
            "test_schema",
            &data_source,
            &[("col1", "text")],
            Some(&[("col1", "invalid_col + 1")]),
            None,
        )
        .await
        .unwrap();

        assert!(!result.success);
        assert!(result
            .errors
            .iter()
            .any(|e| e.error_type == ValidationErrorType::ExpressionError));
    }

    #[tokio::test]
    async fn test_validate_model_with_relationships() {
        let data_source = create_test_data_source();
        let result = validate_model(
            "test_model",
            "test_db",
            "test_schema",
            &data_source,
            &[("col1", "text")],
            None,
            Some(&[("model1", "model2", "many_to_one")]),
        )
        .await
        .unwrap();

        assert!(!result.success);
        assert!(result
            .errors
            .iter()
            .any(|e| e.error_type == ValidationErrorType::InvalidRelationship));
    }

    #[tokio::test]
    async fn test_validate_model_multiple_errors() {
        let data_source = create_test_data_source();
        let result = validate_model(
            "test_model",
            "test_db",
            "test_schema",
            &data_source,
            &[("col1", "text"), ("col2", "invalid_type")],
            Some(&[("col1", "invalid_col + 1")]),
            Some(&[("model1", "model2", "many_to_one")]),
        )
        .await
        .unwrap();

        assert!(!result.success);
        assert!(result.errors.len() > 1);
        assert!(result
            .errors
            .iter()
            .any(|e| e.error_type == ValidationErrorType::ExpressionError));
        assert!(result
            .errors
            .iter()
            .any(|e| e.error_type == ValidationErrorType::InvalidRelationship));
    }
}
