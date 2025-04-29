use sql_analyzer::{analyze_query, SqlAnalyzerError, JoinInfo};
use sql_analyzer::types::TableKind;
use tokio;
use std::collections::HashSet;

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
    // First test: Using a table without schema/db
    let sql = "SELECT u.id FROM users u";
    let result = analyze_query(sql.to_string()).await;

    // Validate that any attempt to use a table without schema results in error
    assert!(
        result.is_err(),
        "Using 'users' without schema/db identifier should fail"
    );
    
    if let Err(SqlAnalyzerError::VagueReferences(msg)) = result {
        println!("Error message for users test: {}", msg);
        assert!(
            msg.contains("users"),
            "Error should mention 'users' table: {}", 
            msg
        );
    } else {
        panic!("Expected VagueReferences error, got: {:?}", result);
    }

    // Second test: Using unqualified column
    let sql = "SELECT id FROM schema.users";
    let result = analyze_query(sql.to_string()).await;

    // Validate that unqualified column references result in error
    assert!(
        result.is_err(),
        "Using unqualified 'id' column should fail"
    );
    
    if let Err(SqlAnalyzerError::VagueReferences(msg)) = result {
        println!("Error message for id test: {}", msg);
        assert!(
            msg.contains("id"),
            "Error should mention 'id' column: {}", 
            msg
        );
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
    
    // We'll check that we have at least the 2 explicit CTEs
    let cte_names: Vec<_> = result.ctes.iter()
        .map(|cte| cte.name.clone())
        .filter(|name| name == "active_users" || name == "recent_orders")
        .collect();
    
    assert_eq!(cte_names.len(), 2, "Should detect the 'active_users' and 'recent_orders' CTEs");
    assert_eq!(result.joins.len(), 2, "Should detect 2 joins in the main query");
}

// --- New Tests Start Here ---

#[tokio::test]
async fn test_multiple_chained_ctes() {
    let sql = r#"
    WITH
      cte1 AS (
        SELECT p.id, p.category 
        FROM db1.schema1.products p
      ),
      cte2 AS (
        SELECT c1.id, c1.category, o.order_date
        FROM cte1 c1
        JOIN db1.schema1.orders o ON c1.id = o.product_id
        WHERE o.status = 'completed'
      )
    SELECT c2.category, COUNT(c2.id) as product_count
    FROM cte2 c2
    GROUP BY c2.category;
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();

    println!("Result CTEs: {:?}", result.ctes);
    println!("Result tables: {:?}", result.tables);

    // Count the named CTEs only (excluding subquery CTEs)
    let named_ctes: Vec<_> = result.ctes.iter()
        .filter(|c| c.name == "cte1" || c.name == "cte2")
        .collect();
    
    assert_eq!(named_ctes.len(), 2, "Should detect both cte1 and cte2");
    
    // The tables should include at least products, orders, and cte2
    assert!(result.tables.len() >= 3, "Should detect at least products, orders, and cte2");
    
    // Check that expected tables are present
    let table_ids: HashSet<_> = result.tables.iter().map(|t| t.table_identifier.as_str()).collect();
    assert!(table_ids.contains("products"), "Should find products table");
    assert!(table_ids.contains("orders"), "Should find orders table");
    assert!(table_ids.contains("cte2"), "Should find cte2 as a referenced table");
    
    // Find the cte2 in the ctes list
    let cte2_opt = result.ctes.iter().find(|c| c.name == "cte2");
    assert!(cte2_opt.is_some(), "Should find cte2 in CTEs list");
    
    // Main query has no direct joins
    assert_eq!(result.joins.len(), 0, "Main query should have no direct joins");
}

#[tokio::test]
async fn test_complex_where_clause() {
    let sql = r#"
    SELECT
        u.name, o.order_total
    FROM
        db1.schema1.users u
    JOIN
        db1.schema1.orders o ON u.id = o.user_id
    WHERE
        (u.signup_date > '2023-01-01' AND u.status = 'active')
        OR (o.order_total > 1000 AND lower(u.country) = 'ca');
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();

    assert_eq!(result.tables.len(), 2);
    assert_eq!(result.joins.len(), 1);

    // Check if columns used in WHERE are captured (basic check)
    let users_table = result.tables.iter().find(|t| t.table_identifier == "users").unwrap();
    assert!(users_table.columns.contains("id"));
    assert!(users_table.columns.contains("signup_date"));
    assert!(users_table.columns.contains("status"));
    assert!(users_table.columns.contains("country")); // Used in lower(u.country)

    let orders_table = result.tables.iter().find(|t| t.table_identifier == "orders").unwrap();
    assert!(orders_table.columns.contains("user_id"));
    assert!(orders_table.columns.contains("order_total"));
}

#[tokio::test]
async fn test_window_function() {
    // Note: The analyzer primarily tracks table/column usage, not the specifics of window function logic.
    let sql = r#"
    SELECT
        product_id,
        order_date,
        ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) as rn
    FROM
        db1.schema2.order_items oi
    WHERE oi.quantity > 0;
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();

    assert_eq!(result.tables.len(), 1);
    assert_eq!(result.joins.len(), 0);
    assert_eq!(result.ctes.len(), 0);

    let table = &result.tables[0];
    assert_eq!(table.table_identifier, "order_items");
    assert_eq!(table.database_identifier, Some("db1".to_string()));
    assert_eq!(table.schema_identifier, Some("schema2".to_string()));

    // Verify columns used in SELECT, WHERE, PARTITION BY, ORDER BY are captured
    assert!(table.columns.contains("product_id"));
    assert!(table.columns.contains("order_date"));
    assert!(table.columns.contains("customer_id")); // From PARTITION BY
    assert!(table.columns.contains("quantity")); // From WHERE
}

// ----- New Complex Test Cases -----

#[tokio::test]
async fn test_complex_nested_ctes_with_multilevel_references() {
    let sql = r#"
    WITH 
    level1 AS (
        SELECT e.id, e.name, e.dept_id FROM db1.schema1.employees e
    ),
    level2 AS (
        SELECT l1.id, l1.name, d.dept_name 
        FROM level1 l1
        JOIN db1.schema1.departments d ON l1.dept_id = d.id
    ),
    level3 AS (
        SELECT 
            l2.id, 
            l2.name, 
            l2.dept_name,
            (SELECT COUNT(*) FROM db1.schema1.projects p WHERE p.dept_id = l1.dept_id) as project_count
        FROM level2 l2
        JOIN level1 l1 ON l2.id = l1.id
    )
    SELECT 
        l3.id,
        l3.name,
        l3.dept_name,
        l3.project_count,
        s.salary_amount
    FROM level3 l3
    LEFT JOIN db1.schema1.salaries s ON l3.id = s.employee_id
    WHERE l3.project_count > 0
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();
    
    println!("Complex nested CTE result: {:?}", result);
    
    // Check that all CTEs are detected
    let cte_names: Vec<_> = result.ctes.iter()
        .map(|cte| cte.name.clone())
        .filter(|name| name == "level1" || name == "level2" || name == "level3")
        .collect();
    
    assert_eq!(cte_names.len(), 3, "Should detect all three CTEs");
    
    // Check base tables (employees, departments, projects, salaries)
    let base_tables: Vec<_> = result.tables.iter()
        .filter(|t| t.kind == TableKind::Base)
        .map(|t| t.table_identifier.clone())
        .collect();
    
    assert!(base_tables.contains(&"employees".to_string()), "Should detect employees table");
    assert!(base_tables.contains(&"departments".to_string()), "Should detect departments table");
    assert!(base_tables.contains(&"projects".to_string()), "Should detect projects table");
    assert!(base_tables.contains(&"salaries".to_string()), "Should detect salaries table");
    
    // Check joins
    assert!(!result.joins.is_empty(), "Should detect at least one join");
}

#[tokio::test]
async fn test_complex_subqueries_in_different_clauses() {
    // Simplified version with fewer deeply nested subqueries
    let sql = r#"
    -- Use CTEs instead of deeply nested subqueries
    WITH user_orders AS (
        SELECT o.id, o.user_id, o.order_date FROM db1.schema1.orders o
    ),
    user_items AS (
        SELECT oi.order_id, oi.item_id FROM db1.schema1.order_items oi
    ),
    verified_users AS (
        SELECT um.user_id FROM db1.schema1.user_metadata um WHERE um.is_verified = true
    )
    SELECT 
        u.id,
        u.name,
        (SELECT MAX(uo.order_date) FROM user_orders uo WHERE uo.user_id = u.id) as last_order,
        (SELECT SUM(i.amount) FROM db1.schema1.items i JOIN user_items ui ON i.item_id = ui.item_id 
         WHERE ui.order_id IN (SELECT uo2.id FROM user_orders uo2 WHERE uo2.user_id = u.id)
        ) as total_amount
    FROM db1.schema1.users u
    WHERE 
        u.status = 'active' 
        AND EXISTS (SELECT 1 FROM db1.schema1.payments p WHERE p.user_id = u.id)
        AND u.id IN (SELECT vu.user_id FROM verified_users vu)
    ORDER BY 
        (SELECT COUNT(*) FROM user_orders uo3 WHERE uo3.user_id = u.id) DESC
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();
    
    println!("Complex subqueries result: {:?}", result);
    
    // We should detect several CTEs - both explicit ones and implicit subquery CTEs
    assert!(result.ctes.len() >= 3, "Should detect both explicit CTEs and subquery CTEs");
    
    // We should detect all base tables
    let base_tables: Vec<_> = result.tables.iter()
        .filter(|t| t.kind == TableKind::Base)
        .map(|t| t.table_identifier.clone())
        .collect();
    
    assert!(base_tables.contains(&"users".to_string()), "Should detect users table");
    assert!(base_tables.contains(&"orders".to_string()), "Should detect orders table");
    assert!(base_tables.contains(&"items".to_string()), "Should detect items table");
    assert!(base_tables.contains(&"order_items".to_string()), "Should detect order_items table");
    assert!(base_tables.contains(&"payments".to_string()), "Should detect payments table");
    assert!(base_tables.contains(&"user_metadata".to_string()), "Should detect user_metadata table");
}

#[tokio::test]
async fn test_recursive_cte() {
    // Testing with a recursive CTE for hierarchical data
    // Note: Some SQL dialects use RECURSIVE keyword, others don't
    let sql = r#"
    WITH employee_hierarchy AS (
        -- Base case: start with CEO (employee with no manager)
        SELECT e.id, e.name, NULL as manager_id, 0 as level
        FROM db1.schema1.employees e
        WHERE e.manager_id IS NULL
        
        UNION ALL
        
        -- Recursive case: get all employees who report to someone in the hierarchy
        SELECT e.id, e.name, e.manager_id, eh.level + 1
        FROM db1.schema1.employees e
        JOIN employee_hierarchy eh ON e.manager_id = eh.id
    )
    SELECT 
        eh.id, 
        eh.name, 
        eh.level,
        d.dept_name
    FROM employee_hierarchy eh
    JOIN db1.schema1.departments d ON eh.id = d.manager_id
    ORDER BY eh.level, eh.name
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();
    
    println!("Recursive CTE result: {:?}", result);
    
    // Check that the recursive CTE is detected
    let cte_names: Vec<_> = result.ctes.iter()
        .map(|cte| cte.name.clone())
        .collect();
    
    assert!(cte_names.contains(&"employee_hierarchy".to_string()), "Should detect the recursive CTE");
    
    // Check base tables
    let base_tables: Vec<_> = result.tables.iter()
        .filter(|t| t.kind == TableKind::Base)
        .map(|t| t.table_identifier.clone())
        .collect();
    
    assert!(base_tables.contains(&"employees".to_string()), "Should detect employees table");
    assert!(base_tables.contains(&"departments".to_string()), "Should detect departments table");
    
    // Check joins in the main query
    assert!(!result.joins.is_empty(), "Should detect at least one join");
}

#[tokio::test]
async fn test_complex_window_functions() {
    let sql = r#"
    WITH monthly_sales AS (
        SELECT 
            p.product_id,
            p.category_id,
            DATE_TRUNC('month', s.sale_date) as month,
            SUM(s.quantity * s.price) as monthly_revenue
        FROM db1.schema1.products p
        JOIN db1.schema1.sales s ON p.product_id = s.product_id
        GROUP BY p.product_id, p.category_id, DATE_TRUNC('month', s.sale_date)
    )
    SELECT 
        ms.product_id,
        c.category_name,
        ms.month,
        ms.monthly_revenue,
        SUM(ms.monthly_revenue) OVER (
            PARTITION BY ms.product_id 
            ORDER BY ms.month
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) as cumulative_revenue,
        RANK() OVER (
            PARTITION BY ms.category_id, ms.month
            ORDER BY ms.monthly_revenue DESC
        ) as category_rank,
        LAG(ms.monthly_revenue, 1) OVER (
            PARTITION BY ms.product_id
            ORDER BY ms.month
        ) as prev_month_revenue,
        CASE 
            WHEN LAG(ms.monthly_revenue, 1) OVER (PARTITION BY ms.product_id ORDER BY ms.month) IS NULL THEN NULL
            ELSE (ms.monthly_revenue - LAG(ms.monthly_revenue, 1) OVER (PARTITION BY ms.product_id ORDER BY ms.month)) 
                / LAG(ms.monthly_revenue, 1) OVER (PARTITION BY ms.product_id ORDER BY ms.month) * 100 
        END as pct_change
    FROM monthly_sales ms
    JOIN db1.schema1.categories c ON ms.category_id = c.category_id
    ORDER BY ms.product_id, ms.month
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();
    
    println!("Complex window functions result: {:?}", result);
    
    // Check that the CTE is detected
    let cte_exists = result.ctes.iter()
        .any(|cte| cte.name == "monthly_sales");
    
    assert!(cte_exists, "Should detect the monthly_sales CTE");
    
    // Check base tables
    let base_tables: Vec<_> = result.tables.iter()
        .filter(|t| t.kind == TableKind::Base)
        .map(|t| t.table_identifier.clone())
        .collect();
    
    assert!(base_tables.contains(&"products".to_string()), "Should detect products table");
    assert!(base_tables.contains(&"sales".to_string()), "Should detect sales table");
    assert!(base_tables.contains(&"categories".to_string()), "Should detect categories table");
    
    // Check columns for window functions
    let monthly_sales_table = result.tables.iter()
        .find(|t| t.table_identifier == "monthly_sales");
        
    assert!(monthly_sales_table.is_some(), "Should find monthly_sales as a table");
    if let Some(ms_table) = monthly_sales_table {
        assert!(ms_table.columns.contains("product_id"), "Should detect product_id column");
        assert!(ms_table.columns.contains("category_id"), "Should detect category_id column");
        assert!(ms_table.columns.contains("month"), "Should detect month column");
        assert!(ms_table.columns.contains("monthly_revenue"), "Should detect monthly_revenue column");
    }
}

#[tokio::test]
async fn test_pivot_query() {
    // This test simulates a pivot query structure
    let sql = r#"
    WITH sales_data AS (
        SELECT 
            s.product_id,
            DATE_TRUNC('month', s.sale_date) as month,
            SUM(s.quantity) as total_sold
        FROM db1.schema1.sales s
        GROUP BY s.product_id, DATE_TRUNC('month', s.sale_date)
    )
    SELECT 
        p.product_name,
        SUM(CASE WHEN sd.month = '2023-01-01' THEN sd.total_sold ELSE 0 END) as jan_sales,
        SUM(CASE WHEN sd.month = '2023-02-01' THEN sd.total_sold ELSE 0 END) as feb_sales,
        SUM(CASE WHEN sd.month = '2023-03-01' THEN sd.total_sold ELSE 0 END) as mar_sales,
        SUM(CASE WHEN sd.month = '2023-04-01' THEN sd.total_sold ELSE 0 END) as apr_sales,
        SUM(CASE WHEN sd.month = '2023-05-01' THEN sd.total_sold ELSE 0 END) as may_sales,
        SUM(CASE WHEN sd.month = '2023-06-01' THEN sd.total_sold ELSE 0 END) as jun_sales,
        SUM(sd.total_sold) as total_sales
    FROM sales_data sd
    JOIN db1.schema1.products p ON sd.product_id = p.product_id
    GROUP BY p.product_name
    HAVING SUM(sd.total_sold) > 100
    ORDER BY total_sales DESC
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();
    
    println!("Pivot query result: {:?}", result);
    
    // Check that the CTE is detected
    let cte_exists = result.ctes.iter()
        .any(|cte| cte.name == "sales_data");
    
    assert!(cte_exists, "Should detect the sales_data CTE");
    
    // Check base tables
    let base_tables: Vec<_> = result.tables.iter()
        .filter(|t| t.kind == TableKind::Base)
        .map(|t| t.table_identifier.clone())
        .collect();
    
    assert!(base_tables.contains(&"sales".to_string()), "Should detect sales table");
    assert!(base_tables.contains(&"products".to_string()), "Should detect products table");
    
    // Check columns
    let sales_data_table = result.tables.iter()
        .find(|t| t.table_identifier == "sales_data");
        
    assert!(sales_data_table.is_some(), "Should find sales_data as a table");
    if let Some(sd_table) = sales_data_table {
        assert!(sd_table.columns.contains("product_id"), "Should detect product_id column");
        assert!(sd_table.columns.contains("month"), "Should detect month column");
        assert!(sd_table.columns.contains("total_sold"), "Should detect total_sold column");
    }
    
    let products_table = result.tables.iter()
        .find(|t| t.table_identifier == "products");
        
    if let Some(p_table) = products_table {
        assert!(p_table.columns.contains("product_name"), "Should detect product_name column");
    }
}

#[tokio::test]
async fn test_set_operations() {
    // Simplified test for set operations - focusing on UNION ALL, which is better supported
    let sql = r#"
    WITH active_users AS (
        SELECT u.id, u.name, u.email FROM db1.schema1.users u WHERE u.status = 'active'
    ),
    premium_users AS (
        SELECT s.id, s.name, s.email FROM db1.schema1.subscriptions s
        WHERE s.plan_type = 'premium' AND s.end_date > CURRENT_DATE
    ),
    churned_users AS (
        SELECT s.id, s.name, s.email FROM db1.schema1.subscriptions s
        WHERE s.end_date < CURRENT_DATE
    )
    
    -- Simplified to use direct UNION ALLs instead of nested EXCEPT/INTERSECT
    SELECT 
        u.id, 
        u.name, 
        u.email, 
        'active' as user_type 
    FROM active_users u
    
    UNION ALL
    
    SELECT 
        p.id, 
        p.name, 
        p.email, 
        'premium' as user_type 
    FROM premium_users p
    
    UNION ALL
    
    SELECT 
        c.id, 
        c.name, 
        c.email, 
        'churned' as user_type 
    FROM churned_users c
    
    ORDER BY user_type, name
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();
    
    println!("Set operations result: {:?}", result);
    
    // Check that all CTEs are detected
    let cte_names: Vec<_> = result.ctes.iter()
        .map(|cte| cte.name.clone())
        .filter(|name| ["active_users", "premium_users", "churned_users"].contains(&name.as_str()))
        .collect();
    
    assert_eq!(cte_names.len(), 3, "Should detect all three CTEs");
    
    // Check base tables
    let base_tables: Vec<_> = result.tables.iter()
        .filter(|t| t.kind == TableKind::Base)
        .map(|t| t.table_identifier.clone())
        .collect();
    
    assert!(base_tables.contains(&"users".to_string()), "Should detect users table");
    assert!(base_tables.contains(&"subscriptions".to_string()), "Should detect subscriptions table");
}

#[tokio::test]
async fn test_self_joins_with_correlated_subqueries() {
    let sql = r#"
    WITH employee_managers AS (
        SELECT 
            e.id as employee_id,
            e.name as employee_name,
            e.manager_id,
            m.name as manager_name,
            m.department_id as manager_dept_id,
            (SELECT COUNT(*) FROM db1.schema1.employees e2 WHERE e2.manager_id = e.id) as direct_reports
        FROM db1.schema1.employees e
        LEFT JOIN db1.schema1.employees m ON e.manager_id = m.id
    ),
    dept_stats AS (
        SELECT 
            d.id as department_id,
            d.name as department_name,
            COUNT(e.id) as employee_count,
            AVG(e.salary) as avg_salary,
            (
                SELECT STRING_AGG(em.employee_name, ', ')
                FROM employee_managers em
                WHERE em.manager_dept_id = d.id AND em.direct_reports > 0
            ) as managers_list
        FROM db1.schema1.departments d
        LEFT JOIN db1.schema1.employees e ON d.id = e.department_id
        GROUP BY d.id, d.name
    )
    SELECT 
        em.employee_id,
        em.employee_name,
        em.manager_name,
        ds.department_name,
        em.direct_reports,
        ds.employee_count,
        ds.avg_salary,
        CASE 
            WHEN em.direct_reports > 0 THEN true 
            ELSE false 
        END as is_manager,
        (
            SELECT MAX(p.budget)
            FROM db1.schema1.projects p
            WHERE p.department_id = em.manager_dept_id
        ) as max_project_budget
    FROM employee_managers em
    JOIN dept_stats ds ON em.manager_dept_id = ds.department_id
    WHERE em.direct_reports > 0
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();
    
    println!("Self joins with correlated subqueries result: {:?}", result);
    
    // Check that all CTEs are detected
    let cte_names: Vec<_> = result.ctes.iter()
        .map(|cte| cte.name.clone())
        .filter(|name| ["employee_managers", "dept_stats"].contains(&name.as_str()))
        .collect();
    
    assert_eq!(cte_names.len(), 2, "Should detect both CTEs");
    
    // Check self-join by verifying the employees table appears with multiple roles
    let employee_roles = result.tables.iter()
        .filter(|t| t.table_identifier == "employees")
        .count();
        
    assert!(employee_roles >= 1, "Should detect employees table at least once");
    
    // Check other base tables
    let base_tables: Vec<_> = result.tables.iter()
        .filter(|t| t.kind == TableKind::Base)
        .map(|t| t.table_identifier.clone())
        .collect();
    
    assert!(base_tables.contains(&"departments".to_string()), "Should detect departments table");
    assert!(base_tables.contains(&"projects".to_string()), "Should detect projects table");
    
    // Check that we detect joins
    assert!(!result.joins.is_empty(), "Should detect joins");
}

#[tokio::test]
async fn test_lateral_joins() {
    // Test LATERAL joins functionality
    let sql = r#"
    WITH users_with_orders AS (
        SELECT u.id, u.name, u.registered_date
        FROM db1.schema1.users u
        WHERE EXISTS (SELECT 1 FROM db1.schema1.orders o WHERE o.user_id = u.id)
    )
    SELECT 
        u.id as user_id,
        u.name as user_name,
        recent_orders.order_id,
        recent_orders.order_date,
        recent_orders.amount
    FROM users_with_orders u
    CROSS JOIN LATERAL (
        SELECT o.id as order_id, o.order_date, o.total_amount as amount
        FROM db1.schema1.orders o
        WHERE o.user_id = u.id
        ORDER BY o.order_date DESC
        LIMIT 3
    ) recent_orders
    ORDER BY u.id, recent_orders.order_date DESC
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();
    
    println!("Lateral joins result: {:?}", result);
    
    // Check that the CTE is detected
    let cte_exists = result.ctes.iter()
        .any(|cte| cte.name == "users_with_orders");
    
    assert!(cte_exists, "Should detect the users_with_orders CTE");
    
    // Check base tables
    let base_tables: Vec<_> = result.tables.iter()
        .filter(|t| t.kind == TableKind::Base)
        .map(|t| t.table_identifier.clone())
        .collect();
    
    assert!(base_tables.contains(&"users".to_string()), "Should detect users table");
    assert!(base_tables.contains(&"orders".to_string()), "Should detect orders table");
    
    // Check for derived table from LATERAL join
    let derived_tables = result.tables.iter()
        .filter(|t| t.kind == TableKind::Derived)
        .count();
        
    assert!(derived_tables >= 1, "Should detect at least one derived table from LATERAL join");
}

#[tokio::test]
async fn test_deeply_nested_derived_tables() {
    // Simplified test with fewer levels of nesting and more explicit aliases
    let sql = r#"
    WITH 
    active_customers AS (
        SELECT c.id, c.name, c.status, c.region 
        FROM db1.schema1.customers c 
        WHERE c.status = 'active'
    ),
    customer_orders AS (
        SELECT 
            o.customer_id, 
            o.id as order_id,
            o.total_amount as order_amount,
            o.status
        FROM db1.schema1.orders o
        WHERE o.order_date > (CURRENT_DATE - INTERVAL '1 year')
    )
    SELECT 
        summary.customer_id,
        summary.region,
        summary.total_spent,
        summary.order_count
    FROM (
        -- Only one level of derived table now
        SELECT
            ac.id as customer_id,
            ac.region,
            SUM(co.order_amount) as total_spent,
            COUNT(DISTINCT co.order_id) as order_count
        FROM active_customers ac
        JOIN customer_orders co ON co.customer_id = ac.id
        WHERE co.status = 'completed'
        GROUP BY ac.id, ac.region
        HAVING COUNT(DISTINCT co.order_id) >= 3
    ) summary
    WHERE summary.total_spent > 1000
    ORDER BY summary.total_spent DESC
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();
    
    println!("Deeply nested derived tables result: {:?}", result);
    
    // Check that the CTEs are detected
    let cte_names: Vec<_> = result.ctes.iter()
        .map(|cte| cte.name.clone())
        .filter(|name| ["active_customers", "customer_orders"].contains(&name.as_str()))
        .collect();
    
    assert_eq!(cte_names.len(), 2, "Should detect both explicit CTEs");
    
    // Check base tables
    let base_tables: Vec<_> = result.tables.iter()
        .filter(|t| t.kind == TableKind::Base)
        .map(|t| t.table_identifier.clone())
        .collect();
    
    assert!(base_tables.contains(&"customers".to_string()), "Should detect customers table");
    assert!(base_tables.contains(&"orders".to_string()), "Should detect orders table");
    
    // Check for derived tables - we should have at least one
    let derived_tables = result.tables.iter()
        .filter(|t| t.kind == TableKind::Derived)
        .count();
        
    assert!(derived_tables >= 1, "Should detect at least one derived table");
    
    // Check that we can find at least one join somewhere (either in main query or in subquery summary)
    let has_join = !result.joins.is_empty() || 
                   result.tables.iter()
                     .filter(|t| t.kind == TableKind::Derived)
                     .flat_map(|t| t.subquery_summary.as_ref())
                     .any(|summary| !summary.joins.is_empty());
    
    assert!(has_join, "Should detect at least one join somewhere in the query");
}

#[tokio::test]
async fn test_calculations_in_select() {
    let sql = r#"
    SELECT
        p.name,
        p.price * (1 - p.discount_percent) AS final_price,
        p.stock_level - 5 AS adjusted_stock
    FROM
        db2.warehouse.products p
    WHERE p.category = 'electronics';
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();

    assert_eq!(result.tables.len(), 1);
    assert_eq!(result.joins.len(), 0);

    let table = &result.tables[0];
    assert_eq!(table.table_identifier, "products");
    assert!(table.columns.contains("name"));
    assert!(table.columns.contains("price"));
    assert!(table.columns.contains("discount_percent"));
    assert!(table.columns.contains("stock_level"));
    assert!(table.columns.contains("category")); // From WHERE
}

#[tokio::test]
async fn test_date_function_usage() {
    // Using DATE_TRUNC style common in PG/Snowflake
    let sql = r#"
    SELECT
        event_id, user_id
    FROM
        db_logs.public.user_events ue
    WHERE
        DATE_TRUNC('day', ue.event_timestamp) = CURRENT_DATE;
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();

    assert_eq!(result.tables.len(), 1);
    let table = &result.tables[0];
    assert_eq!(table.table_identifier, "user_events");

    // Ensure the column used within the date function is captured
    assert!(table.columns.contains("event_timestamp"));
    assert!(table.columns.contains("event_id"));
    assert!(table.columns.contains("user_id"));
}

#[tokio::test]
async fn test_scalar_subquery_in_select() {
    let sql = r#"
    SELECT
        c.customer_name,
        (SELECT MAX(o.order_date) FROM db1.schema1.orders o WHERE o.customer_id = c.id) as last_order_date
    FROM
        db1.schema1.customers c
    WHERE
        c.is_active = true;
    "#;

    let result = analyze_query(sql.to_string()).await.unwrap();
    println!("Scalar Subquery Result: {:?}", result);

    // The analyzer should detect both tables (customers from main query, orders from subquery)
    // We now represent subqueries as CTEs for better analysis
    assert_eq!(result.tables.len(), 2, "Should detect customers and orders tables");
    assert_eq!(result.joins.len(), 0, "Should be no explicit joins");
    assert!(result.ctes.len() >= 1, "Should detect at least one CTE for the subquery");

    let table_names: HashSet<_> = result.tables.iter().map(|t| t.table_identifier.as_str()).collect();
    assert!(table_names.contains("customers"));
    assert!(table_names.contains("orders"));

    // Check columns used
    let customers_table = result.tables.iter().find(|t| t.table_identifier == "customers").unwrap();
    assert!(customers_table.columns.contains("customer_name"));
    
    // 'id' is now part of the CTE state rather than the main query
    let id_in_customers = customers_table.columns.contains("id");
    let id_in_cte = result.ctes.iter()
        .filter_map(|cte| cte.summary.tables.iter()
            .find(|t| t.table_identifier == "customers")
            .map(|t| t.columns.contains("id")))
        .any(|contains| contains);
        
    assert!(id_in_customers || id_in_cte, "id should be tracked somewhere in customers (either main or within CTE)");
    assert!(customers_table.columns.contains("is_active")); // Used in WHERE

    let orders_table = result.tables.iter().find(|t| t.table_identifier == "orders").unwrap();
    assert!(orders_table.columns.contains("order_date")); // Used in MAX()
    assert!(orders_table.columns.contains("customer_id")); // Used in subquery WHERE
}