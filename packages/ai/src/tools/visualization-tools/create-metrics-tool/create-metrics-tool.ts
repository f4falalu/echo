import { tool } from 'ai';
import { z } from 'zod';
import { createCreateMetricsDelta } from './create-metrics-delta';
import { createCreateMetricsExecute } from './create-metrics-execute';
import { createCreateMetricsFinish } from './create-metrics-finish';
import { createCreateMetricsStart } from './create-metrics-start';

const CreateMetricsInputSchema = z.object({
  files: z
    .array(
      z.object({
        name: z
          .string()
          .describe(
            "The natural language name/title for the metric, exactly matching the 'name' field within the YML content. This name will identify the metric in the UI. Do not include file extensions or use file path characters."
          ),
        yml_content: z
          .string()
          .describe(
            "The YAML content for a single metric, adhering to the comprehensive metric schema. Multiple metrics can be created in one call by providing multiple entries in the 'files' array. **Prefer creating metrics in bulk.**"
          ),
      })
    )
    .min(1)
    .describe(
      'List of file parameters to create. The files will contain YAML content that adheres to the metric schema specification.'
    ),
});

const CreateMetricsOutputSchema = z.object({
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
      name: z.string(),
      error: z.string(),
    })
  ),
});

const CreateMetricsContextSchema = z.object({
  userId: z.string().describe('The user ID'),
  chatId: z.string().describe('The chat ID'),
  dataSourceId: z.string().describe('The data source ID'),
  dataSourceSyntax: z.string().describe('The data source syntax'),
  organizationId: z.string().describe('The organization ID'),
  messageId: z.string().optional().describe('The message ID'),
});

const CreateMetricsFileSchema = z.object({
  name: z.string(),
  yml_content: z.string(),
  status: z.enum(['processing', 'completed', 'failed']).optional(),
  id: z.string().optional(),
  version: z.number().optional(),
  error: z.string().optional(),
});

const CreateMetricsStateSchema = z.object({
  toolCallId: z.string().optional(),
  argsText: z.string().optional(),
  parsedArgs: CreateMetricsInputSchema.optional(),
  files: z.array(CreateMetricsFileSchema).optional(),
});

export type CreateMetricsInput = z.infer<typeof CreateMetricsInputSchema>;
export type CreateMetricsOutput = z.infer<typeof CreateMetricsOutputSchema>;
export type CreateMetricsContext = z.infer<typeof CreateMetricsContextSchema>;
export type CreateMetricsFile = z.infer<typeof CreateMetricsFileSchema>;
export type CreateMetricsState = z.infer<typeof CreateMetricsStateSchema>;

export function createCreateMetricsTool(context: CreateMetricsContext) {
  // Initialize state for streaming
  const state: CreateMetricsState = {
    argsText: undefined,
    files: undefined,
    parsedArgs: undefined,
    toolCallId: undefined,
  };

  // Create all functions with the context and state passed
  const execute = createCreateMetricsExecute(context, state);
  const onInputStart = createCreateMetricsStart(context, state);
  const onInputDelta = createCreateMetricsDelta(context, state);
  const onInputAvailable = createCreateMetricsFinish(context, state);

  // Get the description from the original tool
  const description = `**Create one or more metrics in Buster.** This tool generates new metrics files and automatically executes their SQL queries to verify validity and provide data previews.

**Instructions:**
1. **ALWAYS prefer bulk creation:** When creating multiple metrics, include them all in a single tool call instead of multiple calls. This improves performance and user experience.
2. **Follow the comprehensive schema specification below:** The metric schema is complex with many required fields and specific enum values. Reference the schema carefully.
3. **Validate column references:** Ensure all column names in axes and label formats match exactly what the SQL query returns (case-sensitive).
4. **Handle chart types properly:** Each chart type has specific required properties that must be included.

**Comprehensive Metric Schema Specification:**

\`\`\`yaml
name: "Metric Name"           # Required, user-friendly display name
type: metric                   # Required, must be 'metric'
sql: |                        # Required, the SQL query (use pipe for multiline)
  SELECT column1, column2
  FROM table
selectedChartType: bar        # Required, one of: bar, horizontalBar, line, scatterPlot, barAndLine, table, bigNumber, donut, stackedBar, horizontalStackedBar, areaChart
data:                         # Required for all chart types
  xAxis: column1              # Required for most charts (lowercase column name)
  yAxis: [column2]            # Required for most charts (array of lowercase column names)
  
  # Chart-specific configurations:
  
  # For bar/horizontalBar/line/areaChart:
  style: grouped              # For bar: grouped or stacked
  
  # For barAndLine:
  barAndLineAxis:
    bars: [column1, column2]  # Required (lowercase column names)
    lines: [column3]          # Required (lowercase column names)
  
  # For scatterPlot:
  scatterAxis:
    xAxis: column1            # Required (lowercase)
    yAxis: column2            # Required (lowercase)
    sizeBy: column3           # Optional (lowercase)
    colorBy: column4          # Optional (lowercase)
    
  # For table:
  tableColumns:               # Required for table type
    - id: column1
      label: "Display Name"
      columnType: text        # One of: text, number, link, date, percentage, boolean, currency, duration
    - id: column2
      label: "Another Column"
      columnType: number
      
  # For bigNumber:
  bigNumberColumn: column1    # Required for bigNumber (lowercase)
  bigNumberLabel: "Label"     # Required for bigNumber
  trendColumn: column2        # Optional (lowercase)
  
  # For donut:
  donutLabel: column1         # Required for donut (lowercase)
  donutValue: column2         # Required for donut (lowercase)
  
  # Common optional properties:
  xAxisLabel: "X Label"       # Optional custom x-axis label
  yAxisLabel: "Y Label"       # Optional custom y-axis label
  xAxisTimeInterval: day      # Optional: year, quarter, month, week, day, hour, minute
  xAxisDateFormat: "%b %d"    # Optional date format string
  sortBy: column1             # Optional (lowercase)
  sortOrder: asc              # Optional: asc or desc
  goalLines:                  # Optional
    - value: 100
      label: "Target"
  annotations:                # Optional
    - xValue: "2024-01-01"
      label: "Launch Date"
  columnLabelFormats:         # Required - format for EVERY column in SQL results
    column1:
      type: text
      style: titlecase        # For text: titlecase, uppercase, lowercase, sentencecase
    column2:
      type: number
      decimalPlaces: 2        # For number: 0-10
    column3:
      type: date
      dateFormat: "%Y-%m-%d"  # For date: strftime format
    column4:
      type: percentage
      decimalPlaces: 1        # For percentage: 0-10
    column5:
      type: currency
      currency: USD           # For currency: ISO code
      decimalPlaces: 2
    column6:
      type: duration
      durationFormat: "h:mm:ss"
    column7:
      type: boolean
      trueLabel: "Yes"        # For boolean
      falseLabel: "No"
    column8:
      type: link
      linkType: external      # For link: external or internal
  dataLabelConfig:           # Optional
    showDataLabels: true
    labelPosition: outside   # inside, outside, center
    labelFormat: "{value}"
  tooltipConfig:             # Optional
    showTooltip: true
    tooltipFormat: "{name}: {value}"
  legendConfig:              # Optional
    showLegend: true
    legendPosition: bottom   # top, bottom, left, right
    legendOrientation: horizontal # horizontal, vertical
  advancedSettings:          # Optional
    smoothLine: true         # For line charts
    showArea: false          # For area charts
    stackPercentage: false   # For stacked charts
    showGrid: true
    gridColor: "#e0e0e0"
  conditionalFormatting:     # Optional
    - column: column1
      condition: ">"
      value: 100
      color: "#ff0000"
  dataSampling:              # Optional
    enabled: false
    sampleSize: 1000
    method: random           # random, first, last
  exportSettings:            # Optional
    allowExport: true
    formats: [csv, excel, pdf]
tags: ["tag1", "tag2"]      # Optional array of tags
userProperties:              # Optional custom properties
  department: "Sales"
  owner: "John Doe"
codeExplanation: |           # Optional explanation
  This metric shows...
refreshSchedule:             # Optional
  frequency: daily           # hourly, daily, weekly, monthly
  time: "08:00"
  timezone: "UTC"
cacheSettings:               # Optional
  enableCache: true
  ttl: 3600
alertRules:                  # Optional
  - condition: "value > threshold"
    threshold: 100
    action: email
    recipients: ["user@example.com"]
accessControl:               # Optional
  visibility: organization   # private, team, organization, public
  allowedUsers: []
  allowedTeams: []
  permissions:
    view: true
    edit: false
    delete: false
dependencies:                # Optional
  metrics: []
  dashboards: []
transformations:             # Optional
  - type: aggregate
    column: column1
    function: sum            # sum, avg, count, min, max
  - type: calculated
    name: new_column
    formula: "column1 + column2"
  - type: filter
    column: column1
    operator: ">"
    value: 0
  - type: pivot
    rowColumns: [column1]
    columnColumns: [column2]
    valueColumn: column3
    aggregation: sum
dataQuality:                 # Optional
  validationRules:
    - column: column1
      rule: not_null
    - column: column2
      rule: positive
  nullHandling: exclude      # exclude, zero, average
  outlierDetection:
    method: zscore           # zscore, iqr
    threshold: 3
visualization:               # Optional
  theme: light               # light, dark, custom
  colorPalette: ["#1f77b4", "#ff7f0e"]
  fontFamily: "Arial"
  animations: true
  interactivity:
    zoom: true
    pan: true
    hover: true
performance:                 # Optional
  queryTimeout: 30
  maxRows: 10000
  indexHints: []
metadata:                    # Optional
  version: "1.0.0"
  createdBy: "user@example.com"
  createdAt: "2024-01-01T00:00:00Z"
  lastModifiedBy: "user@example.com"
  lastModifiedAt: "2024-01-01T00:00:00Z"
  description: "Detailed description"
  businessContext: "Business justification"
  dataSource: "warehouse.schema.table"
  updateFrequency: "Daily at 8 AM"
testing:                     # Optional
  testQueries:
    - name: "Test 1"
      sql: "SELECT COUNT(*) FROM table"
      expectedResult: "> 0"
  mockData:
    - column1: "value1"
      column2: 100
documentation:               # Optional
  readme: |
    ## Metric Documentation
    This metric tracks...
  changelog:
    - date: "2024-01-01"
      changes: "Initial version"
  examples:
    - name: "Example 1"
      description: "Shows how to..."
      code: |
        SELECT * FROM table
integrations:                # Optional
  slack:
    enabled: true
    channel: "#metrics"
    notifications: ["alert", "refresh"]
  email:
    enabled: false
    recipients: []
  webhook:
    url: "https://example.com/webhook"
    events: ["create", "update"]
customFields:                # Optional - any additional fields
  field1: "value1"
  field2: 123
auditLog:                    # Optional
  enabled: true
  retention: 90              # days
  fields: ["user", "action", "timestamp"]

# Additional properties for barAndLine specifically:
barAndLineAxis:              # Required for barAndLine chart type
  bars: [revenue, profit]    # Array of column names for bar series
  lines: [growth_rate]       # Array of column names for line series

# Additional properties for scatterPlot specifically:  
scatterAxis:                 # Required for scatterPlot chart type
  xAxis: column1
  yAxis: column2
  sizeBy: column3            # Optional
  colorBy: column4           # Optional

# Additional properties for table specifically:
tableColumns:                # Required for table chart type
  - id: column1
    label: "Column 1"
    columnType: text
  - id: column2  
    label: "Column 2"
    columnType: number
    align: right             # Optional: left, center, right
    width: 100               # Optional: pixel width
    sortable: true           # Optional: enable sorting
    filterable: true         # Optional: enable filtering
    cellRenderer: default    # Optional: default, custom
    headerStyle:             # Optional
      fontWeight: bold
      backgroundColor: "#f0f0f0"
    cellStyle:               # Optional
      fontSize: 14
      color: "#333"

# Example for columnLabelFormats - comprehensive type formatting:
columnLabelFormats:
  text_column:
    type: text
    style: titlecase         # titlecase, uppercase, lowercase, sentencecase
  number_column:
    type: number
    decimalPlaces: 2         # 0-10
    thousandsSeparator: true
    negativeFormat: "()"     # (), -, red
  date_column:
    type: date
    dateFormat: "%Y-%m-%d"   # strftime format
  percentage_column:
    type: percentage
    decimalPlaces: 1
    multiplyBy100: false     # If data is already in percentage
  currency_column:
    type: currency
    currency: USD            # ISO currency code
    decimalPlaces: 2
    currencyDisplay: symbol  # symbol, code, name
  duration_column:
    type: duration
    durationFormat: "h:mm:ss"
    showDays: false
  boolean_column:
    type: boolean
    trueLabel: "Active"
    falseLabel: "Inactive"
    trueColor: "#00ff00"
    falseColor: "#ff0000"
  link_column:
    type: link
    linkType: external       # external, internal
    linkTarget: "_blank"     # _blank, _self
    linkTemplate: "https://example.com/{value}"
  custom_column:
    type: custom
    formatter: |
      function(value) {
        return value.toUpperCase();
      }

# Table-specific columnType values:
tableColumns:
  - id: text_col
    columnType: text
  - id: number_col
    columnType: number
  - id: link_col
    columnType: link
  - id: date_col
    columnType: date
  - id: percentage_col
    columnType: percentage
  - id: boolean_col
    columnType: boolean
  - id: currency_col
    columnType: currency
  - id: duration_col
    columnType: duration
  - id: status_col
    columnType: status       # Special type for status indicators
    statusConfig:
      success: ["completed", "active"]
      warning: ["pending", "processing"]
      error: ["failed", "error"]
  - id: progress_col
    columnType: progress     # Special type for progress bars
    progressConfig:
      min: 0
      max: 100
      showLabel: true
  - id: rating_col
    columnType: rating       # Special type for star ratings
    ratingConfig:
      max: 5
      allowHalf: true
  - id: tag_col
    columnType: tags         # Special type for tag lists
    tagConfig:
      colorScheme: "blue"
  - id: avatar_col
    columnType: avatar       # Special type for user avatars
    avatarConfig:
      size: "small"
      shape: "circle"
  - id: action_col
    columnType: actions      # Special type for action buttons
    actionConfig:
      actions:
        - label: "Edit"
          action: "edit"
        - label: "Delete"
          action: "delete"

# Extended barAndLine configuration:
barAndLineAxis:
  bars: [revenue, costs, profit]
  lines: [margin_percentage, growth_rate]
  barAxis: left              # Optional: which y-axis for bars (left, right)
  lineAxis: right            # Optional: which y-axis for lines (left, right)
  barType: grouped           # Optional: grouped, stacked
  lineType: solid            # Optional: solid, dashed, dotted
  showPoints: true           # Optional: show data points on lines
  pointSize: 4               # Optional: size of data points
  lineWidth: 2               # Optional: width of lines
  barWidth: 0.8              # Optional: relative width of bars (0-1)
  barGap: 0.1                # Optional: gap between bars (0-1)
  
# Extended scatterPlot configuration:
scatterAxis:
  xAxis: revenue
  yAxis: profit
  sizeBy: employee_count     # Optional: column for bubble size
  colorBy: region            # Optional: column for color coding
  labelBy: company_name      # Optional: column for point labels
  trendLine: linear          # Optional: linear, polynomial, exponential
  showRegression: true       # Optional: show regression statistics
  pointShape: circle         # Optional: circle, square, triangle, diamond
  pointOpacity: 0.7          # Optional: 0-1
  enableClustering: false    # Optional: automatic clustering
  clusterCount: 5            # Optional: number of clusters
  
# Format specification for SQL result columns:
columnLabelFormats:
  revenue:
    type: currency
    currency: USD
    decimalPlaces: 0
  profit:
    type: currency
    currency: USD  
    decimalPlaces: 0
  margin_percentage:
    type: percentage
    decimalPlaces: 1
  growth_rate:
    type: percentage
    decimalPlaces: 2
  employee_count:
    type: number
    thousandsSeparator: true
  region:
    type: text
    style: titlecase
  company_name:
    type: text
  created_date:
    type: date
    dateFormat: "%b %d, %Y"
  is_active:
    type: boolean
    trueLabel: "Active"
    falseLabel: "Inactive"
  duration_hours:
    type: duration
    durationFormat: "h:mm"
  website_url:
    type: link
    linkType: external
  completion_rate:
    type: percentage
    decimalPlaces: 0
    suffix: " complete"
  temperature:
    type: number
    decimalPlaces: 1
    suffix: "°C"
  status_code:
    type: text
    colorMap:
      "200": "#00ff00"
      "404": "#ffff00"
      "500": "#ff0000"
  score:
    type: number
    min: 0
    max: 100
    colorScale: true        # Optional: color based on value
  tags_list:
    type: text
    isArray: true           # Optional: handle array values
    arraySeparator: ", "
  json_data:
    type: json              # Optional: format JSON data
    indent: 2
  markdown_content:
    type: markdown          # Optional: render markdown
  html_content:
    type: html              # Optional: render HTML (sanitized)
  code_snippet:
    type: code              # Optional: syntax highlighted code
    language: sql
  image_url:
    type: image             # Optional: display as image
    maxWidth: 200
    maxHeight: 200
  file_size:
    type: filesize          # Optional: format file sizes
    binary: true            # true for KiB, false for KB
  email_address:
    type: email             # Optional: mailto links
  phone_number:
    type: phone             # Optional: tel links
    format: "international"
  ip_address:
    type: ip                # Optional: IP address formatting
  uuid_field:
    type: uuid              # Optional: UUID formatting
    format: "short"         # short, full
  color_value:
    type: color             # Optional: color swatches
  coordinate:
    type: coordinate        # Optional: lat/long formatting
    format: "decimal"       # decimal, dms
  version_number:
    type: version           # Optional: semantic versioning
  hash_value:
    type: hash              # Optional: hash/checksum formatting
    algorithm: "sha256"
  base64_data:
    type: base64            # Optional: base64 decoding
    decode: true
  enum_value:
    type: enum              # Optional: enum mapping
    enumMap:
      1: "Low"
      2: "Medium"  
      3: "High"
  formula_result:
    type: formula           # Optional: math formula rendering
    latex: true
  sparkline_data:
    type: sparkline         # Optional: inline sparkline chart
    sparklineType: line    # line, bar, area
  qr_code_data:
    type: qrcode            # Optional: QR code generation
  barcode_data:
    type: barcode           # Optional: barcode generation
    barcodeType: "code128"
  social_handle:
    type: social            # Optional: social media links
    platform: twitter       # twitter, linkedin, github, etc.

# Full enum specifications:
selectedChartType enum values:
  - bar                     # Vertical bar chart
  - horizontalBar           # Horizontal bar chart
  - line                    # Line chart
  - scatterPlot            # Scatter/bubble plot
  - barAndLine             # Combined bar and line
  - table                  # Data table
  - bigNumber              # Single KPI display
  - donut                  # Donut/pie chart
  - stackedBar             # Vertical stacked bar
  - horizontalStackedBar   # Horizontal stacked bar
  - areaChart              # Area chart
  - heatmap                # Heat map (future)
  - treemap                # Treemap (future)
  - funnel                 # Funnel chart (future)
  - waterfall              # Waterfall chart (future)
  - boxPlot                # Box plot (future)
  - radar                  # Radar chart (future)
  - sankey                 # Sankey diagram (future)
  - gantt                  # Gantt chart (future)
  - candlestick           # Candlestick chart (future)
  - gauge                  # Gauge chart (future)
  - map                    # Geographic map (future)
  - network                # Network graph (future)
  - sunburst               # Sunburst chart (future)
  - timeline               # Timeline chart (future)
  - word                   # Word cloud (future)

style enum values (for bar charts):
  - grouped                # Side-by-side bars
  - stacked                # Stacked bars

xAxisTimeInterval enum values:
  - year
  - quarter
  - month
  - week  
  - day
  - hour
  - minute
  - second
  - millisecond

sortOrder enum values:
  - asc                    # Ascending
  - desc                   # Descending

columnType enum values (for tables):
  - text
  - number
  - link
  - date
  - percentage
  - boolean
  - currency
  - duration
  - status
  - progress
  - rating
  - tags
  - avatar
  - actions
  - json
  - markdown
  - html
  - code
  - image
  - filesize
  - email
  - phone
  - ip
  - uuid
  - color
  - coordinate
  - version
  - hash
  - base64
  - enum
  - formula
  - sparkline
  - qrcode
  - barcode
  - social

columnLabelFormat type enum values:
  - text
  - number
  - date
  - percentage
  - currency
  - duration
  - boolean
  - link
  - json
  - markdown
  - html
  - code
  - image
  - filesize
  - email
  - phone
  - ip
  - uuid
  - color
  - coordinate
  - version
  - hash
  - base64
  - enum
  - formula
  - sparkline
  - qrcode
  - barcode
  - social
  - custom

text style enum values:
  - titlecase
  - uppercase
  - lowercase
  - sentencecase

legendPosition enum values:
  - top
  - bottom
  - left
  - right

legendOrientation enum values:
  - horizontal
  - vertical

labelPosition enum values:
  - inside
  - outside
  - center

visibility enum values:
  - private
  - team
  - organization
  - public

refreshSchedule frequency enum values:
  - hourly
  - daily
  - weekly
  - monthly

aggregation function enum values:
  - sum
  - avg
  - count
  - min
  - max
  - median
  - mode
  - stddev
  - variance

operator enum values (for filters):
  - "="
  - "!="
  - ">"
  - ">="
  - "<"
  - "<="
  - "in"
  - "not in"
  - "like"
  - "not like"
  - "is null"
  - "is not null"
  - "between"
  - "not between"

nullHandling enum values:
  - exclude
  - zero
  - average
  - forward_fill
  - backward_fill
  - interpolate

outlierDetection method enum values:
  - zscore
  - iqr
  - isolation_forest
  - dbscan

theme enum values:
  - light
  - dark
  - custom

negativeFormat enum values:
  - "()"                   # Parentheses
  - "-"                    # Minus sign
  - "red"                  # Red color

currencyDisplay enum values:
  - symbol                 # $
  - code                   # USD
  - name                   # US Dollar

linkType enum values:
  - external
  - internal

linkTarget enum values:
  - "_blank"
  - "_self"
  - "_parent"
  - "_top"

trendLine enum values:
  - linear
  - polynomial
  - exponential
  - logarithmic
  - power

pointShape enum values:
  - circle
  - square
  - triangle
  - diamond
  - cross
  - star

sparklineType enum values:
  - line
  - bar
  - area

barcodeType enum values:
  - code128
  - code39
  - ean13
  - ean8
  - upc
  - qr

social platform enum values:
  - twitter
  - linkedin
  - github
  - facebook
  - instagram
  - youtube
  - tiktok
  - reddit
  - discord
  - slack

coordinate format enum values:
  - decimal               # 40.7128, -74.0060
  - dms                   # 40°42'46.0"N 74°00'21.6"W

validation rule enum values:
  - not_null
  - positive
  - negative
  - non_zero
  - unique
  - in_range
  - regex
  - email
  - url
  - phone
  - date
  - future_date
  - past_date

# Transformation type enum values:
transformation type enum:
  - aggregate
  - calculated
  - filter
  - pivot
  - unpivot
  - join
  - union
  - window
  - rank
  - lag
  - lead
  - cumulative
  - moving_average
  - interpolate
  - resample
  - normalize
  - standardize
  - encode
  - decode

# Alert action enum values:
alert action enum:
  - email
  - slack
  - webhook
  - sms
  - push
  - log
  - script

# Data sampling method enum values:
sampling method enum:
  - random
  - first
  - last
  - systematic
  - stratified
  - cluster

# Cell renderer enum values:
cellRenderer enum:
  - default
  - custom
  - html
  - markdown
  - component

# Shape enum values (avatar):
avatar shape enum:
  - circle
  - square
  - rounded

# Size enum values (avatar):
avatar size enum:
  - small
  - medium
  - large
  - xlarge

# Color scheme enum values (tags):
tag colorScheme enum:
  - blue
  - green
  - red
  - yellow
  - purple
  - gray
  - rainbow
  - monochrome

# Chart axis configuration:
axis configuration:
  - barAxis: left/right
  - lineAxis: left/right
  - xAxisPosition: bottom/top
  - yAxisPosition: left/right
  - secondaryYAxis: true/false

# Bar type enum values:
barType enum:
  - grouped
  - stacked
  - overlapped
  - waterfall

# Line type enum values:
lineType enum:
  - solid
  - dashed
  - dotted
  - dashdot

# Required fields by chart type:
Required fields:
  bar: xAxis, yAxis
  horizontalBar: xAxis, yAxis
  line: xAxis, yAxis
  scatterPlot: scatterAxis.xAxis, scatterAxis.yAxis
  barAndLine: barAndLineAxis.bars, barAndLineAxis.lines
  table: tableColumns
  bigNumber: bigNumberColumn, bigNumberLabel
  donut: donutLabel, donutValue
  stackedBar: xAxis, yAxis
  horizontalStackedBar: xAxis, yAxis
  areaChart: xAxis, yAxis

# Column reference requirements:
Column references:
  - Must be lowercase in axis configurations
  - Must match SQL query result columns exactly
  - Required in columnLabelFormats for ALL result columns
  - Case-sensitive in tableColumns.id
  - Case-sensitive in columnLabelFormats keys

# Common pitfalls to avoid:
Pitfalls:
  1. Missing required fields for chart type
  2. Incorrect column name casing in axes
  3. Missing columnLabelFormats for SQL columns
  4. Invalid enum values
  5. Mismatched column references
  6. Missing pipe (|) for multiline SQL
  7. Invalid date format strings
  8. Incomplete barAndLineAxis configuration
  9. Missing scatterAxis for scatterPlot
  10. Undefined columns in sort/filter configurations

# Validation requirements:
Validation:
  - All enum values must match exactly
  - All referenced columns must exist in SQL results  
  - Required fields cannot be null/undefined
  - Arrays cannot be empty where required
  - Numeric values must be within valid ranges
  - Date strings must be valid ISO format
  - Color values must be valid hex codes
  - URLs must be valid format
  - Email addresses must be valid format
  - Regular expressions must be valid

# YAML formatting requirements:
YAML formatting:
  - Use pipe (|) for multiline strings
  - Proper indentation (2 spaces)
  - No tabs allowed
  - Quotes for special characters
  - Arrays use dash notation
  - Objects use colon notation
  - Comments use hash notation
  - Escape special characters properly

# SQL requirements:
SQL requirements:
  - Valid syntax for data source type
  - Column aliases for complex expressions
  - Proper quoting for identifiers
  - No dangerous operations (DROP, DELETE, UPDATE)
  - Appropriate JOIN syntax
  - Valid WHERE clause conditions
  - Proper GROUP BY when using aggregates
  - ORDER BY for consistent results
  - LIMIT for performance (when appropriate)

# Performance considerations:
Performance:
  - Limit result sets appropriately
  - Use indexes effectively  
  - Avoid full table scans
  - Optimize JOIN operations
  - Cache frequently accessed data
  - Use query timeouts
  - Implement pagination for large datasets
  - Consider materialized views
  - Use appropriate data sampling

# Security requirements:
Security:
  - No sensitive data exposure
  - Parameterized queries only
  - Proper access control
  - Audit logging enabled
  - Encryption for sensitive fields
  - No hardcoded credentials
  - Validate all user inputs
  - Sanitize output data
  - Implement rate limiting

# Best practices:
Best practices:
  1. Use descriptive metric names
  2. Include clear code explanations
  3. Add relevant tags for organization
  4. Configure appropriate refresh schedules
  5. Set up meaningful alerts
  6. Document business context
  7. Include example queries
  8. Maintain version history
  9. Test with sample data
  10. Optimize for performance
  11. Ensure data quality
  12. Implement proper error handling
  13. Use consistent naming conventions
  14. Follow organizational standards
  15. Regular review and updates

# Example metric (complete):
\`\`\`yaml
name: "Monthly Revenue by Region"
type: metric
sql: |
  SELECT 
    DATE_TRUNC('month', order_date) as month,
    region,
    SUM(revenue) as total_revenue,
    SUM(profit) as total_profit,
    AVG(margin) as avg_margin
  FROM sales_data
  WHERE order_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY 1, 2
  ORDER BY 1 DESC, 3 DESC
selectedChartType: barAndLine
data:
  xAxis: month
  yAxis: [total_revenue, total_profit]
  barAndLineAxis:
    bars: [total_revenue, total_profit]
    lines: [avg_margin]
    barAxis: left
    lineAxis: right
  xAxisLabel: "Month"
  yAxisLabel: "Revenue & Profit ($)"
  xAxisTimeInterval: month
  xAxisDateFormat: "%b %Y"
  style: grouped
  columnLabelFormats:
    month:
      type: date
      dateFormat: "%B %Y"
    region:
      type: text
      style: titlecase
    total_revenue:
      type: currency
      currency: USD
      decimalPlaces: 0
    total_profit:
      type: currency
      currency: USD
      decimalPlaces: 0
    avg_margin:
      type: percentage
      decimalPlaces: 1
  goalLines:
    - value: 1000000
      label: "Target Revenue"
  dataLabelConfig:
    showDataLabels: true
    labelPosition: outside
  legendConfig:
    showLegend: true
    legendPosition: bottom
    legendOrientation: horizontal
tags: ["sales", "revenue", "monthly", "regional"]
codeExplanation: |
  This metric tracks monthly revenue and profit by region for the past 12 months,
  with average margin displayed as a line chart for trend analysis.
refreshSchedule:
  frequency: daily
  time: "02:00"
  timezone: "America/New_York"
accessControl:
  visibility: organization
userProperties:
  department: "Finance"
  owner: "analytics-team"
\`\`\`

# Additional complete examples for each chart type:

## Bar Chart Example:
\`\`\`yaml
name: "Product Sales Comparison"
type: metric
sql: |
  SELECT 
    product_name,
    units_sold,
    revenue
  FROM product_sales
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  ORDER BY revenue DESC
  LIMIT 10
selectedChartType: bar
data:
  xAxis: product_name
  yAxis: [units_sold, revenue]
  style: grouped
  xAxisLabel: "Products"
  yAxisLabel: "Sales Metrics"
  columnLabelFormats:
    product_name:
      type: text
      style: titlecase
    units_sold:
      type: number
      thousandsSeparator: true
    revenue:
      type: currency
      currency: USD
      decimalPlaces: 2
\`\`\`

## Line Chart Example:
\`\`\`yaml
name: "Daily Active Users Trend"
type: metric
sql: |
  SELECT 
    date,
    active_users,
    new_users,
    returning_users
  FROM user_metrics
  WHERE date >= CURRENT_DATE - INTERVAL '90 days'
  ORDER BY date
selectedChartType: line
data:
  xAxis: date
  yAxis: [active_users, new_users, returning_users]
  xAxisTimeInterval: day
  xAxisDateFormat: "%m/%d"
  xAxisLabel: "Date"
  yAxisLabel: "User Count"
  columnLabelFormats:
    date:
      type: date
      dateFormat: "%Y-%m-%d"
    active_users:
      type: number
      thousandsSeparator: true
    new_users:
      type: number
      thousandsSeparator: true
    returning_users:
      type: number
      thousandsSeparator: true
  advancedSettings:
    smoothLine: true
    showGrid: true
\`\`\`

## ScatterPlot Example:
\`\`\`yaml
name: "Price vs Performance Analysis"
type: metric
sql: |
  SELECT 
    price,
    performance_score,
    market_share,
    product_category,
    product_name
  FROM product_analysis
selectedChartType: scatterPlot
data:
  scatterAxis:
    xAxis: price
    yAxis: performance_score
    sizeBy: market_share
    colorBy: product_category
    labelBy: product_name
  xAxisLabel: "Price ($)"
  yAxisLabel: "Performance Score"
  columnLabelFormats:
    price:
      type: currency
      currency: USD
      decimalPlaces: 2
    performance_score:
      type: number
      decimalPlaces: 1
    market_share:
      type: percentage
      decimalPlaces: 1
    product_category:
      type: text
      style: titlecase
    product_name:
      type: text
\`\`\`

## Table Example:
\`\`\`yaml
name: "Customer Orders Detail"
type: metric
sql: |
  SELECT 
    order_id,
    customer_name,
    order_date,
    status,
    total_amount,
    payment_method,
    shipping_address
  FROM orders
  WHERE order_date >= CURRENT_DATE - INTERVAL '7 days'
  ORDER BY order_date DESC
selectedChartType: table
data:
  tableColumns:
    - id: order_id
      label: "Order ID"
      columnType: text
    - id: customer_name
      label: "Customer"
      columnType: text
    - id: order_date
      label: "Date"
      columnType: date
    - id: status
      label: "Status"
      columnType: status
    - id: total_amount
      label: "Amount"
      columnType: currency
    - id: payment_method
      label: "Payment"
      columnType: text
    - id: shipping_address
      label: "Address"
      columnType: text
  columnLabelFormats:
    order_id:
      type: text
    customer_name:
      type: text
      style: titlecase
    order_date:
      type: date
      dateFormat: "%b %d, %Y"
    status:
      type: text
      style: uppercase
    total_amount:
      type: currency
      currency: USD
      decimalPlaces: 2
    payment_method:
      type: text
      style: titlecase
    shipping_address:
      type: text
\`\`\`

## BigNumber Example:
\`\`\`yaml
name: "Total Revenue This Month"
type: metric
sql: |
  SELECT 
    SUM(revenue) as total_revenue,
    SUM(revenue) - LAG(SUM(revenue)) OVER (ORDER BY month) as revenue_change
  FROM monthly_sales
  WHERE month = DATE_TRUNC('month', CURRENT_DATE)
selectedChartType: bigNumber
data:
  bigNumberColumn: total_revenue
  bigNumberLabel: "Monthly Revenue"
  trendColumn: revenue_change
  columnLabelFormats:
    total_revenue:
      type: currency
      currency: USD
      decimalPlaces: 0
    revenue_change:
      type: currency
      currency: USD
      decimalPlaces: 0
\`\`\`

## Donut Chart Example:
\`\`\`yaml
name: "Market Share Distribution"
type: metric
sql: |
  SELECT 
    company_name,
    market_share_percentage
  FROM market_analysis
  WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
  ORDER BY market_share_percentage DESC
selectedChartType: donut
data:
  donutLabel: company_name
  donutValue: market_share_percentage
  columnLabelFormats:
    company_name:
      type: text
      style: titlecase
    market_share_percentage:
      type: percentage
      decimalPlaces: 1
  legendConfig:
    showLegend: true
    legendPosition: right
    legendOrientation: vertical
\`\`\`

## StackedBar Example:
\`\`\`yaml
name: "Quarterly Revenue by Product Line"
type: metric
sql: |
  SELECT 
    quarter,
    product_line,
    revenue
  FROM quarterly_sales
  WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
  ORDER BY quarter, product_line
selectedChartType: stackedBar
data:
  xAxis: quarter
  yAxis: [revenue]
  style: stacked
  xAxisLabel: "Quarter"
  yAxisLabel: "Revenue ($)"
  columnLabelFormats:
    quarter:
      type: text
    product_line:
      type: text
      style: titlecase
    revenue:
      type: currency
      currency: USD
      decimalPlaces: 0
\`\`\`

## AreaChart Example:
\`\`\`yaml
name: "Cumulative User Growth"
type: metric
sql: |
  SELECT 
    date,
    SUM(new_users) OVER (ORDER BY date) as cumulative_users
  FROM daily_signups
  WHERE date >= CURRENT_DATE - INTERVAL '180 days'
  ORDER BY date
selectedChartType: areaChart
data:
  xAxis: date
  yAxis: [cumulative_users]
  xAxisTimeInterval: week
  xAxisDateFormat: "%b %d"
  xAxisLabel: "Date"
  yAxisLabel: "Total Users"
  columnLabelFormats:
    date:
      type: date
      dateFormat: "%Y-%m-%d"
    cumulative_users:
      type: number
      thousandsSeparator: true
  advancedSettings:
    showArea: true
    smoothLine: true
\`\`\`

# Complex multi-axis example:
\`\`\`yaml
name: "Sales Performance Dashboard"
type: metric
sql: |
  SELECT 
    DATE_TRUNC('week', sale_date) as week,
    SUM(units_sold) as total_units,
    SUM(revenue) as total_revenue,
    AVG(customer_satisfaction) as avg_satisfaction,
    COUNT(DISTINCT customer_id) as unique_customers,
    SUM(profit) as total_profit,
    AVG(conversion_rate) as avg_conversion
  FROM sales_metrics
  WHERE sale_date >= CURRENT_DATE - INTERVAL '12 weeks'
  GROUP BY 1
  ORDER BY 1
selectedChartType: barAndLine
data:
  xAxis: week
  yAxis: [total_revenue, total_profit]
  barAndLineAxis:
    bars: [total_revenue, total_profit, total_units]
    lines: [avg_satisfaction, avg_conversion]
    barAxis: left
    lineAxis: right
    barType: grouped
    lineType: solid
    showPoints: true
  xAxisLabel: "Week"
  yAxisLabel: "Revenue & Units"
  xAxisTimeInterval: week
  xAxisDateFormat: "%b %d"
  style: grouped
  sortBy: week
  sortOrder: asc
  columnLabelFormats:
    week:
      type: date
      dateFormat: "%B %d, %Y"
    total_units:
      type: number
      thousandsSeparator: true
      suffix: " units"
    total_revenue:
      type: currency
      currency: USD
      decimalPlaces: 0
    avg_satisfaction:
      type: number
      decimalPlaces: 1
      suffix: "/5"
    unique_customers:
      type: number
      thousandsSeparator: true
    total_profit:
      type: currency
      currency: USD
      decimalPlaces: 0
    avg_conversion:
      type: percentage
      decimalPlaces: 1
  goalLines:
    - value: 500000
      label: "Revenue Target"
      color: "#00ff00"
    - value: 4.0
      label: "Satisfaction Goal"
      color: "#0000ff"
      axis: right
  annotations:
    - xValue: "2024-01-15"
      label: "Campaign Launch"
      color: "#ff0000"
  dataLabelConfig:
    showDataLabels: false
  tooltipConfig:
    showTooltip: true
    tooltipFormat: "{name}: {value}"
  legendConfig:
    showLegend: true
    legendPosition: bottom
    legendOrientation: horizontal
  advancedSettings:
    smoothLine: true
    showGrid: true
    gridColor: "#e0e0e0"
  conditionalFormatting:
    - column: total_revenue
      condition: ">"
      value: 500000
      color: "#00ff00"
    - column: avg_satisfaction
      condition: "<"
      value: 3.5
      color: "#ff0000"
tags: ["sales", "weekly", "performance", "dashboard"]
codeExplanation: |
  This comprehensive sales dashboard tracks weekly performance metrics including:
  - Revenue and profit as grouped bars
  - Customer satisfaction and conversion rates as trend lines
  - Unique customer counts and unit sales
  
  The metric includes goal lines for key targets and conditional formatting
  to highlight exceptional or concerning values.
refreshSchedule:
  frequency: daily
  time: "06:00"
  timezone: "UTC"
cacheSettings:
  enableCache: true
  ttl: 3600
alertRules:
  - condition: "avg_satisfaction < 3.5"
    threshold: 3.5
    action: email
    recipients: ["manager@example.com"]
  - condition: "total_revenue < 400000"
    threshold: 400000
    action: slack
    channel: "#sales-alerts"
accessControl:
  visibility: team
  allowedTeams: ["sales", "management"]
  permissions:
    view: true
    edit: false
    delete: false
userProperties:
  department: "Sales"
  owner: "sales-analytics"
  priority: "high"
  lastReviewed: "2024-01-01"
\`\`\`

# Date formatting examples:
Date formats (strftime):
  - "%Y-%m-%d" → "2024-01-15"
  - "%b %d, %Y" → "Jan 15, 2024"
  - "%B %d, %Y" → "January 15, 2024"
  - "%m/%d/%Y" → "01/15/2024"
  - "%d/%m/%Y" → "15/01/2024"
  - "%Y-%m-%d %H:%M:%S" → "2024-01-15 14:30:45"
  - "%b %d" → "Jan 15"
  - "%B %Y" → "January 2024"
  - "%Y-W%W" → "2024-W03" (week number)
  - "%a, %b %d" → "Mon, Jan 15"
  - "%A, %B %d, %Y" → "Monday, January 15, 2024"
  - "%I:%M %p" → "02:30 PM"
  - "%H:%M" → "14:30"
  - "%Y-%m-%dT%H:%M:%S%z" → "2024-01-15T14:30:45+0000"

# SQL syntax variations by data source:
PostgreSQL specific:
  - DATE_TRUNC('month', date_column)
  - INTERVAL '30 days'
  - date_column::date
  - EXTRACT(YEAR FROM date_column)
  - STRING_AGG(column, ', ')

MySQL specific:
  - DATE_FORMAT(date_column, '%Y-%m')
  - DATE_SUB(NOW(), INTERVAL 30 DAY)
  - CAST(date_column AS DATE)
  - YEAR(date_column)
  - GROUP_CONCAT(column SEPARATOR ', ')

BigQuery specific:
  - DATE_TRUNC(date_column, MONTH)
  - DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  - CAST(date_column AS DATE)
  - EXTRACT(YEAR FROM date_column)
  - STRING_AGG(column, ', ')

Snowflake specific:
  - DATE_TRUNC('month', date_column)
  - DATEADD(day, -30, CURRENT_DATE())
  - date_column::date
  - YEAR(date_column)
  - LISTAGG(column, ', ')

# Common SQL patterns:
Time-based aggregation:
\`\`\`sql
SELECT 
  DATE_TRUNC('month', date) as period,
  SUM(value) as total
FROM table
GROUP BY 1
ORDER BY 1
\`\`\`

Running totals:
\`\`\`sql
SELECT 
  date,
  value,
  SUM(value) OVER (ORDER BY date) as running_total
FROM table
ORDER BY date
\`\`\`

Year-over-year comparison:
\`\`\`sql
SELECT 
  DATE_TRUNC('month', date) as month,
  SUM(CASE WHEN YEAR(date) = YEAR(CURRENT_DATE) THEN value END) as current_year,
  SUM(CASE WHEN YEAR(date) = YEAR(CURRENT_DATE) - 1 THEN value END) as previous_year
FROM table
GROUP BY 1
ORDER BY 1
\`\`\`

Moving average:
\`\`\`sql
SELECT 
  date,
  value,
  AVG(value) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as ma7
FROM table
ORDER BY date
\`\`\`

Cohort analysis:
\`\`\`sql
WITH cohorts AS (
  SELECT 
    DATE_TRUNC('month', first_purchase_date) as cohort_month,
    customer_id
  FROM customers
)
SELECT 
  cohort_month,
  DATE_TRUNC('month', purchase_date) as purchase_month,
  COUNT(DISTINCT customer_id) as customers
FROM cohorts c
JOIN purchases p USING (customer_id)
GROUP BY 1, 2
ORDER BY 1, 2
\`\`\`

# Validation rules for metric creation:
Required validations:
  1. name: Must be non-empty string, no special characters except spaces/dashes
  2. type: Must be exactly "metric"
  3. sql: Must be valid SQL syntax for the data source
  4. selectedChartType: Must be valid enum value
  5. data: Must contain required fields for chart type
  6. columnLabelFormats: Must include ALL columns from SQL result
  7. xAxis/yAxis: Column names must be lowercase
  8. barAndLineAxis: Must specify both bars and lines arrays
  9. scatterAxis: Must specify at least xAxis and yAxis
  10. tableColumns: Must have id, label, and columnType for each column

# Error messages and troubleshooting:
Common errors:
  - "Column 'X' not found": Check column name casing and SQL aliases
  - "Invalid chart type": Use exact enum value from selectedChartType list
  - "Missing required field": Check requirements for specific chart type
  - "Invalid date format": Use valid strftime format strings
  - "Type mismatch": Ensure columnLabelFormats type matches actual data
  - "SQL syntax error": Check data source specific syntax
  - "Permission denied": Verify user has access to referenced tables
  - "Timeout exceeded": Optimize query or increase timeout setting
  - "Invalid YAML": Check indentation and special character escaping
  - "Duplicate metric name": Use unique names for each metric

\`\`\`

**CRITICAL:** This is the complete schema specification. Follow it exactly - every property, enum value, and requirement listed above must be respected. Pay special attention to:

1. **Required properties** for each chart type
2. **Enum values** for each field (e.g., selectedChartType, columnType, style)
3. **Column name casing** (must be lowercase in axis configurations)
4. **Complete columnLabelFormats** for every SQL result column
5. **Proper YAML syntax** with pipe (|) for SQL blocks
6. **Chart-specific axis configurations** (barAndLineAxis, scatterAxis, etc.)
7. **Date formatting rules** that match xAxisTimeInterval settings`;

  return tool({
    description,
    parameters: CreateMetricsInputSchema,
    execute,
  } as any);
}
