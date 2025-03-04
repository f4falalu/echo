use chrono::Utc;
use futures::TryStreamExt;
use indexmap::IndexMap;

use anyhow::{Error, Result};
use sqlx::{types::BigDecimal, Column, Pool, Postgres, Row};
use num_traits::cast::ToPrimitive;

use crate::data_types::DataType;

pub async fn redshift_query(
    pg_pool: Pool<Postgres>,
    query: String,
) -> Result<Vec<IndexMap<std::string::String, DataType>>, Error> {
    let mut stream = sqlx::query(&query).fetch(&pg_pool);

    let mut result: Vec<IndexMap<String, DataType>> = Vec::new();

    let mut count = 0;

    while let Some(row) = stream.try_next().await? {
        let mut row_map: IndexMap<String, DataType> = IndexMap::new();

        for (i, column) in row.columns().iter().enumerate() {
            let column_name = column.name();
            let type_info = column.type_info().clone().to_string();
            let column_value = match type_info.as_str() {
                "BOOL" => DataType::Bool(Some(row.get::<bool, _>(i))),
                "BYTEA" => DataType::Bytea(Some(row.get::<Vec<u8>, _>(i))),
                "CHAR" => DataType::Char(Some(row.get::<String, _>(i))),
                "INT8" => DataType::Int8(Some(row.get::<i64, _>(i))),
                "INT4" => DataType::Int4(Some(row.get::<i32, _>(i))),
                "INT2" => DataType::Int2(Some(row.get::<i16, _>(i))),
                "TEXT" | "VARCHAR" => DataType::Text(Some(row.get::<String, _>(i))),
                "FLOAT4" => DataType::Float4(Some(row.get::<f32, _>(i))),
                "FLOAT8" => DataType::Float8(Some(row.get::<f64, _>(i))),
                "NUMERIC" => {
                    let value: BigDecimal = row.get::<BigDecimal, _>(i);
                    let value: f64 = value.to_f64().unwrap();
                    DataType::Float8(Some(value))
                }
                "UUID" => DataType::Uuid(Some(row.get::<uuid::Uuid, _>(i))),
                "TIMESTAMP" => DataType::Timestamp(Some(row.get::<chrono::NaiveDateTime, _>(i))),
                "DATE" => DataType::Date(Some(row.get::<chrono::NaiveDate, _>(i))),
                "TIME" => DataType::Time(Some(row.get::<chrono::NaiveTime, _>(i))),
                "TIMESTAMPTZ" => {
                    DataType::Timestamptz(Some(row.get::<chrono::DateTime<Utc>, _>(i)))
                }
                "JSON" | "JSONB" => DataType::Json(Some(row.get::<serde_json::Value, _>(i))),
                _ => DataType::Unknown(Some(row.get::<String, _>(i))),
            };

            row_map.insert(column_name.to_string(), column_value);
        }

        result.push(row_map);

        count += 1;
        if count >= 1000 {
            break;
        }
    }
    Ok(result)
}
