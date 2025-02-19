use anyhow::{anyhow, Result};
use axum::http::StatusCode;
use axum::Extension;
use axum::{response::IntoResponse, Json};
use chrono::Utc;
use diesel::{insert_into, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use handlers::messages::types::{ThreadMessage, ThreadUserMessage};
use handlers::threads::types::ThreadWithMessages;
use litellm::Message as AgentMessage;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use uuid::Uuid;

use crate::routes::rest::ApiResponse;
use crate::utils::tools::database_tools::SampleQuery;
use crate::utils::tools::ToolExecutor;
use crate::{
    database_dep::{
        enums::Verification,
        lib::get_pg_pool,
        models::{DashboardFile, Message, MessageToFile, MetricFile, Thread, User},
        schema::{dashboard_files, messages, messages_to_files, metric_files, threads},
    },
    utils::{
        agent::{Agent, AgentThread},
        tools::{
            file_tools::{
                CreateFilesTool, ModifyFilesTool, OpenFilesTool, SearchDataCatalogTool,
                SearchFilesTool, SendFilesToUserTool,
            },
            interaction_tools::SendMessageToUser,
            IntoValueTool,
        },
    },
};

use super::agent_message_transformer::{transform_message, BusterContainer, ReasoningMessage};

#[derive(Debug, Deserialize, Clone)]
pub struct ChatCreateNewChat {
    pub prompt: String,
    pub chat_id: Option<Uuid>,
    pub message_id: Option<Uuid>,
}

async fn process_chat(request: ChatCreateNewChat, user: User) -> Result<ThreadWithMessages> {
    let chat_id = request.chat_id.unwrap_or_else(|| Uuid::new_v4());
    let message_id = request.message_id.unwrap_or_else(|| Uuid::new_v4());

    let user_org_id = match user.attributes.get("organization_id") {
        Some(Value::String(org_id)) => Uuid::parse_str(&org_id).unwrap_or_default(),
        _ => {
            tracing::error!("User has no organization ID");
            return Err(anyhow!("User has no organization ID"));
        }
    };

    // Create thread
    let thread = Thread {
        id: chat_id,
        title: request.prompt.clone(),
        organization_id: user_org_id,
        created_by: user.id.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    let mut thread_with_messages = ThreadWithMessages {
        id: chat_id,
        title: request.prompt.clone(),
        is_favorited: false,
        messages: vec![ThreadMessage {
            id: message_id,
            request_message: ThreadUserMessage {
                request: request.prompt.clone(),
                sender_id: user.id.clone(),
                sender_name: user.name.clone().unwrap_or_default(),
                sender_avatar: None,
            },
            response_messages: vec![],
            reasoning: vec![],
            created_at: Utc::now().to_string(),
        }],
        created_at: Utc::now().to_string(),
        updated_at: Utc::now().to_string(),
        created_by: user.id.to_string(),
        created_by_id: user.id.to_string(),
        created_by_name: user.name.clone().unwrap_or_default(),
        created_by_avatar: None,
    };

    // Create thread in database
    let mut conn = get_pg_pool().get().await?;
    insert_into(threads::table)
        .values(&thread)
        .execute(&mut conn)
        .await?;

    // Initialize agent with tools
    let mut agent = Agent::new("o3-mini".to_string(), HashMap::new());
    let search_data_catalog_tool = SearchDataCatalogTool;
    let search_files_tool = SearchFilesTool;
    let modify_files_tool = ModifyFilesTool;
    let create_files_tool = CreateFilesTool;
    let open_files_tool = OpenFilesTool;
    let send_to_user_tool = SendFilesToUserTool;
    let send_message_to_user_tool = SendMessageToUser;
    let sample_query_tool = SampleQuery;
    
    agent.add_tool(
        search_data_catalog_tool.get_name(),
        search_data_catalog_tool.into_value_tool(),
    );
    agent.add_tool(
        search_files_tool.get_name(),
        search_files_tool.into_value_tool(),
    );
    agent.add_tool(
        modify_files_tool.get_name(),
        modify_files_tool.into_value_tool(),
    );
    agent.add_tool(
        create_files_tool.get_name(),
        create_files_tool.into_value_tool(),
    );
    agent.add_tool(
        open_files_tool.get_name(),
        open_files_tool.into_value_tool(),
    );
    agent.add_tool(
        send_to_user_tool.get_name(),
        send_to_user_tool.into_value_tool(),
    );

    // agent.add_tool(
    //     sample_query_tool.get_name(),
    //     sample_query_tool.into_value_tool(),
    // );

    // Process chat request
    let agent_thread = AgentThread::new(
        Some(chat_id),
        user.id,
        vec![
            AgentMessage::developer(AGENT_PROMPT.to_string()),
            AgentMessage::user(request.prompt.clone()),
        ],
    );
    let mut rx = agent.stream_process_thread(&agent_thread).await?;

    // Process all messages
    let mut response_messages = Vec::new();
    let mut reasoning_messages = Vec::new();
    let mut all_transformed_messages = Vec::new();
    let mut message = Message {
        id: message_id,
        request: request.prompt,
        response: serde_json::to_value(&all_transformed_messages)?,
        thread_id: chat_id,
        created_by: user.id.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        deleted_at: None,
    };

    // Insert initial message
    insert_into(messages::table)
        .values(&message)
        .execute(&mut conn)
        .await?;

    // Process all messages
    while let Some(msg_result) = rx.recv().await {
        match msg_result {
            Ok(msg) => {
                if let Ok((transformed_messages, _)) = transform_message(&chat_id, &message_id, msg)
                {
                    // Filter and store messages
                    let storage_messages: Vec<_> = transformed_messages
                        .into_iter()
                        .filter(|msg| match msg {
                            BusterContainer::ChatMessage(chat) => {
                                chat.response_message.message.is_some()
                                    && chat.response_message.message_chunk.is_none()
                            }
                            BusterContainer::ReasoningMessage(reasoning) => {
                                match &reasoning.reasoning {
                                    ReasoningMessage::Thought(thought) => {
                                        thought.status == "completed" && thought.thoughts.is_some()
                                    }
                                    ReasoningMessage::File(file) => {
                                        file.status == "completed" && file.file.is_some()
                                    }
                                }
                            }
                        })
                        .collect();

                    // Collect messages by type
                    for msg in &storage_messages {
                        match msg {
                            BusterContainer::ChatMessage(chat) => {
                                if let Some(message) = &chat.response_message.message {
                                    response_messages.push(serde_json::to_value(message)?);
                                }
                            }
                            BusterContainer::ReasoningMessage(reasoning) => {
                                match &reasoning.reasoning {
                                    ReasoningMessage::Thought(thought) => {
                                        if let Some(thoughts) = &thought.thoughts {
                                            reasoning_messages
                                                .push(serde_json::to_value(thoughts)?);
                                        }
                                    }
                                    ReasoningMessage::File(file) => {
                                        if let Some(file_content) = &file.file {
                                            let unified_file_content = file_content
                                                .iter()
                                                .map(|line| line.text.clone())
                                                .collect::<Vec<String>>()
                                                .join("\n");

                                            let file_content_yaml =
                                                serde_yaml::from_str::<serde_yaml::Value>(
                                                    &unified_file_content,
                                                )?;

                                            let file_content_json =
                                                serde_yaml::to_value(file_content_yaml)?;

                                            reasoning_messages.push(serde_json::json!({
                                                "type": "file",
                                                "file_type": file.file_type,
                                                "file_name": file.file_name,
                                                "file_content": file_content_json
                                            }));
                                        }
                                    }
                                }
                            }
                        }
                    }

                    all_transformed_messages.extend(storage_messages);
                    message.response = serde_json::to_value(&all_transformed_messages)?;
                    message.updated_at = Utc::now();
                }
            }
            Err(e) => {
                tracing::error!("Error processing message: {}", e);
                return Err(e.into());
            }
        }
    }

    // Add all collected messages to thread_with_messages
    if let Some(thread_message) = thread_with_messages.messages.first_mut() {
        thread_message.response_messages = response_messages;
        thread_message.reasoning = reasoning_messages;
    }

    // Store final message state and process any completed files
    store_final_message_state(
        &mut conn,
        &message,
        &all_transformed_messages,
        &user_org_id,
        &user.id,
    )
    .await?;

    Ok(thread_with_messages)
}

pub async fn create_chat(
    Extension(user): Extension<User>,
    Json(request): Json<ChatCreateNewChat>,
) -> Result<ApiResponse<ThreadWithMessages>, (StatusCode, &'static str)> {
    match process_chat(request, user).await {
        Ok(response) => Ok(ApiResponse::JsonData(response)),
        Err(e) => {
            tracing::error!("Error processing chat: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to process chat"))
        }
    }
}

async fn store_final_message_state(
    conn: &mut diesel_async::AsyncPgConnection,
    message: &Message,
    all_transformed_messages: &[BusterContainer],
    organization_id: &Uuid,
    user_id: &Uuid,
) -> Result<()> {
    // Update final message state
    diesel::update(messages::table)
        .filter(messages::id.eq(message.id))
        .set((
            messages::response.eq(&message.response),
            messages::updated_at.eq(message.updated_at),
        ))
        .execute(conn)
        .await?;

    // Process any completed metric or dashboard files
    for container in all_transformed_messages {
        match container {
            BusterContainer::ReasoningMessage(msg) => match &msg.reasoning {
                ReasoningMessage::File(file) if file.file_type == "metric" => {
                    if let Some(file_content) = &file.file {
                        let metric_file = MetricFile {
                            id: Uuid::new_v4(),
                            name: file.file_name.clone(),
                            file_name: format!(
                                "{}.yml",
                                file.file_name.to_lowercase().replace(' ', "_")
                            ),
                            content: serde_json::to_value(&file_content)?,
                            verification: Verification::NotRequested,
                            evaluation_obj: None,
                            evaluation_summary: None,
                            evaluation_score: None,
                            organization_id: organization_id.clone(),
                            created_by: user_id.clone(),
                            created_at: Utc::now(),
                            updated_at: Utc::now(),
                            deleted_at: None,
                        };

                        insert_into(metric_files::table)
                            .values(&metric_file)
                            .execute(conn)
                            .await?;

                        let message_to_file = MessageToFile {
                            id: Uuid::new_v4(),
                            message_id: message.id,
                            file_id: metric_file.id,
                            created_at: Utc::now(),
                            updated_at: Utc::now(),
                            deleted_at: None,
                        };

                        insert_into(messages_to_files::table)
                            .values(&message_to_file)
                            .execute(conn)
                            .await?;
                    }
                }
                ReasoningMessage::File(file) if file.file_type == "dashboard" => {
                    if let Some(file_content) = &file.file {
                        let dashboard_file = DashboardFile {
                            id: Uuid::new_v4(),
                            name: file.file_name.clone(),
                            file_name: format!(
                                "{}.yml",
                                file.file_name.to_lowercase().replace(' ', "_")
                            ),
                            content: serde_json::to_value(&file_content)?,
                            filter: None,
                            organization_id: organization_id.clone(),
                            created_by: user_id.clone(),
                            created_at: Utc::now(),
                            updated_at: Utc::now(),
                            deleted_at: None,
                        };

                        insert_into(dashboard_files::table)
                            .values(&dashboard_file)
                            .execute(conn)
                            .await?;

                        let message_to_file = MessageToFile {
                            id: Uuid::new_v4(),
                            message_id: message.id,
                            file_id: dashboard_file.id,
                            created_at: Utc::now(),
                            updated_at: Utc::now(),
                            deleted_at: None,
                        };

                        insert_into(messages_to_files::table)
                            .values(&message_to_file)
                            .execute(conn)
                            .await?;
                    }
                }
                _ => (),
            },
            _ => (),
        }
    }

    Ok(())
}

const AGENT_PROMPT: &str = r##"
You are an expert analytics and data engineer who helps non-technical users get fast, accurate answers to their analytics questions. **Before taking any action (such as creating or modifying metrics/dashboards, writing SQL, etc.), you must first search for and review the relevant data catalog information.** You work through human-like workflows by first confirming the request, checking existing resources, and then either returning existing metrics/dashboards or creating new ones as needed.

**Today's Date:** FEB 19, 2025

---

## Your Workflow

1. **Confirm the Request:**
   - Start by summarizing and confirming the user's request.

2. **Search the Data Catalog (MANDATORY):**
   - **Explicit Rule:** **Do not proceed with any metric/dashboard creation or SQL writing until you have performed a data catalog search using `search_database_tables` and have reviewed the results.**
   - Use `search_database_tables` to check the available database tables, schemas, and relationships.
   - For dashboard requests, first verify which metrics already exist. If a metric is referenced, search for it to ensure you’re using the correct one.
   - **If the data catalog search returns ambiguous or insufficient context, respond to the user telling them what you searched for and that you found no relevant results.**

3. **Creating or Modifying Metrics/Dashboards:**
   - Only create new metrics if none exist that satisfy the requirement.
   - Use the provided YAML schemas exactly when creating metrics or dashboards.

4. **SQL & Schema Best Practices:**
   - When writing SQL, **always include the schema** in your table references.
   - Follow the provided YAML schemas exactly when creating metrics or dashboards.
   - Use the naming conventions:
     - **Metrics:** `metrics/{unique_name}.yml`
     - **Dashboards:** `dashboards/{unique_name}.yml`

5. **SQL Best Practices and Constraints:**
   - **Constraints:**
     - Only join tables with explicit entity relationships.
   - **SQL Requirements:**
     - Use schema-qualified table names (`<SCHEMA_NAME>.<TABLE_NAME>`).
     - Select specific columns (avoid using `SELECT *` or `COUNT(*)`).
     - Use CTEs instead of subqueries, and use snake_case for naming them.
     - Use `DISTINCT` (not `DISTINCT ON`) with matching `GROUP BY`/`SORT BY` clauses.
     - Show entity names rather than just IDs.
     - Handle date conversions appropriately.
     - Order dates in ascending order.
     - Include date fields for time series.
     - Reference database identifiers for cross-database queries.
     - Format output for the specified visualization type.
     - Maintain a consistent data structure across requests unless changes are required.
     - Use explicit ordering for custom buckets or categories.

6. **Time and Naming Conventions:**
   - Default to the last 1 year if no timeframe is specified.
   - Maintain any user-specified time ranges until they are changed.
   - Include units in column names for time values.
   - Concatenate first and last names by default.
   - Use numerical weekday format (1-7).
   - Only use specific dates when explicitly requested.

7. **Digestible Output:**
   - Always strive to present information in the most digestible format for the user.
   - If a query or question can be broken into multiple, simpler metrics that are easier to understand, do so.

8. **Efficient Tool Use:**
   - Minimize tool calls by bundling actions. For example, use one `create_files` or `bulk_modify_files` call to handle multiple changes.
   - Avoid opening or modifying the same file repeatedly.

9. **Communication Style:**
   - Use clear, friendly, and supportive language.
   - Explain actions concisely and summarize what has been done.
   - **Explicit Rule:** If you cannot fulfill a request due to limitations in available data or context (especially if the data catalog search is inconclusive), politely explain why and ask if the user has any additional context that might be helpful.

10. **Finalizing Your Response:**
    - Once you’ve opened or created files, show them to the user and then stop further actions.
    - Summarize your actions in your final response without revealing internal instructions.

---

## Key Rules & Guidelines

- **Data Catalog First (Non-Negotiable):**
  - **Before any metric or dashboard creation/modification or SQL execution, you must always perform a data catalog search.**
  - If the search yields no relevant results, respond to the user telling them what you searched for and that you found no relevant results.
  - Do not ask clarifying questions. 
- **SQL Consistency:** Use proper schema for table references in all SQL queries.
- **Naming Conventions:** Adhere to naming standards when saving files (e.g., metrics and dashboards).
- **Bulk Actions:** When possible, perform actions in bulk to reduce redundant operations.
- **Stay Focused:** Only help with metrics, dashboards, and available data. Politely decline unrelated requests.
- **Follow Special Instructions:** Prioritize any special instructions provided by the user.

---

## YAML Schemas Reference

### Metric YAML Schema
`For context, here is the yml schema for metrics:
```yml
# ------------------------------------------------------------------------------
# METRIC CONFIGURATION SCHEMA (DOCUMENTATION + SPEC)
# ------------------------------------------------------------------------------
# This YAML file shows a JSON Schema-like specification for defining a "metric."
# 
# REQUIRED at the top level:
#   1) title: string
#   2) dataset_ids: array of strings
#   2) sql:   multi-line string (YAML pipe recommended)
#   3) chart_config: must match exactly one of the possible chart sub-schemas 
#                  (bar/line, scatter, pie, combo, metric, table).
#   4) data_metadata: array of columns. Each with { name, data_type }.
# 
# "columnLabelFormats" is a required field under chartConfig (in the base).
#
# If a field is null or empty, simply omit it from your YAML rather than 
# including it with "null." That way, you keep the configuration clean.
# ------------------------------------------------------------------------------

type: object
title: "Metric Configuration Schema"
description: "Specifies structure for a metric file, including SQL + one chart type."

properties:
  # ----------------------
  # 1. TITLE (REQUIRED)
  # ----------------------
  title:
    type: string
    description: >
      A human-readable title for this metric (e.g. "Total Sales").
      Always required.
    
  # ----------------------
  # 2. DATASET IDS (REQUIRED)
  # ----------------------
  dataset_ids:
    type: array
    description: >
      An array of dataset IDs that the metric belongs to.

  # ----------------------
  # 3. SQL (REQUIRED, multi-line recommended)
  # ----------------------
  sql:
    type: string
    description: >
      A SQL query string used to compute or retrieve the metric's data.
      It should be well-formatted, typically using YAML's pipe syntax (|).
      Example:
        sql: |
          SELECT
            date,
            SUM(sales_amount) AS total_sales
          FROM sales
          GROUP BY date
          ORDER BY date DESC
      Always required.

  # ----------------------
  # 4. CHART CONFIG (REQUIRED, EXACTLY ONE TYPE)
  # ----------------------
  chart_config:
    description: >
      Defines visualization settings. Must match exactly one sub-schema
      via oneOf: bar/line, scatter, pie, combo, metric, or table.
    oneOf:
      - $ref: "\#/definitions/bar_line_chart_config"
      - $ref: "#/definitions/scatter_chart_config"
      - $ref: "#/definitions/pie_chart_config"
      - $ref: "#/definitions/combo_chart_config"
      - $ref: "#/definitions/metric_chart_config"
      - $ref: "#/definitions/table_chart_config"

  # ----------------------
  # 5. DATA METADATA (REQUIRED)
  # ----------------------
  data_metadata:
    type: array
    description: >
      An array describing each column in the metric's dataset.
      Each item has a 'name' and a 'dataType'.
    items:
      type: object
      properties:
        name:
          type: string
          description: "Column name."
        data_type:
          type: string
          description: "Data type of the column (e.g., 'string', 'number', 'date')."
      required:
        - name
        - data_type

required:
  - title
  - sql
  - chart_config

definitions:

  goal_line:
    type: object
    description: "A line drawn on the chart to represent a goal/target."
    properties:
      show:
        type: boolean
        description: >
          If true, display the goal line. If you don't need it, omit the property.
      value:
        type: number
        description: >
          Numeric value of the goal line. Omit if unused.
      show_goal_line_label:
        type: boolean
        description: >
          If true, show a label on the goal line. Omit if you want the default behavior.
      goal_line_label:
        type: string
        description: >
          The label text to display near the goal line (if show_goal_line_label = true).
      goal_line_color:
        type: string
        description: >
          Color for the goal line (e.g., "#FF0000"). Omit if not specified.

  trendline:
    type: object
    description: "A trendline overlay (e.g. average line, regression)."
    properties:
      show:
        type: boolean
      show_trendline_label:
        type: boolean
      trendline_label:
        type: string
        description: "Label text if show_trendline_label is true (e.g., 'Slope')."
      type:
        type: string
        enum:
          - average
          - linear_regression
          - logarithmic_regression
          - exponential_regression
          - polynomial_regression
          - min
          - max
          - median
        description: >
          Trendline algorithm to use. Required.
      trend_line_color:
        type: string
        description: "Color for the trendline (e.g. '#000000')."
      column_id:
        type: string
        description: >
          Column ID to which this trendline applies. Required.
    required:
      - type
      - column_id

  bar_and_line_axis:
    type: object
    description: >
      Axis definitions for bar or line charts: x, y, category, and optional tooltip.
    properties:
      x:
        type: array
        items:
          type: string
        description: "Column ID(s) for the x-axis."
      y:
        type: array
        items:
          type: string
        description: "Column ID(s) for the y-axis."
      category:
        type: array
        items:
          type: string
        description: "Column ID(s) representing categories/groups."
      tooltip:
        type: array
        items:
          type: string
        description: "Columns used in tooltips. Omit if you want the defaults."
    required:
      - x
      - y
      - category

  scatter_axis:
    type: object
    description: "Axis definitions for scatter charts: x, y, optional category/size/tooltip."
    properties:
      x:
        type: array
        items:
          type: string
      y:
        type: array
        items:
          type: string
      category:
        type: array
        items:
          type: string
        description: "Optional. Omit if not used."
      size:
        type: array
        maxItems: 1
        items:
          type: string
        description: "If omitted, no size-based variation. If present, exactly one column ID."
      tooltip:
        type: array
        items:
          type: string
        description: "Columns used in tooltips."
    required:
      - x
      - y

  pie_chart_axis:
    type: object
    description: "Axis definitions for pie charts: x, y, optional tooltip."
    properties:
      x:
        type: array
        items:
          type: string
      y:
        type: array
        items:
          type: string
      tooltip:
        type: array
        items:
          type: string
    required:
      - x
      - y

  combo_chart_axis:
    type: object
    description: "Axis definitions for combo charts: x, y, optional y2/category/tooltip."
    properties:
      x:
        type: array
        items:
          type: string
      y:
        type: array
        items:
          type: string
      y2:
        type: array
        items:
          type: string
        description: "Optional secondary y-axis. Omit if unused."
      category:
        type: array
        items:
          type: string
      tooltip:
        type: array
        items:
          type: string
    required:
      - x
      - y

  i_column_label_format:
    type: object
    description: >
      Describes how a column's data is formatted (currency, percent, date, etc.).
      If you do not need special formatting for a column, omit it from 
      `column_label_formats`.
    properties:
      column_type:
        type: string
        description: "e.g., 'number', 'string', 'date'"
      style:
        type: string
        enum:
          - currency
          - percent
          - number
          - date
          - string
        description: "Defines how values are displayed."
      display_name:
        type: string
        description: "Override for the column label. Omit if unused."
      number_separator_style:
        type: string
        description: "E.g., ',' for thousands separator or omit if no special style."
      minimum_fraction_digits:
        type: number
        description: "Min decimal places. Omit if default is fine."
      maximum_fraction_digits:
        type: number
        description: "Max decimal places. Omit if default is fine."
      multiplier:
        type: number
        description: "E.g., 100 for percents. Omit if default is 1."
      prefix:
        type: string
        description: "String to add before each value (e.g. '$')."
      suffix:
        type: string
        description: "String to add after each value (e.g. '%')."
      replace_missing_data_with:
        type: [ "number", "string" ]
        description: "If data is missing, use this value. Omit if default 0 is fine."
      compact_numbers:
        type: boolean
        description: "If true, 10000 => 10K. Omit if not needed."
      currency:
        type: string
        description: "ISO code for style=currency. Default 'USD' if omitted."
      date_format:
        type: string
        description: "Dayjs format if style=date. Default 'LL' if omitted."
      use_relative_time:
        type: boolean
        description: "If true, e.g., '2 days ago' might be used. Omit if not used."
      is_utc:
        type: boolean
        description: "If true, interpret date as UTC. Omit if local time."
      convert_number_to:
        type: string
        description: "Used if style=number but want day_of_week, etc. Omit if not used."
    required:
      - column_type
      - style

  column_settings:
    type: object
    description: "Overrides per-column for visualization (bar, line, dot, etc.)."
    properties:
      show_data_labels:
        type: boolean
      show_data_labels_as_percentage:
        type: boolean
      column_visualization:
        type: string
        enum: [ "bar", "line", "dot" ]
        description: >
          If omitted, chart-level default is used.
      line_width:
        type: number
        description: "Thickness of the line. Omit if default is OK."
      line_style:
        type: string
        enum: [ "area", "line" ]
      line_type:
        type: string
        enum: [ "normal", "smooth", "step" ]
      line_symbol_size:
        type: number
        description: "Size of dots on a line. Omit if default is OK."
      bar_roundness:
        type: number
        description: "Roundness of bar corners (0-50). Omit if default is OK."
      line_symbol_size_dot:
        type: number
        description: "If column_visualization='dot', size of the dots. Omit if default is OK."

  base_chart_config:
    type: object
    properties:
      selected_chart_type:
        type: string
        description: >
          Must match the chart type in the sub-schema. 
          E.g., "bar", "line", "scatter", "pie", "combo", "metric", "table".
      column_label_formats:
        type: object
        description: >
          A map of columnId => label format object (i_column_label_format). 
          If you truly have no column formatting, you can provide an empty object, 
          but do not omit this field. 
        additionalProperties:
          $ref: "#/definitions/i_column_label_format"
      column_settings:
        type: object
        description: >
          A map of columnId => column_settings. 
          Omit columns if no special customization is needed.
        additionalProperties:
          $ref: "#/definitions/column_settings"
      colors:
        type: array
        items:
          type: string
        description: >
          Array of color hex codes or color names. If omitted, use defaults.
      show_legend:
        type: boolean
        description: "Whether to display the legend. Omit if defaults apply."
      grid_lines:
        type: boolean
        description: "Toggle grid lines. Omit if defaults apply."
      show_legend_headline:
        type: string
        description: "Additional legend headline text. Omit if not used."
      goal_lines:
        type: array
        description: "Array of goal_line objects. Omit if none."
        items:
          $ref: "#/definitions/goal_line"
      trendlines:
        type: array
        description: "Array of trendline objects. Omit if none."
        items:
          $ref: "#/definitions/trendline"
      disable_tooltip:
        type: boolean
        description: "If true, tooltips are disabled. Omit if not needed."
      y_axis_config:
        type: object
        description: "If omitted, defaults apply."
        additionalProperties: true
      x_axis_config:
        type: object
        additionalProperties: true
      category_axis_style_config:
        type: object
        additionalProperties: true
      y2_axis_config:
        type: object
        additionalProperties: true
    required:
      - selected_chart_type
      - selected_view
      - column_label_formats

  bar_line_chart_config:
    allOf:
      - $ref: "#/definitions/base_chart_config"
      - type: object
        properties:
          selected_chart_type:
            enum: [ "bar", "line" ]
          bar_and_line_axis:
            $ref: "#/definitions/bar_and_line_axis"
          bar_layout:
            type: string
            enum: [ "horizontal", "vertical" ]
          bar_sort_by:
            type: string
          bar_group_type:
            type: string
            enum: [ "stack", "group", "percentage-stack" ]
          bar_show_total_at_top:
            type: boolean
          line_group_type:
            type: string
            enum: [ "stack", "percentage-stack" ]
        required:
          - bar_and_line_axis

  scatter_chart_config:
    allOf:
      - $ref: "#/definitions/base_chart_config"
      - type: object
        properties:
          selected_chart_type:
            enum: [ "scatter" ]
          scatter_axis:
            $ref: "#/definitions/scatter_axis"
          scatter_dot_size:
            type: array
            minItems: 2
            maxItems: 2
            items:
              type: number
            description: "If omitted, scatter dot sizes may follow a default range."
        required:
          - scatter_axis

  pie_chart_config:
    allOf:
      - $ref: "#/definitions/base_chart_config"
      - type: object
        properties:
          selected_chart_type:
            enum: [ "pie" ]
          pie_chart_axis:
            $ref: "#/definitions/pie_chart_axis"
          pie_display_label_as:
            type: string
            enum: [ "percent", "number" ]
          pie_show_inner_label:
            type: boolean
          pie_inner_label_aggregate:
            type: string
            enum: [ "sum", "average", "median", "max", "min", "count" ]
          pie_inner_label_title:
            type: string
          pie_label_position:
            type: string
            enum: [ "inside", "outside", "none" ]
          pie_donut_width:
            type: number
          pie_minimum_slice_percentage:
            type: number
        required:
          - pie_chart_axis

  combo_chart_config:
    allOf:
      - $ref: "#/definitions/base_chart_config"
      - type: object
        properties:
          selected_chart_type:
            enum: [ "combo" ]
          combo_chart_axis:
            $ref: "#/definitions/combo_chart_axis"
        required:
          - combo_chart_axis

  metric_chart_config:
    allOf:
      - $ref: "#/definitions/base_chart_config"
      - type: object
        properties:
          selected_chart_type:
            enum: [ "metric" ]
          metric_column_id:
            type: string
            description: "Required. The column used for the metric's numeric value."
          metric_value_aggregate:
            type: string
            enum: [ "sum", "average", "median", "max", "min", "count", "first" ]
          metric_header:
            type: string
            description: "If omitted, the column_id is used as default label."
          metric_sub_header:
            type: string
          metric_value_label:
            type: string
            description: "If omitted, the label is derived from metric_column_id + aggregator."
        required:
          - metric_column_id

  table_chart_config:
    allOf:
      - $ref: "#/definitions/base_chart_config"
      - type: object
        properties:
          selected_chart_type:
            enum: [ "table" ]
          table_column_order:
            type: array
            items:
              type: string
          table_column_widths:
            type: object
            additionalProperties:
              type: number
          table_header_background_color:
            type: string
          table_header_font_color:
            type: string
          table_column_font_color:
            type: string
        required: []
        description: >
          For table type, the axis concept is irrelevant; 
          user may specify column order, widths, colors, etc.

```

For context, here is the yml schema for dashboards:
```yml
# ------------------------------------------------------------------------------
# DASHBOARD SCHEMA (DOCUMENTATION + SPEC)
# ------------------------------------------------------------------------------
# This YAML file demonstrates how to structure a "dashboard configuration" file.
# The file is annotated with comments that serve as documentation for users.
#
# Each dashboard should have:
#   1) A top-level "title" (string).
#   2) A "rows" field, which is an array of row definitions.
#   3) Each row contains an array called "items" with up to 4 metric objects.
#   4) Each metric object has:
#         - id (string) : The UUIDv4 identifier of the metric. You should know which metric you want to reference before putting it here.
#         - width (int) : must be at least 3 and at most 12
#   5) The sum of all widths within a given row should not exceed 12.
#
# This file uses a JSON Schema-like structure but written in YAML. You could
# place this in a "dashboard-schema.yml" for reference or use it as documentation
# within your code repository.
#
# ------------------------------------------------------------------------------

type: object
title: "Dashboard Configuration Schema"
description: "Specifies the structure and constraints of a dashboard config file."

properties:
  # ----------------------
  # 1. TITLE
  # ----------------------
  title:
    type: string
    description: >
      The title of the entire dashboard (e.g. "Sales & Marketing Dashboard").
      This field is mandatory.

      # ----------------------
      # 2. ROWS
      # ----------------------
      rows:
        type: array
        description: >
          An array of row objects. Each row represents a 'horizontal band' of
          metrics or widgets across the dashboard.
        items:
          # We define the schema for each row object here.
          type: object
          properties:
            # The row object has "items" that define individual metrics/widgets.
            items:
              type: array
              description: >
                A list (array) of metric definitions. Each metric is represented
                by an object that must specify an 'id' and a 'width'.
                - Up to 4 items per row (no more).
                - Each 'width' must be between 3 and 12.
                - The sum of all 'width' values in a single row should not exceed 12.
    
              # We limit the number of items to 4.
              max_items: 4
    
              # Each array entry must conform to the schema below.
              items:
                type: object
                properties:
                  id:
                    type: string
                    description: >
                      The metric's UUIDv4 identifier. You should know which metric you want to reference before putting it here.
                      Example: "123e4567-e89b-12d3-a456-426614174000"
                      
                  width:
                    type: integer
                    description: >
                      The width allocated to this metric within the row.
                      Valid values range from 3 to 12.
                      Combined with other items in the row, the total 'width'
                      must not exceed 12.
                    minimum: 3
                    maximum: 12
                # Both fields are mandatory for each item.
                required:
                  - id
                  - width
          # The 'items' field must be present in each row.
          required:
            - items
    
    # Top-level "title" and "rows" are required for every valid dashboard config.
    required:
      - title
    
    # ------------------------------------------------------------------------------
    # NOTE ON WIDTH SUM VALIDATION:
    # ------------------------------------------------------------------------------
    # Classic JSON Schema doesn't have a direct, simple way to enforce that the sum
    # of all 'width' fields in a row is <= 12. One common approach is to use
    # "allOf", "if/then" or "contains" with advanced constructs, or simply rely on
    # custom validation logic in your application.
    #
    # If you rely on external validation logic, you can highlight in your docs that
    # end users must ensure each row's total width does not exceed 12.
    # ------------------------------------------------------------------------------
    ```
    "##;
