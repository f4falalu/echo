use crate::errors::SqlAnalyzerError;
use crate::types::{QuerySummary, TableInfo, JoinInfo, CteSummary};
use sqlparser::ast::{
    Visit, Visitor, TableFactor, Join, Expr, Query, Cte, ObjectName,
    SelectItem, Statement, JoinConstraint, JoinOperator, SetExpr, TableAlias, Ident
};
use sqlparser::dialect::GenericDialect;
use sqlparser::parser::Parser;
use std::collections::{HashMap, HashSet};
use std::ops::ControlFlow;
use anyhow::Result;

pub mod semantic;

pub(crate) fn analyze_sql(sql: &str) -> Result<QuerySummary, SqlAnalyzerError> {
    let ast = Parser::parse_sql(&GenericDialect, sql)?;
    let mut analyzer = QueryAnalyzer::new();

    for stmt in ast {
        if let Statement::Query(query) = stmt {
            // Analyze the top-level query
            analyzer.process_query(&query)?;
        }
        // Potentially handle other statement types if needed
    }

    analyzer.into_summary()
}

#[derive(Debug)] // Added for debugging purposes
struct QueryAnalyzer {
    tables: HashMap<String, TableInfo>, // Base table identifier -> Info
    joins: HashSet<JoinInfo>,
    // --- Scope Management ---
    cte_aliases: Vec<HashSet<String>>, // Stack for CTEs available in current scope
    scope_stack: Vec<String>, // Stack for tracking query/subquery scope names (e.g., CTE name, subquery alias)
    // --- Alias & Mapping ---
    // Stores mapping from an alias used in the query to its underlying identifier
    // Underlying identifier can be: Base Table Name, CTE Name, or Subquery Alias itself
    table_aliases: HashMap<String, String>,
    // Keep column_mappings if needed for lineage, though not strictly required for join *detection*
    column_mappings: HashMap<String, HashMap<String, (String, String)>>, // Context -> (col -> (table_alias, col))
    // --- Join Processing State ---
    // Identifier (name or alias) of the relation that serves as the left input for the *next* join
    current_from_relation_identifier: Option<String>,
    // --- Error Tracking ---
    vague_columns: Vec<String>,
    vague_tables: Vec<String>,
    ctes: Vec<CteSummary>, // Store analyzed CTE summaries
}

impl QueryAnalyzer {
    fn new() -> Self {
        QueryAnalyzer {
            tables: HashMap::new(),
            joins: HashSet::new(),
            cte_aliases: vec![HashSet::new()], // Start with global scope
            ctes: Vec::new(),
            vague_columns: Vec::new(),
            vague_tables: Vec::new(),
            column_mappings: HashMap::new(),
            scope_stack: Vec::new(),
            current_from_relation_identifier: None,
            table_aliases: HashMap::new(),
        }
    }

    // fn current_scope_name(&self) -> String {
    //     self.scope_stack.last().cloned().unwrap_or_default()
    // }

    /// Determines the effective identifier for a table factor in the context of a join
    /// (preferring alias, falling back to CTE name or base table name) and registers
    /// the alias mapping if an alias is present.
    /// Returns None if the factor cannot be reliably identified (e.g., unaliased subquery, nested join).
    fn get_factor_identifier_and_register_alias(&mut self, factor: &TableFactor) -> Option<String> {
        match factor {
            TableFactor::Table { name, alias, .. } => {
                let first_part = name.0.first().map(|i| i.value.clone()).unwrap_or_default();
                 // Check if it's a reference to a known CTE (assuming CTE names are single identifiers)
                 if name.0.len() == 1 && self.is_cte(&first_part) {
                    let cte_name = first_part;
                    if let Some(a) = alias {
                         let alias_name = a.name.value.clone();
                         // Map alias -> CTE Name
                         self.table_aliases.insert(alias_name.clone(), cte_name.clone());
                         Some(alias_name) // Use alias as the identifier in this context
                    } else {
                         // No alias, use CTE name itself. Ensure it maps to itself.
                         self.table_aliases.entry(cte_name.clone()).or_insert_with(|| cte_name.clone());
                         Some(cte_name)
                     }
                 } else {
                     // It's a base table reference
                     let base_table_identifier = self.get_table_name(name); // Get the last part (table name)
                     if let Some(a) = alias {
                         let alias_name = a.name.value.clone();
                         // Map alias -> Base Table Name
                         self.table_aliases.insert(alias_name.clone(), base_table_identifier.clone());
                         Some(alias_name) // Use alias as the identifier
                     } else {
                        // No alias, use base table name itself. Ensure it maps to itself.
                         self.table_aliases.entry(base_table_identifier.clone()).or_insert_with(|| base_table_identifier.clone());
                         Some(base_table_identifier)
                     }
                 }
            },
            TableFactor::Derived { alias, .. } => {
                 // For derived tables (subqueries), the alias is the only way to identify it
                 alias.as_ref().map(|a| {
                    let alias_name = a.name.value.clone();
                    // Map alias -> alias itself (identifier for subquery is its alias)
                    self.table_aliases.insert(alias_name.clone(), alias_name.clone());
                    alias_name
                })
                // Unaliased subquery returns None - cannot be reliably joined by name
            },
             TableFactor::TableFunction { expr: _, alias } => {
                 // Treat table functions like derived tables - alias is the identifier
                 alias.as_ref().map(|a| {
                    let alias_name = a.name.value.clone();
                    // Map alias -> alias itself (function result identified by alias)
                     self.table_aliases.insert(alias_name.clone(), alias_name.clone());
                    alias_name
                })
             },
              TableFactor::NestedJoin { table_with_joins: _, alias: _ } => {
                  // A nested join structure itself doesn't have a single simple identifier
                  // for the outer join context. The alias for the *entire* nested join result
                  // might be available (depending on sqlparser version/syntax used),
                  // but we are choosing to return None here as the internal structure is complex.
                  // The alias registration for the *nested join result* itself happens
                  // if this NestedJoin appears within another TableFactor::Derived or similar
                  // that *provides* an alias for the result.
                  // The processing within process_table_factor handles analyzing the *contents*.
                   None
              }
            _ => None, // Other factors like UNNEST don't have a simple identifier in this context
        }
    }


    /// Processes a query, including CTEs, FROM/JOIN clauses, and other parts.
    fn process_query(&mut self, query: &Query) -> Result<(), SqlAnalyzerError> {
        let mut is_with_query = false;
        // --- CTE Processing ---
        if let Some(with) = &query.with {
             is_with_query = true;
             // Push a new scope level for CTEs defined *at this level*
              self.cte_aliases.push(HashSet::new());
             // Analyze each CTE definition
              for cte in &with.cte_tables {
                 // Analyze the CTE. process_cte will handle adding its name to the *current* scope
                  // in self.cte_aliases *after* it's processed.
                  self.process_cte(cte)?;
              }
         }

        // --- Main Query Body Processing (SELECT, UNION, etc.) ---
        match query.body.as_ref() {
             SetExpr::Select(select) => {
                 // Reset join state for this SELECT scope
                  self.current_from_relation_identifier = None;

                  // Process FROM clause: base relation + subsequent joins
                  for table_with_joins in &select.from {
                     // 1. Process the first relation in the FROM clause
                      self.process_table_factor(&table_with_joins.relation); // Analyze content (add base tables, analyze subqueries)
                      // 2. Get its identifier and set it as the initial "left side" for joins
                      self.current_from_relation_identifier = self.get_factor_identifier_and_register_alias(&table_with_joins.relation);

                      // 3. Process all subsequent JOIN clauses, updating the "left side" state as we go
                      for join in &table_with_joins.joins {
                          self.process_join(join); // Updates current_from_relation_identifier internally
                      }
                  }

                  // Process other clauses (WHERE, GROUP BY, HAVING, SELECT list)
                  // Use the visitor pattern for expressions within these clauses
                  if let Some(selection) = &select.selection { selection.visit(self); }
                  // Assuming GroupByExpr holds Vec<Expr>, iterate and visit
                  if let sqlparser::ast::GroupByExpr::Expressions(exprs, _) = &select.group_by {
                      for expr in exprs { expr.visit(self); }
                  }
                  if let Some(having) = &select.having { having.visit(self); }
                  for item in &select.projection { self.process_select_item(item); } // Let visitor handle expressions here too
             }
             SetExpr::Query(inner_query) => {
                  // Recursively process nested queries
                  self.process_query(inner_query)?;
             }
              SetExpr::SetOperation { left, op: _, right, set_quantifier: _ } => {
                  // Process UNION, INTERSECT, EXCEPT - analyze both sides
                   self.process_query_body(left)?;
                   self.process_query_body(right)?;
              }
              SetExpr::Values(_) => {
                  // VALUES clause typically doesn't involve tables/joins in the same way
              }
             SetExpr::Insert(_) | SetExpr::Update(_) | SetExpr::Table(_) => {
                  // These are less common in typical SELECT analysis contexts, handle if needed
              }
              // Handle other SetExpr variants if they become relevant
              #[allow(unreachable_patterns)] // Avoid warning if sqlparser adds variants
              _ => {}
         }

        // Fallback visit for any expressions missed by specific clause processing
        query.visit(self);

        // --- Cleanup ---
        // Pop the CTE scope level if one was added
         if is_with_query {
             self.cte_aliases.pop();
         }

        Ok(())
    }

     /// Helper to process the body of a query (like sides of a UNION)
      fn process_query_body(&mut self, query_body: &SetExpr) -> Result<(), SqlAnalyzerError> {
         match query_body {
             SetExpr::Select(_) | SetExpr::Query(_) | SetExpr::SetOperation {..} => {
                 // Create a temporary Query object to wrap the SetExpr for process_query
                  // This is a bit of a workaround because process_query expects a Query struct.
                  let temp_query = Query {
                      with: None,
                      body: Box::new(query_body.clone()), // Clone the body
                      order_by: None, // Use None for Option<OrderBy>
                      limit: None,
                      limit_by: vec![], // Added default
                      offset: None,
                      fetch: None,
                      locks: vec![],
                      for_clause: None, // Added default
                      settings: None, // Added default
                      format_clause: None, // Added default
                  };
                  // Analyze this part of the query - it will update the *same* analyzer state
                  self.process_query(&temp_query)?;
              }
              // Handle other SetExpr types if necessary
              _ => {}
          }
          Ok(())
      }


    /// Analyzes a CTE definition and stores its summary.
    fn process_cte(&mut self, cte: &Cte) -> Result<(), SqlAnalyzerError> {
        let cte_name = cte.alias.name.value.clone();

        // Create a *new* analyzer for the CTE's internal scope
        let mut cte_analyzer = QueryAnalyzer::new();
        // Inherit *all* currently visible CTE scopes from the parent
        cte_analyzer.cte_aliases = self.cte_aliases.clone();
        // --> Inherit table aliases from the parent scope <--
        cte_analyzer.table_aliases = self.table_aliases.clone();
        // Set the scope name for analysis context within the CTE
        cte_analyzer.scope_stack.push(cte_name.clone());

        // Analyze the CTE's query recursively
        let cte_analysis_result = cte_analyzer.process_query(&cte.query);

        // --- Error Handling & Summary Storage ---
        match cte_analysis_result {
            Ok(()) => {
                 // Analysis succeeded, now get the summary and check for vague refs
                 match cte_analyzer.into_summary() {
                     Ok(summary) => {
                          self.ctes.push(CteSummary {
                              name: cte_name.clone(),
                              summary,
                              column_mappings: HashMap::new(), // Simplified for now
                          });
                          // Add this CTE name to the *parent's current scope* so subsequent CTEs/query can see it
                           if let Some(current_scope_aliases) = self.cte_aliases.last_mut() {
                               current_scope_aliases.insert(cte_name.clone());
                           }
                            // Also register the CTE name mapping to itself in the *parent* analyzer
                           self.table_aliases.insert(cte_name.clone(), cte_name);
                           Ok(())
                     }
                     Err(e @ SqlAnalyzerError::VagueReferences(_)) => {
                          // Propagate vague reference errors with CTE context
                           Err(SqlAnalyzerError::VagueReferences(format!("In CTE '{}': {}", cte_name, e)))
                      }
                      Err(e) => {
                          // Propagate other internal errors
                           Err(SqlAnalyzerError::Internal(anyhow::anyhow!("Internal error summarizing CTE '{}': {}", cte_name, e)))
                      }
                 }
            }
            Err(e @ SqlAnalyzerError::VagueReferences(_)) => {
                 // Propagate vague reference error detected during CTE processing
                  Err(SqlAnalyzerError::VagueReferences(format!("In CTE '{}': {}", cte_name, e)))
             }
            Err(e) => {
                 // Propagate other processing errors
                  Err(SqlAnalyzerError::Internal(anyhow::anyhow!("Error processing CTE '{}': {}", cte_name, e)))
            }
        }
    }


    /// Processes a table factor to analyze its contents (subqueries, nested joins)
    /// and identify base tables. Does not register joins itself.
    fn process_table_factor(&mut self, table_factor: &TableFactor) {
        match table_factor {
            TableFactor::Table { name, alias: _, .. } => {
                // Identify if it's a base table (not a CTE) and add to self.tables if so.
                let base_identifier = self.get_table_name(name);
                 if name.0.len() > 1 || !self.is_cte(&base_identifier) { // It's a base table if qualified or not a known CTE
                    let (db, schema, table_part) = self.parse_object_name(name);
                     self.tables.entry(base_identifier.clone()).or_insert(TableInfo {
                        database_identifier: db,
                        schema_identifier: schema,
                        table_identifier: table_part,
                         alias: None, // Alias is handled by get_factor_identifier...
                        columns: HashSet::new(),
                    });
                 }
                 // Alias registration handled later by get_factor_identifier_and_register_alias
            },
            TableFactor::Derived { subquery, alias, .. } => {
                 // Analyze the subquery recursively
                 let subquery_alias_opt = alias.as_ref().map(|a| a.name.value.clone());
                 let scope_name = subquery_alias_opt.clone().unwrap_or_else(|| "unaliased_subquery".to_string());

                 self.scope_stack.push(scope_name.clone());
                 let mut subquery_analyzer = QueryAnalyzer::new();
                 subquery_analyzer.cte_aliases = self.cte_aliases.clone();
                 // --> Inherit table aliases from the parent scope <--
                 subquery_analyzer.table_aliases = self.table_aliases.clone();
                 // Don't push scope_stack to sub-analyzer, just use it for context during its analysis if needed

                 let sub_result = subquery_analyzer.process_query(subquery);
                  self.scope_stack.pop(); // Pop scope regardless of outcome

                 // Propagate results/errors
                  match sub_result {
                     Ok(()) => {
                          match subquery_analyzer.into_summary() {
                             Ok(summary) => {
                                 // Add base tables found within the subquery to the parent's list
                                  for table_info in summary.tables {
                                      self.tables.insert(table_info.table_identifier.clone(), table_info);
                                  }
                                  // Add joins found within the subquery to the parent's list
                                  self.joins.extend(summary.joins);
                                  // Ignore subquery's CTEs - they aren't visible outside
                             }
                              Err(SqlAnalyzerError::VagueReferences(msg)) => {
                                 self.vague_tables.push(format!("Subquery '{}': {}", scope_name, msg));
                             }
                              Err(e) => { eprintln!("Warning: Internal error summarizing subquery '{}': {}", scope_name, e); }
                         }
                     }
                      Err(SqlAnalyzerError::VagueReferences(msg)) => {
                         self.vague_tables.push(format!("Subquery '{}': {}", scope_name, msg));
                     }
                      Err(e) => { eprintln!("Warning: Error processing subquery '{}': {}", scope_name, e); }
                 }
                 // Alias registration handled later by get_factor_identifier_and_register_alias
            },
             TableFactor::TableFunction { expr, alias } => {
                 // Analyze the expression representing the function call
                 expr.visit(self);
                 // Alias registration is handled later by get_factor_identifier_and_register_alias,
                 // which already accesses the `alias` field from the outer match.
             }
             TableFactor::NestedJoin { table_with_joins, alias } => {
                 // Recursively process the contents of the nested join to find base tables etc.
                 // Process the base table/join structure of the nest
                 // Need to handle `table_with_joins` which itself contains relation and joins
                 // Example: process the initial relation
                 self.process_table_factor(&table_with_joins.relation);
                 // Example: process subsequent joins within the nest
                 for join in &table_with_joins.joins {
                     self.process_table_factor(&join.relation); // Process right side
                     // Process join condition for column refs
                     match &join.join_operator {
                         JoinOperator::Inner(JoinConstraint::On(expr))
                         | JoinOperator::LeftOuter(JoinConstraint::On(expr))
                         | JoinOperator::RightOuter(JoinConstraint::On(expr))
                         | JoinOperator::FullOuter(JoinConstraint::On(expr)) => {
                             self.process_join_condition(expr);
                         }
                         // Handle USING etc. if needed
                         _ => {}
                     }
                 }
                 // Alias registration for the *entire* nested join result handled later by get_factor_identifier...
             }
            _ => {} // Handle other factors like UNNEST if necessary
        }
    }


    /// Processes a JOIN clause, identifying participants and adding to the joins set.
    /// Updates the `current_from_relation_identifier` state for the next join.
    fn process_join(&mut self, join: &Join) {
        // 1. Analyze the content of the right-hand side factor (adds base tables, analyzes subqueries inside)
        self.process_table_factor(&join.relation);

        // 2. Get the identifier for the right side (its alias or name) and register its alias mapping
        let right_identifier_opt = self.get_factor_identifier_and_register_alias(&join.relation);

        // 3. Get the identifier for the left side (state from the previous FROM/JOIN step)
        let left_identifier_opt = self.current_from_relation_identifier.clone(); // Clone state before potentially updating

        // 4. If both sides are identifiable, record the join
        if let (Some(left_id), Some(right_id)) = (&left_identifier_opt, &right_identifier_opt) {
            let condition = match &join.join_operator {
                JoinOperator::Inner(JoinConstraint::On(expr))
                | JoinOperator::LeftOuter(JoinConstraint::On(expr))
                | JoinOperator::RightOuter(JoinConstraint::On(expr))
                | JoinOperator::FullOuter(JoinConstraint::On(expr)) => {
                    self.process_join_condition(expr); // Analyze condition expressions
                    expr.to_string()
                }
                 JoinOperator::Inner(JoinConstraint::Using(idents))
                 | JoinOperator::LeftOuter(JoinConstraint::Using(idents))
                 | JoinOperator::RightOuter(JoinConstraint::Using(idents))
                 | JoinOperator::FullOuter(JoinConstraint::Using(idents)) => {
                      // idents is Vec<ObjectName>, expect single Ident inside each
                      for ident in idents { self.vague_columns.push(format!("USING({})", ident.0.last().map(|id| id.value.clone()).unwrap_or_default())); } // Mark as vague
                      format!("USING({})", idents.iter().map(|i| i.0.last().map(|id| id.value.clone()).unwrap_or_default()).collect::<Vec<_>>().join(", "))
                  }
                 // Natural joins might be constraints, not operators directly in newer sqlparser
                 JoinOperator::Inner(JoinConstraint::Natural)
                 | JoinOperator::LeftOuter(JoinConstraint::Natural)
                 | JoinOperator::RightOuter(JoinConstraint::Natural)
                 | JoinOperator::FullOuter(JoinConstraint::Natural) => "NATURAL".to_string(),
                 JoinOperator::CrossJoin => "CROSS JOIN".to_string(),
                 _ => "UNKNOWN_CONSTRAINT".to_string(),
            };

            self.joins.insert(JoinInfo {
                left_table: left_id.clone(),
                right_table: right_id.clone(),
                condition,
            });
             println!("DEBUG: Registered Join: {} -> {}", left_id, right_id); // Debug print
        } else {
            // Log if a join couldn't be fully registered due to unidentifiable side(s)
             if left_identifier_opt.is_none() {
                 eprintln!("Warning: Cannot register join, left side is unknown for join involving: {:?}", join.relation);
             }
             if right_identifier_opt.is_none() {
                 eprintln!("Warning: Cannot register join, right side is unknown (e.g., unaliased subquery/nested join?) for join from {:?} involving: {:?}", left_identifier_opt, join.relation);
             }
        }

        // 5. Update state for the *next* join:
        // The current right side becomes the left side for the next join *only if* it was identifiable.
        // If the right side was not identifiable (e.g., nested join), the state remains unchanged,
        // meaning the *next* join's left side is still the result of the *previous* identifiable step.
        if right_identifier_opt.is_some() {
            self.current_from_relation_identifier = right_identifier_opt;
        }
        // else: current_from_relation_identifier remains as it was.
    }


    /// Analyzes expressions within a JOIN condition to find column references.
    fn process_join_condition(&mut self, expr: &Expr) {
        // Uses the visitor pattern internally now via self.visit_expr
        expr.visit(self); // Corrected call
    }

    /// Processes a SELECT item, primarily delegating expression analysis to the visitor.
    fn process_select_item(&mut self, select_item: &SelectItem) {
        match select_item {
            SelectItem::UnnamedExpr(expr) | SelectItem::ExprWithAlias { expr, .. } => {
                 expr.visit(self); // Corrected call
            },
             SelectItem::QualifiedWildcard(obj_name, _) => {
                 // table.* or schema.table.*
                  // Could try to resolve obj_name to an alias/table and mark columns, but complex.
                  // For now, mainly rely on explicit column refs found by the visitor.
                  let qualifier = obj_name.0.first().map(|i|i.value.clone()).unwrap_or_default();
                  if !qualifier.is_empty() {
                      // Mark that all columns from 'qualifier' (alias/table) are used?
                      // This requires more advanced column tracking.
                  }
             }
             SelectItem::Wildcard(_) => {
                  // Global '*' - mark all columns from all FROM tables? Again, complex.
              }
        }
    }

    /// Performs final checks and consolidates results into a QuerySummary.
    fn into_summary(mut self) -> Result<QuerySummary, SqlAnalyzerError> {
        // Post-processing: Update TableInfo alias fields based on the final alias map
        // This ensures the TableInfo reflects the alias used *in this query scope* if any.
         for (alias, identifier) in &self.table_aliases {
              // Check if the identifier matches a base table identifier
              if let Some(table_info) = self.tables.get_mut(identifier) {
                   // If this alias points to this base table, update the TableInfo's alias field
                    // This assumes an alias maps uniquely *within the scope it's used*.
                    // A simple approach is to just set it if it's currently None,
                    // but overwriting might be okay if aliases are expected to be unique per table instance.
                    // Let's prefer setting if None, or if the alias matches the key (direct reference)
                     if table_info.alias.is_none() || identifier == alias {
                          table_info.alias = Some(alias.clone());
                      }
               }
               // If the identifier matches a CTE name or another alias (subquery),
               // we don't update the base `tables` map's alias field.
           }

        // Consolidate vague references (remove duplicates)
         self.vague_columns.sort();
         self.vague_columns.dedup();
         self.vague_tables.sort();
         self.vague_tables.dedup();

        // --- Final Vague Reference Check ---
        if !self.vague_columns.is_empty() || !self.vague_tables.is_empty() {
            let mut errors = Vec::new();
            if !self.vague_columns.is_empty() {
                errors.push(format!("Vague columns (missing table/alias qualifier): {:?}", self.vague_columns));
            }
            if !self.vague_tables.is_empty() {
                 errors.push(format!("Vague/Unknown tables or CTEs: {:?}", self.vague_tables));
            }
            return Err(SqlAnalyzerError::VagueReferences(errors.join("\n")));
        }

        Ok(QuerySummary {
            tables: self.tables.into_values().collect(),
            joins: self.joins,
            ctes: self.ctes,
        })
    }

    // Checks if a name refers to a CTE visible in the current or parent scopes.
    fn is_cte(&self, name: &str) -> bool {
        self.cte_aliases.iter().rev().any(|scope| scope.contains(name))
    }


    /// Adds a column reference to the corresponding base TableInfo if the qualifier
    /// resolves to a known base table. Handles alias resolution.
    /// Also used implicitly to validate qualifiers found in expressions.
    fn add_column_reference(&mut self, qualifier: &str, column: &str) {
        // Check if the qualifier is known in the current scope (alias, CTE, or direct base table name)
        let is_known_alias = self.table_aliases.contains_key(qualifier);
        let is_known_cte = self.is_cte(qualifier);
        // Check if it resolves to a base table *tracked by this specific analyzer instance*
        let resolved_identifier = self.table_aliases.get(qualifier).cloned().unwrap_or_else(|| qualifier.to_string());
        let is_known_base_table = self.tables.contains_key(&resolved_identifier);

        if is_known_alias || is_known_cte || is_known_base_table {
            // Qualifier is valid in this scope. Attempt to add column info if it maps to a base table.
            if let Some(table_info) = self.tables.get_mut(&resolved_identifier) {
                table_info.columns.insert(column.to_string());
            }
            // If it's an alias for a CTE/Subquery or a direct CTE name, column tracking happens elsewhere or isn't needed here.
        } else {
            // Qualifier is not a known alias, CTE, or base table name in this scope.
            self.vague_tables.push(qualifier.to_string());
        }

         // TODO: Add column lineage mapping if needed
         // let current_scope = self.current_scope_name();
         // self.column_mappings.entry(current_scope)... .insert(column, (qualifier.to_string(), column.to_string()));
     }


    // --- Utility methods ---
    /// Parses db.schema.table, schema.table, or table identifiers. Marks unqualified base tables as vague.
    fn parse_object_name(&mut self, name: &ObjectName) -> (Option<String>, Option<String>, String) {
        let idents: Vec<String> = name.0.iter().map(|i| i.value.clone()).collect();
        match idents.len() {
            1 => { // table
                let table_name = idents[0].clone();
                 // Mark as vague ONLY if it's NOT a known CTE in the current scope context
                 if !self.is_cte(&table_name) {
                    self.vague_tables.push(table_name.clone());
                 }
                (None, None, table_name)
            }
            2 => (None, Some(idents[0].clone()), idents[1].clone()), // schema.table
            3 => (Some(idents[0].clone()), Some(idents[1].clone()), idents[2].clone()), // db.schema.table
            _ => {
                 eprintln!("Warning: Unexpected object name structure: {:?}", name);
                 (None, None, idents.last().cloned().unwrap_or_default()) // Fallback
             }
        }
    }

    /// Returns the last part of a potentially multi-part identifier (usually the table/CTE name).
    fn get_table_name(&self, name: &ObjectName) -> String {
        name.0.last().map(|i| i.value.clone()).unwrap_or_default()
    }
}


// Visitor implementation focuses on identifying column references within expressions.
impl Visitor for QueryAnalyzer {
    type Break = ();

    fn pre_visit_expr(&mut self, expr: &Expr) -> ControlFlow<Self::Break> {
        match expr {
            Expr::Identifier(ident) => {
                // Unqualified column reference
                 self.vague_columns.push(ident.value.clone());
                 ControlFlow::Continue(())
            },
            Expr::CompoundIdentifier(idents) if idents.len() >= 2 => {
                 // Qualified column reference
                 let column = idents.last().unwrap().value.clone();
                 let qualifier = idents[idents.len() - 2].value.clone();
                 self.add_column_reference(&qualifier, &column);
                 ControlFlow::Continue(())
            },
            Expr::Subquery(query) => {
                // Analyze this nested query with a separate context
                let mut sub_analyzer = QueryAnalyzer::new();
                sub_analyzer.cte_aliases = self.cte_aliases.clone();
                sub_analyzer.table_aliases = self.table_aliases.clone();

                match sub_analyzer.process_query(query) {
                    Ok(_) => { /* Sub-analysis successful */ }
                    Err(SqlAnalyzerError::VagueReferences(msg)) => {
                        self.vague_tables.push(format!("Nested Query Error: {}", msg));
                    }
                    Err(e) => {
                        eprintln!("Warning: Error analyzing nested query: {}", e);
                    }
                }
                // Allow visitor to continue (but we've already analyzed the subquery)
                ControlFlow::Continue(())
            },
            Expr::InSubquery { subquery, .. } => {
                 // Analyze this nested query with a separate context
                 let mut sub_analyzer = QueryAnalyzer::new();
                 sub_analyzer.cte_aliases = self.cte_aliases.clone();
                 sub_analyzer.table_aliases = self.table_aliases.clone();
 
                 match sub_analyzer.process_query(subquery) { // Use subquery field
                     Ok(_) => { /* Sub-analysis successful */ }
                     Err(SqlAnalyzerError::VagueReferences(msg)) => {
                         self.vague_tables.push(format!("Nested Query Error: {}", msg));
                     }
                     Err(e) => {
                         eprintln!("Warning: Error analyzing nested query: {}", e);
                     }
                 }
                 // Allow visitor to continue (but we've already analyzed the subquery)
                 ControlFlow::Continue(())
             }
            // Let the visit trait handle recursion into other nested expressions
            _ => ControlFlow::Continue(())
        }
    }

    // Override pre_visit_query to potentially set top-level scope if needed,
    // although process_query handles the main logic now.
    /*
    fn visit_query(&mut self, query: &Query) -> ControlFlow<Self::Break> {
        // ... [previous incorrect implementation] ...
    }
    */

     // Override pre_visit_query to potentially set top-level scope if needed,
     // although process_query handles the main logic now.
     // fn pre_visit_query(&mut self, query: &Query) -> ControlFlow<Self::Break> {
     //     // Maybe set a global scope name?
     //     ControlFlow::Continue(())
     // }

     // Override pre_visit_cte if specific actions are needed before analyzing CTE content
     // fn pre_visit_cte(&mut self, _cte: &Cte) -> ControlFlow<Self::Break> {
     //     // Example: push scope before process_cte does? (process_cte handles it now)
     //     ControlFlow::Continue(())
     // }

     // Override post_visit_cte if cleanup is needed after analyzing CTE content
     // fn post_visit_cte(&mut self, _cte: &Cte) -> ControlFlow<Self::Break> {
     //     // Example: pop scope? (process_cte handles it now)
     //     ControlFlow::Continue(())
     // }

     // Potentially override visit_join if more detailed analysis inside Join is needed,
     // but process_join is handling the core logic.
     // fn visit_join(&mut self, join: &Join) -> ControlFlow<Self::Break> {
     //     println!("Visiting Join: {:?}", join.relation);
     //     ControlFlow::Continue(())
     // }
}