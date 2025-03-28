use crate::errors::SqlAnalyzerError;
use crate::types::{QuerySummary, TableInfo, JoinInfo, CteSummary};
use sqlparser::ast::{
    Visit, Visitor, TableFactor, Join, Expr, Query, Cte, ObjectName,
    SelectItem, Statement, JoinConstraint, JoinOperator, SetExpr,
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
            analyzer.process_query(&query)?;
        }
    }

    analyzer.into_summary()
}

struct QueryAnalyzer {
    tables: HashMap<String, TableInfo>,
    joins: HashSet<JoinInfo>,
    cte_aliases: Vec<HashSet<String>>,
    ctes: Vec<CteSummary>,
    vague_columns: Vec<String>,
    vague_tables: Vec<String>,
    column_mappings: HashMap<String, HashMap<String, (String, String)>>, // Context -> (col -> (table, col))
    scope_stack: Vec<String>, // For tracking the current query scope
    current_left_table: Option<String>, // For tracking the left table in joins
    table_aliases: HashMap<String, String>, // Alias -> Table name
}

impl QueryAnalyzer {
    fn new() -> Self {
        QueryAnalyzer {
            tables: HashMap::new(),
            joins: HashSet::new(),
            cte_aliases: vec![HashSet::new()],
            ctes: Vec::new(),
            vague_columns: Vec::new(),
            vague_tables: Vec::new(),
            column_mappings: HashMap::new(),
            scope_stack: Vec::new(),
            current_left_table: None,
            table_aliases: HashMap::new(),
        }
    }

    fn process_query(&mut self, query: &Query) -> Result<(), SqlAnalyzerError> {
        // Handle WITH clause (CTEs)
        if let Some(with) = &query.with {
            for cte in &with.cte_tables {
                self.process_cte(cte)?;
            }
        }

        // Process FROM clause first to build table information
        if let SetExpr::Select(select) = query.body.as_ref() {
            for table_with_joins in &select.from {
                // Process the main table
                self.process_table_factor(&table_with_joins.relation);
                
                // Save this as the current left table for joins
                if let TableFactor::Table { name, .. } = &table_with_joins.relation {
                    self.current_left_table = Some(self.get_table_name(name));
                }
                
                // Process joins
                for join in &table_with_joins.joins {
                    self.process_join(join);
                }
            }
            
            // After tables are set up, process SELECT items to extract column references
            for select_item in &select.projection {
                self.process_select_item(select_item);
            }
        }

        // Visit the entire query to catch other expressions
        query.visit(self);
        
        Ok(())
    }

    fn process_cte(&mut self, cte: &Cte) -> Result<(), SqlAnalyzerError> {
        let cte_name = cte.alias.name.to_string();
        
        // Add CTE to the current scope's aliases
        self.cte_aliases.last_mut().unwrap().insert(cte_name.clone());
        
        // Create a new analyzer for the CTE query
        let mut cte_analyzer = QueryAnalyzer::new();
        
        // Copy the current CTE aliases to the new analyzer
        cte_analyzer.cte_aliases = self.cte_aliases.clone();
        
        // Push the CTE name to the scope stack
        cte_analyzer.scope_stack.push(cte_name.clone());
        
        // Analyze the CTE query
        cte_analyzer.process_query(&cte.query)?;
        
        // Extract CTE information before moving the analyzer
        let cte_tables = cte_analyzer.tables.clone();
        let cte_joins = cte_analyzer.joins.clone();
        let cte_ctes = cte_analyzer.ctes.clone();
        let vague_columns = cte_analyzer.vague_columns.clone();
        let vague_tables = cte_analyzer.vague_tables.clone();
        let column_mappings = cte_analyzer.column_mappings.get(&cte_name).cloned().unwrap_or_default();
        
        // Create CTE summary
        let cte_summary = QuerySummary {
            tables: cte_tables.into_values().collect(),
            joins: cte_joins,
            ctes: cte_ctes,
        };
        
        self.ctes.push(CteSummary {
            name: cte_name.clone(),
            summary: cte_summary,
            column_mappings,
        });
        
        // Propagate any errors from CTE analysis
        self.vague_columns.extend(vague_columns);
        self.vague_tables.extend(vague_tables);
        
        Ok(())
    }

    fn process_table_factor(&mut self, table_factor: &TableFactor) {
        match table_factor {
            TableFactor::Table { name, alias, .. } => {
                let table_name = name.to_string();
                if !self.is_cte(&table_name) {
                    let (db, schema, table) = self.parse_object_name(name);
                    let entry = self.tables.entry(table.clone()).or_insert(TableInfo {
                        database_identifier: db,
                        schema_identifier: schema,
                        table_identifier: table.clone(),
                        alias: alias.as_ref().map(|a| a.name.to_string()),
                        columns: HashSet::new(),
                    });
                    
                    if let Some(a) = alias {
                        let alias_name = a.name.to_string();
                        entry.alias = Some(alias_name.clone());
                        self.table_aliases.insert(alias_name, table.clone());
                    }
                }
            },
            TableFactor::Derived { subquery, alias, .. } => {
                // Handle subqueries as another level of analysis
                let mut subquery_analyzer = QueryAnalyzer::new();
                
                // Copy the CTE aliases from current scope
                subquery_analyzer.cte_aliases = self.cte_aliases.clone();
                
                // Track scope with alias if provided
                if let Some(a) = alias {
                    subquery_analyzer.scope_stack.push(a.name.to_string());
                }
                
                // Analyze the subquery
                let _ = subquery_analyzer.process_query(subquery);
                
                // Inherit tables, joins, and vague references from subquery
                for (table_name, table_info) in subquery_analyzer.tables {
                    self.tables.insert(table_name, table_info);
                }
                
                self.joins.extend(subquery_analyzer.joins);
                self.vague_columns.extend(subquery_analyzer.vague_columns);
                self.vague_tables.extend(subquery_analyzer.vague_tables);
                
                // Transfer column mappings
                if let Some(a) = alias {
                    let alias_name = a.name.to_string();
                    if let Some(mappings) = subquery_analyzer.column_mappings.remove("") {
                        self.column_mappings.insert(alias_name, mappings);
                    }
                }
            },
            // Handle other table factors as needed
            _ => {}
        }
    }

    fn process_join(&mut self, join: &Join) {
        if let TableFactor::Table { name, .. } = &join.relation {
            let right_table = self.get_table_name(name);
            
            // Add the table to our tracking
            self.process_table_factor(&join.relation);
            
            // Extract join condition
            if let Some(left_table) = &self.current_left_table.clone() {
                // Add join information with condition
                if let JoinOperator::Inner(JoinConstraint::On(expr)) = &join.join_operator {
                    let condition = expr.to_string();
                    
                    // Process the join condition to extract any column references
                    self.process_join_condition(expr);
                    
                    self.joins.insert(JoinInfo {
                        left_table: left_table.clone(),
                        right_table: right_table.clone(),
                        condition,
                    });
                }
            }
            
            // Update current left table for next join
            self.current_left_table = Some(right_table);
        }
    }
    
    fn process_join_condition(&mut self, expr: &Expr) {
        // Extract any column references from the join condition
        match expr {
            Expr::BinaryOp { left, right, .. } => {
                // Process both sides of the binary operation
                self.process_join_condition(left);
                self.process_join_condition(right);
            },
            Expr::CompoundIdentifier(idents) if idents.len() == 2 => {
                let table = idents[0].to_string();
                let column = idents[1].to_string();
                self.add_column_reference(&table, &column);
            },
            // Other expression types can be processed as needed
            _ => {}
        }
    }

    fn process_select_item(&mut self, select_item: &SelectItem) {
        match select_item {
            SelectItem::UnnamedExpr(expr) => {
                // Handle expressions in SELECT clause
                match expr {
                    Expr::CompoundIdentifier(idents) if idents.len() == 2 => {
                        let table = idents[0].to_string();
                        let column = idents[1].to_string();
                        self.add_column_reference(&table, &column);
                    },
                    _ => {}
                }
            },
            SelectItem::ExprWithAlias { expr, alias } => {
                // Handle aliased expressions in SELECT clause
                match expr {
                    Expr::CompoundIdentifier(idents) if idents.len() == 2 => {
                        let table = idents[0].to_string();
                        let column = idents[1].to_string();
                        let alias_name = alias.to_string();
                        
                        // Add column to table
                        self.add_column_reference(&table, &column);
                        
                        // Add mapping for the alias
                        let current_scope = self.scope_stack.last().cloned().unwrap_or_default();
                        let mappings = self.column_mappings
                            .entry(current_scope)
                            .or_insert_with(HashMap::new);
                            
                        mappings.insert(alias_name, (table, column));
                    },
                    _ => {}
                }
            },
            _ => {}
        }
    }

    fn into_summary(self) -> Result<QuerySummary, SqlAnalyzerError> {
        // Check for vague references and return errors if found
        if !self.vague_columns.is_empty() || !self.vague_tables.is_empty() {
            let mut error_msg = String::new();
            
            if !self.vague_columns.is_empty() {
                error_msg.push_str(&format!("Vague columns: {:?}\n", self.vague_columns));
            }
            
            if !self.vague_tables.is_empty() {
                error_msg.push_str(&format!("Vague tables (missing schema): {:?}", self.vague_tables));
            }
            
            return Err(SqlAnalyzerError::VagueReferences(error_msg));
        }

        // Return the query summary
        Ok(QuerySummary {
            tables: self.tables.into_values().collect(),
            joins: self.joins,
            ctes: self.ctes,
        })
    }

    fn parse_object_name(&mut self, name: &ObjectName) -> (Option<String>, Option<String>, String) {
        let idents = &name.0;
        
        match idents.len() {
            1 => {
                // Single identifier (table name only) - flag as vague unless it's a CTE
                let table_name = idents[0].to_string();
                
                if !self.is_cte(&table_name) {
                    self.vague_tables.push(table_name.clone());
                }
                
                (None, None, table_name)
            }
            2 => {
                // Two identifiers (schema.table)
                (None, Some(idents[0].to_string()), idents[1].to_string())
            }
            3 => {
                // Three identifiers (database.schema.table)
                (Some(idents[0].to_string()), Some(idents[1].to_string()), idents[2].to_string())
            }
            _ => {
                // More than three identifiers - take the last one as table name
                (None, None, idents.last().unwrap().to_string())
            }
        }
    }

    fn get_table_name(&self, name: &ObjectName) -> String {
        name.0.last().unwrap().to_string()
    }

    fn is_cte(&self, name: &str) -> bool {
        // Check if the name is in any CTE scope
        for scope in &self.cte_aliases {
            if scope.contains(name) {
                return true;
            }
        }
        false
    }

    fn add_column_reference(&mut self, table: &str, column: &str) {
        // Get the real table name if this is an alias
        let real_table = self.table_aliases.get(table).cloned().unwrap_or_else(|| table.to_string());
        
        // If this is a table we're tracking (not a CTE), add the column
        if let Some(table_info) = self.tables.get_mut(&real_table) {
            table_info.columns.insert(column.to_string());
        }
        
        // Track column mapping for lineage regardless of whether it's a table or CTE
        let current_scope = self.scope_stack.last().cloned().unwrap_or_default();
        let mappings = self.column_mappings
            .entry(current_scope)
            .or_insert_with(HashMap::new);
            
        mappings.insert(column.to_string(), (table.to_string(), column.to_string()));
    }
}

impl Visitor for QueryAnalyzer {
    type Break = ();

    fn pre_visit_expr(&mut self, expr: &Expr) -> ControlFlow<Self::Break> {
        match expr {
            Expr::Identifier(ident) => {
                // Unqualified column reference - mark as vague
                self.vague_columns.push(ident.to_string());
            },
            Expr::CompoundIdentifier(idents) if idents.len() == 2 => {
                // Qualified column reference (table.column)
                let table = idents[0].to_string();
                let column = idents[1].to_string();
                
                // Add column to table and track mapping
                self.add_column_reference(&table, &column);
            },
            _ => {}
        }
        ControlFlow::Continue(())
    }

    fn pre_visit_table_factor(&mut self, table_factor: &TableFactor) -> ControlFlow<Self::Break> {
        // Most table processing is done in process_table_factor
        // This is just to ensure we catch any tables that might be referenced in expressions
        self.process_table_factor(table_factor);
        ControlFlow::Continue(())
    }
}