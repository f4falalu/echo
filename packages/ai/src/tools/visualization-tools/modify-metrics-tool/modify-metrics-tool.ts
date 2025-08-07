import { tool } from 'ai';
import { z } from 'zod';
import { createModifyMetricsDelta } from './modify-metrics-delta';
import { createModifyMetricsExecute } from './modify-metrics-execute';
import { createModifyMetricsFinish } from './modify-metrics-finish';
import { createModifyMetricsStart } from './modify-metrics-start';

// Input schema for the modify metrics tool
const ModifyMetricsInputSchema = z.object({
  files: z
    .array(
      z.object({
        id: z.string().describe('The UUID of the metric file to modify'),
        yml_content: z
          .string()
          .describe(
            'The complete updated YAML content for the metric. This replaces the entire existing content.'
          ),
      })
    )
    .min(1)
    .describe('Array of metric files to modify with their complete updated YAML content'),
});

// Output schema for the modify metrics tool
const ModifyMetricsOutputSchema = z.object({
  message: z.string(),
  duration: z.number(),
  files: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      file_type: z.string(),
      result_message: z.string().optional(),
      results: z.array(z.record(z.any())).optional(),
      created_at: z.string(),
      updated_at: z.string(),
      version_number: z.number(),
    })
  ),
  failed_files: z.array(
    z.object({
      file_name: z.string(),
      error: z.string(),
    })
  ),
});

// Context schema for the modify metrics tool
const ModifyMetricsContextSchema = z.object({
  userId: z.string().describe('The user ID'),
  chatId: z.string().describe('The chat ID'),
  dataSourceId: z.string().describe('The data source ID'),
  dataSourceSyntax: z.string().describe('The data source syntax'),
  organizationId: z.string().describe('The organization ID'),
  messageId: z.string().optional().describe('The message ID'),
});

// Export types
export type ModifyMetricsInput = z.infer<typeof ModifyMetricsInputSchema>;
export type ModifyMetricsOutput = z.infer<typeof ModifyMetricsOutputSchema>;
export type ModifyMetricsContext = z.infer<typeof ModifyMetricsContextSchema>;

// Type constraint for agent context - must have required fields
export type ModifyMetricsAgentContext = {
  userId: string;
  chatId: string;
  dataSourceId: string;
  dataSourceSyntax: string;
  organizationId: string;
  messageId?: string | undefined;
};

// Factory function that accepts agent context and maps to tool context
export function createModifyMetricsTool<
  TAgentContext extends ModifyMetricsAgentContext = ModifyMetricsAgentContext,
>(context: TAgentContext) {
  // Create all functions with the context passed directly
  const execute = createModifyMetricsExecute<TAgentContext>(context);
  const onInputStart = createModifyMetricsStart<TAgentContext>(context);
  const onInputDelta = createModifyMetricsDelta<TAgentContext>(context);
  const onInputAvailable = createModifyMetricsFinish<TAgentContext>(context);

  // Get the description from the original tool
  const description = `Updates existing metric configuration files with new YAML content. Provide the complete YAML content for each metric, replacing the entire existing file. This tool is ideal for bulk modifications when you need to update multiple metrics simultaneously. The system will preserve version history and perform all necessary validations on the new content. For each metric, you need its UUID and the complete updated YAML content. **Prefer modifying metrics in bulk using this tool rather than one by one.**

Only utilize the required/default fields unless the user specifically requests that optional fields be added.

## COMPLETE METRIC YAML SCHEMA SPECIFICATION

\`\`\`
# METRIC CONFIGURATION - YML STRUCTURE
# -------------------------------------
# REQUIRED Top-Level Fields: \`name\`, \`description\`, \`timeFrame\`, \`sql\`, \`chartConfig\`
#
# --- FIELD DETAILS & RULES --- 
# \`name\`: Human-readable title (e.g., Total Sales). 
#   - RULE: CANNOT contain underscores (\`_\`). Use spaces instead.   
# \`description\`: Detailed explanation of the metric. 
# \`timeFrame\`: Human-readable time period covered by the query, similar to a filter in a BI tool. MUST BE A VALID STRING. 
#   - If doing 2024 as an example, you must do "2024" can't parse as a number.
#   - For queries with fixed date filters, use specific date ranges, e.g., "January 1, 2020 - December 31, 2020", "2024", "Q2 2024", "June 1, 2025".
#   - For queries with relative date filters or no date filter, use relative terms, e.g., "Today", "Yesterday", "Last 7 days", "Last 30 days", "Last Quarter", "Last 12 Months", "Year to Date", "All time", etc.
#   - For comparisons, use "Comparison - [Period 1] vs [Period 2]", with each period formatted according to whether it is fixed or relative, e.g., "Comparison - Last 30 days vs Previous 30 days" or "Comparison - June 1, 2025 - June 30, 2025 vs July 1, 2025 - July 31, 2025".
#   Rules:
#     - Must accurately reflect the date/time filter used in the \`sql\` field. Do not misrepresent the time range.
#     - Use full month names for dates, e.g., "January", not "Jan".
#     - Follow general quoting rules. CANNOT contain ':'.
#   Note: Respond only with the time period, without explanation or additional copy.
# \`sql\`: The SQL query for the metric.
#   - RULE: MUST use the pipe \`|\` block scalar style to preserve formatting and newlines.
#   - NOTE: Remember to use fully qualified names: DATABASE_NAME.SCHEMA_NAME.TABLE_NAME for tables and table_alias.column for columns. This applies to all table and column references, including those within Common Table Expressions (CTEs) and when selecting from CTEs.
#   - Example:
#     sql: |
#       SELECT product_name, SUM(sales) as total_sales 
#       FROM sales_data 
#       GROUP BY product_name
#     NOT: sql: "SELECT product_name, SUM(sales) FROM sales_data"
# 
# \`chartConfig\`: Chart visualization settings (object)
#   Required:
#     - \`chartType\`: (string) One of: bar, pie, line, area, number, table, scatter, heatmap, combo, stacked_bar, grouped_bar, donut, horizontal_bar
#   For bar, line, area, scatter, combo, stacked_bar, grouped_bar, horizontal_bar:
#     - \`xAxis\`: (string) Column name for x-axis
#     - \`yAxis\`: (string) Column name for y-axis  
#   For pie/donut:
#     - \`dimension\`: (string) Column for pie slices
#     - \`measure\`: (string) Column for values
#   For number:
#     - \`value\`: (string) Column to display as big number
#   For table:
#     - \`columns\`: (array) List of columns to display
#   For heatmap:
#     - \`xAxis\`: (string) Column name for x-axis
#     - \`yAxis\`: (string) Column name for y-axis
#     - \`value\`: (string) Column for heat values
#   For combo (multi-axis charts):
#     - \`xAxis\`: (string) Column name for x-axis
#     - \`y1Axis\`: (object) Primary y-axis config
#       - \`columns\`: (array) Column names
#       - \`chartType\`: (string) bar, line, area
#     - \`y2Axis\`: (object) Secondary y-axis config  
#       - \`columns\`: (array) Column names
#       - \`chartType\`: (string) bar, line, area
#
# OPTIONAL fields:
# \`caching\`: (object) Query caching configuration
#   - \`enabled\`: (boolean) Enable/disable caching (default: true)
#   - \`ttl\`: (number) Time-to-live in seconds (default: 3600)
#
# \`parameters\`: (array) Dynamic query parameters
#   Each parameter:
#     - \`name\`: (string) Parameter name (used in SQL as {{param_name}})
#     - \`type\`: (string) One of: string, number, date, boolean
#     - \`defaultValue\`: (any) Default value
#     - \`required\`: (boolean) Is parameter required?
#     - \`description\`: (string) Parameter description
#
# \`filters\`: (array) UI filter configuration
#   Each filter:
#     - \`column\`: (string) Column to filter
#     - \`type\`: (string) One of: select, multiselect, range, date_range, search
#     - \`defaultValue\`: (any) Default filter value
#     - \`options\`: (array) For select/multiselect - available options
#
# \`formatting\`: (object) Data formatting rules
#   - \`numberFormat\`: (string) e.g., "0,0.00", "$0,0"
#   - \`dateFormat\`: (string) e.g., "YYYY-MM-DD", "MM/DD/YYYY"
#   - \`percentFormat\`: (string) e.g., "0.0%"
#   - \`currencySymbol\`: (string) e.g., "$", "€", "£"
#
# \`thresholds\`: (array) Alert/conditional formatting thresholds
#   Each threshold:
#     - \`column\`: (string) Column to evaluate
#     - \`operator\`: (string) One of: >, <, >=, <=, ==, !=
#     - \`value\`: (number) Threshold value
#     - \`color\`: (string) Hex color when condition met
#     - \`label\`: (string) Description of threshold
#
# \`drillDown\`: (object) Drill-down configuration
#   - \`enabled\`: (boolean) Enable drill-down
#   - \`dimensions\`: (array) Hierarchical dimensions for drilling
#   - \`targetMetric\`: (string) ID of detailed metric to load
#
# \`export\`: (object) Export options
#   - \`enabled\`: (boolean) Allow exports (default: true)
#   - \`formats\`: (array) Available formats: csv, excel, pdf, png
#
# \`schedule\`: (object) Refresh schedule
#   - \`frequency\`: (string) One of: hourly, daily, weekly, monthly
#   - \`time\`: (string) Time in HH:MM format (24-hour)
#   - \`timezone\`: (string) IANA timezone (e.g., "America/New_York")
#   - \`recipients\`: (array) Email addresses for scheduled reports
#
# \`visualization\`: (object) Advanced visualization options
#   - \`colorScheme\`: (string) Color palette name or custom colors array
#   - \`showLegend\`: (boolean) Display legend
#   - \`legendPosition\`: (string) One of: top, bottom, left, right
#   - \`showDataLabels\`: (boolean) Show values on chart
#   - \`animation\`: (boolean) Enable animations
#   - \`stacked\`: (boolean) For bar/area charts
#   - \`smooth\`: (boolean) For line charts - smooth curves
#   - \`showGrid\`: (boolean) Show grid lines
#   - \`showTooltips\`: (boolean) Show hover tooltips
#
# \`metadata\`: (object) Additional metadata
#   - \`owner\`: (string) Metric owner/creator
#   - \`department\`: (string) Owning department
#   - \`tags\`: (array) Searchable tags
#   - \`version\`: (string) Metric version
#   - \`lastModified\`: (string) ISO 8601 date
#   - \`relatedMetrics\`: (array) IDs of related metrics
#
# \`aggregation\`: (object) Data aggregation rules
#   - \`defaultGranularity\`: (string) One of: minute, hour, day, week, month, quarter, year
#   - \`allowedGranularities\`: (array) Available granularity options
#   - \`defaultAggregation\`: (string) One of: sum, avg, min, max, count, distinct
#
# \`permissions\`: (object) Access control
#   - \`public\`: (boolean) Publicly accessible
#   - \`groups\`: (array) Group IDs with access
#   - \`users\`: (array) User IDs with access
#   - \`editGroups\`: (array) Groups that can edit
#   - \`editUsers\`: (array) Users that can edit
#
# \`dataSource\`: (object) Data source override (rarely used)
#   - \`connectionId\`: (string) Specific connection to use
#   - \`database\`: (string) Override database
#   - \`schema\`: (string) Override schema
#
# \`performance\`: (object) Performance optimization
#   - \`maxRows\`: (number) Maximum rows to return
#   - \`timeout\`: (number) Query timeout in seconds
#   - \`sampleData\`: (boolean) Use sampled data for preview
#   - \`cacheStrategy\`: (string) One of: aggressive, normal, minimal
#
# \`alerts\`: (array) Alert configuration
#   Each alert:
#     - \`name\`: (string) Alert name
#     - \`condition\`: (string) SQL condition or threshold
#     - \`frequency\`: (string) Check frequency
#     - \`recipients\`: (array) Email/webhook endpoints
#     - \`message\`: (string) Alert message template
#
# \`annotations\`: (array) Chart annotations
#   Each annotation:
#     - \`type\`: (string) One of: line, range, point, text
#     - \`axis\`: (string) x or y
#     - \`value\`: (any) Position value
#     - \`label\`: (string) Annotation label
#     - \`color\`: (string) Annotation color
#
# \`calculations\`: (array) Calculated fields
#   Each calculation:
#     - \`name\`: (string) New field name
#     - \`formula\`: (string) SQL expression
#     - \`dataType\`: (string) Result data type
#     - \`format\`: (string) Display format
#
# \`mobile\`: (object) Mobile-specific settings
#   - \`enabled\`: (boolean) Enable mobile view
#   - \`chartType\`: (string) Override chart type for mobile
#   - \`simplified\`: (boolean) Use simplified view
#
# \`interactivity\`: (object) User interaction settings
#   - \`clickable\`: (boolean) Enable click events
#   - \`hoverable\`: (boolean) Enable hover effects
#   - \`zoomable\`: (boolean) Enable zoom
#   - \`pannable\`: (boolean) Enable pan
#   - \`selectable\`: (boolean) Enable data selection
#
# --- EXAMPLES ---
#
# Basic Bar Chart:
# \`\`\`yaml
# name: Monthly Sales by Product
# description: Total sales amount by product for the current month
# timeFrame: Current Month
# sql: |
#   SELECT 
#     p.product_name,
#     SUM(s.amount) as total_sales
#   FROM mydb.sales.sales_transactions s
#   JOIN mydb.sales.products p ON s.product_id = p.product_id
#   WHERE DATE_TRUNC('month', s.sale_date) = DATE_TRUNC('month', CURRENT_DATE)
#   GROUP BY p.product_name
#   ORDER BY total_sales DESC
# chartConfig:
#   chartType: bar
#   xAxis: product_name
#   yAxis: total_sales
# \`\`\`
#
# Time Series Line Chart:
# \`\`\`yaml
# name: Daily Revenue Trend
# description: Revenue trend over the last 30 days
# timeFrame: Last 30 Days
# sql: |
#   SELECT 
#     DATE_TRUNC('day', order_date) as date,
#     SUM(total_amount) as daily_revenue
#   FROM mydb.sales.orders
#   WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
#   GROUP BY date
#   ORDER BY date
# chartConfig:
#   chartType: line
#   xAxis: date
#   yAxis: daily_revenue
# visualization:
#   smooth: true
#   showDataLabels: false
# formatting:
#   numberFormat: "$0,0"
#   dateFormat: "MMM DD"
# \`\`\`
#
# KPI Number Card:
# \`\`\`yaml
# name: Total Active Users
# description: Count of active users in the last 7 days
# timeFrame: Last 7 Days
# sql: |
#   SELECT COUNT(DISTINCT user_id) as active_users
#   FROM mydb.analytics.user_activity
#   WHERE last_activity >= CURRENT_DATE - INTERVAL '7 days'
# chartConfig:
#   chartType: number
#   value: active_users
# formatting:
#   numberFormat: "0,0"
# thresholds:
#   - column: active_users
#     operator: "<"
#     value: 1000
#     color: "#ff0000"
#     label: "Low activity"
# \`\`\`
#
# Pie Chart with Drill-Down:
# \`\`\`yaml
# name: Revenue by Category
# description: Revenue distribution across product categories
# timeFrame: Year to Date
# sql: |
#   SELECT 
#     c.category_name,
#     SUM(s.amount) as revenue
#   FROM mydb.sales.sales s
#   JOIN mydb.sales.products p ON s.product_id = p.product_id
#   JOIN mydb.sales.categories c ON p.category_id = c.category_id
#   WHERE s.sale_date >= DATE_TRUNC('year', CURRENT_DATE)
#   GROUP BY c.category_name
# chartConfig:
#   chartType: pie
#   dimension: category_name
#   measure: revenue
# drillDown:
#   enabled: true
#   dimensions: [category_name, product_name]
#   targetMetric: "revenue-by-product-detail"
# \`\`\`
#
# Combo Chart (Bar + Line):
# \`\`\`yaml
# name: Sales and Profit Margin
# description: Monthly sales with profit margin trend
# timeFrame: Last 12 Months
# sql: |
#   SELECT 
#     DATE_TRUNC('month', sale_date) as month,
#     SUM(revenue) as total_revenue,
#     SUM(profit) as total_profit,
#     (SUM(profit) / NULLIF(SUM(revenue), 0)) * 100 as profit_margin
#   FROM mydb.finance.sales_summary
#   WHERE sale_date >= CURRENT_DATE - INTERVAL '12 months'
#   GROUP BY month
#   ORDER BY month
# chartConfig:
#   chartType: combo
#   xAxis: month
#   y1Axis:
#     columns: [total_revenue, total_profit]
#     chartType: bar
#   y2Axis:
#     columns: [profit_margin]
#     chartType: line
# formatting:
#   numberFormat: "$0,0"
#   percentFormat: "0.1%"
# \`\`\`
#
# Table with Formatting:
# \`\`\`yaml
# name: Top Customers
# description: Top 10 customers by purchase amount
# timeFrame: Current Quarter
# sql: |
#   SELECT 
#     c.customer_name,
#     c.customer_segment,
#     COUNT(o.order_id) as order_count,
#     SUM(o.total_amount) as total_spent,
#     AVG(o.total_amount) as avg_order_value
#   FROM mydb.sales.customers c
#   JOIN mydb.sales.orders o ON c.customer_id = o.customer_id
#   WHERE o.order_date >= DATE_TRUNC('quarter', CURRENT_DATE)
#   GROUP BY c.customer_name, c.customer_segment
#   ORDER BY total_spent DESC
#   LIMIT 10
# chartConfig:
#   chartType: table
#   columns: [customer_name, customer_segment, order_count, total_spent, avg_order_value]
# formatting:
#   numberFormat: "$0,0.00"
# thresholds:
#   - column: total_spent
#     operator: ">="
#     value: 10000
#     color: "#00ff00"
#     label: "VIP Customer"
# \`\`\`
#
# Heatmap Example:
# \`\`\`yaml
# name: Sales Heatmap by Day and Hour
# description: Sales patterns by day of week and hour
# timeFrame: Last 4 Weeks
# sql: |
#   SELECT 
#     TO_CHAR(sale_timestamp, 'Day') as day_of_week,
#     EXTRACT(hour FROM sale_timestamp) as hour_of_day,
#     COUNT(*) as transaction_count
#   FROM mydb.sales.transactions
#   WHERE sale_timestamp >= CURRENT_DATE - INTERVAL '4 weeks'
#   GROUP BY day_of_week, hour_of_day
# chartConfig:
#   chartType: heatmap
#   xAxis: hour_of_day
#   yAxis: day_of_week
#   value: transaction_count
# visualization:
#   colorScheme: "Blues"
# \`\`\`
#
# Parameterized Query:
# \`\`\`yaml
# name: Product Performance
# description: Performance metrics for selected product
# timeFrame: Custom Range
# sql: |
#   SELECT 
#     DATE_TRUNC('day', sale_date) as date,
#     COUNT(*) as units_sold,
#     SUM(amount) as revenue
#   FROM mydb.sales.sales
#   WHERE product_id = {{product_id}}
#     AND sale_date BETWEEN {{start_date}} AND {{end_date}}
#   GROUP BY date
#   ORDER BY date
# parameters:
#   - name: product_id
#     type: string
#     required: true
#     description: Product ID to analyze
#   - name: start_date
#     type: date
#     required: true
#     defaultValue: "2024-01-01"
#   - name: end_date
#     type: date
#     required: true
#     defaultValue: "2024-12-31"
# chartConfig:
#   chartType: line
#   xAxis: date
#   yAxis: revenue
# \`\`\`
#
# --- COMMON PATTERNS & BEST PRACTICES ---
#
# 1. Time-based Metrics:
#    - Always use DATE_TRUNC for consistent grouping
#    - Include ORDER BY for chronological display
#    - Use appropriate time intervals (day, week, month, quarter, year)
#
# 2. Percentage Calculations:
#    - Use NULLIF to avoid division by zero
#    - Multiply by 100 for percentage display
#    - Format with percentFormat in formatting section
#
# 3. Rankings and Top-N:
#    - Use window functions (RANK, ROW_NUMBER) for rankings
#    - Apply LIMIT for top-N queries
#    - Include ORDER BY for meaningful rankings
#
# 4. Comparisons:
#    - Use CASE statements for period comparisons
#    - Calculate period-over-period changes
#    - Include both absolute and percentage changes
#
# 5. Aggregations:
#    - Choose appropriate aggregation functions (SUM, AVG, COUNT, etc.)
#    - Consider DISTINCT for unique counts
#    - Use HAVING for filtering aggregated results
#
# --- SCHEMA VALIDATION RULES ---
#
# 1. Required fields MUST be present
# 2. chartConfig.chartType must match the data structure
# 3. Referenced columns in chartConfig must exist in SQL results
# 4. SQL must be valid for the target database
# 5. timeFrame should accurately describe the query filter
# 6. Formatting rules must match data types
# 7. Parameter names must match {{placeholders}} in SQL
# 8. Threshold columns must exist in query results
#
# --- ERROR PREVENTION ---
#
# Common mistakes to avoid:
# - Missing pipe (|) for SQL multiline strings
# - Underscores in metric names
# - Mismatched column names between SQL and chartConfig
# - Invalid chartType for data structure
# - Missing required fields in chartConfig
# - Incorrect date/time formatting
# - Division by zero in calculations
# - Missing GROUP BY for aggregations
# - Incorrect parameter syntax (use {{param}} not :param or @param)
#
# --- ADVANCED FEATURES ---
#
# Dynamic Filters Example:
# \`\`\`yaml
# filters:
#   - column: product_category
#     type: multiselect
#     options: ["Electronics", "Clothing", "Food", "Books"]
#     defaultValue: ["Electronics", "Clothing"]
#   - column: date_range
#     type: date_range
#     defaultValue: 
#       start: "2024-01-01"
#       end: "2024-12-31"
# \`\`\`
#
# Scheduled Reports Example:
# \`\`\`yaml
# schedule:
#   frequency: daily
#   time: "08:00"
#   timezone: "America/New_York"
#   recipients: ["manager@company.com", "team@company.com"]
# \`\`\`
#
# Alert Configuration Example:
# \`\`\`yaml
# alerts:
#   - name: Low Sales Alert
#     condition: "daily_revenue < 1000"
#     frequency: hourly
#     recipients: ["alerts@company.com"]
#     message: "Daily revenue has dropped below $1000"
# \`\`\`
#
# Calculation Fields Example:
# \`\`\`yaml
# calculations:
#   - name: profit_margin_pct
#     formula: "(profit / NULLIF(revenue, 0)) * 100"
#     dataType: decimal
#     format: "0.2%"
#   - name: running_total
#     formula: "SUM(amount) OVER (ORDER BY date)"
#     dataType: decimal
#     format: "$0,0"
# \`\`\`
\`\`\`

Remember to follow all the rules and guidelines specified above when modifying metrics.`;

  return tool({
    description,
    inputSchema: ModifyMetricsInputSchema,
    outputSchema: ModifyMetricsOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
