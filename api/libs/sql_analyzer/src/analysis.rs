use crate::errors::SqlAnalyzerError;
use crate::types::{QuerySummary, TableInfo, JoinInfo, CteSummary, TableKind};
use sqlparser::ast::{
    Visit, Visitor, TableFactor, Join, Expr, Query, Cte, ObjectName,
    SelectItem, Statement, JoinConstraint, JoinOperator, SetExpr, TableAlias, Ident
};
use sqlparser::dialect::GenericDialect;
use sqlparser::parser::Parser;
use std::collections::{HashMap, HashSet};
use std::ops::ControlFlow;
use anyhow::Result;
use rand;

pub async fn analyze_query(sql: String) -> Result<QuerySummary, SqlAnalyzerError> {
    let ast = Parser::parse_sql(&GenericDialect, &sql)?;
    let mut analyzer = QueryAnalyzer::new();

    for stmt in ast {
        if let Statement::Query(query) = stmt {
            analyzer.process_query(&query)?;
        }
    }

    analyzer.into_summary()
}

#[derive(Debug)]
struct QueryAnalyzer {
    tables: HashMap<String, TableInfo>,
    joins: HashSet<JoinInfo>,
    known_cte_definitions: Vec<HashSet<String>>,
    scope_stack: Vec<String>,
    current_scope_aliases: HashMap<String, String>,
    column_mappings: HashMap<String, HashMap<String, (String, String)>>,
    current_from_relation_identifier: Option<String>,
    vague_columns: Vec<String>,
    vague_tables: Vec<String>,
    ctes: Vec<CteSummary>,
}

impl QueryAnalyzer {
    fn new() -> Self {
        QueryAnalyzer {
            tables: HashMap::new(),
            joins: HashSet::new(),
            known_cte_definitions: vec![HashSet::new()],
            ctes: Vec::new(),
            vague_columns: Vec::new(),
            vague_tables: Vec::new(),
            column_mappings: HashMap::new(),
            scope_stack: Vec::new(),
            current_from_relation_identifier: None,
            current_scope_aliases: HashMap::new(),
        }
    }

    fn get_factor_identifier_and_register_alias(&mut self, factor: &TableFactor) -> Option<String> {
        match factor {
            TableFactor::Table { name, alias, .. } => {
                let first_part = name.0.first().map(|i| i.value.clone()).unwrap_or_default();
                if name.0.len() == 1 && self.is_known_cte_definition(&first_part) {
                    let cte_name = first_part;
                    if let Some(a) = alias {
                        let alias_name = a.name.value.clone();
                        self.current_scope_aliases.insert(alias_name.clone(), cte_name.clone());
                        Some(alias_name)
                    } else {
                        self.current_scope_aliases.entry(cte_name.clone()).or_insert_with(|| cte_name.clone());
                        Some(cte_name)
                    }
                } else {
                    let base_table_identifier = self.get_table_name(name);
                    if let Some(a) = alias {
                        let alias_name = a.name.value.clone();
                        self.current_scope_aliases.insert(alias_name.clone(), base_table_identifier.clone());
                        Some(alias_name)
                    } else {
                        self.current_scope_aliases.entry(base_table_identifier.clone()).or_insert_with(|| base_table_identifier.clone());
                        Some(base_table_identifier)
                    }
                }
            },
            TableFactor::Derived { alias, lateral: _, subquery: _ } => {
                alias.as_ref().map(|a| {
                    let alias_name = a.name.value.clone();
                    self.current_scope_aliases.insert(alias_name.clone(), alias_name.clone());
                    alias_name
                })
            },
            TableFactor::TableFunction { alias, .. } => {
                alias.as_ref().map(|a| {
                    let alias_name = a.name.value.clone();
                    self.current_scope_aliases.insert(alias_name.clone(), alias_name.clone());
                    alias_name
                })
            },
            TableFactor::NestedJoin { alias, .. } => {
                alias.as_ref().map(|a| {
                    let alias_name = a.name.value.clone();
                    self.current_scope_aliases.insert(alias_name.clone(), alias_name.clone());
                    alias_name
                })
            },
            _ => None,
        }
    }

    fn process_query(&mut self, query: &Query) -> Result<(), SqlAnalyzerError> {
        let mut is_with_query = false;
        if let Some(with) = &query.with {
            if !with.cte_tables.is_empty() {
                is_with_query = true;
                self.known_cte_definitions.push(HashSet::new());
                for cte in &with.cte_tables {
                    self.process_cte(cte)?;
                }
            }
        }

        match query.body.as_ref() {
            SetExpr::Select(select) => {
                self.current_from_relation_identifier = None;

                // --- Stage 1: Process FROM and JOINs to register all aliases --- 
                let mut join_conditions_to_visit: Vec<&Expr> = Vec::new();

                for table_with_joins in &select.from {
                    // Process the base table/factor in the FROM
                    self.process_table_factor(&table_with_joins.relation); 
                    self.current_from_relation_identifier = self.get_factor_identifier_and_register_alias(&table_with_joins.relation);
                    
                    // Process associated joins
                    for join in &table_with_joins.joins {
                        // Process the relation being joined to register its alias
                        self.process_table_factor(&join.relation); 
                        let right_identifier_opt = self.get_factor_identifier_and_register_alias(&join.relation);
                        let left_identifier_opt = self.current_from_relation_identifier.clone();

                        // Record the join relationship (using resolved IDs later if possible)
                        if let (Some(left_id_alias), Some(right_id_alias)) = (&left_identifier_opt, &right_identifier_opt) {
                            let resolved_left_id = self.current_scope_aliases.get(left_id_alias).cloned().unwrap_or_else(|| left_id_alias.clone());
                            let resolved_right_id = self.current_scope_aliases.get(right_id_alias).cloned().unwrap_or_else(|| right_id_alias.clone());
                            
                            let condition_str = match &join.join_operator {
                                JoinOperator::Inner(JoinConstraint::On(expr))
                                | JoinOperator::LeftOuter(JoinConstraint::On(expr))
                                | JoinOperator::RightOuter(JoinConstraint::On(expr))
                                | JoinOperator::FullOuter(JoinConstraint::On(expr)) => {
                                    // *** Defer visiting the ON condition ***
                                    join_conditions_to_visit.push(expr); 
                                    expr.to_string()
                                }
                                JoinOperator::Inner(JoinConstraint::Using(idents))
                                | JoinOperator::LeftOuter(JoinConstraint::Using(idents))
                                | JoinOperator::RightOuter(JoinConstraint::Using(idents))
                                | JoinOperator::FullOuter(JoinConstraint::Using(idents)) => {
                                     // Still mark using columns as potentially vague initially
                                    for ident in idents { self.vague_columns.push(ident.0.last().map(|id| id.value.clone()).unwrap_or_default()); }
                                    format!("USING({})", idents.iter().map(|i| i.0.last().map(|id| id.value.clone()).unwrap_or_default()).collect::<Vec<_>>().join(", "))
                                }
                                JoinOperator::Inner(JoinConstraint::Natural)
                                | JoinOperator::LeftOuter(JoinConstraint::Natural)
                                | JoinOperator::RightOuter(JoinConstraint::Natural)
                                | JoinOperator::FullOuter(JoinConstraint::Natural) => "NATURAL".to_string(),
                                JoinOperator::CrossJoin => "CROSS JOIN".to_string(),
                                _ => "UNKNOWN_CONSTRAINT".to_string(),
                            };

                            self.joins.insert(JoinInfo {
                                left_table: resolved_left_id,
                                right_table: resolved_right_id,
                                condition: condition_str,
                            });
                        } else {
                             eprintln!("Warning: Could not resolve identifiers for join. Left: {:?}, Right: {:?}", left_identifier_opt, right_identifier_opt);
                        }

                        // Update the current relation identifier for the next join in sequence
                        if right_identifier_opt.is_some() {
                            self.current_from_relation_identifier = right_identifier_opt;
                        }
                    }
                }

                 // --- Stage 2: Visit expressions now that aliases are registered --- 
                // Visit JOIN ON conditions first
                for expr in join_conditions_to_visit {
                    expr.visit(self);
                }
                // Visit WHERE clause
                if let Some(selection) = &select.selection { selection.visit(self); }
                // Visit GROUP BY expressions
                if let sqlparser::ast::GroupByExpr::Expressions(exprs, _) = &select.group_by {
                    for expr in exprs { expr.visit(self); }
                }
                // Visit HAVING clause
                if let Some(having) = &select.having { having.visit(self); }
                // Visit SELECT projection list
                for item in &select.projection { self.process_select_item(item); } // Uses item.visit() internally
            }
            SetExpr::Query(inner_query) => {
                 // Keep the recursive processing logic for nested queries
                let mut inner_analyzer = QueryAnalyzer {
                    known_cte_definitions: self.known_cte_definitions.clone(), 
                    scope_stack: self.scope_stack.clone(), 
                    current_scope_aliases: HashMap::new(), // Start fresh alias scope
                    ..QueryAnalyzer::new()
                };
                 inner_analyzer.scope_stack.push("inner_query".to_string());
                 inner_analyzer.process_query(inner_query)?;
                 // Merge results (consider potential alias conflicts if not starting fresh)
                 self.tables.extend(inner_analyzer.tables);
                 self.joins.extend(inner_analyzer.joins);
                 self.ctes.extend(inner_analyzer.ctes);
                 self.vague_columns.extend(inner_analyzer.vague_columns);
                 self.vague_tables.extend(inner_analyzer.vague_tables);
                 self.scope_stack.pop(); 
            }
            SetExpr::SetOperation { left, right, .. } => {
                 // Keep the logic for set operations (UNION, INTERSECT, etc.)
                 // Process left and right with independent alias scopes but shared CTE knowledge
                 let mut left_analyzer = QueryAnalyzer {
                     known_cte_definitions: self.known_cte_definitions.clone(),
                     scope_stack: self.scope_stack.clone(),
                     current_scope_aliases: HashMap::new(),
                     ..QueryAnalyzer::new()
                 };
                 left_analyzer.scope_stack.push("set_op_left".to_string());
                 left_analyzer.process_query_body(left)?;
                 self.scope_stack.pop(); // Pop left scope
 
                 let mut right_analyzer = QueryAnalyzer {
                      known_cte_definitions: self.known_cte_definitions.clone(),
                      scope_stack: self.scope_stack.clone(),
                      current_scope_aliases: HashMap::new(),
                      ..QueryAnalyzer::new()
                  };
                 right_analyzer.scope_stack.push("set_op_right".to_string());
                 right_analyzer.process_query_body(right)?;
                 self.scope_stack.pop(); // Pop right scope
 
                 // Merge results from both sides
                 self.tables.extend(left_analyzer.tables);
                 self.joins.extend(left_analyzer.joins);
                 self.ctes.extend(left_analyzer.ctes);
                 self.vague_columns.extend(left_analyzer.vague_columns);
                 self.vague_tables.extend(left_analyzer.vague_tables);
 
                 self.tables.extend(right_analyzer.tables);
                 self.joins.extend(right_analyzer.joins);
                 self.ctes.extend(right_analyzer.ctes);
                 self.vague_columns.extend(right_analyzer.vague_columns);
                 self.vague_tables.extend(right_analyzer.vague_tables);
            }
            _ => {} 
        }

        // NO longer call broad query.visit(self) here - rely on explicit stage 2 visits

        if is_with_query {
            self.known_cte_definitions.pop(); 
        }

        Ok(())
    }

    fn process_query_body(&mut self, query_body: &SetExpr) -> Result<(), SqlAnalyzerError> {
        match query_body {
            SetExpr::Select(_) | SetExpr::Query(_) | SetExpr::SetOperation {..} => {
                let temp_query = Query {
                    with: None,
                    body: Box::new(query_body.clone()),
                    order_by: None,
                    limit: None,
                    limit_by: vec![],
                    offset: None,
                    fetch: None,
                    locks: vec![],
                    for_clause: None,
                    settings: None,
                    format_clause: None,
                };
                self.process_query(&temp_query)?;
            }
            _ => {}
        }
        Ok(())
    }

    fn process_cte(&mut self, cte: &Cte) -> Result<(), SqlAnalyzerError> {
        let cte_name = cte.alias.name.value.clone();

        // Create analyzer for the CTE. Inherit known CTEs from parent.
        let mut cte_analyzer = QueryAnalyzer {
            known_cte_definitions: self.known_cte_definitions.clone(), // *** Inherit parent's known CTEs ***
            scope_stack: self.scope_stack.clone(), // Inherit scope stack for context
            ..QueryAnalyzer::new() // Start fresh otherwise (tables, joins, aliases, etc.)
        };
        cte_analyzer.scope_stack.push(format!("CTE:{}", cte_name));

        // Analyze the CTE's query
        let cte_analysis_result = cte_analyzer.process_query(&cte.query);
        // We pop the scope stack *after* attempting summary, in case of errors during summary
        // cte_analyzer.scope_stack.pop(); // Moved down

        match cte_analysis_result {
            Ok(()) => {
                // Finalize the summary for the CTE's internal analysis
                match cte_analyzer.into_summary() { // This consumes cte_analyzer
                    Ok(summary) => {
                        // Pop scope stack now that analysis + summary is complete
                        // self.scope_stack = cte_analyzer.scope_stack; // No, parent stack doesn't change here
                        // We don't need to pop from cte_analyzer's stack as it's consumed.
                        
                        // Store the nested summary
                        self.ctes.push(CteSummary {
                            name: cte_name.clone(),
                            summary: Box::new(summary), // *** Box the summary ***
                            column_mappings: HashMap::new(), // Reset or populate if needed later
                        });

                        // *** IMPORTANT: Register this CTE in the PARENT scope ***
                        // 1. Add to known definitions for subsequent CTEs/main query in this scope level
                        if let Some(current_parent_definitions) = self.known_cte_definitions.last_mut() {
                            current_parent_definitions.insert(cte_name.clone());
                        }
                        // 2. Add to parent's *current* alias map so it can be referenced directly by name later in this query part
                        self.current_scope_aliases.insert(cte_name.clone(), cte_name.clone());

                        Ok(())
                    }
                    Err(e @ SqlAnalyzerError::VagueReferences(_)) => {
                        // Error during CTE summary finalization (e.g., vague refs inside CTE detected now)
                        // Pop the scope stack that was pushed before analysis
                        // self.scope_stack.pop(); // Handled by consuming analyzer?
                        Err(SqlAnalyzerError::VagueReferences(format!("In CTE '{}': {}", cte_name, e)))
                    }
                    Err(e) => {
                         // Pop the scope stack
                        // self.scope_stack.pop();
                        Err(SqlAnalyzerError::Internal(anyhow::anyhow!("Internal error summarizing CTE '{}': {}", cte_name, e)))
                    }
                }
            }
            Err(e @ SqlAnalyzerError::VagueReferences(_)) => {
                 // Error during CTE query processing itself
                 // Pop the scope stack
                 // self.scope_stack.pop(); // Consumed analyzer handles its stack
                Err(SqlAnalyzerError::VagueReferences(format!("In CTE '{}': {}", cte_name, e)))
            }
            Err(e) => {
                 // Other error during CTE query processing
                 // Pop the scope stack
                // self.scope_stack.pop();
                 Err(SqlAnalyzerError::Internal(anyhow::anyhow!("Error processing CTE '{}': {}", cte_name, e)))
            }
        }
    }

    fn process_table_factor(&mut self, table_factor: &TableFactor) {
        match table_factor {
            TableFactor::Table { name, alias, .. } => {
                let identifier = name.0.first().map(|i| i.value.clone()).unwrap_or_default();

                // Check if it's using a CTE known from parent scopes or the current scope
                if name.0.len() == 1 && self.is_known_cte_definition(&identifier) {
                    // It's a CTE usage.
                    let cte_name = identifier;
                    let alias_name = alias.as_ref().map(|a| a.name.value.clone());

                    // Use the CTE name as the identifier in the tables map
                    self.tables.entry(cte_name.clone()).or_insert(TableInfo {
                        database_identifier: None, // CTEs don't have db/schema
                        schema_identifier: None,
                        table_identifier: cte_name.clone(), // Store the CTE name
                        alias: alias_name.or_else(|| Some(cte_name.clone())),
                        columns: HashSet::new(),
                        kind: TableKind::Cte, // *** Use TableKind::Cte ***
                        subquery_summary: None, // *** CTEs don't have subquery summary ***
                    });
                } else { // It's a base table
                    let (db, schema, table_part) = self.parse_object_name(name);
                    // *** Check if parse_object_name just marked this as vague ***
                    if !self.vague_tables.contains(&table_part) { 
                        let table_key = self.get_table_name(name); // Use full name key if qualified
                        let alias_name = alias.as_ref().map(|a| a.name.value.clone());
    
                        // Add/update the base table info
                        self.tables.entry(table_key).or_insert(TableInfo {
                            database_identifier: db,
                            schema_identifier: schema,
                            table_identifier: table_part, // Use the simple name here
                            alias: alias_name,
                            columns: HashSet::new(),
                            kind: TableKind::Base,
                            subquery_summary: None,
                        });
                    } // *** End of check ***
                }
            },
            TableFactor::Derived { subquery, alias, lateral: _ } => {
                let alias_name = alias.as_ref().map(|a| a.name.value.clone());
                // Use alias or generate a unique ID for the derived table
                let derived_key = alias_name.clone().unwrap_or_else(|| format!("_derived_{}", rand::random::<u32>()));

                let scope_name = format!("derived:{}", derived_key);
                self.scope_stack.push(scope_name.clone());

                let mut subquery_analyzer = QueryAnalyzer {
                    known_cte_definitions: self.known_cte_definitions.clone(),
                    scope_stack: self.scope_stack.clone(),
                    current_scope_aliases: HashMap::new(), // New alias scope for subquery
                    ..QueryAnalyzer::new()
                };

                let sub_result = subquery_analyzer.process_query(subquery);
                self.scope_stack.pop();

                let subquery_summary_opt = match sub_result {
                    Ok(()) => match subquery_analyzer.into_summary() {
                        Ok(summary) => Some(Box::new(summary)),
                        Err(SqlAnalyzerError::VagueReferences(msg)) => {
                            self.vague_tables.push(format!("Subquery '{}': {}", derived_key, msg));
                            None
                        }
                        Err(e) => {
                            eprintln!(
                                "Warning: Internal error summarizing subquery '{}': {}",
                                derived_key, e
                            );
                            None
                        }
                    },
                    Err(SqlAnalyzerError::VagueReferences(msg)) => {
                        self.vague_tables.push(format!("Subquery '{}': {}", derived_key, msg));
                        None
                    }
                    Err(e) => {
                        eprintln!("Warning: Error processing subquery '{}': {}", derived_key, e);
                        None
                    }
                };

                // Add TableInfo for the derived table
                self.tables.insert(derived_key.clone(), TableInfo {
                    database_identifier: None, // Derived tables don't have inherent db/schema
                    schema_identifier: None,
                    table_identifier: derived_key.clone(), // Use the alias/generated ID
                    alias: alias_name.clone(),
                    columns: HashSet::new(), // Columns used *from* this derived table added later
                    kind: TableKind::Derived,
                    subquery_summary: subquery_summary_opt,
                });

                // Map the alias (if exists) to the derived table's key in the *current* scope
                if let Some(a_name) = alias_name {
                    self.current_scope_aliases.insert(a_name, derived_key);
                }
            },
            TableFactor::TableFunction { expr, alias } => {
                // TODO: Handle table functions - analyze expr if needed,
                // treat like derived table with alias?
                expr.visit(self);
            },
            TableFactor::NestedJoin { table_with_joins, alias } => {
                // Process the base table of the nested join
                self.process_table_factor(&table_with_joins.relation);
                // Process subsequent joins within the nested structure
                for join in &table_with_joins.joins {
                    self.process_join(join);
                }
                // TODO: Handle the alias for the entire nested join structure if needed.
                // Currently, aliases for nested joins are not explicitly stored or used for resolution.
                // If `alias` is Some, we might need to represent the whole join result
                // as a derived table, similar to TableFactor::Derived.
            },
            _ => {}
        }
    }

    fn process_join(&mut self, join: &Join) {
        self.process_table_factor(&join.relation);
        let right_identifier_opt = self.get_factor_identifier_and_register_alias(&join.relation);
        let left_identifier_opt = self.current_from_relation_identifier.clone();

        if let (Some(left_id_alias), Some(right_id_alias)) = (&left_identifier_opt, &right_identifier_opt) {
            let resolved_left_id = self.current_scope_aliases.get(left_id_alias).cloned().unwrap_or_else(|| left_id_alias.clone());
            let resolved_right_id = self.current_scope_aliases.get(right_id_alias).cloned().unwrap_or_else(|| right_id_alias.clone());

            let condition = match &join.join_operator {
                JoinOperator::Inner(JoinConstraint::On(expr))
                | JoinOperator::LeftOuter(JoinConstraint::On(expr))
                | JoinOperator::RightOuter(JoinConstraint::On(expr))
                | JoinOperator::FullOuter(JoinConstraint::On(expr)) => {
                    self.process_join_condition(expr);
                    expr.to_string()
                }
                JoinOperator::Inner(JoinConstraint::Using(idents))
                | JoinOperator::LeftOuter(JoinConstraint::Using(idents))
                | JoinOperator::RightOuter(JoinConstraint::Using(idents))
                | JoinOperator::FullOuter(JoinConstraint::Using(idents)) => {
                    for ident in idents { self.vague_columns.push(format!("USING({})", ident.0.last().map(|id| id.value.clone()).unwrap_or_default())); }
                    format!("USING({})", idents.iter().map(|i| i.0.last().map(|id| id.value.clone()).unwrap_or_default()).collect::<Vec<_>>().join(", "))
                }
                JoinOperator::Inner(JoinConstraint::Natural)
                | JoinOperator::LeftOuter(JoinConstraint::Natural)
                | JoinOperator::RightOuter(JoinConstraint::Natural)
                | JoinOperator::FullOuter(JoinConstraint::Natural) => "NATURAL".to_string(),
                JoinOperator::CrossJoin => "CROSS JOIN".to_string(),
                _ => "UNKNOWN_CONSTRAINT".to_string(),
            };

            self.joins.insert(JoinInfo {
                left_table: resolved_left_id,
                right_table: resolved_right_id,
                condition,
            });
        } else {
            eprintln!("Warning: Could not resolve identifiers for join. Left: {:?}, Right: {:?}", left_identifier_opt, right_identifier_opt);
        }

        if right_identifier_opt.is_some() {
            self.current_from_relation_identifier = right_identifier_opt;
        }
    }

    fn process_join_condition(&mut self, expr: &Expr) {
        expr.visit(self);
    }

    fn process_select_item(&mut self, select_item: &SelectItem) {
        // Use the visitor trait *specifically* for the expression within the select item
        match select_item {
            SelectItem::UnnamedExpr(expr) | SelectItem::ExprWithAlias { expr, .. } => {
                expr.visit(self); // Visit the expression to find column references
            },
            SelectItem::QualifiedWildcard(obj_name, _) => {
                // Handle qualified wildcard if necessary (e.g., record usage of all columns from alias obj_name.0[0])
                let qualifier = obj_name.0.first().map(|i|i.value.clone()).unwrap_or_default();
                if !qualifier.is_empty() {
                     // TODO: Potentially add logic to mark all columns of the resolved table/CTE as used
                     // For now, just ensure the qualifier itself is known
                    if !self.current_scope_aliases.contains_key(&qualifier) && 
                       !self.tables.contains_key(&qualifier) && 
                       !self.is_known_cte_definition(&qualifier) {
                           self.vague_tables.push(qualifier);
                       }
                }
            }
            SelectItem::Wildcard(_) => {
                 // Handle unqualified wildcard if necessary (potentially mark all columns of all tables in scope? Risky)
            }
        }
    }

    fn into_summary(mut self) -> Result<QuerySummary, SqlAnalyzerError> {
        self.vague_columns.sort();
        self.vague_columns.dedup();
        self.vague_tables.sort();
        self.vague_tables.dedup();

        // Combine directly used tables/CTEs/Derived with base tables found within CTEs/Subqueries
        let mut final_tables = self.tables.clone(); // Clone to iterate while potentially modifying
        let mut discovered_base_tables: HashMap<String, TableInfo> = HashMap::new();

        fn extract_base_tables(summary: &QuerySummary, base_tables: &mut HashMap<String, TableInfo>) {
            for table_info in &summary.tables {
                match table_info.kind {
                    TableKind::Base => {
                         base_tables.entry(table_info.table_identifier.clone()).or_insert_with(|| table_info.clone());
                    }
                    TableKind::Cte => { /* Already handled by CTE processing */ }
                    TableKind::Derived => {
                        if let Some(ref sub_summary) = table_info.subquery_summary {
                            extract_base_tables(sub_summary, base_tables);
                        }
                    }
                }
            }
             for cte in &summary.ctes {
                 extract_base_tables(&cte.summary, base_tables);
             }
        }

        // Extract base tables from top-level CTEs
        for cte in &self.ctes {
            extract_base_tables(&cte.summary, &mut discovered_base_tables);
        }
        // Extract base tables from top-level derived tables
        for table_info in self.tables.values() {
            if table_info.kind == TableKind::Derived {
                if let Some(ref sub_summary) = table_info.subquery_summary {
                    extract_base_tables(sub_summary, &mut discovered_base_tables);
                }
            }
        }

        // Add discovered base tables to the final list, avoiding duplicates
        for (key, base_table) in discovered_base_tables {
             final_tables.entry(key).or_insert(base_table);
        }


        // Check for vagueness *after* gathering all potential sources
        if !self.vague_columns.is_empty() || !self.vague_tables.is_empty() {
            let mut errors = Vec::new();
            if !self.vague_columns.is_empty() {
                errors.push(format!(
                    "Vague columns (missing table/alias qualifier): {:?}",
                    self.vague_columns
                ));
            }
            if !self.vague_tables.is_empty() {
                 // Filter vague tables: Check if the identifier is present as a key in final_tables
                 // OR as a key in the current scope's aliases.
                 // Also exclude internal generated names.
                let filtered_vague_tables: Vec<_> = self.vague_tables.iter()
                    .filter(|t| !final_tables.contains_key(*t) && !self.current_scope_aliases.contains_key(*t))
                    .filter(|t| !t.starts_with("_derived_") && !t.starts_with("derived:") && !t.starts_with("inner_query") && !t.starts_with("set_op_"))
                    .cloned()
                    .collect();
                if !filtered_vague_tables.is_empty() {
                    errors.push(format!(
                        "Vague/Unknown tables, CTEs, or aliases: {:?}",
                        filtered_vague_tables
                    ));
                }
            }
            if !errors.is_empty() {
                return Err(SqlAnalyzerError::VagueReferences(errors.join("\n")));
            }
        }

        Ok(QuerySummary {
            // Collect values from the combined map
            tables: final_tables.into_values().collect(),
            joins: self.joins,
            ctes: self.ctes,
        })
    }

    fn is_known_cte_definition(&self, name: &str) -> bool {
        self.known_cte_definitions.iter().rev().any(|scope| scope.contains(name))
    }

    fn add_column_reference(&mut self, qualifier: &str, column: &str) {
        // Check if the qualifier is an alias defined in the CURRENT scope
        let resolved_identifier_opt = self.current_scope_aliases.get(qualifier);

        match resolved_identifier_opt {
            // If it is an alias...
            Some(resolved_identifier) => {
                 // Check if this resolved identifier points to a known TableInfo entry (Base, Cte, or Derived)
                if let Some(table_info) = self.tables.get_mut(resolved_identifier) {
                    table_info.columns.insert(column.to_string());
                }
                // ELSE: The alias resolved to an identifier, but that identifier wasn't found
                // as a key in self.tables. This indicates a problem - the alias should map
                // to a TableInfo entry that was added during FROM/JOIN processing.
                // Mark the *qualifier* (what the user wrote) as vague.
                else {
                    self.vague_tables.push(qualifier.to_string());
                }
            }
            // If the qualifier is NOT an alias in the current scope...
            None => {
                 // Is it a table/CTE name used directly (without alias)? Check self.tables
                if let Some(table_info) = self.tables.get_mut(qualifier) {
                     // Found a direct match (base table or CTE used by name)
                    table_info.columns.insert(column.to_string());
                }
                // If it's not an alias AND not found directly in self.tables
                else {
                     // It's an unknown qualifier (vague table/alias/CTE)
                    self.vague_tables.push(qualifier.to_string());
                }
            }
        }
    }

    fn parse_object_name(&mut self, name: &ObjectName) -> (Option<String>, Option<String>, String) {
        let idents: Vec<String> = name.0.iter().map(|i| i.value.clone()).collect();
        match idents.len() {
            1 => {
                let table_name = idents[0].clone();
                // A single identifier MUST be a CTE to be valid in this simplified model.
                // If it's not a known CTE, mark it as vague immediately.
                if !self.is_known_cte_definition(&table_name) {
                     self.vague_tables.push(table_name.clone());
                }
                (None, None, table_name)
            }
            2 => (None, Some(idents[0].clone()), idents[1].clone()),
            3 => (Some(idents[0].clone()), Some(idents[1].clone()), idents[2].clone()),
            _ => (None, None, idents.last().cloned().unwrap_or_default())
        }
    }

    fn get_table_name(&self, name: &ObjectName) -> String {
        name.0.last().map(|i| i.value.clone()).unwrap_or_default()
    }
}

impl Visitor for QueryAnalyzer {
    type Break = ();

    // Keep pre_visit_expr as the primary way to detect column/alias usage within expressions
    fn pre_visit_expr(&mut self, expr: &Expr) -> ControlFlow<Self::Break> {
        match expr {
            Expr::Identifier(ident) => {
                // Still initially mark unqualified identifiers as vague
                self.vague_columns.push(ident.value.clone());
                ControlFlow::Continue(())
            },
            Expr::CompoundIdentifier(idents) if idents.len() >= 2 => {
                let column = idents.last().unwrap().value.clone();
                let qualifier = idents[idents.len() - 2].value.clone();
                self.add_column_reference(&qualifier, &column);
                // Allow visiting deeper parts (e.g., function calls on columns)
                ControlFlow::Continue(())
            },
            // Let nested queries/subqueries be handled by the explicit logic in process_query/process_table_factor
            Expr::Subquery(_) | Expr::InSubquery { .. } => {
                 // Stop the visitor from automatically descending into subqueries here,
                 // as they are handled explicitly elsewhere.
                ControlFlow::Break(())
            },
            _ => ControlFlow::Continue(())
        }
    }
     // No longer need pre_visit_table_factor or pre_visit_join overrides here
}