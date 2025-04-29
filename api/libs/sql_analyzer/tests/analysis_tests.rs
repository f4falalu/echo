use sql_analyzer::{analyze_query, SqlAnalyzerError, JoinInfo};
use tokio;

#[tokio::test]
async fn test_simple_query() {
    let sql = "SELECT u.id, u.name FROM schema.users u";
    let result = analyze_query(sql.to_string()).await.unwrap();

    assert_eq!(result.tables.len(), 1);
    assert_eq!(result.joins.len(), 0);
    assert_eq!(result.ctes.len(), 0);

    let table = &result.tables[0];
    assert_eq!(table.database_identifier, None);
    assert_eq!(table.schema_identifier, Some("schema".to_string()));
    assert_eq!(table.table_identifier, "users");
    assert_eq!(table.alias, Some("u".to_string()));

    let columns_vec: Vec<_> = table.columns.iter().collect();
    assert!(
        columns_vec.len() == 2,
        "Expected 2 columns, got {}",
        columns_vec.len()
    );
    assert!(table.columns.contains("id"), "Missing 'id' column");
    assert!(table.columns.contains("name"), "Missing 'name' column");
}

#[tokio::test]
async fn test_joins() {
    let sql =
        "SELECT u.id, o.order_id FROM schema.users u JOIN schema.orders o ON u.id = o.user_id";
    let result = analyze_query(sql.to_string()).await.unwrap();

    assert_eq!(result.tables.len(), 2);
    assert!(result.joins.len() > 0, "Should detect at least one join");

    let table_names: Vec<String> = result
        .tables
        .iter()
        .map(|t| t.table_identifier.clone())
        .collect();
    assert!(table_names.contains(&"users".to_string()));
    assert!(table_names.contains(&"orders".to_string()));

    let join_exists = result.joins.iter().any(|join| {
        (join.left_table == "users" && join.right_table == "orders")
            || (join.left_table == "orders" && join.right_table == "users")
    });
    assert!(
        join_exists,
        "Expected to find a join between tables users and orders"
    );
}

#[tokio::test]
async fn test_cte_query() {
    let sql = "WITH user_orders AS (
                 SELECT u.id, o.order_id 
                 FROM schema.users u 
                 JOIN schema.orders o ON u.id = o.user_id
               )
               SELECT uo.id, uo.order_id FROM user_orders uo";

    let result = analyze_query(sql.to_string()).await.unwrap();

    println!("Result: {:?}", result);

    assert_eq!(result.ctes.len(), 1);
    let cte = &result.ctes[0];
    assert_eq!(cte.name, "user_orders");
    assert_eq!(cte.summary.tables.len(), 2);
    assert_eq!(cte.summary.joins.len(), 1);
}

#[tokio::test]
async fn test_vague_references() {
    let sql = "SELECT u.id FROM users u";
    let result = analyze_query(sql.to_string()).await;

    assert!(result.is_err());
    if let Err(SqlAnalyzerError::VagueReferences(msg)) = result {
        assert!(msg.contains("Vague tables") || msg.contains("Vague/Unknown"), "Expected VagueTables error for 'users u', got: {}", msg);
    } else {
        panic!("Expected VagueReferences error, got: {:?}", result);
    }

    let sql = "SELECT id FROM schema.users";
    let result = analyze_query(sql.to_string()).await;

    assert!(result.is_err());
    if let Err(SqlAnalyzerError::VagueReferences(msg)) = result {
        assert!(msg.contains("Vague columns") || msg.contains("Vague/Unknown"), "Expected VagueColumns error for 'id', got: {}", msg);
    } else {
        panic!("Expected VagueReferences error, got: {:?}", result);
    }
}

#[tokio::test]
async fn test_fully_qualified_query() {
    let sql = "SELECT u.id, u.name FROM database.schema.users u";
    let result = analyze_query(sql.to_string()).await.unwrap();

    assert_eq!(result.tables.len(), 1);
    let table = &result.tables[0];
    assert_eq!(table.database_identifier, Some("database".to_string()));
    assert_eq!(table.schema_identifier, Some("schema".to_string()));
    assert_eq!(table.table_identifier, "users");
}

#[tokio::test]
async fn test_complex_cte_lineage() {
    let sql = "WITH 
               users_cte AS (
                 SELECT u.id, u.name FROM schema.users u
               )
               SELECT uc.id, uc.name FROM users_cte uc";

    let result = analyze_query(sql.to_string()).await.unwrap();

    assert_eq!(result.ctes.len(), 1);
    let cte = &result.ctes[0];
    assert_eq!(cte.name, "users_cte");
    assert_eq!(cte.summary.tables.len(), 1);
}

#[tokio::test]
async fn test_invalid_sql() {
    let sql = "SELECT * FRM users";
    let result = analyze_query(sql.to_string()).await;


    assert!(result.is_err());
    if let Err(SqlAnalyzerError::ParseError(msg)) = result {
        assert!(msg.contains("Expected") || msg.contains("syntax error"));
    } else {
        panic!("Expected ParseError, got: {:?}", result);
    }
}

#[tokio::test]
async fn test_analysis_nested_subqueries_as_join() {
    let sql = r#"
    WITH main_data AS (
        SELECT 
            t1.col1, 
            t2.col2, 
            t1.id as t1_id,
            c.id as c_id
        FROM db1.schema1.tableA t1
        JOIN db1.schema1.tableB t2 ON t1.id = t2.a_id
        LEFT JOIN db1.schema2.tableC c ON c.id = t1.id
        WHERE t1.status = 'active'
    )
    SELECT
        md.col1,
        COUNT(md.c_id) as sub_count
    FROM
        main_data md
    WHERE md.col1 > 100
    GROUP BY md.col1;
    "#;

    let result = analyze_query(sql.to_string())
        .await
        .expect("Analysis failed for nested query rewritten as JOIN in CTE");

    println!("Result: {:?}", result);

    assert_eq!(result.ctes.len(), 1, "Should detect 1 CTE");
    let main_cte = &result.ctes[0];
    assert_eq!(main_cte.name, "main_data");

    assert_eq!(main_cte.summary.joins.len(), 2, "Should detect 2 joins inside the CTE summary");
    
    let join1_exists = main_cte.summary.joins.iter().any(|j| 
        (j.left_table == "tableA" && j.right_table == "tableB") || (j.left_table == "tableB" && j.right_table == "tableA")
    );
    let join2_exists = main_cte.summary.joins.iter().any(|j| 
        (j.left_table == "tableB" && j.right_table == "tableC") || (j.left_table == "tableC" && j.right_table == "tableB")
    );
    assert!(join1_exists, "Join between tableA and tableB not found in CTE summary");
    assert!(join2_exists, "Join between tableB and tableC not found in CTE summary");

    assert_eq!(result.joins.len(), 0, "Overall query should have no direct joins");

    assert_eq!(result.tables.len(), 4, "Should detect all 3 base tables (A, B, C) and the CTE");

    let table_names: std::collections::HashSet<String> = result
        .tables
        .iter()
        .map(|t| format!("{}.{}.{}", t.database_identifier.as_deref().unwrap_or(""), t.schema_identifier.as_deref().unwrap_or(""), t.table_identifier))
        .collect();

    assert!(table_names.contains(&"db1.schema1.tableA".to_string()), "Missing tableA");
    assert!(table_names.contains(&"db1.schema1.tableB".to_string()), "Missing tableB");
    assert!(table_names.contains(&"db1.schema2.tableC".to_string()), "Missing tableC");
}

#[tokio::test]
async fn test_analysis_union_all() {
    let sql = r#"
    SELECT u.id, u.name FROM db1.schema1.users u WHERE u.status = 'active'
    UNION ALL
    SELECT e.user_id, e.username FROM db2.schema1.employees e WHERE e.role = 'manager'
    UNION ALL
    SELECT c.pk, c.full_name FROM db1.schema2.contractors c WHERE c.end_date IS NULL;
    "#;

    let result = analyze_query(sql.to_string())
        .await
        .expect("Analysis failed for UNION ALL test");

    assert_eq!(result.ctes.len(), 0, "Should be no CTEs");
    assert_eq!(result.joins.len(), 0, "Should be no joins");
    assert_eq!(result.tables.len(), 3, "Should detect all 3 tables across UNIONs");

    let table_names: std::collections::HashSet<String> = result
        .tables
        .iter()
        .map(|t| {
            format!(
                "{}.{}.{}",
                t.database_identifier.as_deref().unwrap_or(""),
                t.schema_identifier.as_deref().unwrap_or(""),
                t.table_identifier
            )
        })
        .collect();

    assert!(
        table_names.contains(&"db1.schema1.users".to_string()),
        "Missing users table"
    );
    assert!(
        table_names.contains(&"db2.schema1.employees".to_string()),
        "Missing employees table"
    );
    assert!(
        table_names.contains(&"db1.schema2.contractors".to_string()),
        "Missing contractors table"
    );
}

#[tokio::test]
async fn test_analysis_combined_complexity() {
    let sql = r#"
    WITH active_users AS (
        SELECT u.id, u.name FROM db1.schema1.users u WHERE u.status = 'active'
    ),
    recent_orders AS (
        SELECT ro.user_id, MAX(ro.order_date) as last_order_date
        FROM db1.schema1.orders ro
        GROUP BY ro.user_id
    )
    SELECT au.name, ro.last_order_date
    FROM active_users au
    JOIN recent_orders ro ON au.id = ro.user_id
    JOIN (
        SELECT p_sub.item_id, p_sub.category FROM db2.schema1.products p_sub WHERE p_sub.is_available = true
    ) p ON p.item_id = ro.user_id
    WHERE au.id IN (SELECT sl.user_id FROM db1.schema2.special_list sl)
    UNION ALL
    SELECT e.name, e.hire_date
    FROM db2.schema1.employees e
    WHERE e.department = 'Sales';
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();

    println!("Result: {:?}", result);

    assert_eq!(result.ctes.len(), 2, "Should detect 2 CTEs");
    assert_eq!(result.joins.len(), 2, "Should detect 2 joins in the main query");
}